import { Container } from 'pixi.js';

/**
 * Animation utilities for card movements and transitions
 *
 * These functions use PixiJS Ticker for smooth 60fps animations with easing.
 */

/**
 * Easing function for smooth animations (ease-out cubic)
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for bouncy animations (ease-out back)
 */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Animate a card's position with easing
 *
 * @param container - The card container to animate
 * @param targetX - Target X position
 * @param targetY - Target Y position
 * @param duration - Animation duration in milliseconds
 * @param easing - Easing function (default: easeOutCubic)
 * @returns Promise that resolves when animation completes
 */
export function animatePosition(
  container: Container,
  targetX: number,
  targetY: number,
  duration: number = 300,
  easing: (t: number) => number = easeOutCubic
): Promise<void> {
  return new Promise((resolve) => {
    const startX = container.x;
    const startY = container.y;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      container.x = startX + (targetX - startX) * easedProgress;
      container.y = startY + (targetY - startY) * easedProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        container.x = targetX;
        container.y = targetY;
        resolve();
      }
    };

    animate();
  });
}

/**
 * Animate a card's scale with easing
 *
 * @param container - The card container to animate
 * @param targetScale - Target scale (1 = normal size)
 * @param duration - Animation duration in milliseconds
 * @param easing - Easing function
 * @returns Promise that resolves when animation completes
 */
export function animateScale(
  container: Container,
  targetScale: number,
  duration: number = 150,
  easing: (t: number) => number = easeOutBack
): Promise<void> {
  return new Promise((resolve) => {
    const startScale = container.scale.x;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const scale = startScale + (targetScale - startScale) * easedProgress;
      container.scale.set(scale);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        container.scale.set(targetScale);
        resolve();
      }
    };

    animate();
  });
}

/**
 * Animate a card's alpha (opacity)
 *
 * @param container - The card container to animate
 * @param targetAlpha - Target alpha (0 = invisible, 1 = fully visible)
 * @param duration - Animation duration in milliseconds
 * @returns Promise that resolves when animation completes
 */
export function animateFade(
  container: Container,
  targetAlpha: number,
  duration: number = 200
): Promise<void> {
  return new Promise((resolve) => {
    const startAlpha = container.alpha;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      container.alpha = startAlpha + (targetAlpha - startAlpha) * progress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        container.alpha = targetAlpha;
        resolve();
      }
    };

    animate();
  });
}

/**
 * Card flip animation (rotate on Y-axis illusion)
 *
 * @param container - The card container to animate
 * @param onMidpoint - Callback to execute at flip midpoint (to swap texture)
 * @param duration - Animation duration in milliseconds
 * @returns Promise that resolves when animation completes
 */
export function animateFlip(
  container: Container,
  onMidpoint?: () => void,
  duration: number = 400
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let midpointCalled = false;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Simulate 3D flip by scaling X
      const scaleX = Math.abs(Math.cos(progress * Math.PI));
      container.scale.x = scaleX;

      // Call midpoint callback when card is edge-on
      if (progress >= 0.5 && !midpointCalled && onMidpoint) {
        onMidpoint();
        midpointCalled = true;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        container.scale.x = 1;
        resolve();
      }
    };

    animate();
  });
}

/**
 * Deal animation: Card slides from deck position to target with bounce
 *
 * @param container - The card container to animate
 * @param fromX - Starting X position (deck location)
 * @param fromY - Starting Y position (deck location)
 * @param toX - Target X position (hand location)
 * @param toY - Target Y position (hand location)
 * @param delay - Delay before animation starts (for staggering)
 * @returns Promise that resolves when animation completes
 */
export async function animateDeal(
  container: Container,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  delay: number = 0
): Promise<void> {
  // Set initial position
  container.x = fromX;
  container.y = fromY;
  container.alpha = 0;

  // Wait for delay (stagger effect)
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Fade in quickly
  await animateFade(container, 1, 100);

  // Slide to target position with easing
  await animatePosition(container, toX, toY, 400, easeOutBack);
}

/**
 * Play animation: Card slides from hand to center area
 *
 * @param container - The card container to animate
 * @param toX - Target X position (center area)
 * @param toY - Target Y position (center area)
 * @returns Promise that resolves when animation completes
 */
export async function animatePlay(
  container: Container,
  toX: number,
  toY: number
): Promise<void> {
  // Scale up slightly while moving
  await Promise.all([
    animatePosition(container, toX, toY, 300, easeOutCubic),
    animateScale(container, 1.2, 300, easeOutCubic)
  ]);

  // Quick pause at destination
  await new Promise(resolve => setTimeout(resolve, 200));

  // Fade out and scale down
  await Promise.all([
    animateFade(container, 0, 200),
    animateScale(container, 0.8, 200, easeOutCubic)
  ]);
}

/**
 * Discard animation: Card moves to discard pile
 *
 * @param container - The card container to animate
 * @param toX - Target X position (discard pile)
 * @param toY - Target Y position (discard pile)
 * @returns Promise that resolves when animation completes
 */
export async function animateDiscard(
  container: Container,
  toX: number,
  toY: number
): Promise<void> {
  await Promise.all([
    animatePosition(container, toX, toY, 300, easeOutCubic),
    animateScale(container, 0.5, 300, easeOutCubic)
  ]);
}

/**
 * Elimination animation: Card bursts away
 *
 * @param container - The card container to animate
 * @returns Promise that resolves when animation completes
 */
export async function animateElimination(container: Container): Promise<void> {
  // Shake
  const originalX = container.x;
  const shakeAmount = 10;

  for (let i = 0; i < 5; i++) {
    container.x = originalX + (Math.random() - 0.5) * shakeAmount;
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  container.x = originalX;

  // Burst away (scale up and fade out simultaneously)
  await Promise.all([
    animateScale(container, 2, 300, easeOutCubic),
    animateFade(container, 0, 300)
  ]);
}
