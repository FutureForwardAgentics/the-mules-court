import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from './useGameState';
import { gameDB, type GameSession } from '../services/gameDatabase';
import { SimpleAI } from '../ai/simpleAI';
import type { GameState } from '../types/game';

export function useGameWithAI(playerCount: number, humanPlayerId: string = 'player-0') {
  const [session, setSession] = useState<GameSession | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiTimeoutRef = useRef<number | null>(null);
  const pendingEventRef = useRef<{
    type: 'game_start' | 'draw_card' | 'play_card' | 'end_turn' | 'round_end' | 'game_end';
    playerId: string;
    data: any;
  } | null>(null);

  // State change callback for recording
  const handleStateChange = useCallback((newState: GameState) => {
    if (pendingEventRef.current && session) {
      gameDB.recordEvent({
        sessionId: session.id,
        ...pendingEventRef.current,
        gameState: newState,
      });
      pendingEventRef.current = null;
    }
  }, [session]);

  const gameState = useGameState(playerCount, handleStateChange);

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
    const currentPhase = gameState.gameState.phase;

    // Check if it's an AI player's turn
    const isAITurn = currentPlayer.id !== humanPlayerId && !currentPlayer.isEliminated;

    console.log('AI Check:', {
      playerName: currentPlayer.name,
      playerId: currentPlayer.id,
      isAI: isAITurn,
      thinking: isAIThinking,
      phase: currentPhase,
      hasSession: !!session
    });

    if (isAITurn && !isAIThinking && session && (currentPhase === 'draw' || currentPhase === 'play')) {
      console.log('🤖 AI will act for', currentPlayer.name);
      setIsAIThinking(true);

      const decision = SimpleAI.decideAction(gameState.gameState, currentPlayer.id);

      if (decision) {
        const delay = SimpleAI.getActionDelay();

        aiTimeoutRef.current = window.setTimeout(() => {
          console.log(`🤖 AI ${currentPlayer.name} executing:`, decision);

          if (decision.action === 'draw') {
            pendingEventRef.current = {
              type: 'draw_card',
              playerId: currentPlayer.id,
              data: { action: 'draw' },
            };
            gameState.drawCard();
            // Clear thinking after draw
            setIsAIThinking(false);
          } else if (decision.action === 'play' && decision.cardId) {
            pendingEventRef.current = {
              type: 'play_card',
              playerId: currentPlayer.id,
              data: { cardId: decision.cardId, choice: decision.choice },
            };
            gameState.playCard(decision.cardId, decision.choice);

            // Auto end turn after playing with proper event recording
            setTimeout(() => {
              pendingEventRef.current = {
                type: 'end_turn',
                playerId: currentPlayer.id,
                data: {},
              };
              gameState.endTurn();
              setIsAIThinking(false);
            }, 300);
          } else {
            setIsAIThinking(false);
          }
        }, delay);
      } else {
        console.log('AI has no valid decision');
        setIsAIThinking(false);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
    // Re-run when key game state changes
  }, [
    gameState.gameState.currentPlayerIndex,
    gameState.gameState.phase,
    humanPlayerId,
    isAIThinking,
    session,
    gameState.drawCard,
    gameState.playCard,
    gameState.endTurn
  ]);

  // Enhanced draw card with recording
  const drawCardWithRecording = useCallback(() => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    pendingEventRef.current = {
      type: 'draw_card',
      playerId: currentPlayer.id,
      data: { action: 'draw' },
    };

    gameState.drawCard();
  }, [gameState]);

  // Enhanced play card with recording
  const playCardWithRecording = useCallback((cardId: string, choice?: any) => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    pendingEventRef.current = {
      type: 'play_card',
      playerId: currentPlayer.id,
      data: { cardId, choice },
    };

    gameState.playCard(cardId, choice);
  }, [gameState]);

  // Enhanced end turn with recording
  const endTurnWithRecording = useCallback(() => {
    const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];

    pendingEventRef.current = {
      type: 'end_turn',
      playerId: currentPlayer.id,
      data: {},
    };

    gameState.endTurn();
  }, [gameState]);

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
