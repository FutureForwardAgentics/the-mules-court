import type { Player } from '../types/game';
import { GameCard } from './GameCard';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isLocalPlayer: boolean;
  onCardClick?: (cardId: string) => void;
}

export function PlayerArea({ player, isCurrentPlayer, isLocalPlayer, onCardClick }: PlayerAreaProps) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        isCurrentPlayer
          ? 'border-red-500 bg-red-950/30'
          : 'border-gray-700 bg-gray-900/30'
      } ${player.isEliminated ? 'opacity-50' : ''}`}
    >
      {/* Player Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">
            {player.name}
            {isCurrentPlayer && <span className="ml-2 text-red-400">⚡</span>}
            {player.isProtected && <span className="ml-2 text-cyan-400">🛡️</span>}
            {player.isEliminated && <span className="ml-2 text-gray-500">💀</span>}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400">Devotion:</div>
          <div className="flex gap-1">
            {Array.from({ length: player.devotionTokens }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-900 border border-red-400 flex items-center justify-center">
                <span className="text-sm">👁️</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hand */}
      <div className="mb-3">
        <div className="text-xs text-gray-400 uppercase mb-2">Hand</div>
        <div className="flex gap-2">
          {player.hand.map(card => (
            <GameCard
              key={card.id}
              card={card}
              size="small"
              isRevealed={isLocalPlayer}
              isPlayable={isCurrentPlayer && isLocalPlayer}
              onClick={() => onCardClick?.(card.id)}
            />
          ))}
        </div>
      </div>

      {/* Discard Pile */}
      {player.discardPile.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 uppercase mb-2">Played Cards</div>
          <div className="flex gap-1 flex-wrap">
            {player.discardPile.map((card, i) => (
              <div key={`${card.id}-${i}`} className="text-2xl opacity-70" title={card.name}>
                {card.icon}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
