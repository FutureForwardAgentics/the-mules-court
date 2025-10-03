import { useEffect, useRef } from 'react';
import { Application, Graphics, Container } from 'pixi.js';

interface PixiEffectsProps {
  onReady?: (app: Application) => void;
}

export function PixiEffects({ onReady }: PixiEffectsProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create PixiJS Application
    const app = new Application();

    // Initialize the app
    (async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      // Add canvas to DOM
      if (canvasRef.current && app.canvas) {
        canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
      }

      appRef.current = app;

      // Notify parent component
      if (onReady) {
        onReady(app);
      }

      // Handle window resize
      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    })();

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [onReady]);

  return (
    <div
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
  app: Application,
  x: number,
  y: number,
  color: number = 0xff6b6b
): void {
  const container = new Container();
  app.stage.addChild(container);

  // Create particles
  const particleCount = 20;
  const particles: { graphic: Graphics; vx: number; vy: number; life: number }[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = new Graphics();
    particle.circle(0, 0, Math.random() * 4 + 2);
    particle.fill({ color, alpha: 0.8 });

    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = Math.random() * 3 + 2;

    particle.x = x;
    particle.y = y;

    particles.push({
      graphic: particle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1.0,
    });

    container.addChild(particle);
  }

  // Animation
  const animate = () => {
    let allDead = true;

    particles.forEach(p => {
      if (p.life > 0) {
        allDead = false;

        // Update position
        p.graphic.x += p.vx;
        p.graphic.y += p.vy;

        // Apply gravity
        p.vy += 0.2;

        // Fade out
        p.life -= 0.02;
        p.graphic.alpha = p.life;
      }
    });

    if (allDead) {
      app.stage.removeChild(container);
      container.destroy({ children: true });
    } else {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

// Elimination effect
export function createEliminationEffect(
  app: Application,
  x: number,
  y: number
): void {
  const container = new Container();
  app.stage.addChild(container);

  // Create expanding circle
  const circle = new Graphics();
  circle.circle(0, 0, 1);
  circle.fill({ color: 0xff0000, alpha: 0.5 });
  circle.x = x;
  circle.y = y;
  container.addChild(circle);

  let radius = 1;
  let alpha = 0.5;

  const animate = () => {
    radius += 5;
    alpha -= 0.02;

    if (alpha <= 0) {
      app.stage.removeChild(container);
      container.destroy({ children: true });
      return;
    }

    circle.clear();
    circle.circle(0, 0, radius);
    circle.fill({ color: 0xff0000, alpha });

    requestAnimationFrame(animate);
  };

  animate();
}

// Protection shield effect
export function createProtectionEffect(
  app: Application,
  x: number,
  y: number
): void {
  const shield = new Graphics();
  shield.circle(0, 0, 40);
  shield.fill({ color: 0x00ffff, alpha: 0 });
  shield.stroke({ color: 0x00ffff, width: 3, alpha: 0.8 });
  shield.x = x;
  shield.y = y;
  app.stage.addChild(shield);

  let scale = 0.5;
  let growing = true;

  const animate = () => {
    if (growing) {
      scale += 0.05;
      if (scale >= 1.2) growing = false;
    } else {
      scale -= 0.05;
      if (scale <= 0.5) growing = true;
    }

    shield.scale.set(scale);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      app.stage.removeChild(shield);
      shield.destroy();
    }, 3000);
  };

  const interval = setInterval(animate, 50);
  setTimeout(() => clearInterval(interval), 3000);
}
