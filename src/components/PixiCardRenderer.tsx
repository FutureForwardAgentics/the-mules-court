import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import type { PixiCardRendererProps } from '../types/pixi';
import { renderCards, calculateCanvasDimensions } from '../pixi/card/CardRenderer';

/**
 * React component that renders cards using PixiJS
 *
 * This component creates a PixiJS Application and renders cards using the Graphics API.
 * It handles the PixiJS lifecycle (initialization and cleanup) and updates when props change.
 *
 * @example
 * ```tsx
 * <PixiCardRenderer
 *   cards={player.hand}
 *   size="small"
 *   isRevealed={true}
 *   isInteractive={true}
 *   onCardClick={(cardId) => handleCardClick(cardId)}
 * />
 * ```
 */
export function PixiCardRenderer({
  cards,
  size = 'medium',
  isRevealed = true,
  isInteractive = false,
  layout = 'horizontal',
  spacing = 8,
  onCardClick,
}: PixiCardRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  // Initialize PixiJS Application
  useEffect(() => {
    if (!canvasRef.current) return;

    // Track if this effect instance is still mounted
    let isMounted = true;

    // Calculate canvas size based on cards and layout
    const { width, height } = calculateCanvasDimensions(cards, {
      size,
      isRevealed,
      isInteractive,
      layout,
      spacing,
      onCardClick,
    });

    // Handle empty cards array - render nothing
    if (width === 0 || height === 0) {
      return;
    }

    // Create PixiJS Application
    const app = new Application();
    let isInitialized = false;

    // Initialize the app
    (async () => {
      try {
        await app.init({
          width,
          height,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        // Check if component is still mounted
        if (!isMounted) {
          // Component unmounted during init, clean up immediately
          try {
            app.destroy(true, { children: true });
          } catch (e) {
            // Silently catch cleanup errors during unmount
          }
          return;
        }

        isInitialized = true;

        // Add canvas to DOM
        if (canvasRef.current && app.canvas) {
          // Clear any existing canvases
          canvasRef.current.innerHTML = '';
          canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
        }

        // Store app reference
        appRef.current = app;

        // Render cards
        renderCards(app, cards, {
          size,
          isRevealed,
          isInteractive,
          layout,
          spacing,
          onCardClick,
        });
      } catch (error) {
        console.error('PixiJS initialization error:', error);
      }
    })();

    // Cleanup
    return () => {
      isMounted = false;

      // Only destroy if initialization completed
      if (appRef.current && isInitialized) {
        try {
          appRef.current.destroy(true, { children: true });
        } catch (error) {
          // Silently catch destroy errors - PixiJS v8 can have cleanup issues
          console.warn('PixiJS cleanup warning:', error);
        }
        appRef.current = null;
      }
    };
  }, [cards, size, isRevealed, isInteractive, layout, spacing, onCardClick]);

  return (
    <div
      ref={canvasRef}
      style={{
        display: 'inline-block',
        pointerEvents: isInteractive ? 'auto' : 'none',
      }}
    />
  );
}
