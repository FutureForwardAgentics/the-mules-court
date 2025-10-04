import type { Card } from '../types/game';

interface GameCardProps {
  card: Card;
  isPlayable?: boolean;
  isRevealed?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function GameCard({ card, isPlayable = false, isRevealed = true, onClick, size = 'medium' }: GameCardProps) {
  const sizeClasses = {
    small: 'w-24 h-36 text-xs',
    medium: 'w-48 h-72 text-sm',
    large: 'w-64 h-96 text-base'
  };

  const iconSizes = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl'
  };

  const valueSizes = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl'
  };

  if (!isRevealed) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg shadow-xl border-2 border-gray-600 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform`}
        onClick={onClick}
      >
        <div className="text-6xl opacity-50">👁️</div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br ${card.color} rounded-lg shadow-2xl p-3 flex flex-col relative ${
        isPlayable ? 'cursor-pointer hover:scale-105 hover:shadow-red-500/50 transition-all border-2 border-red-400' : ''
      }`}
      onClick={isPlayable ? onClick : undefined}
    >
      {/* Card Header */}
      <div className="flex justify-between items-start mb-2">
        <div className={`${iconSizes[size]} opacity-90`}>{card.icon}</div>
        <div className="text-right">
          <div className={`${valueSizes[size]} font-bold text-white`}>{card.value}</div>
        </div>
      </div>

      {/* Card Name */}
      <h2 className={`${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-xl' : 'text-2xl'} font-bold text-white mb-1`}>
        {card.name}
      </h2>
      {size !== 'small' && (
        <p className="text-xs text-gray-300 italic mb-2 line-clamp-2">{card.description}</p>
      )}

      {/* Divider */}
      {size !== 'small' && <div className="border-t border-gray-400 opacity-30 my-2"></div>}

      {/* Quote */}
      {size === 'large' && (
        <div className="mb-3">
          <p className="text-xs text-gray-200 italic leading-relaxed line-clamp-3">
            "{card.quote}"
          </p>
        </div>
      )}

      {/* Ability */}
      {size !== 'small' && (
        <div className="mt-auto">
          <div className="bg-black bg-opacity-40 rounded-lg p-2 border border-gray-600">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Ability</div>
            <p className="text-xs text-white leading-relaxed">{card.ability}</p>
          </div>
        </div>
      )}

      {/* Decorative corner elements */}
      <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-gray-400 opacity-20"></div>
      <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-gray-400 opacity-20"></div>
    </div>
  );
}
