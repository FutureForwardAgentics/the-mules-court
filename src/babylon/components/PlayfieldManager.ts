import { Scene, FreeCamera, Vector3, HemisphericLight, DirectionalLight, ShadowGenerator, Color3 } from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Rectangle,
  Image,
  TextBlock,
  StackPanel
} from '@babylonjs/gui';
import { BabylonCard } from './BabylonCard';
import { CardSlot } from './CardSlot';
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
  private onCardClick?: (cardId: string) => void; // Card click handler
  private shadowGenerator: ShadowGenerator; // For card shadows
  private use3DCards: boolean = true; // Toggle for 3D vs GUI cards


  constructor(scene: Scene, advancedTexture: AdvancedDynamicTexture) {
    this.scene = scene;
    this.advancedTexture = advancedTexture;

    // Create camera with better positioning for 2.5D card game
    // Position further back to fit entire playfield
    const camera = new FreeCamera('playfield-camera', new Vector3(0, -8, -35), scene);
    camera.setTarget(new Vector3(0, 0, 0));
    scene.activeCamera = camera;

    // Add lighting for 3D depth
    this.shadowGenerator = this.setupLighting(scene);

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
   * Setup lighting for 3D card depth and shadows
   */
  private setupLighting(scene: Scene): ShadowGenerator {
    // Hemispheric light for ambient lighting
    const ambientLight = new HemisphericLight('ambient-light', new Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.6;
    ambientLight.diffuse = new Color3(0.8, 0.8, 1.0); // Slight blue tint
    ambientLight.groundColor = new Color3(0.3, 0.3, 0.4);

    // Directional light for shadows and depth
    const mainLight = new DirectionalLight('main-light', new Vector3(-0.5, -1, -0.3), scene);
    mainLight.intensity = 0.8;
    mainLight.position = new Vector3(10, 20, 10);

    // Create shadow generator
    const shadowGenerator = new ShadowGenerator(1024, mainLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    return shadowGenerator;
  }

  /**
   * Calculate player area positions based on player count
   * 2.5D perspective: players further away appear smaller/higher
   */
  private calculatePlayerLayouts(playerCount: number): PlayerAreaLayout[] {
    const layouts: PlayerAreaLayout[] = [];

    if (playerCount === 2) {
      // Horizontal split: bottom (close) vs top (far) with perspective
      layouts.push({
        x: 0, y: 260,       // Player 1 bottom center (closer - larger)
        handX: 0, handY: 310,
        nameX: 0, nameY: 210,
        tokensX: 250, tokensY: 210
      });
      layouts.push({
        x: 0, y: -260,      // Player 2 top center (farther - smaller)
        handX: 0, handY: -310,
        nameX: 0, nameY: -210,
        tokensX: 250, tokensY: -210
      });
    } else if (playerCount === 3) {
      // Triangular: bottom center (close), top left/right (far)
      layouts.push({
        x: 0, y: 280,       // Player 1 bottom (closest)
        handX: 0, handY: 330,
        nameX: 0, nameY: 230,
        tokensX: 250, tokensY: 230
      });
      layouts.push({
        x: -380, y: -200,   // Player 2 top left (far)
        handX: -380, handY: -250,
        nameX: -380, nameY: -150,
        tokensX: -180, tokensY: -150
      });
      layouts.push({
        x: 380, y: -200,    // Player 3 top right (far)
        handX: 380, handY: -250,
        nameX: 380, nameY: -150,
        tokensX: 580, tokensY: -150
      });
    } else { // 4 players
      // Quadrant: bottom (close), left/right (mid), top (far)
      layouts.push({
        x: 0, y: 300,       // Player 1 bottom (closest)
        handX: 0, handY: 350,
        nameX: 0, nameY: 250,
        tokensX: 250, tokensY: 250
      });
      layouts.push({
        x: -430, y: 20,     // Player 2 left (mid-distance)
        handX: -480, handY: 20,
        nameX: -380, nameY: -30,
        tokensX: -230, tokensY: -30
      });
      layouts.push({
        x: 0, y: -300,      // Player 3 top (farthest)
        handX: 0, handY: -350,
        nameX: 0, nameY: -250,
        tokensX: 250, tokensY: -250
      });
      layouts.push({
        x: 430, y: 20,      // Player 4 right (mid-distance)
        handX: 480, handY: 20,
        nameX: 380, nameY: -30,
        tokensX: 630, tokensY: -30
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

  /**
   * Set card click handler for game interaction
   */
  public setCardClickHandler(handler: (cardId: string) => void): void {
    this.onCardClick = handler;
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
          index === 0, // Assume player 0 is local player
          this.onCardClick,
          index, // Pass player index for perspective scaling
          this.shadowGenerator,
          this.use3DCards
        );
        this.playerAreas.set(player.id, playerArea);
        // Initialize previous hand size to prevent false animation on first update
        this.previousHandSizes.set(player.id, player.hand.length);
      } else {
        playerArea.update(player, gameState.currentPlayerIndex === index, previousHandSize, this.onCardClick);
        // Update tracked hand size AFTER update
        this.previousHandSizes.set(player.id, player.hand.length);
      }
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
  private container: Rectangle;
  private nameText: TextBlock;
  private statusPanel: Rectangle;
  private statusText: TextBlock;
  private tokenContainer: StackPanel;
  private handContainer: Rectangle;
  private handSlots: CardSlot[] = []; // Fixed slots for hand cards (max 2)
  private discardContainer: Rectangle;
  private discardSlots: CardSlot[] = []; // Fixed slots for discard pile
  private isLocalPlayer: boolean;
  private shadowGenerator?: ShadowGenerator;
  private use3DCards: boolean;
  private layout: PlayerAreaLayout;

  constructor(
    scene: Scene,
    advancedTexture: AdvancedDynamicTexture,
    player: Player,
    layout: PlayerAreaLayout,
    isLocalPlayer: boolean,
    onCardClick?: (cardId: string) => void,
    _playerIndex: number = 0,
    shadowGenerator?: ShadowGenerator,
    use3DCards: boolean = true
  ) {
    this.scene = scene;
    this.isLocalPlayer = isLocalPlayer;
    this.shadowGenerator = shadowGenerator;
    this.use3DCards = use3DCards;
    this.layout = layout;

    // Calculate perspective scale (player 0 is closest = 1.0, others scale down)
    const perspectiveScale = _playerIndex === 0 ? 1.0 : 0.85;

    // Create main container (optimized size to prevent overlaps)
    this.container = new Rectangle(`player-${player.id}-container`);
    this.container.width = '320px'; // Reduced from 400px to fit better
    this.container.height = '200px'; // Reduced from 240px to fit better
    this.container.thickness = 3; // Thicker border
    this.container.cornerRadius = 15; // Rounder corners
    this.container.color = '#6b7280';
    this.container.background = 'rgba(0, 0, 0, 0.7)'; // Slightly more opaque
    this.container.left = `${layout.x}px`;
    this.container.top = `${layout.y}px`;
    // Apply perspective scaling
    this.container.scaleX = perspectiveScale;
    this.container.scaleY = perspectiveScale;
    // Add shadow effect for depth
    this.container.shadowBlur = 20;
    this.container.shadowOffsetX = 0;
    this.container.shadowOffsetY = 10;
    this.container.shadowColor = 'rgba(0, 0, 0, 0.5)';
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

    // Hand placeholder (sized for cards)
    this.handContainer = new Rectangle(`player-${player.id}-hand`);
    this.handContainer.width = '220px'; // Reduced to fit in smaller container
    this.handContainer.height = '130px'; // Reduced to fit in smaller container
    this.handContainer.thickness = 2;
    this.handContainer.cornerRadius = 10;
    this.handContainer.color = '#4b5563';
    this.handContainer.background = 'rgba(0, 0, 0, 0.3)';
    this.handContainer.top = '50px';
    this.container.addControl(this.handContainer);

    const handLabel = new TextBlock(`player-${player.id}-hand-label`, 'Hand');
    handLabel.fontSize = 12;
    handLabel.color = '#9ca3af';
    this.handContainer.addControl(handLabel);

    // Discard pile (played cards) - sized appropriately
    this.discardContainer = new Rectangle(`player-${player.id}-discard`);
    this.discardContainer.width = '100px'; // Reduced to fit better
    this.discardContainer.height = '110px'; // Reduced to fit better
    this.discardContainer.thickness = 2;
    this.discardContainer.cornerRadius = 10;
    this.discardContainer.color = '#6b7280';
    this.discardContainer.background = 'rgba(0, 0, 0, 0.3)';
    this.discardContainer.top = '-60px';
    this.discardContainer.left = '110px';
    this.container.addControl(this.discardContainer);

    const discardLabel = new TextBlock(`player-${player.id}-discard-label`, 'Played');
    discardLabel.fontSize = 10;
    discardLabel.color = '#9ca3af';
    this.discardContainer.addControl(discardLabel);

    // Initialize card slots (fixed positions for slot-based rendering)
    this.initializeCardSlots(player.id, onCardClick);

    // Initial update
    this.update(player, false, undefined, onCardClick);
  }

  /**
   * Initialize fixed card slots for this player
   * This prevents card duplication by using persistent slot objects
   */
  private initializeCardSlots(playerId: string, onCardClick?: (cardId: string) => void): void {
    // Create 2 hand slots (max hand size is 2)
    const handSlotCount = 2;
    const cardSpacing = 2.5; // World units
    const startX = -(handSlotCount - 1) * cardSpacing / 2;

    // Calculate base position in 3D world space
    const basePos = this.pixelTo3D(
      this.layout.x,
      this.layout.y + 50, // Offset for hand area
      0
    );

    for (let i = 0; i < handSlotCount; i++) {
      const xOffset = startX + (i * cardSpacing);
      const position = new Vector3(
        basePos.x + xOffset,
        basePos.y,
        basePos.z
      );

      const slot = new CardSlot(
        this.scene,
        `${playerId}-hand-${i}`,
        position,
        {
          isRevealed: this.isLocalPlayer,
          isInteractive: this.isLocalPlayer,
          shadowGenerator: this.shadowGenerator,
          onCardClick
        }
      );

      this.handSlots.push(slot);
    }

    // Create discard slots (we'll create them dynamically as needed)
    // For now, just initialize empty array
    this.discardSlots = [];
  }

  /**
   * Helper to convert 2D pixel position to 3D world position
   */
  private pixelTo3D(pixelX: number, pixelY: number, z: number = 0): Vector3 {
    // Simple conversion: pixels to world units
    // Assuming screen center is (0,0) and scaling down
    const worldX = pixelX / 100; // Scale factor
    const worldY = -pixelY / 100; // Invert Y for 3D space
    return new Vector3(worldX, worldY, z);
  }

  public update(player: Player, isCurrentPlayer: boolean, previousHandSize?: number, onCardClick?: (cardId: string) => void): void {
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
    this.updateHandCards(player, handSizeIncreased, onCardClick);

    // Update discard pile
    this.updateDiscardPile(player);
  }

  /**
   * Helper to convert 2D pixel position to 3D world position
   */
  /**
   * Update hand cards using slot-based system
   * This prevents card duplication by assigning cards to fixed slots
   */
  private updateHandCards(player: Player, _animateNewCard: boolean = false, _onCardClick?: (cardId: string) => void): void {
    // Assign cards to slots (max 2 slots for max hand size of 2)
    for (let i = 0; i < this.handSlots.length; i++) {
      const card = player.hand[i] || null;
      this.handSlots[i].setCard(card);
    }

    // Hide hand container background when using 3D cards
    if (this.use3DCards) {
      this.handContainer.background = 'rgba(0, 0, 0, 0)';
      this.handContainer.color = 'transparent';
      this.handContainer.thickness = 0;
    }
  }

  // Obsolete methods removed - using slot-based rendering now

  /**
   * Update discard pile with stacked cards showing values
   * TODO: Convert to slot-based system like hand cards
   */
  private updateDiscardPile(_player: Player): void {
    // Temporarily disabled - will convert to slot-based system
    // For now, just show a simple placeholder
    this.discardContainer.clearControls();
    this.discardContainer.background = 'rgba(0, 0, 0, 0.3)';
    this.discardContainer.color = '#6b7280';
    this.discardContainer.thickness = 1;

    const placeholder = new TextBlock('discard-placeholder', 'Discard');
    placeholder.fontSize = 10;
    placeholder.color = '#9ca3af';
    this.discardContainer.addControl(placeholder);
  }

  // Method temporarily unused - will be needed when discard pile is converted to slots
  // private parseCardColor(tailwindGradient: string): { r: number; g: number; b: number } {
  //   // Parse Tailwind gradient to RGB (simplified)
  //   const colorMap: Record<string, { r: number; g: number; b: number }> = {
  //     'from-slate-700': { r: 51, g: 56, b: 64 },
  //     'from-blue-800': { r: 31, g: 61, b: 120 },
  //     'from-indigo-800': { r: 51, g: 46, b: 128 },
  //     'from-amber-800': { r: 151, g: 89, b: 10 },
  //     'from-purple-800': { r: 89, g: 41, b: 143 },
  //     'from-cyan-800': { r: 21, g: 115, b: 140 },
  //     'from-rose-800': { r: 158, g: 41, b: 92 },
  //     'from-red-800': { r: 153, g: 38, b: 38 },
  //     'from-yellow-700': { r: 164, g: 132, b: 20 },
  //     'from-emerald-800': { r: 6, g: 120, b: 94 },
  //     'from-red-950': { r: 89, g: 10, b: 10 }
  //   };
  //
  //   const match = tailwindGradient.match(/from-[\w-]+/);
  //   if (match && colorMap[match[0]]) {
  //     return colorMap[match[0]];
  //   }
  //
  //   return { r: 77, g: 77, b: 77 }; // Default gray
  // }

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
    // Dispose card slots
    this.handSlots.forEach(slot => slot.dispose());
    this.handSlots = [];
    this.discardSlots.forEach(slot => slot.dispose());
    this.discardSlots = [];
    // Dispose container (which will dispose all children)
    this.container.dispose();
  }
}
