import { useState, useCallback } from 'react';
import type { GameState, Player } from '../types/game';
import { createDeck, shuffleDeck } from '../data/cards';
import { applyCardEffect, checkFirstSpeakerAutoDiscard, autoDiscardFirstSpeaker } from '../game/cardEffects';
import type { CardInteractionChoice } from '../components/CardInteractionModal';
import { validateCardPlay } from '../game/gameValidation';

export function useGameState(
  playerCount: number,
  onStateChange?: (newState: GameState) => void
) {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame(playerCount));

  const drawCard = useCallback(() => {
    setGameState(prev => {
      if (prev.deck.length === 0 || prev.phase !== 'draw') return prev;

      const newDeck = [...prev.deck];
      const drawnCard = newDeck.pop()!;
      const newPlayers = [...prev.players];
      const currentPlayerIdx = prev.currentPlayerIndex;
      newPlayers[currentPlayerIdx].hand.push(drawnCard);

      let updatedState: GameState = {
        ...prev,
        deck: newDeck,
        players: newPlayers,
        phase: 'play'
      };

      // Check if First Speaker must be auto-discarded after drawing
      const currentPlayer = updatedState.players[currentPlayerIdx];
      if (checkFirstSpeakerAutoDiscard(currentPlayer)) {
        console.log('⚠️ First Speaker must be discarded after drawing!');
        updatedState = autoDiscardFirstSpeaker(updatedState, currentPlayer.id);
      }

      if (onStateChange) onStateChange(updatedState);
      return updatedState;
    });
  }, [onStateChange]);

  const playCard = useCallback((cardId: string, choice?: CardInteractionChoice) => {
    setGameState(prev => {
      // Can only play cards during the 'play' phase
      if (prev.phase !== 'play') return prev;

      const currentPlayer = prev.players[prev.currentPlayerIndex];

      // Validate the play
      const validation = validateCardPlay(prev, currentPlayer.id, cardId);
      if (!validation.valid) {
        console.warn(`❌ Invalid play: ${validation.reason}`);
        return prev;
      }

      const cardIndex = currentPlayer.hand.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return prev;

      const newPlayers = [...prev.players];
      const playedCard = currentPlayer.hand[cardIndex];

      newPlayers[prev.currentPlayerIndex] = {
        ...currentPlayer,
        hand: currentPlayer.hand.filter((_, i) => i !== cardIndex),
        discardPile: [...currentPlayer.discardPile, playedCard]
      };

      // Clear protection from previous turn
      newPlayers.forEach(p => {
        if (p.id !== currentPlayer.id) {
          p.isProtected = false;
        }
      });

      let updatedState: GameState = {
        ...prev,
        players: newPlayers
      };

      // Apply card effect
      const effectResult = applyCardEffect(updatedState, playedCard, currentPlayer.id, choice);
      updatedState = effectResult.gameState;

      // Log effect message
      if (effectResult.message) {
        console.log(`💫 Card Effect: ${effectResult.message}`);
      }

      // Check for First Speaker auto-discard after drawing
      const playerAfterEffect = updatedState.players[updatedState.currentPlayerIndex];
      if (checkFirstSpeakerAutoDiscard(playerAfterEffect)) {
        console.log('⚠️ First Speaker must be discarded!');
        updatedState = autoDiscardFirstSpeaker(updatedState, playerAfterEffect.id);
      }

      if (onStateChange) onStateChange(updatedState);
      return updatedState;
    });
  }, [onStateChange]);

  const endTurn = useCallback(() => {
    setGameState(prev => {
      const activePlayers = prev.players.filter(p => !p.isEliminated);

      // Check win conditions
      if (activePlayers.length === 1) {
        const newState = handleRoundEnd(prev, activePlayers[0].id);
        if (onStateChange) onStateChange(newState);
        return newState;
      }

      if (prev.deck.length === 0) {
        const winner = determineWinner(activePlayers);
        const newState = handleRoundEnd(prev, winner.id);
        if (onStateChange) onStateChange(newState);
        return newState;
      }

      // Move to next player
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      while (prev.players[nextIndex].isEliminated) {
        nextIndex = (nextIndex + 1) % prev.players.length;
      }

      const newState: GameState = {
        ...prev,
        currentPlayerIndex: nextIndex,
        phase: 'draw' as const
      };
      if (onStateChange) onStateChange(newState);
      return newState;
    });
  }, [onStateChange]);

  const startNewRound = useCallback(() => {
    setGameState(prev => {
      const winner = prev.players.find(p => p.devotionTokens >= prev.tokensToWin);
      if (winner) {
        const newState = { ...prev, phase: 'game-end' as const };
        if (onStateChange) onStateChange(newState);
        return newState;
      }

      const newState = initializeRound(prev.players, prev.tokensToWin);
      if (onStateChange) onStateChange(newState);
      return newState;
    });
  }, [onStateChange]);

  return {
    gameState,
    drawCard,
    playCard,
    endTurn,
    startNewRound
  };
}

function initializeGame(playerCount: number): GameState {
  // Validate player count
  if (playerCount < 2 || playerCount > 4) {
    throw new Error(`Invalid player count: ${playerCount}. Must be between 2 and 4.`);
  }

  const players: Player[] = Array.from({ length: playerCount }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i + 1}`,
    hand: [],
    discardPile: [],
    devotionTokens: 0,
    isProtected: false,
    isEliminated: false
  }));

  const tokensToWin = playerCount === 2 ? 7 : playerCount === 3 ? 5 : 4;

  return initializeRound(players, tokensToWin);
}

function initializeRound(players: Player[], tokensToWin: number): GameState {
  const deck = shuffleDeck(createDeck());

  // Remove cards based on player count
  const cardsToRemove = players.length === 2 ? 3 : players.length === 3 ? 1 : 0;
  const removedCard = cardsToRemove > 0 ? deck[0] : null;
  const playDeck = deck.slice(cardsToRemove);

  // Reset players for new round
  const resetPlayers: Player[] = players.map(p => ({
    ...p,
    hand: [],
    discardPile: [],
    isProtected: false,
    isEliminated: false
  }));

  // Deal one card to each player
  resetPlayers.forEach(player => {
    player.hand.push(playDeck.pop()!);
  });

  return {
    players: resetPlayers,
    deck: playDeck,
    currentPlayerIndex: 0,
    phase: 'draw',
    tokensToWin,
    removedCard
  };
}

function handleRoundEnd(state: GameState, winnerId: string): GameState {
  const newPlayers = state.players.map(p =>
    p.id === winnerId
      ? { ...p, devotionTokens: p.devotionTokens + 1 }
      : p
  );

  return {
    ...state,
    players: newPlayers,
    phase: 'round-end'
  };
}

function determineWinner(players: Player[]): Player {
  // Find highest card value
  const playersWithValues = players.map(p => ({
    player: p,
    handValue: p.hand[0]?.value || 0,
    discardTotal: p.discardPile.reduce((sum, card) => sum + card.value, 0)
  }));

  playersWithValues.sort((a, b) => {
    if (b.handValue !== a.handValue) return b.handValue - a.handValue;
    return b.discardTotal - a.discardTotal;
  });

  return playersWithValues[0].player;
}
