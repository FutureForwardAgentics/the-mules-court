import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Color4
} from '@babylonjs/core';
import type { BabylonCardRendererProps } from '../types/babylon';
import { BabylonCardMesh } from '../babylon/components/BabylonCardMesh';

/**
 * Convert card size to approximate pixel dimensions
 * (for calculating canvas size)
 */
function getPixelDimensions(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return { width: 96, height: 144 };
    case 'medium':
      return { width: 192, height: 288 };
    case 'large':
      return { width: 256, height: 384 };
  }
}

/**
 * Calculate world-space positions for cards based on layout
 */
function calculateCardPositions(
  cardCount: number,
  size: 'small' | 'medium' | 'large',
  layout: 'horizontal' | 'vertical' | 'stack',
  spacing: number
): Vector3[] {
  const positions: Vector3[] = [];

  // Card dimensions in world units
  const dimensions = {
    small: { width: 1.0, height: 1.5 },
    medium: { width: 2.0, height: 3.0 },
    large: { width: 2.67, height: 4.0 }
  }[size];

  // Convert pixel spacing to world units (approximate)
  const worldSpacing = spacing * 0.01;

  switch (layout) {
    case 'horizontal': {
      // Cards in a row
      const totalWidth =
        cardCount * dimensions.width + (cardCount - 1) * worldSpacing;
      const startX = -totalWidth / 2 + dimensions.width / 2;

      for (let i = 0; i < cardCount; i++) {
        const x = startX + i * (dimensions.width + worldSpacing);
        positions.push(new Vector3(x, 0, 0));
      }
      break;
    }

    case 'vertical': {
      // Cards in a column
      const totalHeight =
        cardCount * dimensions.height + (cardCount - 1) * worldSpacing;
      const startY = totalHeight / 2 - dimensions.height / 2;

      for (let i = 0; i < cardCount; i++) {
        const y = startY - i * (dimensions.height + worldSpacing);
        positions.push(new Vector3(0, y, 0));
      }
      break;
    }

    case 'stack': {
      // Cards stacked with slight offset
      const stackOffset = 0.02;
      for (let i = 0; i < cardCount; i++) {
        // Slight offset in X and Y, Z layering
        positions.push(new Vector3(i * stackOffset, i * stackOffset, i * -0.01));
      }
      break;
    }
  }

  return positions;
}

/**
 * BabylonCardRenderer3D
 *
 * Renders cards using 3D plane meshes instead of 2D GUI.
 * This version supports shader materials (Stage 3).
 *
 * Maintains the same interface as BabylonCardRenderer for drop-in replacement.
 */
export function BabylonCardRenderer3D({
  cards,
  size = 'medium',
  isRevealed = true,
  isInteractive = false,
  layout = 'horizontal',
  spacing = 8,
  onCardClick,
}: BabylonCardRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cardMeshesRef = useRef<BabylonCardMesh[]>([]);

  useEffect(() => {
    if (!canvasRef.current || cards.length === 0) return;

    const dim = getPixelDimensions(size);

    // Calculate canvas dimensions based on layout
    let width = 0;
    let height = 0;
    switch (layout) {
      case 'horizontal':
        width = cards.length * dim.width + (cards.length - 1) * spacing;
        height = dim.height;
        break;
      case 'vertical':
        width = dim.width;
        height = cards.length * dim.height + (cards.length - 1) * spacing;
        break;
      case 'stack':
        width = dim.width + (cards.length - 1) * 2;
        height = dim.height + (cards.length - 1) * 2;
        break;
    }

    if (width === 0 || height === 0) return;

    // Set canvas size
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Create engine and scene
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engineRef.current = engine;

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0); // Transparent background
    sceneRef.current = scene;

    // Create orthographic camera for 2D appearance
    const camera = new ArcRotateCamera(
      'camera',
      0, // Alpha (rotation around Y)
      0, // Beta (rotation around X) - looking straight down
      10, // Radius (distance from target)
      Vector3.Zero(), // Target
      scene
    );

    // Lock camera to prevent user interaction
    camera.inputs.clear();

    // Calculate orthographic size based on layout
    const orthoSize = layout === 'horizontal' ? height / 2 : width / 2;
    camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
    camera.orthoTop = orthoSize * 0.01;
    camera.orthoBottom = -orthoSize * 0.01;
    camera.orthoLeft = -(width / height) * (orthoSize * 0.01);
    camera.orthoRight = (width / height) * (orthoSize * 0.01);

    // Add ambient lighting
    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    // Calculate card positions
    const positions = calculateCardPositions(cards.length, size, layout, spacing);

    // Create card meshes
    const cardMeshes: BabylonCardMesh[] = [];
    cards.forEach((card, index) => {
      const cardMesh = new BabylonCardMesh(scene, {
        card,
        size,
        isRevealed,
        isInteractive,
        position: positions[index],
        onCardClick,
      });
      cardMeshes.push(cardMesh);
    });
    cardMeshesRef.current = cardMeshes;

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cardMeshes.forEach((cm) => cm.dispose());
      cardMeshesRef.current = [];
      scene.dispose();
      engine.dispose();
    };
  }, [cards, size, isRevealed, isInteractive, layout, spacing, onCardClick]);

  const dim = getPixelDimensions(size);
  let width = 0;
  let height = 0;

  if (cards.length > 0) {
    switch (layout) {
      case 'horizontal':
        width = cards.length * dim.width + (cards.length - 1) * spacing;
        height = dim.height;
        break;
      case 'vertical':
        width = dim.width;
        height = cards.length * dim.height + (cards.length - 1) * spacing;
        break;
      case 'stack':
        width = dim.width + (cards.length - 1) * 2;
        height = dim.height + (cards.length - 1) * 2;
        break;
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          pointerEvents: isInteractive ? 'auto' : 'none',
        }}
      />
    </div>
  );
}
