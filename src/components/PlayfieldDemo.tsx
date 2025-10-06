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
  const [showRules, setShowRules] = useState(false);
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
          <div className="bg-gray-900 rounded-xl p-8 border-2 border-purple-600 max-w-2xl shadow-2xl shadow-purple-900/50">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4 text-center">
              The Mule's Court
            </h1>
            <p className="text-gray-400 text-center mb-6 italic">
              "When the Mule touches your mind, you know no better love"
            </p>

            {!showRules ? (
              <>
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
                  className="w-full py-4 mb-3 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg transition-all duration-200 hover:scale-105 shadow-xl shadow-purple-500/30"
                >
                  Enter The Court
                </button>

                <button
                  onClick={() => setShowRules(true)}
                  className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
                >
                  📖 How to Play
                </button>
              </>
            ) : (
              <HowToPlay onClose={() => setShowRules(false)} />
            )}
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

  // Set card click handler
  useEffect(() => {
    if (playfieldManager) {
      playfieldManager.setCardClickHandler(gameState.playCard);
    }
  }, [playfieldManager, gameState.playCard]);

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

interface HowToPlayProps {
  onClose: () => void;
}

function HowToPlay({ onClose }: HowToPlayProps) {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4 text-center text-purple-400">How to Play</h2>

      <div className="space-y-4 text-sm max-h-96 overflow-y-auto pr-2">
        <section>
          <h3 className="font-bold text-lg mb-2 text-yellow-400">🎯 Objective</h3>
          <p className="text-gray-300">Be the last player standing in a round, or have the highest card when the deck runs out. Win devotion tokens to become the ultimate victor.</p>
          <ul className="list-disc list-inside mt-2 text-gray-300 space-y-1">
            <li><strong>2 players:</strong> First to 7 tokens wins</li>
            <li><strong>3 players:</strong> First to 5 tokens wins</li>
            <li><strong>4 players:</strong> First to 4 tokens wins</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2 text-yellow-400">🎮 Gameplay</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li><strong>Start:</strong> Each player gets 1 card from the deck</li>
            <li><strong>Your Turn:</strong> Draw 1 card (now you have 2 cards)</li>
            <li><strong>Play:</strong> Choose 1 card to play and discard it</li>
            <li><strong>Activate:</strong> Follow the card's ability</li>
            <li><strong>Next:</strong> Play passes to the next player</li>
          </ol>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2 text-yellow-400">🃏 The Cards (1-8)</h3>
          <div className="space-y-2">
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">1️⃣ Informant</strong>
              <p className="text-xs text-gray-400">Guess another player's card. If correct, they're eliminated!</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">2️⃣ Han Pritcher / Bail Channis</strong>
              <p className="text-xs text-gray-400">Look at another player's hand</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">3️⃣ Ebling Mis / Magnifico</strong>
              <p className="text-xs text-gray-400">Compare cards with another player. Lower value is eliminated</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">4️⃣ Shielded Mind</strong>
              <p className="text-xs text-gray-400">Protection until your next turn</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">5️⃣ Bayta / Toran Darell</strong>
              <p className="text-xs text-gray-400">Choose a player to discard and draw a new card</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">6️⃣ Mayor Indbur</strong>
              <p className="text-xs text-gray-400">Trade hands with another player</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">7️⃣ First Speaker</strong>
              <p className="text-xs text-gray-400">No effect, but worth 7 points!</p>
            </div>
            <div className="bg-gray-800 p-2 rounded">
              <strong className="text-yellow-300">8️⃣ The Mule</strong>
              <p className="text-xs text-gray-400">If discarded, you're eliminated! (Unless it's your only card)</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2 text-yellow-400">♿ Accessibility</h3>
          <p className="text-gray-300">Card values are shown with high-contrast gold numbers in circles. All text has outlines for readability.</p>
        </section>

        <section>
          <h3 className="font-bold text-lg mb-2 text-yellow-400">📺 Video Guide</h3>
          <p className="text-gray-300">Watch a 3-minute gameplay video: <a href="https://youtu.be/WAiI7G3QdOU" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Love Letter Tutorial</a></p>
        </section>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105"
      >
        Back to Setup
      </button>
    </div>
  );
}
