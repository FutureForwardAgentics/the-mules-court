import { useState, useEffect } from 'react';
import type { GameState } from '../types/game';
import { PlayerArea } from './PlayerArea';
import { PixiCardRenderer } from './PixiCardRenderer';

interface GameBoardProps {
  gameState: GameState;
  localPlayerId: string;
  onCardClick: (cardId: string) => void;
  onDrawCard: () => void;
  onEndTurn: () => void;
  onStartNewRound: () => void;
  isAIThinking?: boolean;
}

// Whimsical AI thinking messages
const AI_THINKING_MESSAGES = [
  "The Mule is peering into their mind...",
  "Converting emotions to devotion...",
  "Calculating optimal submission...",
  "Rewriting their emotional reality...",
  "The touch of the Mule deepens...",
  "Their will becomes his will...",
  "Psychohistory cannot predict this...",
  "Foundation trembles before this power...",
  "Another mind falls to his influence...",
  "Resistance is... meaningless...",
];

export function GameBoard({
  gameState,
  localPlayerId,
  onCardClick,
  onDrawCard,
  onEndTurn,
  onStartNewRound,
  isAIThinking = false,
}: GameBoardProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer.id === localPlayerId;
  const [thinkingMessage, setThinkingMessage] = useState("");
  const [showVictory, setShowVictory] = useState(false);

  // Rotate through AI thinking messages
  useEffect(() => {
    if (isAIThinking) {
      const randomMessage = AI_THINKING_MESSAGES[Math.floor(Math.random() * AI_THINKING_MESSAGES.length)];
      setThinkingMessage(randomMessage);
    }
  }, [isAIThinking]);

  // Show victory animation when entering round-end or game-end
  useEffect(() => {
    if (gameState.phase === 'round-end' || gameState.phase === 'game-end') {
      setShowVictory(true);
    } else {
      setShowVictory(false);
    }
  }, [gameState.phase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2 animate-[pulse_3s_ease-in-out_infinite]">
            The Mule's Court
          </h1>
          <p className="text-gray-300 text-sm italic">
            "When the Mule touches your mind, you know no better love"
          </p>
        </header>

        {/* AI Thinking Indicator */}
        {isAIThinking && (
          <div className="bg-purple-900/50 border border-purple-500 rounded-lg p-3 mb-4 animate-[pulse_1s_ease-in-out_infinite]">
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-[bounce_0.6s_ease-in-out_0.4s_infinite]"></div>
              </div>
              <span className="text-purple-200 text-sm font-medium">{thinkingMessage}</span>
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700 transition-all duration-300 hover:border-purple-500">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              <span className="font-bold text-white">{currentPlayer.name}'s</span> turn
              {gameState.phase === 'draw' && (
                <span className="ml-2 text-red-400">
                  - Draw your fate
                </span>
              )}
              {gameState.phase === 'play' && (
                <span className="ml-2 text-purple-400">
                  - Choose your devotion
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Cards remaining: <span className="text-white font-bold">{gameState.deck.length}</span>
              </div>
              <div className="text-sm text-gray-400">
                Conversion threshold: <span className="text-white font-bold">{gameState.tokensToWin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Area - Deck and Actions */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 transition-all duration-300 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20">
            <div className="flex items-center gap-6">
              {/* Deck */}
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase mb-2">The Deck</div>
                {gameState.deck.length > 0 ? (
                  <div className="transition-transform hover:scale-105">
                    <PixiCardRenderer
                      cards={[gameState.deck[0]]}
                      size="small"
                      isRevealed={false}
                      layout="horizontal"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-36 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
                    <div className="text-gray-600 text-sm text-center">
                      Depleted
                      <div className="text-xs mt-1">👁️</div>
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-400 mt-2">
                  {gameState.deck.length > 0
                    ? `${gameState.deck.length} cards`
                    : "The end approaches"}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {isLocalPlayerTurn && gameState.phase === 'draw' && (
                  <button
                    data-testid="draw-card-button"
                    onClick={onDrawCard}
                    disabled={gameState.deck.length === 0}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50 active:scale-95"
                  >
                    {/* TODO: Add card-draw swoosh sound */}
                    Draw Card
                  </button>
                )}
                {isLocalPlayerTurn && gameState.phase === 'play' && (
                  <button
                    data-testid="end-turn-button"
                    onClick={onEndTurn}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
                  >
                    {/* TODO: Add turn-end chime sound */}
                    Submit Turn
                  </button>
                )}
                {gameState.phase === 'round-end' && (
                  <button
                    data-testid="next-round-button"
                    onClick={onStartNewRound}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 active:scale-95 animate-[pulse_1.5s_ease-in-out_infinite]"
                  >
                    {/* TODO: Add new-round bell sound */}
                    Continue Conversion
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gameState.players.map((player) => (
            <PlayerArea
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayer.id}
              isLocalPlayer={player.id === localPlayerId}
              onCardClick={onCardClick}
            />
          ))}
        </div>

        {/* Round End Modal */}
        {gameState.phase === 'round-end' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-[fadeIn_0.3s_ease-out]">
            <div className={`bg-gray-800 rounded-xl p-8 border-2 border-red-500 max-w-md transform ${
              showVictory ? 'animate-[bounce_0.6s_ease-out]' : ''
            }`}>
              <div className="text-center mb-4">
                <div className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">👁️</div>
                <h2 className="text-3xl font-bold text-red-400 mb-2">Devotion Deepens</h2>
              </div>
              <p className="text-gray-300 text-center mb-6">
                {currentPlayer.name} has proven their conversion runs deepest this round.
              </p>
              <div className="bg-red-950/50 rounded-lg p-4 mb-6 border border-red-500">
                <div className="text-center">
                  <div className="text-5xl mb-2 animate-[bounce_0.8s_ease-out_3]">👁️</div>
                  <div className="text-xl text-white font-bold">+1 Devotion Token</div>
                  <div className="text-sm text-gray-400 mt-1 italic">
                    "Your will is his will"
                  </div>
                </div>
              </div>
              <button
                data-testid="round-end-continue-button"
                onClick={onStartNewRound}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {/* TODO: Add triumphant sound effect */}
                The Mule Demands More
              </button>
            </div>
          </div>
        )}

        {/* Game End Modal */}
        {gameState.phase === 'game-end' && (
          <div data-testid="game-end-modal" className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-[fadeIn_0.5s_ease-out]">
            <div className={`bg-gray-800 rounded-xl p-8 border-2 border-purple-500 max-w-md transform ${
              showVictory ? 'animate-[bounce_0.8s_ease-out]' : ''
            } shadow-2xl shadow-purple-500/50`}>
              <div className="text-center mb-6">
                <div className="text-8xl mb-4 animate-[pulse_2s_ease-in-out_infinite]">👁️</div>
                <h2 className="text-4xl font-bold text-purple-400 mb-2 animate-[pulse_3s_ease-in-out_infinite]">
                  Complete Conversion
                </h2>
              </div>
              <div className="bg-purple-950/50 rounded-lg p-6 mb-6 border border-purple-500">
                <p className="text-gray-300 text-center mb-4">
                  <span className="text-2xl font-bold text-purple-300">
                    {gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin)?.name}
                  </span>
                  <br />
                  <span className="text-sm text-gray-400">has been revealed as</span>
                  <br />
                  <span className="text-lg text-purple-200">
                    the most thoroughly converted
                  </span>
                </p>
                <div className="text-center text-sm text-gray-400 italic border-t border-purple-700 pt-4">
                  "You thought you were playing for yourself,
                  <br />
                  but you served only the Mule."
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-xs italic mb-4">
                  The game is complete. Your devotion is eternal.
                </p>
                <div className="flex gap-2 text-4xl justify-center animate-[bounce_1s_ease-in-out_infinite]">
                  {Array.from({ length: gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin)?.devotionTokens || 0 }).map((_, i) => (
                    <span key={i}>👁️</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
