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

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PixiJS Application
    const pixiApp = new Application();

    // Initialize the application
    (async () => {
      await pixiApp.init({
        width: options.width || 800,
        height: options.height || 600,
        backgroundColor: options.backgroundColor || 0x1a1a2e,
        antialias: options.antialias ?? true,
        autoDensity: options.autoDensity ?? true,
        resizeTo: options.resizeTo,
      });

      // Mount canvas to DOM
      if (canvasRef.current) {
        canvasRef.current.appendChild(pixiApp.canvas);
        setApp(pixiApp);
        setIsReady(true);
      }
    })();

    // Cleanup
    return () => {
      pixiApp.destroy(true, {
        children: true,
        texture: true,
      });
    };
  }, []);

  return { canvasRef, app, isReady };
}
