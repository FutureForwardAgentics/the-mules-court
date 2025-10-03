import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card } from '../../types/game';
import type { CardSize, CardDimensions } from '../../types/pixi';
import { parseTailwindGradient } from '../utils/colors';
import { animateScale } from './CardAnimations';

/**
 * Get pixel dimensions for each card size
 * Matches the existing GameCard.tsx Tailwind classes:
 * - small: w-24 h-36 (96x144px)
 * - medium: w-48 h-72 (192x288px)
 * - large: w-64 h-96 (256x384px)
 */
export function getDimensions(size: CardSize): CardDimensions {
  switch (size) {
    case 'small':
      return {
        width: 96,
        height: 144,
        cornerRadius: 8,
        borderWidth: 2,
        padding: 8,
      };
    case 'medium':
      return {
        width: 192,
        height: 288,
        cornerRadius: 12,
        borderWidth: 2,
        padding: 12,
      };
    case 'large':
      return {
        width: 256,
        height: 384,
        cornerRadius: 16,
        borderWidth: 3,
        padding: 16,
      };
  }
}

/**
 * Create a PixiJS Container with all card graphics and text
 *
 * @param card - Card data to render
 * @param size - Card size variant
 * @returns Container with all card elements
 */
export function createCardSprite(card: Card, size: CardSize): Container {
  const container = new Container();
  const dim = getDimensions(size);
  const { startColor, endColor } = parseTailwindGradient(card.color);

  // Background with gradient
  const background = new Graphics();
  background.roundRect(0, 0, dim.width, dim.height, dim.cornerRadius);

  // Create gradient fill (top to bottom)
  background.fill({
    color: startColor,
    alpha: 1,
  });

  // Add a second rect for gradient effect (PixiJS v8 doesn't have built-in gradient fills,
  // so we'll simulate with overlapping rectangles and alpha)
  const gradientOverlay = new Graphics();
  gradientOverlay.roundRect(0, 0, dim.width, dim.height, dim.cornerRadius);
  gradientOverlay.fill({
    color: endColor,
    alpha: 0.6,
  });

  container.addChild(background);
  container.addChild(gradientOverlay);

  // Border
  const border = new Graphics();
  border.roundRect(0, 0, dim.width, dim.height, dim.cornerRadius);
  border.stroke({
    color: 0xffffff,
    width: dim.borderWidth,
    alpha: 0.3,
  });
  container.addChild(border);

  // Decorative corner elements (top-left and bottom-right)
  const topLeftCorner = new Graphics();
  topLeftCorner.moveTo(dim.padding, dim.padding);
  topLeftCorner.lineTo(dim.padding, dim.padding + 16);
  topLeftCorner.moveTo(dim.padding, dim.padding);
  topLeftCorner.lineTo(dim.padding + 16, dim.padding);
  topLeftCorner.stroke({ color: 0xffffff, width: 2, alpha: 0.2 });
  container.addChild(topLeftCorner);

  const bottomRightCorner = new Graphics();
  bottomRightCorner.moveTo(dim.width - dim.padding, dim.height - dim.padding);
  bottomRightCorner.lineTo(dim.width - dim.padding, dim.height - dim.padding - 16);
  bottomRightCorner.moveTo(dim.width - dim.padding, dim.height - dim.padding);
  bottomRightCorner.lineTo(dim.width - dim.padding - 16, dim.height - dim.padding);
  bottomRightCorner.stroke({ color: 0xffffff, width: 2, alpha: 0.2 });
  container.addChild(bottomRightCorner);

  // Text sizes based on card size
  const iconSize = size === 'small' ? 20 : size === 'medium' ? 32 : 48;
  const valueSize = size === 'small' ? 20 : size === 'medium' ? 32 : 40;
  const nameSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const descSize = size === 'small' ? 8 : size === 'medium' ? 10 : 12;
  const abilitySize = size === 'small' ? 8 : size === 'medium' ? 10 : 11;

  // Icon (top-left)
  const iconText = new Text({
    text: card.icon,
    style: new TextStyle({
      fontSize: iconSize,
      fill: 0xffffff,
      fontFamily: 'Arial, sans-serif',
    }),
  });
  iconText.x = dim.padding;
  iconText.y = dim.padding;
  container.addChild(iconText);

  // Value (top-right)
  const valueText = new Text({
    text: card.value.toString(),
    style: new TextStyle({
      fontSize: valueSize,
      fill: 0xffffff,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
    }),
  });
  valueText.anchor.set(1, 0);
  valueText.x = dim.width - dim.padding;
  valueText.y = dim.padding;
  container.addChild(valueText);

  // Card name
  const nameText = new Text({
    text: card.name,
    style: new TextStyle({
      fontSize: nameSize,
      fill: 0xffffff,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      wordWrap: true,
      wordWrapWidth: dim.width - dim.padding * 2,
    }),
  });
  nameText.x = dim.padding;
  nameText.y = dim.padding + iconSize + 4;
  container.addChild(nameText);

  // Description (only for medium and large)
  if (size !== 'small') {
    const descText = new Text({
      text: card.description,
      style: new TextStyle({
        fontSize: descSize,
        fill: 0xcccccc,
        fontStyle: 'italic',
        fontFamily: 'Arial, sans-serif',
        wordWrap: true,
        wordWrapWidth: dim.width - dim.padding * 2,
      }),
    });
    descText.x = dim.padding;
    descText.y = nameText.y + nameText.height + 2;
    container.addChild(descText);

    // Divider line
    const dividerY = descText.y + descText.height + 6;
    const divider = new Graphics();
    divider.moveTo(dim.padding, dividerY);
    divider.lineTo(dim.width - dim.padding, dividerY);
    divider.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
    container.addChild(divider);
  }

  // Ability box (bottom)
  if (size !== 'small') {
    const abilityBoxHeight = size === 'medium' ? 60 : 80;
    const abilityBoxY = dim.height - dim.padding - abilityBoxHeight;

    // Ability background
    const abilityBg = new Graphics();
    abilityBg.roundRect(
      dim.padding,
      abilityBoxY,
      dim.width - dim.padding * 2,
      abilityBoxHeight,
      4
    );
    abilityBg.fill({ color: 0x000000, alpha: 0.4 });
    abilityBg.stroke({ color: 0x666666, width: 1, alpha: 0.6 });
    container.addChild(abilityBg);

    // "Ability" label
    const abilityLabel = new Text({
      text: 'ABILITY',
      style: new TextStyle({
        fontSize: abilitySize - 2,
        fill: 0x999999,
        fontFamily: 'Arial, sans-serif',
        letterSpacing: 1,
      }),
    });
    abilityLabel.x = dim.padding + 4;
    abilityLabel.y = abilityBoxY + 4;
    container.addChild(abilityLabel);

    // Ability text
    const abilityText = new Text({
      text: card.ability,
      style: new TextStyle({
        fontSize: abilitySize,
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
        wordWrap: true,
        wordWrapWidth: dim.width - dim.padding * 2 - 8,
        leading: 2,
      }),
    });
    abilityText.x = dim.padding + 4;
    abilityText.y = abilityLabel.y + abilityLabel.height + 2;
    container.addChild(abilityText);
  }

  return container;
}

/**
 * Create a card back sprite for hidden cards
 *
 * @param size - Card size variant
 * @returns Container with card back design
 */
export function createCardBackSprite(size: CardSize): Container {
  const container = new Container();
  const dim = getDimensions(size);

  // Background (dark gradient)
  const background = new Graphics();
  background.roundRect(0, 0, dim.width, dim.height, dim.cornerRadius);
  background.fill({ color: 0x374151, alpha: 1 }); // gray-700
  container.addChild(background);

  const gradientOverlay = new Graphics();
  gradientOverlay.roundRect(0, 0, dim.width, dim.height, dim.cornerRadius);
  gradientOverlay.fill({ color: 0x111827, alpha: 0.6 }); // gray-900
  container.addChild(gradientOverlay);

  // Border
  const border = new Graphics();
  border.roundRect(0, 0, dim.width, dim.height, dim.cornerRadius);
  border.stroke({ color: 0x6b7280, width: dim.borderWidth });
  container.addChild(border);

  // Eye icon in center
  const iconSize = size === 'small' ? 32 : size === 'medium' ? 48 : 64;
  const eyeIcon = new Text({
    text: '👁️',
    style: new TextStyle({
      fontSize: iconSize,
      fontFamily: 'Arial, sans-serif',
    }),
  });
  eyeIcon.anchor.set(0.5);
  eyeIcon.x = dim.width / 2;
  eyeIcon.y = dim.height / 2;
  eyeIcon.alpha = 0.5;
  container.addChild(eyeIcon);

  return container;
}

/**
 * Make a card container interactive with hover and click events
 *
 * This function adds PixiJS event listeners for hover effects and click handling.
 * It bridges PixiJS events to React callbacks.
 *
 * @param container - The card Container to make interactive
 * @param cardId - The unique ID of the card
 * @param onClick - Callback function when card is clicked
 */
export function makeCardInteractive(
  container: Container,
  cardId: string,
  onClick: (cardId: string) => void
): void {
  // Enable interactivity (PixiJS v8 API)
  container.eventMode = 'static';
  container.cursor = 'pointer';

  // Hover effect: Smooth scale up animation
  container.on('pointerover', () => {
    animateScale(container, 1.05, 150);
  });

  // Hover out: Smooth scale down animation
  container.on('pointerout', () => {
    animateScale(container, 1, 150);
  });

  // Click: Fire callback
  container.on('pointerdown', () => {
    onClick(cardId);
  });
}

