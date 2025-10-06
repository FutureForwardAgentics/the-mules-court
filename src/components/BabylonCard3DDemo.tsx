import { useState } from 'react';
import { BabylonCardRenderer3D } from './BabylonCardRenderer3D';
import { createDeck } from '../data/cards';
import type { CardSize, CardLayout } from '../types/babylon';

/**
 * BabylonCard3DDemo
 *
 * Test component for Stage 2: 3D Mesh Architecture
 * Validates that card meshes render correctly with various configurations.
 */
export function BabylonCard3DDemo() {
  const [size, setSize] = useState<CardSize>('medium');
  const [layout, setLayout] = useState<CardLayout>('horizontal');
  const [isRevealed, setIsRevealed] = useState(true);
  const [isInteractive, setIsInteractive] = useState(true);
  const [cardCount, setCardCount] = useState(3);

  const deck = createDeck();
  const cards = deck.slice(0, cardCount);

  const handleCardClick = (cardId: string) => {
    console.log('Card clicked:', cardId);
    alert(`Clicked card: ${cardId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Stage 2: 3D Card Mesh Demo
        </h1>
        <p className="text-gray-400 mb-8">
          Testing BabylonJS 3D plane meshes with orthographic camera
        </p>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 space-y-4">
          <h2 className="text-xl font-bold mb-4">Controls</h2>

          {/* Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Size</label>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as CardSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded ${
                    size === s
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div>
            <label className="block text-sm font-medium mb-2">Layout</label>
            <div className="flex gap-2">
              {(['horizontal', 'vertical', 'stack'] as CardLayout[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`px-4 py-2 rounded ${
                    layout === l
                      ? 'bg-blue-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Card Count */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Card Count: {cardCount}
            </label>
            <input
              type="range"
              min="1"
              max="16"
              value={cardCount}
              onChange={(e) => setCardCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRevealed}
                onChange={(e) => setIsRevealed(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Revealed</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isInteractive}
                onChange={(e) => setIsInteractive(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Interactive</span>
            </label>
          </div>
        </div>

        {/* Renderer */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">3D Card Renderer</h2>
          <div className="flex justify-center items-center min-h-[400px] bg-gray-900 rounded-lg p-4">
            <BabylonCardRenderer3D
              cards={cards}
              size={size}
              layout={layout}
              isRevealed={isRevealed}
              isInteractive={isInteractive}
              onCardClick={handleCardClick}
              spacing={8}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">
            Testing Checklist
          </h3>
          <ul className="space-y-2 text-sm">
            <li>✓ Cards render as 3D meshes with orthographic camera</li>
            <li>✓ All three sizes work (small, medium, large)</li>
            <li>✓ All three layouts work (horizontal, vertical, stack)</li>
            <li>✓ Revealed/hidden states toggle correctly</li>
            <li>✓ Interactive mode enables hover and click</li>
            <li>✓ Card colors reflect their type (temporary solid colors)</li>
            <li>✓ Performance is smooth (60fps) with 16 cards</li>
            <li className="text-yellow-400">
              → Next: Replace with shader material in Stage 3
            </li>
          </ul>
        </div>

        {/* Debug Info */}
        <div className="mt-4 text-xs text-gray-500 font-mono">
          <p>Rendering {cards.length} cards</p>
          <p>
            Config: size={size}, layout={layout}, revealed={String(isRevealed)},
            interactive={String(isInteractive)}
          </p>
        </div>
      </div>
    </div>
  );
}
