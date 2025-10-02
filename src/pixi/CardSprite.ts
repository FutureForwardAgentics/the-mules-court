import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Card } from '../types/game';

export type CardSize = 'small' | 'medium' | 'large';

export interface CardSpriteOptions {
  card: Card;
  size?: CardSize;
  isRevealed?: boolean;
  isPlayable?: boolean;
}

const CARD_DIMENSIONS = {
  small: { width: 96, height: 144 },
  medium: { width: 192, height: 288 },
  large: { width: 256, height: 384 },
};

const GRADIENT_COLORS: Record<string, number[]> = {
  'from-slate-700 to-slate-900': [0x334155, 0x0f172a],
  'from-blue-800 to-blue-950': [0x1e40af, 0x172554],
  'from-indigo-800 to-indigo-950': [0x3730a3, 0x1e1b4b],
  'from-amber-800 to-amber-950': [0x92400e, 0x451a03],
  'from-purple-800 to-purple-950': [0x6b21a8, 0x3b0764],
  'from-cyan-800 to-cyan-950': [0x155e75, 0x083344],
  'from-rose-800 to-rose-950': [0x9f1239, 0x4c0519],
  'from-red-800 to-red-950': [0x991b1b, 0x450a0a],
  'from-yellow-700 to-yellow-900': [0xa16207, 0x713f12],
  'from-emerald-800 to-emerald-950': [0x065f46, 0x022c22],
  'from-red-950 to-black': [0x450a0a, 0x000000],
};

export class CardSprite extends Container {
  private card: Card;
  private size: CardSize;
  private isRevealed: boolean;
  private isPlayable: boolean;
  private background: Graphics;

  constructor(options: CardSpriteOptions) {
    super();

    this.card = options.card;
    this.size = options.size || 'medium';
    this.isRevealed = options.isRevealed ?? true;
    this.isPlayable = options.isPlayable ?? false;

    this.background = new Graphics();
    this.addChild(this.background);

    this.render();
    this.setupInteractivity();
  }

  private render() {
    const dims = CARD_DIMENSIONS[this.size];
    const padding = this.size === 'small' ? 8 : this.size === 'medium' ? 12 : 16;

    // Clear previous graphics
    this.background.clear();

    if (!this.isRevealed) {
      this.renderCardBack(dims);
    } else {
      this.renderCardFront(dims, padding);
    }
  }

  private renderCardBack(dims: { width: number; height: number }) {
    // Card back background (gray gradient)
    this.background.roundRect(0, 0, dims.width, dims.height, 8);
    this.background.fill({ color: 0x374151 });

    // Border
    this.background.roundRect(0, 0, dims.width, dims.height, 8);
    this.background.stroke({ color: 0x4b5563, width: 2 });

    // Eye icon in center
    const iconStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: this.size === 'small' ? 48 : this.size === 'medium' ? 64 : 80,
      fill: 0xffffff,
      align: 'center',
    });
    const icon = new Text({ text: '👁️', style: iconStyle });
    icon.anchor.set(0.5);
    icon.position.set(dims.width / 2, dims.height / 2);
    icon.alpha = 0.5;
    this.addChild(icon);
  }

  private renderCardFront(dims: { width: number; height: number }, padding: number) {
    // Get gradient colors
    const colors = GRADIENT_COLORS[this.card.color] || [0x334155, 0x0f172a];

    // Card background with gradient effect
    this.background.roundRect(0, 0, dims.width, dims.height, 8);
    this.background.fill({ color: colors[0] });

    // Border
    const borderColor = this.isPlayable ? 0xf87171 : 0x6b7280;
    const borderWidth = this.isPlayable ? 3 : 2;
    this.background.roundRect(0, 0, dims.width, dims.height, 8);
    this.background.stroke({ color: borderColor, width: borderWidth });

    let yOffset = padding;

    // Icon and Value header
    const iconSize = this.size === 'small' ? 24 : this.size === 'medium' ? 32 : 48;
    const valueSize = this.size === 'small' ? 32 : this.size === 'medium' ? 48 : 64;

    const iconStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: iconSize,
      fill: 0xffffff,
    });
    const icon = new Text({ text: this.card.icon, style: iconStyle });
    icon.position.set(padding, yOffset);
    this.addChild(icon);

    const valueStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: valueSize,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const value = new Text({ text: this.card.value.toString(), style: valueStyle });
    value.anchor.set(1, 0);
    value.position.set(dims.width - padding, yOffset);
    this.addChild(value);

    yOffset += iconSize + padding;

    // Card Name
    const nameSize = this.size === 'small' ? 14 : this.size === 'medium' ? 20 : 24;
    const nameStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: nameSize,
      fontWeight: 'bold',
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: dims.width - padding * 2,
    });
    const name = new Text({ text: this.card.name, style: nameStyle });
    name.position.set(padding, yOffset);
    this.addChild(name);

    yOffset += name.height + padding / 2;

    // Description (medium and large only)
    if (this.size !== 'small') {
      const descStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xd1d5db,
        fontStyle: 'italic',
        wordWrap: true,
        wordWrapWidth: dims.width - padding * 2,
      });
      const desc = new Text({ text: this.card.description, style: descStyle });
      desc.position.set(padding, yOffset);
      this.addChild(desc);

      yOffset += desc.height + padding;
    }

    // Quote (large only)
    if (this.size === 'large') {
      const quoteStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xe5e7eb,
        fontStyle: 'italic',
        wordWrap: true,
        wordWrapWidth: dims.width - padding * 2,
      });
      const quote = new Text({ text: `"${this.card.quote}"`, style: quoteStyle });
      quote.position.set(padding, yOffset);
      this.addChild(quote);

      yOffset += quote.height + padding;
    }

    // Ability box (medium and large only)
    if (this.size !== 'small') {
      const abilityBoxY = dims.height - padding - 60;
      const abilityBox = new Graphics();
      abilityBox.roundRect(padding, abilityBoxY, dims.width - padding * 2, 60, 4);
      abilityBox.fill({ color: 0x000000, alpha: 0.4 });
      abilityBox.stroke({ color: 0x4b5563, width: 1 });
      this.addChild(abilityBox);

      const abilityLabelStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 8,
        fill: 0x9ca3af,
        fontWeight: 'bold',
      });
      const abilityLabel = new Text({ text: 'ABILITY', style: abilityLabelStyle });
      abilityLabel.position.set(padding + 4, abilityBoxY + 4);
      this.addChild(abilityLabel);

      const abilityStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 10,
        fill: 0xffffff,
        wordWrap: true,
        wordWrapWidth: dims.width - padding * 2 - 8,
      });
      const ability = new Text({ text: this.card.ability, style: abilityStyle });
      ability.position.set(padding + 4, abilityBoxY + 16);
      this.addChild(ability);
    }

    // Decorative corner elements
    const cornerSize = 12;
    const cornerGraphics = new Graphics();

    // Top-left corner
    cornerGraphics.moveTo(padding / 2, padding / 2 + cornerSize);
    cornerGraphics.lineTo(padding / 2, padding / 2);
    cornerGraphics.lineTo(padding / 2 + cornerSize, padding / 2);
    cornerGraphics.stroke({ color: 0x9ca3af, width: 2, alpha: 0.3 });

    // Bottom-right corner
    cornerGraphics.moveTo(dims.width - padding / 2 - cornerSize, dims.height - padding / 2);
    cornerGraphics.lineTo(dims.width - padding / 2, dims.height - padding / 2);
    cornerGraphics.lineTo(dims.width - padding / 2, dims.height - padding / 2 - cornerSize);
    cornerGraphics.stroke({ color: 0x9ca3af, width: 2, alpha: 0.3 });

    this.addChild(cornerGraphics);
  }

  private setupInteractivity() {
    this.eventMode = 'static';
    this.cursor = this.isPlayable ? 'pointer' : 'default';

    if (this.isPlayable) {
      this.on('pointerover', () => {
        this.scale.set(1.05);
      });

      this.on('pointerout', () => {
        this.scale.set(1);
      });
    }
  }

  public updateCard(options: Partial<CardSpriteOptions>) {
    if (options.card !== undefined) this.card = options.card;
    if (options.size !== undefined) this.size = options.size;
    if (options.isRevealed !== undefined) this.isRevealed = options.isRevealed;
    if (options.isPlayable !== undefined) this.isPlayable = options.isPlayable;

    // Clear all children and re-render
    this.removeChildren();
    this.background = new Graphics();
    this.addChild(this.background);
    this.render();
    this.setupInteractivity();
  }
}
