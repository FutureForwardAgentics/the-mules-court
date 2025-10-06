import { Scene, FreeCamera, Vector3 } from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Rectangle,
  Image,
  TextBlock,
  Control,
  StackPanel
} from '@babylonjs/gui';
import { BabylonCard } from './BabylonCard';
import type { GameState, Player, Card } from '../../types/game';

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
  private deckImage: Image;
  private deckCountText: TextBlock;
  private playerAreas: Map<string, PlayerAreaUI> = new Map();
  private playerCards: Map<string, BabylonCard[]> = new Map();
  private centerInfoPanel: Rectangle;
  private phaseText: TextBlock;
  private currentPlayerText: TextBlock;

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
        playerArea.update(player, gameState.currentPlayerIndex === index);
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
  private advancedTexture: AdvancedDynamicTexture;
  private container: Rectangle;
  private nameText: TextBlock;
  private statusPanel: Rectangle;
  private statusText: TextBlock;
  private tokenContainer: StackPanel;
  private handContainer: Rectangle;
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

    // Initial update
    this.update(player, false);
  }

  public update(player: Player, isCurrentPlayer: boolean): void {
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

    // Update hand info with glow effect
    const handCount = player.hand.length;
    if (handCount > 0) {
      this.handContainer.background = 'rgba(147, 51, 234, 0.3)';
      this.handContainer.color = '#a78bfa';
      this.handContainer.thickness = 2;
    } else {
      this.handContainer.background = 'rgba(0, 0, 0, 0.3)';
      this.handContainer.color = '#4b5563';
      this.handContainer.thickness = 1;
    }
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
    this.container.dispose();
  }
}
