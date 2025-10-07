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
import { CardTextureComposer } from '../utils/CardTextureComposer';

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
  public mesh: Mesh; // Front face of card
  public material: Material;
  private backMesh: Mesh; // Back face of card
  private backMaterial: Material;
  private scene: Scene;
  private config: CardMeshConfig;
  private static composerInstance: CardTextureComposer | null = null;

  constructor(scene: Scene, config: CardMeshConfig) {
    this.scene = scene;
    this.config = config;

    // Initialize composer if needed
    if (!BabylonCardMesh.composerInstance) {
      BabylonCardMesh.composerInstance = new CardTextureComposer(scene);
    }

    // Create the front mesh with a placeholder material
    this.mesh = this.createCardMesh('front');

    // Start with a basic placeholder material
    this.material = this.createPlaceholderMaterial();
    this.mesh.material = this.material;

    // Create the back mesh for double-sided card
    this.backMesh = this.createCardMesh('back');
    this.backMaterial = this.createPlaceholderMaterial();
    this.backMesh.material = this.backMaterial;

    // Asynchronously create the proper materials
    this.initializeMaterial();
    this.initializeBackMaterial();

    // Parent back mesh to front mesh so they transform together
    this.backMesh.parent = this.mesh;

    // Position back mesh slightly behind to prevent z-fighting (in local space)
    this.backMesh.position = new Vector3(0, 0, -0.001);

    // Rotate back mesh 180° on Y axis (in local space) to face opposite direction
    this.backMesh.rotation = new Vector3(0, Math.PI, 0);

    // Set initial position and rotation for front mesh (parent)
    this.mesh.position = config.position;
    if (config.rotation) {
      this.mesh.rotation = config.rotation;
    } else {
      this.mesh.rotation = new Vector3(0.1, 0, 0); // Default slight tilt
    }

    // Enable shadow casting if shadow generator provided
    if (config.shadowGenerator) {
      config.shadowGenerator.addShadowCaster(this.mesh);
      config.shadowGenerator.addShadowCaster(this.backMesh);
      this.mesh.receiveShadows = true;
      this.backMesh.receiveShadows = true;
    }

    // Enable interactions if needed (only on front mesh)
    if (config.isInteractive && config.onCardClick) {
      this.enableInteractions();
    }
  }

  /**
   * Create a plane mesh with card proportions
   * @param face 'front' or 'back' face of the card
   */
  private createCardMesh(face: 'front' | 'back'): Mesh {
    const dimensions = CARD_DIMENSIONS[this.config.size];

    const mesh = MeshBuilder.CreatePlane(
      `card-${face}-${this.config.card.id}`,
      {
        width: dimensions.width,
        height: dimensions.height,
        sideOrientation: Mesh.FRONTSIDE // Only visible from front (proper face culling)
      },
      this.scene
    );

    // Enable picking for raycasting (only on front face)
    mesh.isPickable = this.config.isInteractive && face === 'front';

    // Store card data for later reference
    mesh.metadata = {
      cardId: this.config.card.id,
      cardType: this.config.card.type,
      isCard: true,
      face
    };

    return mesh;
  }

  /**
   * Create placeholder material while card texture loads
   */
  private createPlaceholderMaterial(): StandardMaterial {
    const material = new StandardMaterial(
      `placeholder-material-${this.config.card.id}`,
      this.scene
    );
    material.diffuseColor = new Color3(0.2, 0.2, 0.3);
    material.emissiveColor = new Color3(0.05, 0.05, 0.08);
    material.backFaceCulling = false;
    return material;
  }

  /**
   * Initialize the proper material asynchronously
   */
  private async initializeMaterial(): Promise<void> {
    try {
      if (this.config.isRevealed) {
        // Create composed card texture with all elements
        const composer = BabylonCardMesh.composerInstance!;
        const cardTexture = await composer.createCardTexture(this.config.card);

        // Create appropriate material with composed texture
        if (this.config.useHoloShader) {
          const holoMaterial = new HoloShaderMaterial(
            `holo-material-${this.config.card.id}`,
            this.scene,
            cardTexture
          );
          holoMaterial.backFaceCulling = false;

          // Dispose old material and apply new one
          this.material.dispose();
          this.material = holoMaterial;
          this.mesh.material = holoMaterial;
        } else {
          const standardMaterial = new StandardMaterial(
            `card-material-${this.config.card.id}`,
            this.scene
          );
          standardMaterial.diffuseTexture = cardTexture;
          standardMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
          standardMaterial.specularPower = 32;
          standardMaterial.backFaceCulling = false;
          standardMaterial.emissiveColor = new Color3(0.05, 0.05, 0.08);

          // Dispose old material and apply new one
          this.material.dispose();
          this.material = standardMaterial;
          this.mesh.material = standardMaterial;
        }
      } else {
        // Card back - use static texture
        const backTexture = new Texture('/img/card-back/card_back_3.png', this.scene);
        const backMaterial = new StandardMaterial(
          `back-material-${this.config.card.id}`,
          this.scene
        );
        backMaterial.diffuseTexture = backTexture;
        backMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
        backMaterial.backFaceCulling = false;
        backMaterial.emissiveColor = new Color3(0.05, 0.05, 0.08);

        // Dispose old material and apply new one
        this.material.dispose();
        this.material = backMaterial;
        this.mesh.material = backMaterial;
      }
    } catch (error) {
      console.error(`Failed to initialize material for card ${this.config.card.id}:`, error);
    }
  }

  /**
   * Initialize the back material with card_back_3.png texture
   */
  private async initializeBackMaterial(): Promise<void> {
    try {
      // Load card back texture
      const backTexture = new Texture('/img/card-back/card_back_3.png', this.scene);

      // Apply maximum quality filtering for sharp rendering at angles
      backTexture.anisotropicFilteringLevel = 16;
      backTexture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);

      const backMaterial = new StandardMaterial(
        `back-material-${this.config.card.id}`,
        this.scene
      );
      backMaterial.diffuseTexture = backTexture;
      backMaterial.specularColor = new Color3(0.3, 0.3, 0.3);
      backMaterial.backFaceCulling = false; // Must be false since mesh is rotated 180°
      backMaterial.emissiveColor = new Color3(0.05, 0.05, 0.08);

      // Dispose old material and apply new one
      this.backMaterial.dispose();
      this.backMaterial = backMaterial;
      this.backMesh.material = backMaterial;
    } catch (error) {
      console.error(`Failed to initialize back material for card ${this.config.card.id}:`, error);
    }
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
  public async setRevealed(isRevealed: boolean): Promise<void> {
    this.config.isRevealed = isRevealed;

    // Re-initialize material with new revealed state
    await this.initializeMaterial();
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
    // Dispose front mesh and material
    this.material.dispose();
    this.mesh.dispose();

    // Dispose back mesh and material
    this.backMaterial.dispose();
    this.backMesh.dispose();
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
