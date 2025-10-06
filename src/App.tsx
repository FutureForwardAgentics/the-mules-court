import { useState, useEffect, useRef } from "react";
import { useGameWithAI } from "./hooks/useGameWithAI";
import { GameBoard } from "./components/GameBoard";
import { SessionViewer } from "./components/SessionViewer";
import { BabylonEffects } from "./components/BabylonEffects";
import { BabylonCard3DDemo } from "./components/BabylonCard3DDemo";
import {
  BabylonEffectsProvider,
  useBabylonEffects,
} from "./contexts/BabylonEffectsContext";
import { Color3 } from "@babylonjs/core";

function App() {
  console.log("App component rendering (React+Tailwind version)");
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);

  console.log("Game state:", { gameStarted, playerCount });

  // Check for demo mode via URL parameter
  const params = new URLSearchParams(window.location.search);
  const demo = params.get('demo');

  if (demo === '3d') {
    return <BabylonCard3DDemo />;
  }

  return (
    <BabylonEffectsProvider>
      <AppContent
        gameStarted={gameStarted}
        setGameStarted={setGameStarted}
        playerCount={playerCount}
        setPlayerCount={setPlayerCount}
      />
    </BabylonEffectsProvider>
  );
}

function AppContent({
  gameStarted,
  setGameStarted,
  playerCount,
  setPlayerCount,
}: {
  gameStarted: boolean;
  setGameStarted: (value: boolean) => void;
  playerCount: number;
  setPlayerCount: (value: number) => void;
}) {
  const [hoveredCount, setHoveredCount] = useState<number | null>(null);
  const [startButtonHovered, setStartButtonHovered] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Easter egg: Click title 5 times
  const handleTitleClick = () => {
    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);

    if (newCount === 5) {
      setShowEasterEgg(true);
      setTimeout(() => {
        setShowEasterEgg(false);
        setTitleClickCount(0);
      }, 3000);
    }
  };

  if (!gameStarted) {
    console.log("Rendering start screen");
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center p-8">
        <div className="bg-gray-800 rounded-xl p-8 border-2 border-purple-500 max-w-2xl animate-fadeIn">
          <h1
            onClick={handleTitleClick}
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4 text-center animate-[pulse_3s_ease-in-out_infinite] cursor-pointer select-none"
          >
            The Mule's Court
          </h1>

          {/* Easter Egg Message */}
          {showEasterEgg && (
            <div className="bg-purple-950 border-2 border-purple-400 rounded-lg p-4 mb-4 animate-[bounce_0.5s_ease-out]">
              <p className="text-purple-300 text-center text-sm font-semibold">
                🎉 You found the Mule's secret! 🎉
              </p>
              <p className="text-purple-400 text-center text-xs mt-2 italic">
                "Even curiosity serves the Mule's will..."
              </p>
            </div>
          )}

          <p className="text-gray-300 text-center mb-2">
            A Foundation Universe Card Game
          </p>
          <p className="text-gray-400 text-sm text-center italic mb-8">
            "When the Mule touches your mind, you know no better love"
          </p>

          <div className="bg-gray-900/50 rounded-lg p-6 mb-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">
              The Tragic Premise
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              You are not trying to reach the Mule. You have already been
              touched by his power, your emotions fundamentally rewritten,
              though you do not consciously know it. You believe yourself to be
              acting independently, pursuing your own goals, engaged in
              political maneuvering or resistance efforts.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              But every action you take, every clever play, every successful
              round, is simply proof of how thoroughly the Mule has conquered
              your mind. When you win, you reveal that your emotional conversion
              runs deeper than the others.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-white font-bold mb-3">
              How Many Minds Will Submit?
            </label>
            <div className="flex gap-3">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  onMouseEnter={() => setHoveredCount(count)}
                  onMouseLeave={() => setHoveredCount(null)}
                  className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all duration-200 ${
                    playerCount === count
                      ? "bg-red-600 text-white scale-105 shadow-lg shadow-red-500/50"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:scale-105"
                  } ${hoveredCount === count ? "animate-[bounce_0.5s_ease-in-out]" : ""}`}
                >
                  {count} Players
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-2 text-center">
              Devotion tokens required for complete conversion:{" "}
              {playerCount === 2 ? "7" : playerCount === 3 ? "5" : "4"}
            </p>
          </div>

          <button
            onClick={() => setGameStarted(true)}
            onMouseEnter={() => setStartButtonHovered(true)}
            onMouseLeave={() => setStartButtonHovered(false)}
            className={`w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold text-lg rounded-lg transition-all duration-200 ${
              startButtonHovered ? "scale-105 shadow-2xl shadow-purple-500/50" : ""
            }`}
          >
            {/* TODO: Add satisfying click sound effect */}
            Submit to the Mule
          </button>
          <p className="text-gray-500 text-xs text-center mt-2 italic">
            (You were already his. This is merely a formality.)
          </p>
        </div>
      </div>
    );
  }

  // Only initialize game state after game has started
  return <GameComponent playerCount={playerCount} />;
}

// Separate component that uses the game hook with AI
function GameComponent({ playerCount }: { playerCount: number }) {
  console.log("GameComponent rendering with playerCount:", playerCount);
  const gameWithAI = useGameWithAI(playerCount, "player-0");
  const { setEngineAndScene, playCardEffect, eliminationEffect, protectionEffect, celebrationEffect } =
    useBabylonEffects();

  console.log("Game state initialized:", {
    phase: gameWithAI.gameState.phase,
    players: gameWithAI.gameState.players.length,
    deck: gameWithAI.gameState.deck.length,
    session: gameWithAI.session?.id,
    aiThinking: gameWithAI.isAIThinking,
  });

  // Track previous game state for visual effects
  const prevGameStateRef = useRef(gameWithAI.gameState);

  // Trigger visual effects based on game state changes
  useEffect(() => {
    const prevState = prevGameStateRef.current;
    const currentState = gameWithAI.gameState;

    // Check for eliminations
    currentState.players.forEach((player, idx) => {
      const prevPlayer = prevState.players[idx];
      if (player.isEliminated && !prevPlayer?.isEliminated) {
        // Player was just eliminated - trigger effect at random screen position
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 300;
        eliminationEffect(x, y);
      }

      // Check for protection
      if (player.isProtected && !prevPlayer?.isProtected) {
        // Player just gained protection
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 300;
        protectionEffect(x, y);
      }

      // Check for devotion token gain (celebration!)
      if (player.devotionTokens > (prevPlayer?.devotionTokens || 0)) {
        // Player gained a devotion token - CELEBRATE!
        // TODO: Add triumphant sound effect
        celebrationEffect(window.innerWidth / 2, window.innerHeight / 2);
      }
    });

    prevGameStateRef.current = currentState;
  }, [gameWithAI.gameState, eliminationEffect, protectionEffect, celebrationEffect]);

  // Trigger visual effects based on game actions
  const enhancedPlayCard = (cardId: string) => {
    // Trigger particle effect at screen center
    // TODO: Add satisfying card-play sound effect
    playCardEffect(window.innerWidth / 2, window.innerHeight / 2, new Color3(1, 0.42, 0.42));
    gameWithAI.playCard(cardId);
  };

  return (
    <>
      <BabylonEffects onReady={setEngineAndScene} />
      <GameBoard
        gameState={gameWithAI.gameState}
        localPlayerId="player-0"
        onCardClick={enhancedPlayCard}
        onDrawCard={gameWithAI.drawCard}
        onEndTurn={gameWithAI.endTurn}
        onStartNewRound={gameWithAI.startNewRound}
        isAIThinking={gameWithAI.isAIThinking}
      />
      <SessionViewer />
    </>
  );
}

export default App;
