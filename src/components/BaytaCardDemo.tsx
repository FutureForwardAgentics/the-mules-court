import { useState, useCallback } from 'react';
import { Scene } from '@babylonjs/core';
import { AdvancedDynamicTexture } from '@babylonjs/gui';
import { BabylonCanvas } from '../babylon/engine/BabylonCanvas';
import { BabylonCard, type CardConfig } from '../babylon/components/BabylonCard';

/**
 * BaytaCardDemo
 *
 * Demonstration component showing Bayta Darell's card with all 4 portrait variants.
 * This serves as proof-of-concept for the BabylonJS card rendering system.
 */
export function BaytaCardDemo() {
  const [currentPortraitIndex, setCurrentPortraitIndex] = useState(0);
  const [card, setCard] = useState<BabylonCard | null>(null);

  const portraits = [
    '/img/5_bayta_darell.png',
    '/img/5_bayta_darell_1.png',
    '/img/5_bayta_darell_2.png',
    '/img/5_bayta_darell_3.png'
  ];

  const baytaConfig: CardConfig = {
    id: 'bayta-darell-demo',
    name: 'Bayta Darell',
    value: 5,
    ability: 'Choose any player to discard their hand and draw a new card.',
    quote: "You must reveal yourself - we're searching for the Mule!",
    portraitUrl: portraits[0],
    cardBackUrl: '/img/card_back_3.png',
    cardFrontUrl: '/img/card_front_3.png',
    color: { r: 225, g: 29, b: 72 } // Rose-800 approximate
  };

  const onSceneReady = useCallback((scene: Scene) => {
    // Create fullscreen GUI texture
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

    // Create Bayta's card centered on screen
    const baytaCard = new BabylonCard(
      scene,
      advancedTexture,
      baytaConfig,
      '0px', // Centered horizontally
      '0px'  // Centered vertically
    );

    setCard(baytaCard);

    // Cleanup on scene disposal
    scene.onDisposeObservable.add(() => {
      baytaCard.dispose();
    });
  }, []);

  const handlePortraitChange = (index: number) => {
    setCurrentPortraitIndex(index);
    if (card) {
      card.setPortrait(portraits[index]);
    }
  };

  const handleFlip = () => {
    if (card) {
      card.flip();
    }
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!card) return;

    const currentPos = card.getPosition();
    const offset = 100;

    let newX = parseFloat(currentPos.x) || 0;
    let newY = parseFloat(currentPos.y) || 0;

    switch (direction) {
      case 'up':
        newY -= offset;
        break;
      case 'down':
        newY += offset;
        break;
      case 'left':
        newX -= offset;
        break;
      case 'right':
        newX += offset;
        break;
    }

    card.moveTo(`${newX}px`, `${newY}px`, 500);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-4">
        Bayta Darell Card Demo
      </h1>

      <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <BabylonCanvas
          onSceneReady={onSceneReady}
          width="800px"
          height="600px"
        />
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Controls</h2>

        <div className="space-y-4">
          {/* Portrait Selector */}
          <div>
            <label className="block text-white mb-2 font-semibold">
              Portrait Variant:
            </label>
            <div className="flex gap-2">
              {portraits.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handlePortraitChange(index)}
                  className={`px-4 py-2 rounded transition-colors ${
                    currentPortraitIndex === index
                      ? 'bg-rose-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Portrait {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Flip Button */}
          <div>
            <label className="block text-white mb-2 font-semibold">
              Card State:
            </label>
            <button
              onClick={handleFlip}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Flip Card
            </button>
          </div>

          {/* Movement Controls */}
          <div>
            <label className="block text-white mb-2 font-semibold">
              Position:
            </label>
            <div className="grid grid-cols-3 gap-2 max-w-xs">
              <div></div>
              <button
                onClick={() => handleMove('up')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                ↑
              </button>
              <div></div>

              <button
                onClick={() => handleMove('left')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                ←
              </button>
              <div className="flex items-center justify-center text-white">
                Move
              </div>
              <button
                onClick={() => handleMove('right')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                →
              </button>

              <div></div>
              <button
                onClick={() => handleMove('down')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                ↓
              </button>
              <div></div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-700 rounded">
          <h3 className="text-white font-semibold mb-2">Interactions:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• <strong>Hover</strong> over the card to see highlight effect</li>
            <li>• <strong>Click</strong> the card to flip it (also logs to console)</li>
            <li>• Use <strong>portrait buttons</strong> to switch between 4 variants</li>
            <li>• Use <strong>movement arrows</strong> to slide the card around</li>
          </ul>
        </div>

        {/* Card Info */}
        <div className="mt-6 p-4 bg-rose-900/30 border border-rose-700 rounded">
          <h3 className="text-rose-300 font-semibold mb-2">Bayta Darell (Value: 5)</h3>
          <p className="text-rose-200 text-sm mb-2">
            <strong>Ability:</strong> {baytaConfig.ability}
          </p>
          <p className="text-rose-200 text-sm italic">
            "{baytaConfig.quote}"
          </p>
          <p className="text-rose-300 text-xs mt-2">
            The woman whose intuition provides some immunity
          </p>
        </div>
      </div>
    </div>
  );
}
