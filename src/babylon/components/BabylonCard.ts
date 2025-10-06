import { Scene } from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Rectangle,
  Image,
  TextBlock,
  Control
} from '@babylonjs/gui';

export interface CardConfig {
  id: string;
  name: string;
  value: number;
  ability: string;
  quote: string;
  portraitUrl: string;
  cardBackUrl: string;
  cardFrontUrl: string;
  color: { r: number; g: number; b: number }; // Rose color for Bayta
}

/**
 * BabylonCard
 *
 * Represents a single card using BabylonJS GUI controls.
 * Handles rendering, animations, and interactions.
 */
export class BabylonCard {
  private container: Rectangle;
  private backgroundImage: Image;
  private portraitImage: Image;
  private nameText: TextBlock;
  private valueText: TextBlock;
  private abilityText: TextBlock;
  private quoteText: TextBlock;

  private isFaceUp: boolean = false;
  private isHovered: boolean = false;

  public scene: Scene;
  public advancedTexture: AdvancedDynamicTexture;
  public config: CardConfig;

  constructor(
    scene: Scene,
    advancedTexture: AdvancedDynamicTexture,
    config: CardConfig,
    x: string = '0px',
    y: string = '0px'
  ) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;
    this.config = config;

    // Create container rectangle (card boundary)
    this.container = new Rectangle(`card-container-${config.id}`);
    this.container.width = '200px';
    this.container.height = '300px';
    this.container.thickness = 2;
    this.container.cornerRadius = 10;
    this.container.color = 'white';
    this.container.background = 'rgba(0, 0, 0, 0.8)';
    this.container.left = x;
    this.container.top = y;

    advancedTexture.addControl(this.container);

    // Background image (card back initially)
    this.backgroundImage = new Image(`card-bg-${config.id}`, config.cardBackUrl);
    this.backgroundImage.width = '200px';
    this.backgroundImage.height = '300px';
    this.backgroundImage.stretch = Image.STRETCH_FILL;
    this.container.addControl(this.backgroundImage);

    // Portrait image (visible when face up)
    this.portraitImage = new Image(`card-portrait-${config.id}`, config.portraitUrl);
    this.portraitImage.width = '180px';
    this.portraitImage.height = '180px';
    this.portraitImage.top = '-30px';
    this.portraitImage.stretch = Image.STRETCH_UNIFORM;
    this.portraitImage.isVisible = false;
    this.container.addControl(this.portraitImage);

    // Card value (top-left corner)
    this.valueText = new TextBlock(`card-value-${config.id}`, config.value.toString());
    this.valueText.fontSize = 32;
    this.valueText.color = 'white';
    this.valueText.fontWeight = 'bold';
    this.valueText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.valueText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.valueText.left = '10px';
    this.valueText.top = '10px';
    this.valueText.width = '40px';
    this.valueText.height = '40px';
    this.valueText.isVisible = false;
    this.container.addControl(this.valueText);

    // Card name
    this.nameText = new TextBlock(`card-name-${config.id}`, config.name);
    this.nameText.fontSize = 18;
    this.nameText.color = 'white';
    this.nameText.fontWeight = 'bold';
    this.nameText.top = '100px';
    this.nameText.height = '30px';
    this.nameText.isVisible = false;
    this.container.addControl(this.nameText);

    // Card ability
    this.abilityText = new TextBlock(`card-ability-${config.id}`, config.ability);
    this.abilityText.fontSize = 12;
    this.abilityText.color = 'white';
    this.abilityText.textWrapping = true;
    this.abilityText.top = '130px';
    this.abilityText.width = '180px';
    this.abilityText.height = '60px';
    this.abilityText.isVisible = false;
    this.container.addControl(this.abilityText);

    // Card quote
    this.quoteText = new TextBlock(`card-quote-${config.id}`, `"${config.quote}"`);
    this.quoteText.fontSize = 10;
    this.quoteText.color = 'rgba(255, 255, 255, 0.7)';
    this.quoteText.fontStyle = 'italic';
    this.quoteText.textWrapping = true;
    this.quoteText.top = '120px';
    this.quoteText.width = '180px';
    this.quoteText.height = '50px';
    this.quoteText.isVisible = false;
    this.container.addControl(this.quoteText);

    // Setup interactions
    this.setupInteractions();
  }

  private setupInteractions(): void {
    // Hover effect
    this.container.onPointerEnterObservable.add(() => {
      this.isHovered = true;
      this.applyHoverEffect();
    });

    this.container.onPointerOutObservable.add(() => {
      this.isHovered = false;
      this.removeHoverEffect();
    });

    // Click handler
    this.container.onPointerClickObservable.add(() => {
      console.log(`Card clicked: ${this.config.name}`, this.config);
      this.flip();
    });
  }

  private applyHoverEffect(): void {
    // Add glow/highlight effect
    this.container.thickness = 4;
    this.container.color = `rgb(${this.config.color.r}, ${this.config.color.g}, ${this.config.color.b})`;

    // Slight scale up (simulated by changing size)
    this.container.scaleX = 1.05;
    this.container.scaleY = 1.05;
  }

  private removeHoverEffect(): void {
    if (!this.isHovered) {
      this.container.thickness = 2;
      this.container.color = 'white';
      this.container.scaleX = 1;
      this.container.scaleY = 1;
    }
  }

  /**
   * Flip card between face up and face down
   */
  public flip(): void {
    this.isFaceUp = !this.isFaceUp;

    if (this.isFaceUp) {
      // Show front
      this.backgroundImage.source = this.config.cardFrontUrl;
      this.portraitImage.isVisible = true;
      this.valueText.isVisible = true;
      this.nameText.isVisible = true;
      this.abilityText.isVisible = true;
      this.quoteText.isVisible = true;
    } else {
      // Show back
      this.backgroundImage.source = this.config.cardBackUrl;
      this.portraitImage.isVisible = false;
      this.valueText.isVisible = false;
      this.nameText.isVisible = false;
      this.abilityText.isVisible = false;
      this.quoteText.isVisible = false;
    }

    // Animate flip (simulate with scale)
    this.animateFlip();
  }

  private animateFlip(): void {
    const flipDuration = 300; // milliseconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / flipDuration, 1);

      // Scale X to create flip effect
      const scale = Math.abs(Math.cos(progress * Math.PI));
      this.container.scaleX = scale < 0.1 ? 0.1 : scale;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.container.scaleX = 1;
      }
    };

    animate();
  }

  /**
   * Move card to a new position with animation
   */
  public moveTo(x: string, y: string, duration: number = 500): void {
    const startX = parseFloat(this.container.left as string) || 0;
    const startY = parseFloat(this.container.top as string) || 0;
    const endX = parseFloat(x) || 0;
    const endY = parseFloat(y) || 0;

    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.container.left = `${startX + (endX - startX) * eased}px`;
      this.container.top = `${startY + (endY - startY) * eased}px`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  /**
   * Update portrait image (for switching between variants)
   */
  public setPortrait(portraitUrl: string): void {
    this.config.portraitUrl = portraitUrl;
    this.portraitImage.source = portraitUrl;
  }

  /**
   * Dispose of all GUI controls
   */
  public dispose(): void {
    this.container.dispose();
  }

  /**
   * Get current position
   */
  public getPosition(): { x: string; y: string } {
    return {
      x: this.container.left as string,
      y: this.container.top as string
    };
  }

  /**
   * Set visibility
   */
  public setVisible(visible: boolean): void {
    this.container.isVisible = visible;
  }

  /**
   * Get the container element (for adding to other GUI controls)
   */
  public getContainer(): Rectangle {
    return this.container;
  }
}
