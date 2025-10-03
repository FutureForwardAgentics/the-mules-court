import { useState } from 'react';
import { createDeck } from '../data/cards';
import { PixiCardRenderer } from './PixiCardRenderer';
import type { CardSize, CardLayout } from '../types/pixi';

/**
 * Demo page for visually testing PixiCardRenderer
 *
 * This component displays all cards with controls to test different sizes,
 * layouts, and interaction modes. Use this for visual verification during development.
 *
 * To view this demo, temporarily replace App.tsx content with:
 * import { PixiCardDemo } from './components/PixiCardDemo';
 * function App() { return <PixiCardDemo />; }
 */
export function PixiCardDemo() {
  const [size, setSize] = useState<CardSize>('medium');
  const [isRevealed, setIsRevealed] = useState(true);
  const [isInteractive, setIsInteractive] = useState(false);
  const [layout, setLayout] = useState<CardLayout>('horizontal');
  const [clickCount, setClickCount] = useState(0);
  const [lastClickedCard, setLastClickedCard] = useState<string>('');

  const allCards = createDeck();

  const handleCardClick = (cardId: string) => {
    setClickCount((prev) => prev + 1);
    setLastClickedCard(cardId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-white mb-2">PixiJS Card Renderer Demo</h1>
        <p className="text-gray-300 mb-8">Visual testing for Stage 1 & 2 implementation</p>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Size Control */}
            <div>
              <label className="block text-white font-bold mb-2">Size</label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as CardSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-3 py-2 rounded font-bold text-sm ${
                      size === s
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Control */}
            <div>
              <label className="block text-white font-bold mb-2">Layout</label>
              <div className="flex gap-2">
                {(['horizontal', 'vertical', 'stack'] as CardLayout[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    className={`px-3 py-2 rounded font-bold text-sm ${
                      layout === l
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Revealed Toggle */}
            <div>
              <label className="block text-white font-bold mb-2">Revealed</label>
              <button
                onClick={() => setIsRevealed(!isRevealed)}
                className={`w-full px-4 py-2 rounded font-bold ${
                  isRevealed
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {isRevealed ? 'Yes (showing faces)' : 'No (showing backs)'}
              </button>
            </div>

            {/* Interactive Toggle */}
            <div>
              <label className="block text-white font-bold mb-2">Interactive (Stage 2)</label>
              <button
                onClick={() => setIsInteractive(!isInteractive)}
                className={`w-full px-4 py-2 rounded font-bold ${
                  isInteractive
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}
              >
                {isInteractive ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {/* Click Counter (Stage 2) */}
          {isInteractive && (
            <div className="mt-4 p-4 bg-gray-900 rounded">
              <div className="text-white">
                <strong>Clicks:</strong> {clickCount}
              </div>
              {lastClickedCard && (
                <div className="text-gray-300 text-sm mt-1">
                  Last clicked: {lastClickedCard}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Grid */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">All 16 Cards</h2>

          <div
            className="flex flex-wrap gap-4"
            style={{
              alignItems: 'flex-start',
            }}
          >
            {allCards.map((card) => (
              <div key={card.id} className="flex flex-col items-center gap-2">
                <PixiCardRenderer
                  cards={[card]}
                  size={size}
                  isRevealed={isRevealed}
                  isInteractive={isInteractive}
                  onCardClick={handleCardClick}
                />
                {isRevealed && (
                  <div className="text-gray-400 text-xs text-center">
                    {card.name} (#{card.value})
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Layout Examples */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Layout Examples</h2>

          <div className="space-y-6">
            {/* Horizontal */}
            <div>
              <h3 className="text-white font-bold mb-2">Horizontal (Player Hand)</h3>
              <PixiCardRenderer
                cards={allCards.slice(0, 5)}
                size="small"
                isRevealed={true}
                layout="horizontal"
                spacing={8}
                isInteractive={isInteractive}
                onCardClick={handleCardClick}
              />
            </div>

            {/* Vertical */}
            <div>
              <h3 className="text-white font-bold mb-2">Vertical</h3>
              <PixiCardRenderer
                cards={allCards.slice(0, 3)}
                size="small"
                isRevealed={true}
                layout="vertical"
                spacing={8}
                isInteractive={isInteractive}
                onCardClick={handleCardClick}
              />
            </div>

            {/* Stack */}
            <div>
              <h3 className="text-white font-bold mb-2">Stack (Discard Pile)</h3>
              <PixiCardRenderer
                cards={allCards.slice(0, 8)}
                size="small"
                isRevealed={true}
                layout="stack"
                spacing={0}
                isInteractive={isInteractive}
                onCardClick={handleCardClick}
              />
            </div>

            {/* Hidden Cards */}
            <div>
              <h3 className="text-white font-bold mb-2">Hidden Cards (Deck)</h3>
              <PixiCardRenderer
                cards={allCards.slice(0, 1)}
                size="medium"
                isRevealed={false}
                layout="horizontal"
              />
            </div>
          </div>
        </div>

        {/* Stage Info */}
        <div className="mt-8 p-4 bg-gray-900 rounded text-gray-400 text-sm">
          <strong>Stage 1:</strong> Basic rendering with Graphics API (gradients, text, borders)
          <br />
          <strong>Stage 2:</strong> Hover effects and click handling
          <br />
          <strong>Note:</strong> Enable "Interactive" to test Stage 2 features (hover scales card, click fires callback)
        </div>
      </div>
    </div>
  );
}
