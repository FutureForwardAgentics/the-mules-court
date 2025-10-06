import { useState, useCallback, useEffect } from 'react';
import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { BabylonCanvas } from '../babylon/engine/BabylonCanvas';
import { PlayfieldManager } from '../babylon/components/PlayfieldManager';
import { useGameState } from '../hooks/useGameState';

/**
 * PlayfieldDemo
 *
 * Full playfield demonstration with BabylonJS rendering.
 * Shows the complete game UI with Foundation theming.
 */
export function PlayfieldDemo() {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(2);
  const [gameStarted, setGameStarted] = useState(false);
  const [playfieldManager, setPlayfieldManager] = useState<PlayfieldManager | null>(null);

  const onSceneReady = useCallback((scene: Scene) => {
    // Create fullscreen GUI texture
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('PlayfieldUI', true, scene);

    // Create playfield manager
    const manager = new PlayfieldManager(scene, advancedTexture);
    setPlayfieldManager(manager);

    // Cleanup on scene disposal
    scene.onDisposeObservable.add(() => {
      manager.dispose();
    });
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {!gameStarted ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-gray-900 rounded-xl p-8 border-2 border-purple-600 max-w-lg shadow-2xl shadow-purple-900/50">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4 text-center">
              The Mule's Court
            </h1>
            <p className="text-gray-400 text-center mb-6 italic">
              "When the Mule touches your mind, you know no better love"
            </p>

            <div className="mb-6">
              <label className="block text-white font-bold mb-3 text-center">
                Select Player Count
              </label>
              <div className="flex gap-3">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPlayerCount(count as 2 | 3 | 4)}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
                      playerCount === count
                        ? 'bg-red-600 text-white scale-105 shadow-lg shadow-red-500/50'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setGameStarted(true)}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg transition-all duration-200 hover:scale-105 shadow-xl shadow-purple-500/30"
            >
              Enter The Court
            </button>
          </div>
        </div>
      ) : (
        <>
          <BabylonCanvas
            onSceneReady={onSceneReady}
            width="100%"
            height="100vh"
          />
          <GameControls
            playerCount={playerCount}
            playfieldManager={playfieldManager}
          />
        </>
      )}
    </div>
  );
}

interface GameControlsProps {
  playerCount: 2 | 3 | 4;
  playfieldManager: PlayfieldManager | null;
}

function GameControls({ playerCount, playfieldManager }: GameControlsProps) {
  const gameState = useGameState(playerCount);

  // Update playfield when game state changes
  useEffect(() => {
    if (playfieldManager && gameState.gameState) {
      playfieldManager.updatePlayfield(gameState.gameState);
    }
  }, [playfieldManager, gameState.gameState]);

  if (!gameState.gameState) return null;

  const currentPlayer = gameState.gameState.players[gameState.gameState.currentPlayerIndex];
  const isPlayer1Turn = currentPlayer.id === 'player-0';

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-gray-900/90 rounded-xl p-6 border-2 border-purple-600 shadow-2xl backdrop-blur-sm min-w-[400px]">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          Game Controls
        </h3>

        <div className="space-y-3">
          {/* Draw Card */}
          {isPlayer1Turn && gameState.gameState.phase === 'draw' && (
            <button
              onClick={gameState.drawCard}
              disabled={gameState.gameState.deck.length === 0}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Draw Card
            </button>
          )}

          {/* Play Card */}
          {isPlayer1Turn && gameState.gameState.phase === 'play' && currentPlayer.hand.length === 2 && (
            <div>
              <p className="text-sm text-gray-400 mb-2 text-center">Choose a card to play:</p>
              <div className="flex gap-2">
                {currentPlayer.hand.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => gameState.playCard(card.id)}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 text-sm"
                  >
                    {card.icon} {card.name}
                    <div className="text-xs text-purple-200 mt-1">Value: {card.value}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Turn */}
          {isPlayer1Turn && gameState.gameState.phase === 'play' && currentPlayer.hand.length < 2 && (
            <button
              onClick={gameState.endTurn}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              End Turn
            </button>
          )}

          {/* Start New Round */}
          {gameState.gameState.phase === 'round-end' && (
            <button
              onClick={gameState.startNewRound}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 animate-pulse"
            >
              Start New Round
            </button>
          )}

          {/* Game Over */}
          {gameState.gameState.phase === 'game-end' && (
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400 mb-2">Game Over!</p>
              <p className="text-white">
                {gameState.gameState.players.find(p => p.devotionTokens >= gameState.gameState!.tokensToWin)?.name} wins!
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105"
              >
                New Game
              </button>
            </div>
          )}

          {/* AI Turn Indicator */}
          {!isPlayer1Turn && gameState.gameState.phase !== 'round-end' && gameState.gameState.phase !== 'game-end' && (
            <div className="text-center">
              <p className="text-purple-400 font-semibold animate-pulse">
                {currentPlayer.name}'s Turn (AI)
              </p>
              <p className="text-sm text-gray-500 mt-1">
                The Mule is working...
              </p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Phase: {gameState.gameState.phase} | Deck: {gameState.gameState.deck.length} cards
          </p>
        </div>
      </div>
    </div>
  );
}
