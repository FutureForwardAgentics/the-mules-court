import type { GameState } from '../types/game';
import { PlayerArea } from './PlayerArea';

interface GameBoardProps {
  gameState: GameState;
  localPlayerId: string;
  onCardClick: (cardId: string) => void;
  onDrawCard: () => void;
  onEndTurn: () => void;
  onStartNewRound: () => void;
}

export function GameBoard({
  gameState,
  localPlayerId,
  onCardClick,
  onDrawCard,
  onEndTurn,
  onStartNewRound
}: GameBoardProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer.id === localPlayerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2">
            The Mule's Court
          </h1>
          <p className="text-gray-300 text-sm italic">
            "When the Mule touches your mind, you know no better love"
          </p>
        </header>

        {/* Game Status */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-gray-300">
              <span className="font-bold text-white">{currentPlayer.name}'s</span> turn
              {gameState.phase === 'draw' && ' - Draw a card'}
              {gameState.phase === 'play' && ' - Play a card'}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Cards in deck: <span className="text-white font-bold">{gameState.deck.length}</span>
              </div>
              <div className="text-sm text-gray-400">
                Tokens to win: <span className="text-white font-bold">{gameState.tokensToWin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Area - Deck and Actions */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-6">
              {/* Deck */}
              <div className="text-center">
                <div className="text-xs text-gray-400 uppercase mb-2">Deck</div>
                <div className="w-32 h-48 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-xl border-2 border-gray-600 flex items-center justify-center">
                  <div className="text-6xl opacity-50">👁️</div>
                </div>
                <div className="text-sm text-gray-400 mt-2">{gameState.deck.length} cards</div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {isLocalPlayerTurn && gameState.phase === 'draw' && (
                  <button
                    onClick={onDrawCard}
                    disabled={gameState.deck.length === 0}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Draw Card
                  </button>
                )}
                {isLocalPlayerTurn && gameState.phase === 'play' && (
                  <button
                    onClick={onEndTurn}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                  >
                    End Turn
                  </button>
                )}
                {gameState.phase === 'round-end' && (
                  <button
                    onClick={onStartNewRound}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Start New Round
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

        {/* Round End / Game End */}
        {gameState.phase === 'round-end' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 border-2 border-red-500 max-w-md">
              <h2 className="text-3xl font-bold text-red-400 mb-4 text-center">Round Complete</h2>
              <p className="text-gray-300 text-center mb-6">
                {currentPlayer.name} has proven their devotion runs deepest this round.
              </p>
              <div className="text-center mb-6">
                <div className="text-5xl mb-2">👁️</div>
                <div className="text-xl text-white">+1 Devotion Token</div>
              </div>
              <button
                onClick={onStartNewRound}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {gameState.phase === 'game-end' && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 border-2 border-purple-500 max-w-md">
              <h2 className="text-4xl font-bold text-purple-400 mb-4 text-center">Game Over</h2>
              <p className="text-gray-300 text-center mb-6">
                {gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin)?.name} has been
                revealed as the most thoroughly converted servant of the Mule.
              </p>
              <div className="text-center mb-6 text-sm text-gray-400 italic">
                "You thought you were playing for yourself, but you served only the Mule."
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
