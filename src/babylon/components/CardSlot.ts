import { Scene, Vector3 } from '@babylonjs/core';
import { ShadowGenerator } from '@babylonjs/core';
import type { Card } from '../../types/game';
import { BabylonCardMesh } from './BabylonCardMesh';

/**
 * CardSlot
 *
 * Represents a fixed position on the playfield where a card can be displayed.
 * Solves card duplication by maintaining persistent slot objects instead of
 * dynamically creating/destroying cards.
 *
 * Key benefits:
 * - No creation/destruction on every update
 * - Fixed, predictable positions
 * - Prevents accumulation of orphaned objects
 * - Object pooling pattern for performance
 */
export class CardSlot {
  private scene: Scene;
  private position: Vector3;
  private cardMesh: BabylonCardMesh | null = null;
  private currentCard: Card | null = null;
  private slotId: string;
  private shadowGenerator?: ShadowGenerator;
  private isRevealed: boolean;
  private isInteractive: boolean;
  private onCardClick?: (cardId: string) => void;

  constructor(
    scene: Scene,
    slotId: string,
    position: Vector3,
    options: {
      isRevealed?: boolean;
      isInteractive?: boolean;
      shadowGenerator?: ShadowGenerator;
      onCardClick?: (cardId: string) => void;
    } = {}
  ) {
    this.scene = scene;
    this.slotId = slotId;
    this.position = position;
    this.shadowGenerator = options.shadowGenerator;
    this.isRevealed = options.isRevealed ?? false;
    this.isInteractive = options.isInteractive ?? false;
    this.onCardClick = options.onCardClick;
  }

  /**
   * Assign a card to this slot (creates mesh if needed)
   */
  public setCard(card: Card | null): void {
    // If same card, no update needed
    if (this.currentCard?.id === card?.id) {
      return;
    }

    // Clear current card if exists
    if (this.cardMesh) {
      this.cardMesh.dispose();
      this.cardMesh = null;
    }

    this.currentCard = card;

    // Create new card mesh if card provided
    if (card) {
      this.cardMesh = new BabylonCardMesh(this.scene, {
        card,
        size: 'medium',
        isRevealed: this.isRevealed,
        isInteractive: this.isInteractive,
        position: this.position.clone(),
        onCardClick: this.onCardClick ? () => this.onCardClick!(card.id) : undefined,
        rotation: new Vector3(0.1, 0, 0),
        shadowGenerator: this.shadowGenerator
      });
    }
  }

  /**
   * Get the currently assigned card
   */
  public getCard(): Card | null {
    return this.currentCard;
  }

  /**
   * Check if slot is empty
   */
  public isEmpty(): boolean {
    return this.currentCard === null;
  }

  /**
   * Update slot position
   */
  public setPosition(position: Vector3): void {
    this.position = position;
    if (this.cardMesh) {
      this.cardMesh.setPosition(position);
    }
  }

  /**
   * Update revealed state
   */
  public setRevealed(isRevealed: boolean): void {
    this.isRevealed = isRevealed;
    if (this.cardMesh) {
      this.cardMesh.setRevealed(isRevealed);
    }
  }

  /**
   * Update interactive state
   */
  public setInteractive(isInteractive: boolean): void {
    this.isInteractive = isInteractive;
    if (this.cardMesh) {
      this.cardMesh.setInteractive(isInteractive);
    }
  }

  /**
   * Clear the slot
   */
  public clear(): void {
    this.setCard(null);
  }

  /**
   * Dispose of the slot and its card
   */
  public dispose(): void {
    if (this.cardMesh) {
      this.cardMesh.dispose();
      this.cardMesh = null;
    }
    this.currentCard = null;
  }

  /**
   * Get slot ID
   */
  public getId(): string {
    return this.slotId;
  }
}
