import { useEffect, useRef, useState } from 'react';
import { Application } from 'pixi.js';

export interface PixiAppOptions {
  width?: number;
  height?: number;
  backgroundColor?: number;
  resizeTo?: Window | HTMLElement;
  antialias?: boolean;
  autoDensity?: boolean;
}

export function usePixiApp(options: PixiAppOptions = {}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let mounted = true;

    // Create and initialize PixiJS Application
    (async () => {
      const pixiApp = new Application();
      appRef.current = pixiApp;

      try {
        console.log('Initializing PixiJS Application...');
        await pixiApp.init({
          width: options.width || 800,
          height: options.height || 600,
          background: options.backgroundColor || 0x1a1a2e,
          antialias: options.antialias ?? true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: options.autoDensity ?? true,
          resizeTo: options.resizeTo,
        });

        console.log('PixiJS Application initialized successfully');

        // Mount canvas to DOM only if still mounted
        if (mounted && canvasRef.current) {
          canvasRef.current.appendChild(pixiApp.canvas);
          console.log('Canvas appended to DOM');
          setApp(pixiApp);
          setIsReady(true);
        } else {
          // Component unmounted before init completed
          console.log('Component unmounted before init completed');
          pixiApp.destroy(true);
        }
      } catch (error) {
        console.error('Failed to initialize PixiJS:', error);
      }
    })();

    // Cleanup
    return () => {
      console.log('Cleaning up PixiJS Application');
      mounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, {
          children: true,
          texture: true,
        });
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { canvasRef, app, isReady };
}
