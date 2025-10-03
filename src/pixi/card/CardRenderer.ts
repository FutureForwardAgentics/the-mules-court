import { Application, Container } from 'pixi.js';
import type { Card } from '../../types/game';
import type { CardRendererOptions } from '../../types/pixi';
import { createCardSprite, createCardBackSprite, getDimensions, makeCardInteractive } from './CardSprite';

/**
 * Render cards into a PixiJS Application
 *
 * This function creates card sprites and positions them according to the layout option.
 * It returns the root container holding all cards.
 *
 * @param app - PixiJS Application instance
 * @param cards - Array of cards to render
 * @param options - Rendering options (size, layout, spacing, etc.)
 * @returns Container holding all rendered cards
 */
export function renderCards(
  app: Application,
  cards: Card[],
  options: CardRendererOptions
): Container {
  const rootContainer = new Container();
  const dim = getDimensions(options.size);

  // Clear existing stage children
  app.stage.removeChildren();

  // Handle empty cards array
  if (cards.length === 0) {
    app.stage.addChild(rootContainer);
    return rootContainer;
  }

  // Create card sprites
  const cardContainers: Container[] = cards.map((card, index) => {
    const container = options.isRevealed
      ? createCardSprite(card, options.size)
      : createCardBackSprite(options.size);

    // Add interactivity if requested
    if (options.isInteractive && options.onCardClick) {
      makeCardInteractive(container, card.id, options.onCardClick);
    }

    return container;
  });

  // Position cards based on layout
  switch (options.layout) {
    case 'horizontal':
      positionHorizontal(cardContainers, dim.width, options.spacing);
      break;

    case 'vertical':
      positionVertical(cardContainers, dim.height, options.spacing);
      break;

    case 'stack':
      positionStacked(cardContainers);
      break;
  }

  // Add all cards to root container
  cardContainers.forEach((cardContainer) => {
    rootContainer.addChild(cardContainer);
  });

  // Add root container to stage
  app.stage.addChild(rootContainer);

  return rootContainer;
}

/**
 * Position cards horizontally in a row
 */
function positionHorizontal(
  containers: Container[],
  cardWidth: number,
  spacing: number
): void {
  containers.forEach((container, index) => {
    container.x = index * (cardWidth + spacing);
    container.y = 0;
  });
}

/**
 * Position cards vertically in a column
 */
function positionVertical(
  containers: Container[],
  cardHeight: number,
  spacing: number
): void {
  containers.forEach((container, index) => {
    container.x = 0;
    container.y = index * (cardHeight + spacing);
  });
}

/**
 * Position cards in a stack (overlapping slightly)
 * Each card is offset by a small amount to show depth
 */
function positionStacked(containers: Container[]): void {
  const stackOffset = 2; // Pixels of offset per card

  containers.forEach((container, index) => {
    container.x = index * stackOffset;
    container.y = index * stackOffset;
  });
}

/**
 * Calculate the total dimensions of the rendered cards area
 * Useful for setting the canvas size
 *
 * @param cards - Array of cards
 * @param options - Rendering options
 * @returns Object with width and height in pixels
 */
export function calculateCanvasDimensions(
  cards: Card[],
  options: CardRendererOptions
): { width: number; height: number } {
  if (cards.length === 0) {
    return { width: 0, height: 0 };
  }

  const dim = getDimensions(options.size);

  switch (options.layout) {
    case 'horizontal':
      return {
        width: cards.length * dim.width + (cards.length - 1) * options.spacing,
        height: dim.height,
      };

    case 'vertical':
      return {
        width: dim.width,
        height: cards.length * dim.height + (cards.length - 1) * options.spacing,
      };

    case 'stack':
      // Stacked cards only add a small offset per card
      const stackOffset = 2;
      return {
        width: dim.width + (cards.length - 1) * stackOffset,
        height: dim.height + (cards.length - 1) * stackOffset,
      };
  }
}
