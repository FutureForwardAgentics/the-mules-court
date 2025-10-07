import {
  Scene,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  Color3,
  ActionManager,
  ExecuteCodeAction,
  Texture,
  ShadowGenerator,
  Material
} from '@babylonjs/core';
import type { Card } from '../../types/game';
import type { CardSize } from '../../types/babylon';
import { HoloShaderMaterial } from '../materials/HoloShaderMaterial';

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
  rotation?: Vector3; // Optional initial rotation for 2.5D effect
  shadowGenerator?: ShadowGenerator; // Optional shadow casting
  useHoloShader?: boolean; // Use holographic shader material
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
  public material: Material;
  private scene: Scene;
  private config: CardMeshConfig;

  constructor(scene: Scene, config: CardMeshConfig) {
    this.scene = scene;
    this.config = config;

    // Create the mesh and material
    this.mesh = this.createCardMesh();
    this.material = config.useHoloShader
      ? this.createHoloMaterial()
      : this.createCardMaterial();
    this.mesh.material = this.material;

    // Set initial position
    this.mesh.position = config.position;

    // Apply rotation for 2.5D effect if provided
    if (config.rotation) {
      this.mesh.rotation = config.rotation;
    } else {
      // Default slight tilt for depth
      this.mesh.rotation = new Vector3(0.1, 0, 0); // Tilt forward slightly
    }

    // Enable shadow casting if shadow generator provided
    if (config.shadowGenerator) {
      config.shadowGenerator.addShadowCaster(this.mesh);
      this.mesh.receiveShadows = true;
    }

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
   * Create a graphical material for the card with textures
   */
  private createCardMaterial(): StandardMaterial {
    const material = new StandardMaterial(
      `card-material-${this.config.card.id}`,
      this.scene
    );

    // Load appropriate texture based on revealed state
    const texturePath = this.config.isRevealed
      ? `/img/${this.config.card.value}_${this.config.card.type}.png` // Card front with portrait
      : '/img/card_back_3.png'; // Card back

    // Create and apply texture
    const texture = new Texture(texturePath, this.scene);
    material.diffuseTexture = texture;

    // Graphical enhancements
    material.specularColor = new Color3(0.3, 0.3, 0.3); // Slight shine
    material.specularPower = 32; // Sharp highlights
    material.backFaceCulling = false; // Render both sides

    // Add subtle emissive for card glow
    material.emissiveColor = new Color3(0.05, 0.05, 0.08);

    // Enable alpha if texture has transparency
    if (texture) {
      material.useAlphaFromDiffuseTexture = true;
    }

    return material;
  }

  /**
   * Create a holographic shader material for the card
   */
  private createHoloMaterial(): HoloShaderMaterial {
    // Load appropriate texture based on revealed state
    const texturePath = this.config.isRevealed
      ? `/img/${this.config.card.value}_${this.config.card.type}.png`
      : '/img/card_back_3.png';

    const texture = new Texture(texturePath, this.scene);

    const holoMaterial = new HoloShaderMaterial(
      `holo-material-${this.config.card.id}`,
      this.scene,
      texture
    );

    holoMaterial.backFaceCulling = false;

    return holoMaterial;
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
   * Handle hover enter with 2.5D effects
   */
  private onHoverEnter(): void {
    // Scale up and lift
    this.mesh.scaling = new Vector3(1.1, 1.1, 1.0);
    this.mesh.position.z += 0.5; // Lift forward

    // Add rotation tilt for depth
    const currentRotation = this.mesh.rotation.clone();
    this.mesh.rotation = new Vector3(
      currentRotation.x - 0.1, // Tilt more forward
      currentRotation.y,
      currentRotation.z
    );

    // Brighten material with glow (only for StandardMaterial)
    if (this.material instanceof StandardMaterial) {
      this.material.emissiveColor = new Color3(0.1, 0.1, 0.15);
    }
    // HoloShaderMaterial has built-in hover effect via mouse position
  }

  /**
   * Handle hover exit
   */
  private onHoverExit(): void {
    // Reset scale and position
    this.mesh.scaling = new Vector3(1.0, 1.0, 1.0);
    this.mesh.position.z -= 0.5; // Lower back

    // Reset rotation
    if (this.config.rotation) {
      this.mesh.rotation = this.config.rotation.clone();
    } else {
      this.mesh.rotation = new Vector3(0.1, 0, 0);
    }

    // Reset brightness (only for StandardMaterial)
    if (this.material instanceof StandardMaterial) {
      this.material.emissiveColor = new Color3(0.05, 0.05, 0.08);
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
   * Update the card's revealed state with texture swap
   */
  public setRevealed(isRevealed: boolean): void {
    this.config.isRevealed = isRevealed;

    if (this.material instanceof StandardMaterial) {
      // Update texture to show front or back
      const texturePath = isRevealed
        ? `/img/${this.config.card.value}_${this.config.card.type}.png`
        : '/img/card_back_3.png';

      // Dispose old texture
      if (this.material.diffuseTexture) {
        this.material.diffuseTexture.dispose();
      }

      // Load new texture
      this.material.diffuseTexture = new Texture(texturePath, this.scene);
    } else if (this.material instanceof HoloShaderMaterial) {
      // For HoloShaderMaterial, need to recreate material with new texture
      this.material.dispose();
      this.material = this.createHoloMaterial();
      this.mesh.material = this.material;
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

  /**
   * Update mouse position for holographic effect (normalized 0-1 coordinates)
   */
  public updateMousePosition(x: number, y: number): void {
    if (this.material instanceof HoloShaderMaterial) {
      this.material.updateMousePosition(x, y);
    }
  }
}
