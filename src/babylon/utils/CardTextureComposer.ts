import { DynamicTexture, Scene, Texture } from '@babylonjs/core';
import type { Card } from '../../types/game';

/**
 * CardTextureComposer
 *
 * Composes card textures dynamically using canvas 2D API.
 * Loads card-front/card_front_1.png template and overlays:
 * - Value number (top left)
 * - Name text (top center banner)
 * - Portrait image (top half)
 * - Ability text (bottom half)
 */
export class CardTextureComposer {
  private scene: Scene;
  private templateImage: HTMLImageElement | null = null;
  private templateLoaded: boolean = false;

  constructor(scene: Scene) {
    this.scene = scene;
    this.loadTemplate();
  }

  /**
   * Load the card template image
   */
  private loadTemplate(): void {
    this.templateImage = new Image();
    this.templateImage.crossOrigin = 'anonymous';
    this.templateImage.onload = () => {
      this.templateLoaded = true;
    };
    this.templateImage.src = '/img/card-front/card_front_1.png';
  }

  /**
   * Create a composed card texture for the given card
   * Ultra high resolution (2048x3072) for maximum text clarity
   */
  public async createCardTexture(card: Card, width: number = 2048, height: number = 3072): Promise<DynamicTexture> {
    // Wait for template to load
    if (!this.templateLoaded) {
      await this.waitForTemplate();
    }

    const texture = new DynamicTexture(`card-texture-${card.id}`, { width, height }, this.scene, false);
    const ctx = texture.getContext() as unknown as CanvasRenderingContext2D;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Draw template image as base
    if (this.templateImage) {
      ctx.drawImage(this.templateImage, 0, 0, width, height);
    }

    // Load and draw portrait
    const portraitImage = await this.loadPortrait(card);
    if (portraitImage) {
      // Portrait goes in top half area
      const portraitWidth = width * 0.85;
      const portraitHeight = height * 0.45;
      const portraitX = (width - portraitWidth) / 2;
      const portraitY = height * 0.18; // Below the name banner

      // Draw portrait with rounded corners effect (clip)
      ctx.save();
      this.roundRect(ctx, portraitX, portraitY, portraitWidth, portraitHeight, 60);
      ctx.clip();
      ctx.drawImage(portraitImage, portraitX, portraitY, portraitWidth, portraitHeight);
      ctx.restore();
    }

    // Draw value number (top left)
    this.drawValue(ctx, card.value, width, height);

    // Draw name (top center banner)
    this.drawName(ctx, card.name, width, height);

    // Draw ability text (bottom half)
    this.drawAbility(ctx, card.ability, width, height);

    // Update texture
    texture.update();

    // Apply maximum quality filtering for sharp text at all angles
    texture.anisotropicFilteringLevel = 16; // Maximum anisotropic filtering
    texture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);

    return texture;
  }

  /**
   * Load portrait image for a card
   */
  private loadPortrait(card: Card): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      // Use the portraitPath from the card (randomly selected during deck creation)
      const portraitPath = card.portraitPath;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load portrait: ${portraitPath}`);
        resolve(null);
      };
      img.src = portraitPath;
    });
  }

  /**
   * Draw value number in top left
   */
  private drawValue(ctx: CanvasRenderingContext2D, value: number, width: number, height: number): void {
    const x = width * 0.1;
    const y = height * 0.08;

    // Draw background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 160, 0, Math.PI * 2);
    ctx.fill();

    // Draw gold border
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(x, y, 160, 0, Math.PI * 2);
    ctx.stroke();

    // Draw value text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 192px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), x, y);
  }

  /**
   * Draw name text in top center banner
   */
  private drawName(ctx: CanvasRenderingContext2D, name: string, width: number, height: number): void {
    const x = width / 2;
    const y = height * 0.085;

    // Draw semi-transparent background banner
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(width * 0.2, y - 100, width * 0.6, 200);

    // Draw name with text outline for visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 16;
    ctx.font = 'bold 128px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(name, x, y);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(name, x, y);
  }

  /**
   * Draw ability text in bottom half
   * Ultra high resolution for maximum readability
   */
  private drawAbility(ctx: CanvasRenderingContext2D, ability: string, width: number, height: number): void {
    const padding = width * 0.08;
    const startY = height * 0.68;
    const maxWidth = width - (padding * 2);

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(padding - 40, startY - 60, maxWidth + 80, height * 0.28);

    // Word wrap the ability text with high-quality rendering
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.font = 'bold 80px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const words = ability.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    // Draw each line with thick outline for better readability
    const lineHeight = 104;
    lines.forEach((line, index) => {
      const y = startY + (index * lineHeight);

      // Outline
      ctx.strokeText(line, padding, y);

      // Fill
      ctx.fillText(line, padding, y);
    });
  }

  /**
   * Helper to create rounded rectangle path
   */
  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Wait for template image to load
   */
  private waitForTemplate(): Promise<void> {
    return new Promise((resolve) => {
      if (this.templateLoaded) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (this.templateLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('Template loading timed out');
        resolve();
      }, 5000);
    });
  }
}
