import { useEffect, useState } from 'react';

export interface GameAction {
  id: string;
  message: string;
  type: 'draw' | 'play' | 'effect' | 'elimination' | 'round-end' | 'game-end';
  timestamp: number;
}

interface ActionNotificationProps {
  actions: GameAction[];
  maxVisible?: number;
}

/**
 * ActionNotification
 *
 * Displays recent game actions as a scrolling log with color-coded messages.
 * Shows what's happening in the automated gameplay.
 */
export function ActionNotification({ actions, maxVisible = 5 }: ActionNotificationProps) {
  const [visibleActions, setVisibleActions] = useState<GameAction[]>([]);

  useEffect(() => {
    // Show only the most recent actions
    const recent = actions.slice(-maxVisible);
    setVisibleActions(recent);
  }, [actions, maxVisible]);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-8 right-8 z-20 w-96">
      <div className="bg-gray-900/95 rounded-xl p-4 border-2 border-purple-600 shadow-2xl backdrop-blur-sm">
        <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
          <span className="animate-pulse">●</span>
          Game Actions
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {visibleActions.map((action) => (
            <ActionMessage key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionMessage({ action }: { action: GameAction }) {
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const getActionStyle = () => {
    switch (action.type) {
      case 'draw':
        return 'bg-blue-900/30 border-blue-500 text-blue-200';
      case 'play':
        return 'bg-purple-900/30 border-purple-500 text-purple-200';
      case 'effect':
        return 'bg-cyan-900/30 border-cyan-500 text-cyan-200';
      case 'elimination':
        return 'bg-red-900/30 border-red-500 text-red-200';
      case 'round-end':
        return 'bg-green-900/30 border-green-500 text-green-200';
      case 'game-end':
        return 'bg-yellow-900/30 border-yellow-500 text-yellow-200';
      default:
        return 'bg-gray-900/30 border-gray-500 text-gray-200';
    }
  };

  return (
    <div
      className={`
        p-3 rounded-lg border-l-4 text-sm
        ${getActionStyle()}
        ${isNew ? 'animate-slide-in-right scale-105' : 'scale-100'}
        transition-all duration-300
      `}
    >
      {action.message}
    </div>
  );
}
