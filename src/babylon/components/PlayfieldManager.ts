import { Scene, FreeCamera, Vector3 } from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Rectangle,
  Image,
  TextBlock,
  StackPanel
} from '@babylonjs/gui';
import { BabylonCard } from './BabylonCard';
import type { GameState, Player } from '../../types/game';

interface PlayerAreaLayout {
  x: number;
  y: number;
  handX: number;
  handY: number;
  nameX: number;
  nameY: number;
  tokensX: number;
  tokensY: number;
}

/**
 * PlayfieldManager
 *
 * Manages the complete game playfield layout using BabylonJS GUI.
 * Handles positioning of player areas, deck, discard pile, and UI elements.
 */
export class PlayfieldManager {
  private scene: Scene;
  private advancedTexture: AdvancedDynamicTexture;
  private backgroundImage: Image;
  private deckContainer: Rectangle;
  private deckImage!: Image; // Will be initialized in createDeckArea()
  private deckCountText!: TextBlock; // Will be initialized in createDeckArea()
  private playerAreas: Map<string, PlayerAreaUI> = new Map();
  private playerCards: Map<string, BabylonCard[]> = new Map();
  private centerInfoPanel!: Rectangle; // Will be initialized in createCenterInfoPanel()
  private phaseText!: TextBlock; // Will be initialized in createCenterInfoPanel()
  private currentPlayerText!: TextBlock; // Will be initialized in createCenterInfoPanel()
  private previousHandSizes: Map<string, number> = new Map(); // Track hand sizes for animation


  constructor(scene: Scene, advancedTexture: AdvancedDynamicTexture) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;

    // Create camera (required for BabylonJS scene rendering)
    const camera = new FreeCamera('playfield-camera', new Vector3(0, 0, -10), scene);
    camera.setTarget(Vector3.Zero());
    scene.activeCamera = camera;

    // Create background
    this.backgroundImage = new Image('playfield-bg', '/img/playfield_background_space.png');
    this.backgroundImage.width = '100%';
    this.backgroundImage.height = '100%';
    this.backgroundImage.stretch = Image.STRETCH_FILL;
    this.advancedTexture.addControl(this.backgroundImage);

    // Create deck area
    this.deckContainer = this.createDeckArea();

    // Create center info panel
    const { panel, phaseText, playerText } = this.createCenterInfoPanel();
    this.centerInfoPanel = panel;
    this.phaseText = phaseText;
    this.currentPlayerText = playerText;
  }

  private createDeckArea(): Rectangle {
    const container = new Rectangle('deck-container');
    container.width = '150px';
    container.height = '220px';
    container.thickness = 3;
    container.cornerRadius = 10;
    container.color = '#9333ea'; // Purple
    container.background = 'rgba(0, 0, 0, 0.7)';
    container.left = '0px';
    container.top = '0px';
    this.advancedTexture.addControl(container);

    // Deck card image
    this.deckImage = new Image('deck-card', '/img/card_back_3.png');
    this.deckImage.width = '120px';
    this.deckImage.height = '180px';
    this.deckImage.top = '-10px';
    this.deckImage.stretch = Image.STRETCH_UNIFORM;
    container.addControl(this.deckImage);

    // Deck count text
    this.deckCountText = new TextBlock('deck-count', '16');
    this.deckCountText.fontSize = 20;
    this.deckCountText.color = 'white';
    this.deckCountText.fontWeight = 'bold';
    this.deckCountText.top = '80px';
    this.deckCountText.height = '30px';
    container.addControl(this.deckCountText);

    // Label
    const label = new TextBlock('deck-label', 'THE DECK');
    label.fontSize = 12;
    label.color = '#a78bfa';
    label.top = '100px';
    label.height = '20px';
    container.addControl(label);

    return container;
  }

  private createCenterInfoPanel(): { panel: Rectangle; phaseText: TextBlock; playerText: TextBlock } {
    const panel = new Rectangle('center-info-panel');
    panel.width = '400px';
    panel.height = '120px';
    panel.thickness = 2;
    panel.cornerRadius = 15;
    panel.color = '#ef4444'; // Red
    panel.background = 'rgba(0, 0, 0, 0.85)';
    panel.top = '-200px';
    panel.left = '0px';
    this.advancedTexture.addControl(panel);

    // Title
    const title = new TextBlock('game-title', "THE MULE'S COURT");
    title.fontSize = 24;
    title.color = '#fca5a5';
    title.fontWeight = 'bold';
    title.top = '-35px';
    title.height = '30px';
    panel.addControl(title);

    // Phase text
    const phaseText = new TextBlock('phase-text', 'Setup Phase');
    phaseText.fontSize = 16;
    phaseText.color = '#c084fc';
    phaseText.top = '5px';
    phaseText.height = '25px';
    panel.addControl(phaseText);

    // Current player text
    const playerText = new TextBlock('current-player', "Player 1's Turn");
    playerText.fontSize = 18;
    playerText.color = 'white';
    playerText.fontWeight = 'bold';
    playerText.top = '35px';
    playerText.height = '30px';
    panel.addControl(playerText);

    return { panel, phaseText, playerText };
  }

  /**
   * Calculate player area positions based on player count
   */
  private calculatePlayerLayouts(playerCount: number): PlayerAreaLayout[] {
    const layouts: PlayerAreaLayout[] = [];

    if (playerCount === 2) {
      // Horizontal split: bottom vs top
      layouts.push({
        x: 0, y: 200,       // Player 1 bottom center
        handX: 0, handY: 250,
        nameX: 0, nameY: 150,
        tokensX: 200, tokensY: 150
      });
      layouts.push({
        x: 0, y: -200,      // Player 2 top center
        handX: 0, handY: -250,
        nameX: 0, nameY: -150,
        tokensX: 200, tokensY: -150
      });
    } else if (playerCount === 3) {
      // Triangular: bottom center, top left, top right
      layouts.push({
        x: 0, y: 220,       // Player 1 bottom
        handX: 0, handY: 270,
        nameX: 0, nameY: 170,
        tokensX: 200, tokensY: 170
      });
      layouts.push({
        x: -300, y: -150,   // Player 2 top left
        handX: -300, handY: -200,
        nameX: -300, nameY: -100,
        tokensX: -100, tokensY: -100
      });
      layouts.push({
        x: 300, y: -150,    // Player 3 top right
        handX: 300, handY: -200,
        nameX: 300, nameY: -100,
        tokensX: 500, tokensY: -100
      });
    } else { // 4 players
      // Quadrant: bottom, left, top, right
      layouts.push({
        x: 0, y: 240,       // Player 1 bottom
        handX: 0, handY: 290,
        nameX: 0, nameY: 190,
        tokensX: 200, tokensY: 190
      });
      layouts.push({
        x: -350, y: 0,      // Player 2 left
        handX: -400, handY: 0,
        nameX: -300, nameY: -50,
        tokensX: -150, tokensY: -50
      });
      layouts.push({
        x: 0, y: -240,      // Player 3 top
        handX: 0, handY: -290,
        nameX: 0, nameY: -190,
        tokensX: 200, tokensY: -190
      });
      layouts.push({
        x: 350, y: 0,       // Player 4 right
        handX: 400, handY: 0,
        nameX: 300, nameY: -50,
        tokensX: 550, tokensY: -50
      });
    }

    return layouts;
  }

  /**
   * Update the entire playfield with new game state
   */
  public updatePlayfield(gameState: GameState): void {
    // Update deck with animation
    this.updateDeckWithAnimation(gameState);

    // Update phase with color coding
    this.updatePhaseDisplay(gameState);

    // Update current player with highlight
    this.updateCurrentPlayerDisplay(gameState);

    // Update or create player areas
    this.updatePlayerAreas(gameState);
  }

  /**
   * Get deck container position for animations
   */
  public getDeckPosition(): { x: number; y: number } {
    return {
      x: parseFloat(this.deckContainer.left as string) || 0,
      y: parseFloat(this.deckContainer.top as string) || 0
    };
  }

  private updateDeckWithAnimation(gameState: GameState): void {
    const deckCount = gameState.deck.length;

    this.deckCountText.text = deckCount.toString();

    if (deckCount === 0) {
      // Animate deck depletion
      this.deckImage.alpha = 0.3;
      this.deckCountText.text = 'EMPTY';
      this.deckCountText.color = '#ef4444';
      this.deckContainer.color = '#991b1b';

      // Pulse animation
      this.animatePulse(this.deckContainer);
    } else if (deckCount <= 3) {
      // Low deck warning
      this.deckImage.alpha = 0.7;
      this.deckCountText.color = '#fbbf24'; // Yellow warning
      this.deckContainer.color = '#b45309';

      // Subtle pulse
      this.animatePulse(this.deckContainer, 0.95, 1.05, 2000);
    } else {
      this.deckImage.alpha = 1.0;
      this.deckCountText.color = 'white';
      this.deckContainer.color = '#9333ea';
    }
  }

  private updatePhaseDisplay(gameState: GameState): void {
    const phaseConfig = {
      'setup': { text: 'Setup Phase', color: '#9ca3af' },
      'draw': { text: '→ Draw Card', color: '#60a5fa' },
      'play': { text: '→ Play Card', color: '#c084fc' },
      'round-end': { text: '✦ Round Complete', color: '#4ade80' },
      'game-end': { text: '★ GAME OVER ★', color: '#fbbf24' }
    };

    const config = phaseConfig[gameState.phase];
    this.phaseText.text = config.text;
    this.phaseText.color = config.color;

    // Animate phase changes
    if (gameState.phase === 'round-end' || gameState.phase === 'game-end') {
      this.animatePulse(this.phaseText, 0.9, 1.1, 1000);
    }
  }

  private updateCurrentPlayerDisplay(gameState: GameState): void {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (gameState.phase === 'game-end') {
      const winner = gameState.players.find(p => p.devotionTokens >= gameState.tokensToWin);
      if (winner) {
        this.currentPlayerText.text = `👑 ${winner.name} WINS! 👑`;
        this.currentPlayerText.color = '#fbbf24'; // Gold
        this.animatePulse(this.currentPlayerText, 0.9, 1.15, 800);
      }
    } else {
      this.currentPlayerText.text = `${currentPlayer.name}'s Turn`;
      this.currentPlayerText.color = 'white';

      // Highlight active player
      this.centerInfoPanel.color = '#ef4444';
      this.animatePulse(this.centerInfoPanel, 0.98, 1.02, 1500);
    }
  }

  /**
   * Animate pulsing effect on a control
   */
  private animatePulse(
    control: Rectangle | TextBlock,
    minScale: number = 0.95,
    maxScale: number = 1.05,
    duration: number = 1500
  ): void {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % duration) / duration;

      // Sine wave for smooth pulse
      const scale = minScale + (maxScale - minScale) * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);

      control.scaleX = scale;
      control.scaleY = scale;

      // Continue animation
      requestAnimationFrame(animate);
    };

    animate();
  }

  private updatePlayerAreas(gameState: GameState): void {
    const layouts = this.calculatePlayerLayouts(gameState.players.length);

    gameState.players.forEach((player, index) => {
      const layout = layouts[index];

      // Get or create player area
      let playerArea = this.playerAreas.get(player.id);
      const previousHandSize = this.previousHandSizes.get(player.id);

      if (!playerArea) {
        playerArea = new PlayerAreaUI(
          this.scene,
          this.advancedTexture,
          player,
          layout,
          index === 0 // Assume player 0 is local player
        );
        this.playerAreas.set(player.id, playerArea);
      } else {
        playerArea.update(player, gameState.currentPlayerIndex === index, previousHandSize);
      }

      // Update tracked hand size
      this.previousHandSizes.set(player.id, player.hand.length);
    });
  }

  /**
   * Dispose of all GUI elements
   */
  public dispose(): void {
    this.backgroundImage.dispose();
    this.deckContainer.dispose();
    this.centerInfoPanel.dispose();
    this.playerAreas.forEach(area => area.dispose());
    this.playerAreas.clear();
    this.playerCards.forEach(cards => cards.forEach(card => card.dispose()));
    this.playerCards.clear();
  }
}

/**
 * PlayerAreaUI
 *
 * Represents a single player's area on the playfield
 */
class PlayerAreaUI {
  private scene: Scene;
  private advancedTexture: AdvancedDynamicTexture;
  private container: Rectangle;
  private nameText: TextBlock;
  private statusPanel: Rectangle;
  private statusText: TextBlock;
  private tokenContainer: StackPanel;
  private handContainer: Rectangle;
  private handCards: BabylonCard[] = [];
  private discardContainer: Rectangle;
  private discardCards: BabylonCard[] = [];
  private isLocalPlayer: boolean;

  constructor(
    scene: Scene,
    advancedTexture: AdvancedDynamicTexture,
    player: Player,
    layout: PlayerAreaLayout,
    isLocalPlayer: boolean
  ) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;
    this.isLocalPlayer = isLocalPlayer;

    // Create main container
    this.container = new Rectangle(`player-${player.id}-container`);
    this.container.width = '300px';
    this.container.height = '180px';
    this.container.thickness = 2;
    this.container.cornerRadius = 10;
    this.container.color = '#6b7280';
    this.container.background = 'rgba(0, 0, 0, 0.6)';
    this.container.left = `${layout.x}px`;
    this.container.top = `${layout.y}px`;
    advancedTexture.addControl(this.container);

    // Player name
    this.nameText = new TextBlock(`player-${player.id}-name`, player.name);
    this.nameText.fontSize = 18;
    this.nameText.color = 'white';
    this.nameText.fontWeight = 'bold';
    this.nameText.top = '-60px';
    this.nameText.height = '25px';
    this.container.addControl(this.nameText);

    if (isLocalPlayer) {
      const youLabel = new TextBlock(`player-${player.id}-you`, '(YOU)');
      youLabel.fontSize = 12;
      youLabel.color = '#c084fc';
      youLabel.top = '-38px';
      youLabel.height = '18px';
      this.container.addControl(youLabel);
    }

    // Status panel (protection, elimination)
    this.statusPanel = new Rectangle(`player-${player.id}-status-panel`);
    this.statusPanel.width = '280px';
    this.statusPanel.height = '40px';
    this.statusPanel.thickness = 1;
    this.statusPanel.cornerRadius = 5;
    this.statusPanel.top = '-10px';
    this.statusPanel.isVisible = false;
    this.container.addControl(this.statusPanel);

    this.statusText = new TextBlock(`player-${player.id}-status`, '');
    this.statusText.fontSize = 14;
    this.statusText.fontWeight = 'bold';
    this.statusPanel.addControl(this.statusText);

    // Devotion tokens
    this.tokenContainer = new StackPanel(`player-${player.id}-tokens`);
    this.tokenContainer.isVertical = false;
    this.tokenContainer.width = '200px';
    this.tokenContainer.height = '50px';
    this.tokenContainer.top = '40px';
    this.container.addControl(this.tokenContainer);

    // Hand placeholder
    this.handContainer = new Rectangle(`player-${player.id}-hand`);
    this.handContainer.width = '150px';
    this.handContainer.height = '60px';
    this.handContainer.thickness = 1;
    this.handContainer.cornerRadius = 5;
    this.handContainer.color = '#4b5563';
    this.handContainer.background = 'rgba(0, 0, 0, 0.3)';
    this.handContainer.top = '50px';
    this.container.addControl(this.handContainer);

    const handLabel = new TextBlock(`player-${player.id}-hand-label`, 'Hand');
    handLabel.fontSize = 12;
    handLabel.color = '#9ca3af';
    this.handContainer.addControl(handLabel);

    // Discard pile (played cards)
    this.discardContainer = new Rectangle(`player-${player.id}-discard`);
    this.discardContainer.width = '100px';
    this.discardContainer.height = '80px';
    this.discardContainer.thickness = 1;
    this.discardContainer.cornerRadius = 5;
    this.discardContainer.color = '#6b7280';
    this.discardContainer.background = 'rgba(0, 0, 0, 0.3)';
    this.discardContainer.top = '-50px';
    this.discardContainer.left = '100px';
    this.container.addControl(this.discardContainer);

    const discardLabel = new TextBlock(`player-${player.id}-discard-label`, 'Played');
    discardLabel.fontSize = 10;
    discardLabel.color = '#9ca3af';
    this.discardContainer.addControl(discardLabel);

    // Initial update
    this.update(player, false);
  }

  public update(player: Player, isCurrentPlayer: boolean, previousHandSize?: number): void {
    // Update border based on current player with animation
    if (isCurrentPlayer) {
      this.container.color = '#ef4444'; // Red
      this.container.thickness = 3;
      this.animateHighlight();
    } else {
      this.container.color = '#6b7280'; // Gray
      this.container.thickness = 2;
      this.container.scaleX = 1.0;
      this.container.scaleY = 1.0;
    }

    // Update elimination/protection status
    if (player.isEliminated) {
      this.container.alpha = 0.5;
      this.statusPanel.isVisible = true;
      this.statusPanel.background = 'rgba(75, 85, 99, 0.7)';
      this.statusPanel.color = '#9ca3af';
      this.statusText.text = '💀 Eliminated';
      this.statusText.color = '#9ca3af';
    } else if (player.isProtected) {
      this.container.alpha = 1.0;
      this.statusPanel.isVisible = true;
      this.statusPanel.background = 'rgba(6, 182, 212, 0.3)';
      this.statusPanel.color = '#22d3ee';
      this.statusText.text = '🛡️ Protected';
      this.statusText.color = '#22d3ee';
      this.animateProtectionPulse();
    } else {
      this.container.alpha = 1.0;
      this.statusPanel.isVisible = false;
    }

    // Update devotion tokens with fade-in animation
    this.tokenContainer.clearControls();
    for (let i = 0; i < player.devotionTokens; i++) {
      const tokenImage = new Image(`token-${player.id}-${i}`, '/img/devotion_token.png');
      tokenImage.width = '40px';
      tokenImage.height = '40px';
      tokenImage.stretch = Image.STRETCH_UNIFORM;
      tokenImage.paddingLeftInPixels = 2;
      tokenImage.paddingRightInPixels = 2;

      // Fade in animation
      tokenImage.alpha = 0;
      this.fadeIn(tokenImage, i * 100);

      this.tokenContainer.addControl(tokenImage);
    }

    // Check if a new card was drawn
    const handSizeIncreased = previousHandSize !== undefined && player.hand.length > previousHandSize;

    // Update hand cards - RENDER ACTUAL CARDS
    this.updateHandCards(player, handSizeIncreased);

    // Update discard pile
    this.updateDiscardPile(player);
  }

  private updateHandCards(player: Player, animateNewCard: boolean = false): void {
    // Clear existing cards
    this.handCards.forEach(card => card.dispose());
    this.handCards = [];
    this.handContainer.clearControls();

    const handCount = player.hand.length;

    if (handCount > 0) {
      // Hide hand container background when cards are present
      this.handContainer.background = 'rgba(0, 0, 0, 0)'; // Transparent
      this.handContainer.color = 'transparent';
      this.handContainer.thickness = 0;

      // Calculate card positions (small cards in hand)
      const cardWidth = 60;
      const cardHeight = 90;
      const cardSpacing = 10; // Pixels between cards
      const totalWidth = (cardWidth * handCount) + (cardSpacing * (handCount - 1));
      const startX = -(totalWidth / 2) + (cardWidth / 2); // Center the row

      player.hand.forEach((card, index) => {
        const cardX = startX + (index * (cardWidth + cardSpacing));
        const isNewCard = animateNewCard && index === handCount - 1; // Last card is the new one

        const babylonCard = new BabylonCard(
          this.scene,
          this.advancedTexture,
          {
            id: card.id,
            name: card.name,
            value: card.value,
            ability: card.ability,
            quote: card.quote,
            portraitUrl: `/img/${card.value}_${card.type}.png`,
            cardBackUrl: '/img/card_back_3.png',
            cardFrontUrl: '/img/card_front_3.png',
            color: this.parseCardColor(card.color)
          },
          `${cardX}px`,
          '0px'
        );

        // Scale down cards for hand (they're 200x300 by default)
        const cardContainer = babylonCard.getContainer();
        cardContainer.widthInPixels = cardWidth;
        cardContainer.heightInPixels = cardHeight;

        // Make cards visible if local player
        if (this.isLocalPlayer) {
          babylonCard.flip(); // Show card face
        }

        // Add whimsical entrance animation for new cards
        if (isNewCard) {
          this.animateCardDraw(cardContainer);
        }

        // Add to hand container
        this.handContainer.addControl(cardContainer);
        this.handCards.push(babylonCard);
      });
    } else {
      // No cards - show placeholder
      this.handContainer.background = 'rgba(0, 0, 0, 0.3)';
      this.handContainer.color = '#4b5563';
      this.handContainer.thickness = 1;

      const placeholder = new TextBlock('hand-empty', 'Hand');
      placeholder.fontSize = 12;
      placeholder.color = '#9ca3af';
      this.handContainer.addControl(placeholder);
    }
  }

  /**
   * Whimsical card draw animation
   * - Starts small and grows
   * - Bouncy entrance with rotation
   * - Slight sparkle effect via opacity
   */
  private animateCardDraw(cardContainer: Rectangle): void {
    const duration = 600; // milliseconds
    const startTime = Date.now();

    // Initial state: small, slightly rotated
    cardContainer.scaleX = 0.1;
    cardContainer.scaleY = 0.1;
    cardContainer.rotation = Math.PI * 0.25; // 45 degrees
    cardContainer.alpha = 0;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Bounce easing (overshoot then settle)
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      // Scale with bounce (overshoot to 1.15 then settle to 1.0)
      const bounceScale = eased < 0.8
        ? eased * 1.4
        : 1.15 - (eased - 0.8) * 0.75;

      cardContainer.scaleX = bounceScale;
      cardContainer.scaleY = bounceScale;

      // Rotation: spin in then settle
      cardContainer.rotation = (1 - progress) * Math.PI * 0.25;

      // Opacity: fade in with sparkle
      cardContainer.alpha = Math.min(progress * 1.5, 1.0);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Final state
        cardContainer.scaleX = 1.0;
        cardContainer.scaleY = 1.0;
        cardContainer.rotation = 0;
        cardContainer.alpha = 1.0;
      }
    };

    animate();
  }

  /**
   * Update discard pile with stacked cards showing values
   */
  private updateDiscardPile(player: Player): void {
    // Clear existing discard cards
    this.discardCards.forEach(card => card.dispose());
    this.discardCards = [];
    this.discardContainer.clearControls();

    const discardCount = player.discardPile.length;

    if (discardCount > 0) {
      // Hide placeholder background
      this.discardContainer.background = 'rgba(0, 0, 0, 0)';
      this.discardContainer.color = 'transparent';
      this.discardContainer.thickness = 0;

      // Stack cards with slight offset to show values
      const cardWidth = 50;
      const cardHeight = 75;
      const stackOffset = 15; // Pixels offset for each card (shows top portion)

      player.discardPile.forEach((card, index) => {
        const cardY = -(discardCount - 1 - index) * stackOffset; // Stack from bottom to top

        const babylonCard = new BabylonCard(
          this.scene,
          this.advancedTexture,
          {
            id: `discard-${card.id}`,
            name: card.name,
            value: card.value,
            ability: card.ability,
            quote: card.quote,
            portraitUrl: `/img/${card.value}_${card.type}.png`,
            cardBackUrl: '/img/card_back_3.png',
            cardFrontUrl: '/img/card_front_3.png',
            color: this.parseCardColor(card.color)
          },
          '0px',
          `${cardY}px`
        );

        // Scale down for discard pile
        const cardContainer = babylonCard.getContainer();
        cardContainer.widthInPixels = cardWidth;
        cardContainer.heightInPixels = cardHeight;

        // Always show face for discard pile
        babylonCard.flip();

        // Add to discard container
        this.discardContainer.addControl(cardContainer);
        this.discardCards.push(babylonCard);
      });
    } else {
      // No cards - show placeholder
      this.discardContainer.background = 'rgba(0, 0, 0, 0.3)';
      this.discardContainer.color = '#6b7280';
      this.discardContainer.thickness = 1;

      const placeholder = new TextBlock('discard-empty', 'Played');
      placeholder.fontSize = 10;
      placeholder.color = '#9ca3af';
      this.discardContainer.addControl(placeholder);
    }
  }

  private parseCardColor(tailwindGradient: string): { r: number; g: number; b: number } {
    // Parse Tailwind gradient to RGB (simplified)
    const colorMap: Record<string, { r: number; g: number; b: number }> = {
      'from-slate-700': { r: 51, g: 56, b: 64 },
      'from-blue-800': { r: 31, g: 61, b: 120 },
      'from-indigo-800': { r: 51, g: 46, b: 128 },
      'from-amber-800': { r: 151, g: 89, b: 10 },
      'from-purple-800': { r: 89, g: 41, b: 143 },
      'from-cyan-800': { r: 21, g: 115, b: 140 },
      'from-rose-800': { r: 158, g: 41, b: 92 },
      'from-red-800': { r: 153, g: 38, b: 38 },
      'from-yellow-700': { r: 164, g: 132, b: 20 },
      'from-emerald-800': { r: 6, g: 120, b: 94 },
      'from-red-950': { r: 89, g: 10, b: 10 }
    };

    const match = tailwindGradient.match(/from-[\w-]+/);
    if (match && colorMap[match[0]]) {
      return colorMap[match[0]];
    }

    return { r: 77, g: 77, b: 77 }; // Default gray
  }

  private animateHighlight(): void {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % 1500) / 1500;

      // Pulse between 1.0 and 1.03
      const scale = 1.0 + 0.03 * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);

      this.container.scaleX = scale;
      this.container.scaleY = scale;

      requestAnimationFrame(animate);
    };

    animate();
  }

  private animateProtectionPulse(): void {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % 800) / 800;

      // Fast pulse for protection
      const alpha = 0.3 + 0.4 * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);

      this.statusPanel.background = `rgba(6, 182, 212, ${alpha})`;

      requestAnimationFrame(animate);
    };

    animate();
  }

  private fadeIn(control: Image, delay: number = 0): void {
    setTimeout(() => {
      const startTime = Date.now();
      const duration = 500;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        control.alpha = progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }, delay);
  }

  public dispose(): void {
    // Dispose hand cards
    this.handCards.forEach(card => card.dispose());
    this.handCards = [];
    // Dispose discard cards
    this.discardCards.forEach(card => card.dispose());
    this.discardCards = [];
    // Dispose container (which will dispose all children)
    this.container.dispose();
  }
}
