import { useState } from 'react';
import type { Player } from '../types/game';
import { PixiCardRenderer } from './PixiCardRenderer';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isLocalPlayer: boolean;
  onCardClick?: (cardId: string) => void;
}

export function PlayerArea({ player, isCurrentPlayer, isLocalPlayer, onCardClick }: PlayerAreaProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
        isCurrentPlayer
          ? 'border-red-500 bg-red-950/30 shadow-lg shadow-red-500/30 scale-105'
          : 'border-gray-700 bg-gray-900/30'
      } ${player.isEliminated ? 'opacity-50 grayscale' : ''} ${
        isHovered && !player.isEliminated ? 'scale-105' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Player Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {player.name}
            {isCurrentPlayer && (
              <span className="text-red-400 animate-[pulse_1s_ease-in-out_infinite]">⚡</span>
            )}
            {player.isProtected && (
              <span
                className="text-cyan-400 animate-[pulse_0.8s_ease-in-out_infinite]"
                title="Protected by Shielded Mind"
              >
                🛡️
              </span>
            )}
            {player.isEliminated && (
              <span className="text-gray-500" title="Eliminated this round">💀</span>
            )}
          </h3>
          {isLocalPlayer && (
            <span className="text-xs text-purple-400 font-semibold">You</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">
            {player.devotionTokens > 0 ? 'Devotion:' : 'Unconverted'}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: player.devotionTokens }).map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-red-400 flex items-center justify-center transition-all duration-300 hover:scale-125 animate-[fadeIn_0.5s_ease-out]"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-sm">👁️</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 uppercase mb-2 flex items-center gap-2">
          <span>Hand</span>
          {player.hand.length === 0 && !player.isEliminated && (
            <span className="text-xs text-yellow-500 italic">(awaiting cards...)</span>
          )}
        </div>
        <div className="flex gap-2">
          {player.hand.length > 0 ? (
            <PixiCardRenderer
              cards={player.hand}
              size="small"
              isRevealed={isLocalPlayer}
              isInteractive={isCurrentPlayer && isLocalPlayer && player.hand.length === 2}
              layout="horizontal"
              spacing={8}
              onCardClick={onCardClick}
            />
          ) : (
            !player.isEliminated && (
              <div className="w-24 h-36 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                <span className="text-gray-600 text-xs">Empty</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Discard Pile */}
      {player.discardPile.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 uppercase mb-2">Devotion History</div>
          <div className="flex gap-1 flex-wrap">
            {player.discardPile.map((card, i) => (
              <div
                key={`${card.id}-${i}`}
                className="text-2xl opacity-70 transition-all duration-300 hover:opacity-100 hover:scale-125 cursor-help"
                title={`${card.name} - ${card.description}`}
                style={{
                  animation: 'fadeIn 0.4s ease-out',
                  animationDelay: `${i * 0.05}s`,
                  animationFillMode: 'backwards'
                }}
              >
                {card.icon}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total value: {player.discardPile.reduce((sum, card) => sum + card.value, 0)}
            {' '}(used for tiebreakers)
          </div>
        </div>
      )}

      {/* Elimination Message */}
      {player.isEliminated && (
        <div className="mt-3 bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-center animate-[fadeIn_0.5s_ease-out]">
          <p className="text-sm text-gray-400 italic">
            Their conversion was incomplete this round
          </p>
        </div>
      )}

      {/* Protection Message */}
      {player.isProtected && !player.isEliminated && (
        <div className="mt-3 bg-cyan-950/30 border border-cyan-700 rounded-lg p-2 text-center animate-[pulse_1.5s_ease-in-out_infinite]">
          <p className="text-sm text-cyan-300 font-semibold">
            ✨ Mind Shielded ✨
          </p>
          <p className="text-xs text-cyan-400 italic mt-1">
            Immune to targeting this turn
          </p>
        </div>
      )}
    </div>
  );
}
