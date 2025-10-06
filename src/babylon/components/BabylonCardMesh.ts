import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  Color3,
  ActionManager,
  ExecuteCodeAction
} from '@babylonjs/core';
import type { Card } from '../../types/game';
import type { CardSize } from '../../types/babylon';

/**
 * Configuration for creating a card mesh
 */
export interface CardMeshConfig {
  card: Card;
  size: CardSize;
  isRevealed: boolean;
  isInteractive: boolean;
  position: Vector3;
  onCardClick?: (cardId: string) => void;
}

/**
 * Card dimensions in world units (3D space)
 * Maintains 2:3 aspect ratio (standard card proportions)
 */
const CARD_DIMENSIONS = {
  small: { width: 1.0, height: 1.5 },
  medium: { width: 2.0, height: 3.0 },
  large: { width: 2.67, height: 4.0 }
};

/**
 * BabylonCardMesh
 *
 * Creates and manages a 3D plane mesh for a single card.
 * Replaces the 2D GUI-based BabylonCard with a shader-ready mesh.
 */
export class BabylonCardMesh {
  public mesh: Mesh;
  public material: StandardMaterial;
  private scene: Scene;
  private config: CardMeshConfig;

  constructor(scene: Scene, config: CardMeshConfig) {
    this.scene = scene;
    this.config = config;

    // Create the mesh and material
    this.mesh = this.createCardMesh();
    this.material = this.createCardMaterial();
    this.mesh.material = this.material;

    // Set initial position
    this.mesh.position = config.position;

    // Enable interactions if needed
    if (config.isInteractive && config.onCardClick) {
      this.enableInteractions();
    }
  }

  /**
   * Create a plane mesh with card proportions
   */
  private createCardMesh(): Mesh {
    const dimensions = CARD_DIMENSIONS[this.config.size];

    const mesh = MeshBuilder.CreatePlane(
      `card-mesh-${this.config.card.id}`,
      {
        width: dimensions.width,
        height: dimensions.height,
        sideOrientation: Mesh.DOUBLESIDE // Visible from both sides
      },
      this.scene
    );

    // Enable picking for raycasting
    mesh.isPickable = this.config.isInteractive;

    // Store card data for later reference
    mesh.metadata = {
      cardId: this.config.card.id,
      cardType: this.config.card.type,
      isCard: true
    };

    return mesh;
  }

  /**
   * Create a temporary material for the card
   * This will be replaced with the shader material in Stage 3
   */
  private createCardMaterial(): StandardMaterial {
    const material = new StandardMaterial(
      `card-material-${this.config.card.id}`,
      this.scene
    );

    if (this.config.isRevealed) {
      // For now, use a solid color based on card color
      // Later this will be replaced with actual card texture + shader
      const cardColor = this.parseCardColor(this.config.card.color);
      material.diffuseColor = cardColor;
      material.emissiveColor = cardColor.scale(0.2); // Slight glow
    } else {
      // Card back - dark gray
      material.diffuseColor = new Color3(0.2, 0.2, 0.25);
    }

    // Add some basic properties
    material.specularColor = new Color3(0.1, 0.1, 0.1); // Low specular
    material.backFaceCulling = false; // Render both sides

    return material;
  }

  /**
   * Parse Tailwind gradient color to a single Color3
   * For now, just extract the start color
   * TODO: Proper gradient rendering in shader
   */
  private parseCardColor(tailwindGradient: string): Color3 {
    // Simple mapping of Tailwind colors to RGB
    // This is temporary - real cards will use textures
    const colorMap: Record<string, Color3> = {
      'from-slate-700': new Color3(0.2, 0.22, 0.25),
      'from-blue-800': new Color3(0.12, 0.24, 0.47),
      'from-indigo-800': new Color3(0.2, 0.18, 0.5),
      'from-amber-800': new Color3(0.59, 0.35, 0.04),
      'from-purple-800': new Color3(0.35, 0.16, 0.56),
      'from-cyan-800': new Color3(0.08, 0.45, 0.55),
      'from-rose-800': new Color3(0.62, 0.16, 0.36),
      'from-red-800': new Color3(0.6, 0.15, 0.15),
      'from-yellow-700': new Color3(0.64, 0.52, 0.08),
      'from-emerald-800': new Color3(0.02, 0.47, 0.37),
      'from-red-950': new Color3(0.35, 0.04, 0.04)
    };

    // Extract the "from-*" part of the gradient
    const match = tailwindGradient.match(/from-[\w-]+/);
    if (match && colorMap[match[0]]) {
      return colorMap[match[0]];
    }

    // Default color
    return new Color3(0.3, 0.3, 0.3);
  }

  /**
   * Enable hover and click interactions using ActionManager
   */
  private enableInteractions(): void {
    if (!this.mesh.actionManager) {
      this.mesh.actionManager = new ActionManager(this.scene);
    }

    // Hover enter
    this.mesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOverTrigger,
        () => this.onHoverEnter()
      )
    );

    // Hover exit
    this.mesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPointerOutTrigger,
        () => this.onHoverExit()
      )
    );

    // Click
    this.mesh.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        () => this.onClick()
      )
    );
  }

  /**
   * Handle hover enter
   */
  private onHoverEnter(): void {
    // Scale up slightly
    this.mesh.scaling = new Vector3(1.05, 1.05, 1.0);
    // Brighten material
    if (this.material.emissiveColor) {
      this.material.emissiveColor = this.material.emissiveColor.scale(1.5);
    }
  }

  /**
   * Handle hover exit
   */
  private onHoverExit(): void {
    // Reset scale
    this.mesh.scaling = new Vector3(1.0, 1.0, 1.0);
    // Reset brightness
    if (this.material.diffuseColor) {
      this.material.emissiveColor = this.material.diffuseColor.scale(0.2);
    }
  }

  /**
   * Handle click
   */
  private onClick(): void {
    if (this.config.onCardClick) {
      this.config.onCardClick(this.config.card.id);
    }
  }

  /**
   * Update the card's revealed state
   */
  public setRevealed(isRevealed: boolean): void {
    this.config.isRevealed = isRevealed;

    // Update material to show front or back
    if (isRevealed) {
      const cardColor = this.parseCardColor(this.config.card.color);
      this.material.diffuseColor = cardColor;
      this.material.emissiveColor = cardColor.scale(0.2);
    } else {
      this.material.diffuseColor = new Color3(0.2, 0.2, 0.25);
      this.material.emissiveColor = new Color3(0, 0, 0);
    }
  }

  /**
   * Update the card's position
   */
  public setPosition(position: Vector3): void {
    this.mesh.position = position;
  }

  /**
   * Update the card's interactive state
   */
  public setInteractive(isInteractive: boolean): void {
    this.config.isInteractive = isInteractive;
    this.mesh.isPickable = isInteractive;
  }

  /**
   * Dispose of the mesh and material
   */
  public dispose(): void {
    this.material.dispose();
    this.mesh.dispose();
  }

  /**
   * Get the mesh's current position
   */
  public getPosition(): Vector3 {
    return this.mesh.position.clone();
  }

  /**
   * Get the card's dimensions in world units
   */
  public getDimensions(): { width: number; height: number } {
    return CARD_DIMENSIONS[this.config.size];
  }
}
