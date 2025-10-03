import type { Card } from './game';

/**
 * Card size variants matching the existing GameCard component
 * - small: 96x144px (used in player hands, discard piles)
 * - medium: 192x288px (used for deck, played cards)
 * - large: 256x384px (used for card previews, modals)
 */
export type CardSize = 'small' | 'medium' | 'large';

/**
 * Layout direction for multiple cards
 * - horizontal: Cards in a row (e.g., player hand)
 * - vertical: Cards in a column
 * - stack: Cards overlapping (e.g., discard pile)
 */
export type CardLayout = 'horizontal' | 'vertical' | 'stack';

/**
 * Props for the PixiCardRenderer React component
 */
export interface PixiCardRendererProps {
  /** Array of cards to render */
  cards: Card[];

  /** Size variant for all cards */
  size?: CardSize;

  /** Whether cards should show their faces (true) or backs (false) */
  isRevealed?: boolean;

  /** Whether cards should respond to interaction events */
  isInteractive?: boolean;

  /** Layout direction for multiple cards */
  layout?: CardLayout;

  /** Callback when a card is clicked (only fires if isInteractive=true) */
  onCardClick?: (cardId: string) => void;

  /** Spacing between cards in pixels (only applies to horizontal/vertical layouts) */
  spacing?: number;
}

/**
 * Options for rendering cards with CardRenderer
 */
export interface CardRendererOptions {
  size: CardSize;
  isRevealed: boolean;
  isInteractive: boolean;
  layout: CardLayout;
  spacing: number;
  onCardClick?: (cardId: string) => void;
}

/**
 * Dimensions for each card size in pixels
 */
export interface CardDimensions {
  width: number;
  height: number;
  cornerRadius: number;
  borderWidth: number;
  padding: number;
}

/**
 * Parsed gradient colors from Tailwind class names
 */
export interface GradientColors {
  startColor: number;  // Hex color for gradient start
  endColor: number;    // Hex color for gradient end
}
