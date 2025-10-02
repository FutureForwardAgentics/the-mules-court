import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from './useGameState';
import { gameDB, type GameSession } from '../services/gameDatabase';
import { SimpleAI } from '../ai/simpleAI';

export function useGameWithAI(playerCount: number, humanPlayerId: string = 'player-0') {
  const gameState = useGameState(playerCount);
  const [session, setSession] = useState<GameSession | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiTimeoutRef = useRef<number | null>(null);

  // Initialize game session
  useEffect(() => {
    const initSession = async () => {
      const newSession = await gameDB.createSession(playerCount);
      setSession(newSession);

      // Record game start
      await gameDB.recordEvent({
        sessionId: newSession.id,
        type: 'game_start',
        playerId: 'system',
        data: { playerCount },
        gameState: gameState.gameState,
      });
    };

    initSession();
  }, [playerCount]);

  // Auto-play AI turns
  useEffect(() => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    // Check if it's an AI player's turn
    const isAITurn = currentPlayer.id !== humanPlayerId && !currentPlayer.isEliminated;

    if (isAITurn && !isAIThinking && session) {
      setIsAIThinking(true);

      const decision = SimpleAI.decideAction(gameState.gameState, currentPlayer.id);

      if (decision) {
        const delay = SimpleAI.getActionDelay();

        aiTimeoutRef.current = window.setTimeout(async () => {
          console.log(`AI ${currentPlayer.name} deciding:`, decision);

          if (decision.action === 'draw') {
            gameState.drawCard();

            await gameDB.recordEvent({
              sessionId: session.id,
              type: 'draw_card',
              playerId: currentPlayer.id,
              data: { action: 'draw' },
              gameState: gameState.gameState,
            });
          } else if (decision.action === 'play' && decision.cardId) {
            gameState.playCard(decision.cardId);

            await gameDB.recordEvent({
              sessionId: session.id,
              type: 'play_card',
              playerId: currentPlayer.id,
              data: { cardId: decision.cardId },
              gameState: gameState.gameState,
            });

            // Auto end turn after playing
            setTimeout(() => {
              gameState.endTurn();
            }, 300);
          }

          setIsAIThinking(false);
        }, delay);
      } else {
        setIsAIThinking(false);
      }
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [gameState.gameState, humanPlayerId, isAIThinking, session]);

  // Enhanced draw card with recording
  const drawCardWithRecording = useCallback(async () => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    gameState.drawCard();

    if (session) {
      await gameDB.recordEvent({
        sessionId: session.id,
        type: 'draw_card',
        playerId: currentPlayer.id,
        data: { action: 'draw' },
        gameState: gameState.gameState,
      });
    }
  }, [gameState, session]);

  // Enhanced play card with recording
  const playCardWithRecording = useCallback(async (cardId: string) => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    gameState.playCard(cardId);

    if (session) {
      await gameDB.recordEvent({
        sessionId: session.id,
        type: 'play_card',
        playerId: currentPlayer.id,
        data: { cardId },
        gameState: gameState.gameState,
      });
    }
  }, [gameState, session]);

  // Enhanced end turn with recording
  const endTurnWithRecording = useCallback(async () => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    gameState.endTurn();

    if (session) {
      await gameDB.recordEvent({
        sessionId: session.id,
        type: 'end_turn',
        playerId: currentPlayer.id,
        data: {},
        gameState: gameState.gameState,
      });

      // Check if game ended
      if (gameState.gameState.phase === 'game-end') {
        const winner = gameState.gameState.players.find(
          p => p.devotionTokens >= gameState.gameState.tokensToWin
        );
        await gameDB.endSession(session.id, winner?.id);
      }
    }
  }, [gameState, session]);

  return {
    gameState: gameState.gameState,
    session,
    isAIThinking,
    drawCard: drawCardWithRecording,
    playCard: playCardWithRecording,
    endTurn: endTurnWithRecording,
    startNewRound: gameState.startNewRound,
  };
}
