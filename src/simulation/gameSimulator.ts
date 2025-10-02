import type { GameState, Player } from '../types/game';
import { createDeck, shuffleDeck } from '../data/cards';
import { applyCardEffect, checkFirstSpeakerAutoDiscard, autoDiscardFirstSpeaker } from '../game/cardEffects';
import { validateCardPlay, getValidPlays } from '../game/gameValidation';
import { SimpleAI } from '../ai/simpleAI';

export interface SimulationResult {
  gameId: string;
  winner: string | null;
  rounds: number;
  totalTurns: number;
  errors: SimulationError[];
  playerStats: Record<string, PlayerStats>;
}

export interface SimulationError {
  turn: number;
  playerId: string;
  error: string;
  gameState: GameState;
}

export interface PlayerStats {
  turnsPlayed: number;
  cardsPlayed: number;
  playersEliminated: number;
  roundsWon: number;
  finalTokens: number;
}

export class GameSimulator {
  /**
   * Run a single game simulation
   */
  static simulateGame(playerCount: number, _seed?: number): SimulationResult {
    const gameId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let gameState = this.initializeGame(playerCount);
    const errors: SimulationError[] = [];
    let turnCount = 0;
    let roundCount = 1;

    const playerStats: Record<string, PlayerStats> = {};
    gameState.players.forEach(p => {
      playerStats[p.id] = {
        turnsPlayed: 0,
        cardsPlayed: 0,
        playersEliminated: 0,
        roundsWon: 0,
        finalTokens: 0,
      };
    });

    // Run until game ends
    while (gameState.phase !== 'game-end') {
      turnCount++;

      // Safety check - prevent infinite loops
      if (turnCount > 1000) {
        errors.push({
          turn: turnCount,
          playerId: 'system',
          error: 'Game exceeded 1000 turns - possible infinite loop',
          gameState: JSON.parse(JSON.stringify(gameState)),
        });
        break;
      }

      try {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        playerStats[currentPlayer.id].turnsPlayed++;

        if (gameState.phase === 'draw') {
          // Draw phase
          if (gameState.deck.length > 0) {
            gameState = this.simulateDrawCard(gameState);
          } else {
            // Deck empty - end round
            const winner = this.determineRoundWinner(gameState.players.filter(p => !p.isEliminated));
            if (winner) {
              gameState = this.handleRoundEnd(gameState, winner.id);
              playerStats[winner.id].roundsWon++;
              roundCount++;
            }
          }
        } else if (gameState.phase === 'play') {
          // Play phase
          const result = this.simulatePlayCard(gameState, currentPlayer.id);
          if (result.error) {
            errors.push({
              turn: turnCount,
              playerId: currentPlayer.id,
              error: result.error,
              gameState: JSON.parse(JSON.stringify(gameState)),
            });
          }
          if (result.gameState) {
            gameState = result.gameState;
            playerStats[currentPlayer.id].cardsPlayed++;
          }

          // End turn
          gameState = this.simulateEndTurn(gameState);
        } else if (gameState.phase === 'round-end') {
          // Check if game should end
          const winner = gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin);
          if (winner) {
            gameState = { ...gameState, phase: 'game-end' };
          } else {
            // Start new round
            gameState = this.initializeRound(gameState.players, gameState.tokensToWin);
            roundCount++;
          }
        }
      } catch (error) {
        errors.push({
          turn: turnCount,
          playerId: gameState.players[gameState.currentPlayerIndex].id,
          error: error instanceof Error ? error.message : String(error),
          gameState: JSON.parse(JSON.stringify(gameState)),
        });
        break;
      }
    }

    // Update final stats
    gameState.players.forEach(p => {
      playerStats[p.id].finalTokens = p.devotionTokens;
    });

    const winner = gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin);

    return {
      gameId,
      winner: winner?.id || null,
      rounds: roundCount,
      totalTurns: turnCount,
      errors,
      playerStats,
    };
  }

  /**
   * Run multiple game simulations
   */
  static runSimulations(count: number, playerCount: number): SimulationResult[] {
    const results: SimulationResult[] = [];
    console.log(`🎮 Running ${count} game simulations with ${playerCount} players...`);

    for (let i = 0; i < count; i++) {
      const result = this.simulateGame(playerCount);
      results.push(result);

      if ((i + 1) % 100 === 0) {
        console.log(`  Completed ${i + 1}/${count} simulations`);
      }
    }

    return results;
  }

  /**
   * Analyze simulation results
   */
  static analyzeResults(results: SimulationResult[]): void {
    const totalGames = results.length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const avgRounds = results.reduce((sum, r) => sum + r.rounds, 0) / totalGames;
    const avgTurns = results.reduce((sum, r) => sum + r.totalTurns, 0) / totalGames;

    console.log('\n📊 Simulation Analysis:');
    console.log(`  Total games: ${totalGames}`);
    console.log(`  Total errors: ${totalErrors} (${((totalErrors / totalGames) * 100).toFixed(2)}% of games)`);
    console.log(`  Average rounds per game: ${avgRounds.toFixed(2)}`);
    console.log(`  Average turns per game: ${avgTurns.toFixed(2)}`);

    // Error breakdown
    if (totalErrors > 0) {
      console.log('\n❌ Error types:');
      const errorTypes: Record<string, number> = {};
      results.forEach(r => {
        r.errors.forEach(e => {
          errorTypes[e.error] = (errorTypes[e.error] || 0) + 1;
        });
      });
      Object.entries(errorTypes).forEach(([error, count]) => {
        console.log(`  - ${error}: ${count}`);
      });
    }

    // Winner distribution
    const winnerCounts: Record<string, number> = {};
    results.forEach(r => {
      if (r.winner) {
        winnerCounts[r.winner] = (winnerCounts[r.winner] || 0) + 1;
      }
    });
    console.log('\n🏆 Winner distribution:');
    Object.entries(winnerCounts).forEach(([playerId, count]) => {
      console.log(`  ${playerId}: ${count} wins (${((count / totalGames) * 100).toFixed(2)}%)`);
    });
  }

  // Private helper methods

  private static initializeGame(playerCount: number): GameState {
    const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      hand: [],
      discardPile: [],
      devotionTokens: 0,
      isProtected: false,
      isEliminated: false,
    }));

    const tokensToWin = playerCount === 2 ? 7 : playerCount === 3 ? 5 : 4;

    return this.initializeRound(players, tokensToWin);
  }

  private static initializeRound(players: Player[], tokensToWin: number): GameState {
    const deck = shuffleDeck(createDeck());
    const cardsToRemove = players.length === 2 ? 3 : players.length === 3 ? 1 : 0;
    const removedCard = cardsToRemove > 0 ? deck[0] : null;
    const playDeck = deck.slice(cardsToRemove);

    const resetPlayers: Player[] = players.map(p => ({
      ...p,
      hand: [],
      discardPile: [],
      isProtected: false,
      isEliminated: false,
    }));

    resetPlayers.forEach(player => {
      player.hand.push(playDeck.pop()!);
    });

    return {
      players: resetPlayers,
      deck: playDeck,
      currentPlayerIndex: 0,
      phase: 'draw',
      tokensToWin,
      removedCard,
    };
  }

  private static simulateDrawCard(gameState: GameState): GameState {
    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    const newPlayers = [...gameState.players];
    const currentPlayerIdx = gameState.currentPlayerIndex;
    newPlayers[currentPlayerIdx].hand.push(drawnCard);

    let updatedState: GameState = {
      ...gameState,
      deck: newDeck,
      players: newPlayers,
      phase: 'play',
    };

    // Check First Speaker auto-discard
    const currentPlayer = updatedState.players[currentPlayerIdx];
    if (checkFirstSpeakerAutoDiscard(currentPlayer)) {
      updatedState = autoDiscardFirstSpeaker(updatedState, currentPlayer.id);
    }

    return updatedState;
  }

  private static simulatePlayCard(
    gameState: GameState,
    playerId: string
  ): { gameState?: GameState; error?: string } {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return { error: 'Player not found' };

    // Get valid cards
    const validCards = getValidPlays(player);
    if (validCards.length === 0) {
      return { error: 'No valid cards to play' };
    }

    // AI decides which card to play
    const decision = SimpleAI.decideAction(gameState, playerId);
    if (!decision || decision.action !== 'play' || !decision.cardId) {
      return { error: 'AI failed to make decision' };
    }

    // Validate the play
    const validation = validateCardPlay(gameState, playerId, decision.cardId);
    if (!validation.valid) {
      return { error: `Invalid play: ${validation.reason}` };
    }

    const cardIndex = player.hand.findIndex(c => c.id === decision.cardId);
    const playedCard = player.hand[cardIndex];

    const newPlayers = [...gameState.players];
    const playerIdx = newPlayers.findIndex(p => p.id === playerId);

    newPlayers[playerIdx] = {
      ...newPlayers[playerIdx],
      hand: newPlayers[playerIdx].hand.filter((_, i) => i !== cardIndex),
      discardPile: [...newPlayers[playerIdx].discardPile, playedCard],
    };

    // Clear protection
    newPlayers.forEach(p => {
      if (p.id !== playerId) {
        p.isProtected = false;
      }
    });

    let updatedState: GameState = {
      ...gameState,
      players: newPlayers,
    };

    // Apply card effect
    const effectResult = applyCardEffect(updatedState, playedCard, playerId, decision.choice);
    updatedState = effectResult.gameState;

    // Check First Speaker auto-discard after effect
    const playerAfterEffect = updatedState.players[playerIdx];
    if (checkFirstSpeakerAutoDiscard(playerAfterEffect)) {
      updatedState = autoDiscardFirstSpeaker(updatedState, playerAfterEffect.id);
    }

    return { gameState: updatedState };
  }

  private static simulateEndTurn(gameState: GameState): GameState {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);

    // Check win conditions
    if (activePlayers.length === 1) {
      return this.handleRoundEnd(gameState, activePlayers[0].id);
    }

    if (gameState.deck.length === 0) {
      const winner = this.determineRoundWinner(activePlayers);
      return this.handleRoundEnd(gameState, winner.id);
    }

    // Move to next player
    let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    while (gameState.players[nextIndex].isEliminated) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
    }

    return {
      ...gameState,
      currentPlayerIndex: nextIndex,
      phase: 'draw',
    };
  }

  private static handleRoundEnd(state: GameState, winnerId: string): GameState {
    const newPlayers = state.players.map(p =>
      p.id === winnerId ? { ...p, devotionTokens: p.devotionTokens + 1 } : p
    );

    return {
      ...state,
      players: newPlayers,
      phase: 'round-end',
    };
  }

  private static determineRoundWinner(players: Player[]): Player {
    const playersWithValues = players.map(p => ({
      player: p,
      handValue: p.hand[0]?.value || 0,
      discardTotal: p.discardPile.reduce((sum, card) => sum + card.value, 0),
    }));

    playersWithValues.sort((a, b) => {
      if (b.handValue !== a.handValue) return b.handValue - a.handValue;
      return b.discardTotal - a.discardTotal;
    });

    return playersWithValues[0].player;
  }
}
