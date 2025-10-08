import { useEffect, useRef, useState, useCallback } from 'react';
import type { GameState } from '../types/game';
import { makeAICardChoice, chooseAITarget, makeAICardGuess } from '../game/aiPlayer';
import type { GameAction } from '../components/ActionNotification';

interface AutomatedGameplayProps {
  gameState: GameState | null;
  drawCard: () => void;
  playCard: (cardId: string, choice?: any) => void;
  endTurn: () => void;
  startNewRound: () => void;
  isEnabled: boolean;
  actionDelay?: number; // Delay between actions in ms
}

/**
 * useAutomatedGameplay
 *
 * Automates gameplay by making AI decisions for all players.
 * Adds delays between actions for visual clarity.
 */
export function useAutomatedGameplay({
  gameState,
  drawCard,
  playCard,
  endTurn,
  startNewRound,
  isEnabled,
  actionDelay = 1500
}: AutomatedGameplayProps) {
  const [actions, setActions] = useState<GameAction[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actionCounterRef = useRef<number>(0);

  const addAction = useCallback((message: string, type: GameAction['type']) => {
    const action: GameAction = {
      id: `action-${actionCounterRef.current++}`,
      message,
      type,
      timestamp: Date.now()
    };
    setActions(prev => [...prev, action]);
  }, []);

  const performNextAction = useCallback(() => {
    if (!gameState || !isEnabled) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    try {
      switch (gameState.phase) {
        case 'draw': {
          if (gameState.deck.length === 0) {
            // No cards to draw, end turn immediately
            addAction(`⚠️ Deck is empty, ending ${currentPlayer.name}'s turn`, 'effect');
            endTurn();
          } else {
            addAction(`🃏 ${currentPlayer.name} draws a card`, 'draw');
            drawCard();
          }
          break;
        }

        case 'play': {
          // Check if player has cards to play
          if (currentPlayer.hand.length === 0) {
            addAction(`⏭️ ${currentPlayer.name} has no cards, ending turn`, 'effect');
            endTurn();
            break;
          }

          // AI chooses which card to play
          const cardToPlay = makeAICardChoice(currentPlayer, gameState);
          const card = currentPlayer.hand.find(c => c.id === cardToPlay);

          if (!card) {
            console.error('AI chose invalid card:', cardToPlay);
            endTurn();
            break;
          }

          // Determine if card needs a target
          let choice;
          if (card.value === 1) {
            // Informant - needs target and guess
            const targetId = chooseAITarget(currentPlayer, gameState, card.value);
            const guessValue = makeAICardGuess();
            choice = { targetPlayerId: targetId, guessedValue: guessValue };

            const targetPlayer = gameState.players.find(p => p.id === targetId);
            addAction(
              `♠️ ${currentPlayer.name} plays ${card.icon} ${card.name}, targeting ${targetPlayer?.name || 'no one'} (guesses ${guessValue})`,
              'play'
            );
          } else if ([2, 3, 5, 6].includes(card.value)) {
            // Cards that need a target
            const targetId = chooseAITarget(currentPlayer, gameState, card.value);
            choice = { targetPlayerId: targetId };

            const targetPlayer = gameState.players.find(p => p.id === targetId);
            if (targetPlayer) {
              addAction(
                `♦️ ${currentPlayer.name} plays ${card.icon} ${card.name}, targeting ${targetPlayer.name}`,
                'play'
              );
            } else {
              addAction(
                `♦️ ${currentPlayer.name} plays ${card.icon} ${card.name} (no valid targets)`,
                'play'
              );
            }
          } else {
            // No target needed
            addAction(`♣️ ${currentPlayer.name} plays ${card.icon} ${card.name}`, 'play');
          }

          playCard(cardToPlay, choice);

          // After playing, end turn
          setTimeout(() => {
            if (gameState.phase === 'play') {
              addAction(`⏭️ ${currentPlayer.name} ends their turn`, 'effect');
              endTurn();
            }
          }, actionDelay / 2);
          break;
        }

        case 'round-end': {
          const winner = gameState.players.find(p =>
            gameState.players.filter(pl => !pl.isEliminated).length === 1
              ? !p.isEliminated
              : p.hand.length > 0 && p.hand[0].value === Math.max(...gameState.players.filter(pl => !pl.isEliminated).map(pl => pl.hand[0]?.value || 0))
          );

          addAction(
            `🏆 Round complete! ${winner?.name || 'Unknown'} wins this round and gains a devotion token`,
            'round-end'
          );

          setTimeout(() => {
            startNewRound();
          }, actionDelay * 1.5);
          break;
        }

        case 'game-end': {
          const gameWinner = gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin);
          addAction(
            `👑 GAME OVER! ${gameWinner?.name || 'Unknown'} wins with ${gameWinner?.devotionTokens || 0} devotion tokens!`,
            'game-end'
          );
          // Don't schedule next action - game is over
          return;
        }

        default:
          console.warn('Unknown game phase:', gameState.phase);
      }
    } catch (error) {
      console.error('Error in automated gameplay:', error);
      addAction(`❌ Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`, 'effect');
    }
  }, [gameState, isEnabled, drawCard, playCard, endTurn, startNewRound, addAction, actionDelay]);

  // Main automation loop
  useEffect(() => {
    if (!isEnabled || !gameState) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't schedule if game is over
    if (gameState.phase === 'game-end') return;

    // Schedule next action
    timeoutRef.current = setTimeout(() => {
      performNextAction();
    }, actionDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [gameState, isEnabled, performNextAction, actionDelay]);

  return { actions };
}
