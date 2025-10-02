import type { Container } from 'pixi.js';

export interface AnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

// Easing functions
export const easing = {
  linear: (t: number) => t,
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOut: (t: number) => t * (2 - t),
  easeIn: (t: number) => t * t,
  bounce: (t: number) => {
    if (t < 0.5) {
      return 8 * t * t;
    } else {
      return 1 - 8 * (t - 1) * (t - 1);
    }
  },
};

/**
 * Animate a container's position
 */
export function animatePosition(
  container: Container,
  toX: number,
  toY: number,
  options: AnimationOptions = {}
): void {
  const { duration = 500, easing: easingFn = easing.easeInOut, onComplete } = options;

  const startX = container.x;
  const startY = container.y;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const t = easingFn(progress);

    container.x = startX + (toX - startX) * t;
    container.y = startY + (toY - startY) * t;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  animate();
}

/**
 * Animate a container's scale
 */
export function animateScale(
  container: Container,
  toScale: number,
  options: AnimationOptions = {}
): void {
  const { duration = 300, easing: easingFn = easing.easeOut, onComplete } = options;

  const startScale = container.scale.x;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const t = easingFn(progress);

    const scale = startScale + (toScale - startScale) * t;
    container.scale.set(scale);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  animate();
}

/**
 * Animate a container's alpha (opacity)
 */
export function animateAlpha(
  container: Container,
  toAlpha: number,
  options: AnimationOptions = {}
): void {
  const { duration = 300, easing: easingFn = easing.linear, onComplete } = options;

  const startAlpha = container.alpha;
  const startTime = Date.now();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const t = easingFn(progress);

    container.alpha = startAlpha + (toAlpha - startAlpha) * t;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  animate();
}

/**
 * Create a "pop" animation (scale up then down)
 */
export function popAnimation(container: Container, options: AnimationOptions = {}): void {
  const { onComplete } = options;

  animateScale(container, 1.2, {
    duration: 150,
    easing: easing.easeOut,
    onComplete: () => {
      animateScale(container, 1.0, {
        duration: 150,
        easing: easing.easeIn,
        onComplete,
      });
    },
  });
}

/**
 * Create a "slide in" animation from a direction
 */
export function slideIn(
  container: Container,
  fromDirection: 'left' | 'right' | 'top' | 'bottom',
  options: AnimationOptions = {}
): void {
  const { duration = 500, easing: easingFn = easing.easeOut, onComplete } = options;

  const targetX = container.x;
  const targetY = container.y;

  const offset = 200;

  switch (fromDirection) {
    case 'left':
      container.x = targetX - offset;
      break;
    case 'right':
      container.x = targetX + offset;
      break;
    case 'top':
      container.y = targetY - offset;
      break;
    case 'bottom':
      container.y = targetY + offset;
      break;
  }

  animatePosition(container, targetX, targetY, { duration, easing: easingFn, onComplete });
}

/**
 * Fade in animation
 */
export function fadeIn(container: Container, options: AnimationOptions = {}): void {
  container.alpha = 0;
  animateAlpha(container, 1, options);
}

/**
 * Fade out animation
 */
export function fadeOut(container: Container, options: AnimationOptions = {}): void {
  animateAlpha(container, 0, options);
}
