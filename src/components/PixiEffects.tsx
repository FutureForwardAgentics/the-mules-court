import { useEffect, useRef } from 'react';
import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';

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
  const particleCount = 30;
  const particles: { graphic: Graphics; vx: number; vy: number; life: number }[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = new Graphics();
    particle.circle(0, 0, Math.random() * 5 + 2);
    particle.fill({ color, alpha: 0.9 });

    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = Math.random() * 4 + 3;

    particle.x = x;
    particle.y = y;

    particles.push({
      graphic: particle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 1.0,
    });

    container.addChild(particle);
  }

  // Animation with sparkle effect
  const animate = () => {
    let allDead = true;

    particles.forEach(p => {
      if (p.life > 0) {
        allDead = false;

        // Update position
        p.graphic.x += p.vx;
        p.graphic.y += p.vy;

        // Apply gravity
        p.vy += 0.3;

        // Fade out
        p.life -= 0.015;
        p.graphic.alpha = p.life;

        // Sparkle effect
        p.graphic.scale.set(1 + Math.sin(p.life * 10) * 0.2);
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
  // TODO: Add satisfying particle burst sound effect
}

// Elimination effect - dramatic expanding ring
export function createEliminationEffect(
  app: Application,
  x: number,
  y: number
): void {
  const container = new Container();
  app.stage.addChild(container);

  // Create multiple expanding circles for dramatic effect
  const circles: { graphic: Graphics; radius: number; alpha: number }[] = [];

  for (let i = 0; i < 3; i++) {
    const circle = new Graphics();
    circle.x = x;
    circle.y = y;
    container.addChild(circle);

    circles.push({
      graphic: circle,
      radius: 1,
      alpha: 0.6 - i * 0.15,
    });
  }

  let frame = 0;

  const animate = () => {
    frame++;
    let allDead = true;

    circles.forEach((c, idx) => {
      const delay = idx * 5;
      if (frame > delay) {
        c.radius += 6;
        c.alpha -= 0.02;

        if (c.alpha > 0) {
          allDead = false;
          c.graphic.clear();
          c.graphic.circle(0, 0, c.radius);
          c.graphic.stroke({ color: 0xff0000, width: 3, alpha: c.alpha });

          // Add inner glow
          c.graphic.circle(0, 0, c.radius - 5);
          c.graphic.stroke({ color: 0xff6666, width: 2, alpha: c.alpha * 0.5 });
        }
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
  // TODO: Add ominous elimination sound effect
}

// Protection shield effect - pulsing shield
export function createProtectionEffect(
  app: Application,
  x: number,
  y: number
): void {
  const container = new Container();
  app.stage.addChild(container);

  const shield = new Graphics();
  shield.x = x;
  shield.y = y;
  container.addChild(shield);

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

    // Redraw shield with current scale
    shield.clear();
    shield.scale.set(scale);

    // Hexagonal shield pattern
    shield.moveTo(40, 0);
    for (let i = 1; i <= 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      shield.lineTo(Math.cos(angle) * 40, Math.sin(angle) * 40);
    }
    shield.stroke({ color: 0x00ffff, width: 4, alpha: 0.8 });

    // Inner glow
    shield.circle(0, 0, 30);
    shield.fill({ color: 0x00ffff, alpha: 0.1 });

    if (pulseCount >= maxPulses && scale <= 0.3) {
      app.stage.removeChild(container);
      container.destroy({ children: true });
    } else {
      requestAnimationFrame(animate);
    }
  };

  animate();
  // TODO: Add shield activation sound effect
}

// Celebration effect - confetti explosion for devotion tokens!
export function createCelebrationEffect(
  app: Application,
  x: number,
  y: number
): void {
  const container = new Container();
  app.stage.addChild(container);

  // Create confetti particles
  const confettiCount = 100;
  const particles: {
    graphic: Graphics;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
    color: number;
  }[] = [];

  const colors = [0xff0000, 0xff6b6b, 0xff0066, 0x9900ff, 0x6600ff, 0xffaa00, 0xffdd00];

  for (let i = 0; i < confettiCount; i++) {
    const particle = new Graphics();
    const size = Math.random() * 6 + 3;
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Random confetti shapes
    if (Math.random() > 0.5) {
      particle.rect(-size / 2, -size / 2, size, size);
    } else {
      particle.circle(0, 0, size / 2);
    }
    particle.fill({ color, alpha: 1 });

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;

    particle.x = x;
    particle.y = y;

    particles.push({
      graphic: particle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 1.0,
      color,
    });

    container.addChild(particle);
  }

  // Add eye emoji particles for thematic celebration
  for (let i = 0; i < 10; i++) {
    const eyeText = new Text({
      text: '👁️',
      style: new TextStyle({
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
      }),
    });
    eyeText.anchor.set(0.5);
    eyeText.x = x;
    eyeText.y = y;

    const angle = (Math.PI * 2 * i) / 10;
    const speed = Math.random() * 5 + 3;

    particles.push({
      graphic: eyeText as any,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      life: 1.0,
      color: 0xffffff,
    });

    container.addChild(eyeText);
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
        p.vy += 0.4;

        // Apply rotation
        p.rotation += p.rotationSpeed;
        p.graphic.rotation = p.rotation;

        // Fade out
        p.life -= 0.01;
        p.graphic.alpha = p.life;

        // Slow down horizontal movement
        p.vx *= 0.98;
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
  // TODO: Add celebratory fanfare sound effect
}
