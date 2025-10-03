import { useState } from 'react';
import { useGameWithAI } from './hooks/useGameWithAI';
import { GameBoard } from './components/GameBoard';
import { SessionViewer } from './components/SessionViewer';

function App() {
  console.log('App component rendering (React+Tailwind version)');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

  console.log('Game state:', { gameStarted, playerCount });

  if (!gameStarted) {
    console.log('Rendering start screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-8">
        <div className="bg-gray-800 rounded-xl p-8 border-2 border-purple-500 max-w-2xl">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4 text-center">
            The Mule's Court
          </h1>
          <p className="text-gray-300 text-center mb-2">A Foundation Universe Card Game</p>
          <p className="text-gray-400 text-sm text-center italic mb-8">
            "When the Mule touches your mind, you know no better love"
          </p>

          <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">The Tragic Premise</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              You are not trying to reach the Mule. You have already been touched by his power, your emotions
              fundamentally rewritten, though you do not consciously know it. You believe yourself to be acting
              independently, pursuing your own goals, engaged in political maneuvering or resistance efforts.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              But every action you take, every clever play, every successful round, is simply proof of how
              thoroughly the Mule has conquered your mind. When you win, you reveal that your emotional
              conversion runs deeper than the others.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-white font-bold mb-3">Number of Players</label>
            <div className="flex gap-3">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`flex-1 py-3 px-6 rounded-lg font-bold transition-colors ${
                    playerCount === count
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {count} Players
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">
              Tokens to win: {playerCount === 2 ? '7' : playerCount === 3 ? '5' : '4'}
            </p>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg transition-colors"
          >
            Begin the Game
          </button>
        </div>
      </div>
    );
  }

  // Only initialize game state after game has started
  return <GameComponent playerCount={playerCount} />;
}

// Separate component that uses the game hook with AI
function GameComponent({ playerCount }: { playerCount: number }) {
  console.log('GameComponent rendering with playerCount:', playerCount);
  const gameWithAI = useGameWithAI(playerCount, 'player-0');

  console.log('Game state initialized:', {
    phase: gameWithAI.gameState.phase,
    players: gameWithAI.gameState.players.length,
    deck: gameWithAI.gameState.deck.length,
    session: gameWithAI.session?.id,
    aiThinking: gameWithAI.isAIThinking,
  });

  return (
    <>
      <GameBoard
        gameState={gameWithAI.gameState}
        localPlayerId="player-0"
        onCardClick={gameWithAI.playCard}
        onDrawCard={gameWithAI.drawCard}
        onEndTurn={gameWithAI.endTurn}
        onStartNewRound={gameWithAI.startNewRound}
      />
      <SessionViewer />
    </>
  );
}

export default App;
