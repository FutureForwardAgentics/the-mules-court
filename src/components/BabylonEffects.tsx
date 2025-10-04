import { useEffect, useRef } from 'react';
import { Engine, Scene, Vector3, Color3, Color4, ParticleSystem, Texture, FreeCamera, Camera } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

interface BabylonEffectsProps {
  onReady?: (engine: Engine, scene: Scene) => void;
}

export function BabylonEffects({ onReady }: BabylonEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create BabylonJS Engine
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    // Create Scene
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background

    // Create orthographic camera for 2D rendering
    const camera = new FreeCamera('camera', new Vector3(0, 0, -10), scene);
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

    const aspectRatio = window.innerWidth / window.innerHeight;
    const orthoSize = 10;
    camera.orthoLeft = -orthoSize * aspectRatio;
    camera.orthoRight = orthoSize * aspectRatio;
    camera.orthoBottom = -orthoSize;
    camera.orthoTop = orthoSize;

    // Store references
    engineRef.current = engine;
    sceneRef.current = scene;

    // Notify parent component
    if (onReady) {
      onReady(engine, scene);
    }

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => {
      engine.resize();
      const aspectRatio = window.innerWidth / window.innerHeight;
      camera.orthoLeft = -orthoSize * aspectRatio;
      camera.orthoRight = orthoSize * aspectRatio;
      camera.orthoBottom = -orthoSize;
      camera.orthoTop = orthoSize;
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [onReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}

// Particle effect for card plays
export function createCardPlayEffect(
  scene: Scene,
  x: number,
  y: number,
  color: Color3 = new Color3(1, 0.42, 0.42) // #ff6b6b
): void {
  // Convert screen coordinates to world coordinates
  const worldPos = screenToWorld(scene, x, y);

  // Create particle system
  const particleSystem = new ParticleSystem('cardPlay', 30, scene);

  // Create a simple particle texture (white circle)
  particleSystem.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', scene);

  particleSystem.emitter = worldPos;
  particleSystem.minEmitBox = new Vector3(-0.1, -0.1, 0);
  particleSystem.maxEmitBox = new Vector3(0.1, 0.1, 0);

  particleSystem.color1 = new Color4(color.r, color.g, color.b, 0.9);
  particleSystem.color2 = new Color4(color.r, color.g, color.b, 0.5);
  particleSystem.colorDead = new Color4(color.r, color.g, color.b, 0);

  particleSystem.minSize = 0.1;
  particleSystem.maxSize = 0.3;

  particleSystem.minLifeTime = 0.3;
  particleSystem.maxLifeTime = 0.6;

  particleSystem.emitRate = 200;
  particleSystem.blendMode = ParticleSystem.BLENDMODE_ADD;

  particleSystem.gravity = new Vector3(0, -2, 0);

  particleSystem.direction1 = new Vector3(-2, 1, 0);
  particleSystem.direction2 = new Vector3(2, 3, 0);

  particleSystem.minAngularSpeed = 0;
  particleSystem.maxAngularSpeed = Math.PI;

  particleSystem.minEmitPower = 1;
  particleSystem.maxEmitPower = 3;
  particleSystem.updateSpeed = 0.01;

  particleSystem.start();

  setTimeout(() => {
    particleSystem.stop();
    setTimeout(() => {
      particleSystem.dispose();
    }, 1000);
  }, 200);
}

// Elimination effect - expanding rings using GUI
export function createEliminationEffect(
  scene: Scene,
  x: number,
  y: number
): void {
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

  const createRing = (delay: number, alpha: number) => {
    const ellipse = new GUI.Ellipse();
    ellipse.width = '20px';
    ellipse.height = '20px';
    ellipse.color = 'red';
    ellipse.thickness = 3;
    ellipse.alpha = alpha;
    ellipse.left = x - window.innerWidth / 2;
    ellipse.top = y - window.innerHeight / 2;
    advancedTexture.addControl(ellipse);

    setTimeout(() => {
      const startSize = 20;
      const endSize = 400;
      const duration = 1000;
      let currentTime = 0;

      const animate = () => {
        currentTime += 16;
        const progress = currentTime / duration;

        if (progress >= 1) {
          advancedTexture.removeControl(ellipse);
          ellipse.dispose();
          return;
        }

        const size = startSize + (endSize - startSize) * progress;
        ellipse.width = `${size}px`;
        ellipse.height = `${size}px`;
        ellipse.alpha = alpha * (1 - progress);

        requestAnimationFrame(animate);
      };

      animate();
    }, delay);
  };

  createRing(0, 0.6);
  createRing(100, 0.45);
  createRing(200, 0.3);

  setTimeout(() => {
    advancedTexture.dispose();
  }, 2000);
}

// Protection shield effect
export function createProtectionEffect(
  scene: Scene,
  x: number,
  y: number
): void {
  const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

  // Create circular shield using Ellipse
  const ellipse = new GUI.Ellipse();
  ellipse.width = '80px';
  ellipse.height = '80px';
  ellipse.color = 'cyan';
  ellipse.thickness = 4;
  ellipse.alpha = 0.8;
  ellipse.left = x - window.innerWidth / 2;
  ellipse.top = y - window.innerHeight / 2;

  advancedTexture.addControl(ellipse);

  // Pulse animation
  let scale = 0.3;
  let growing = true;
  let pulseCount = 0;
  const maxPulses = 3;

  const animate = () => {
    if (growing) {
      scale += 0.08;
      if (scale >= 1.3) {
        growing = false;
        pulseCount++;
      }
    } else {
      scale -= 0.08;
      if (scale <= 0.8) {
        growing = true;
      }
    }

    ellipse.scaleX = scale;
    ellipse.scaleY = scale;

    if (pulseCount >= maxPulses && scale <= 0.3) {
      advancedTexture.removeControl(ellipse);
      ellipse.dispose();
      advancedTexture.dispose();
      return;
    }

    requestAnimationFrame(animate);
  };

  animate();
}

// Celebration effect - confetti
export function createCelebrationEffect(
  scene: Scene,
  x: number,
  y: number
): void {
  const worldPos = screenToWorld(scene, x, y);

  // Create confetti particle system
  const particleSystem = new ParticleSystem('confetti', 100, scene);
  particleSystem.particleTexture = new Texture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', scene);

  particleSystem.emitter = worldPos;
  particleSystem.minEmitBox = new Vector3(-0.5, -0.5, 0);
  particleSystem.maxEmitBox = new Vector3(0.5, 0.5, 0);

  const colors = [
    new Color4(1, 0, 0, 1),
    new Color4(1, 0.42, 0.42, 1),
    new Color4(1, 0, 0.4, 1),
    new Color4(0.6, 0, 1, 1),
    new Color4(0.4, 0, 1, 1),
    new Color4(1, 0.67, 0, 1),
    new Color4(1, 0.87, 0, 1),
  ];

  particleSystem.color1 = colors[Math.floor(Math.random() * colors.length)];
  particleSystem.color2 = colors[Math.floor(Math.random() * colors.length)];
  particleSystem.colorDead = new Color4(0, 0, 0, 0);

  particleSystem.minSize = 0.15;
  particleSystem.maxSize = 0.35;

  particleSystem.minLifeTime = 1;
  particleSystem.maxLifeTime = 2;

  particleSystem.emitRate = 500;
  particleSystem.blendMode = ParticleSystem.BLENDMODE_STANDARD;

  particleSystem.gravity = new Vector3(0, -5, 0);
  particleSystem.direction1 = new Vector3(-4, 2, 0);
  particleSystem.direction2 = new Vector3(4, 6, 0);

  particleSystem.minAngularSpeed = -Math.PI;
  particleSystem.maxAngularSpeed = Math.PI;

  particleSystem.minEmitPower = 2;
  particleSystem.maxEmitPower = 4;
  particleSystem.updateSpeed = 0.01;

  particleSystem.start();

  setTimeout(() => {
    particleSystem.stop();
    setTimeout(() => {
      particleSystem.dispose();
    }, 2000);
  }, 500);
}

// Helper: Convert screen coordinates to world coordinates
function screenToWorld(scene: Scene, screenX: number, screenY: number): Vector3 {
  const camera = scene.activeCamera;
  if (!camera) return Vector3.Zero();

  // For orthographic camera in 2D mode
  const aspectRatio = window.innerWidth / window.innerHeight;
  const orthoSize = 10;

  const normalizedX = (screenX / window.innerWidth) * 2 - 1;
  const normalizedY = -((screenY / window.innerHeight) * 2 - 1);

  const worldX = normalizedX * orthoSize * aspectRatio;
  const worldY = normalizedY * orthoSize;

  return new Vector3(worldX, worldY, 0);
}
