import { useEffect, useRef } from 'react';
import { Engine, Scene } from '@babylonjs/core';

interface BabylonCanvasProps {
  onSceneReady: (scene: Scene) => void;
  onRender?: (scene: Scene) => void;
  width?: string | number;
  height?: string | number;
}

/**
 * BabylonCanvas component
 *
 * Manages BabylonJS Engine and Scene lifecycle within React.
 * Provides cleanup on unmount to prevent memory leaks.
 */
export function BabylonCanvas({
  onSceneReady,
  onRender,
  width = '100%',
  height = '600px'
}: BabylonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize BabylonJS Engine
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    // Create Scene
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Notify parent component that scene is ready
    onSceneReady(scene);

    // Start render loop
    engine.runRenderLoop(() => {
      if (onRender) {
        onRender(scene);
      }
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [onSceneReady, onRender]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        display: 'block',
        touchAction: 'none' // Prevent default touch behaviors
      }}
    />
  );
}
