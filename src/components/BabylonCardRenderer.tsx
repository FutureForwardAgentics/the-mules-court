import { useEffect, useRef } from 'react';
import { Engine, Scene, FreeCamera, Vector3, Camera, Color4 } from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import type { BabylonCardRendererProps } from '../types/babylon';
import type { Card } from '../types/game';
import { parseTailwindGradient } from '../babylon/utils/colors';

/**
 * Get pixel dimensions for each card size
 */
function getDimensions(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return { width: 96, height: 144, cornerRadius: 8, padding: 8 };
    case 'medium':
      return { width: 192, height: 288, cornerRadius: 12, padding: 12 };
    case 'large':
      return { width: 256, height: 384, cornerRadius: 16, padding: 16 };
  }
}

/**
 * Create a BabylonJS GUI card
 */
function createCardGUI(
  card: Card,
  size: 'small' | 'medium' | 'large',
  isRevealed: boolean,
  isInteractive: boolean,
  onCardClick?: (cardId: string) => void
): GUI.Rectangle {
  const dim = getDimensions(size);
  const { startColor, endColor } = parseTailwindGradient(card.color);

  // Create card container
  const cardRect = new GUI.Rectangle();
  cardRect.width = `${dim.width}px`;
  cardRect.height = `${dim.height}px`;
  cardRect.cornerRadius = dim.cornerRadius;
  cardRect.thickness = 2;
  cardRect.color = 'white';
  cardRect.alpha = 0.3;

  if (isRevealed) {
    // Create gradient background using multiple rectangles
    const bgRect = new GUI.Rectangle();
    bgRect.width = 1;
    bgRect.height = 1;
    bgRect.background = startColor;
    bgRect.cornerRadius = dim.cornerRadius;
    cardRect.addControl(bgRect);

    const gradientRect = new GUI.Rectangle();
    gradientRect.width = 1;
    gradientRect.height = 1;
    gradientRect.background = endColor;
    gradientRect.alpha = 0.6;
    gradientRect.cornerRadius = dim.cornerRadius;
    cardRect.addControl(gradientRect);

    // Icon (top-left)
    const iconSize = size === 'small' ? 20 : size === 'medium' ? 32 : 48;
    const iconText = new GUI.TextBlock();
    iconText.text = card.icon;
    iconText.fontSize = iconSize;
    iconText.color = 'white';
    iconText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    iconText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    iconText.left = dim.padding;
    iconText.top = dim.padding;
    cardRect.addControl(iconText);

    // Value (top-right)
    const valueSize = size === 'small' ? 20 : size === 'medium' ? 32 : 40;
    const valueText = new GUI.TextBlock();
    valueText.text = card.value.toString();
    valueText.fontSize = valueSize;
    valueText.color = 'white';
    valueText.fontWeight = 'bold';
    valueText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    valueText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    valueText.left = -dim.padding;
    valueText.top = dim.padding;
    cardRect.addControl(valueText);

    // Name
    const nameSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
    const nameText = new GUI.TextBlock();
    nameText.text = card.name;
    nameText.fontSize = nameSize;
    nameText.color = 'white';
    nameText.fontWeight = 'bold';
    nameText.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    nameText.textVerticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    nameText.left = dim.padding;
    nameText.top = dim.padding + iconSize + 4;
    nameText.textWrapping = true;
    cardRect.addControl(nameText);
  } else {
    // Card back
    const bgRect = new GUI.Rectangle();
    bgRect.width = 1;
    bgRect.height = 1;
    bgRect.background = '#374151';
    bgRect.cornerRadius = dim.cornerRadius;
    cardRect.addControl(bgRect);

    const eyeSize = size === 'small' ? 32 : size === 'medium' ? 48 : 64;
    const eyeText = new GUI.TextBlock();
    eyeText.text = '👁️';
    eyeText.fontSize = eyeSize;
    eyeText.alpha = 0.5;
    cardRect.addControl(eyeText);
  }

  // Interactivity
  if (isInteractive && onCardClick) {
    cardRect.isPointerBlocker = true;
    cardRect.hoverCursor = 'pointer';
    cardRect.onPointerDownObservable.add(() => {
      onCardClick(card.id);
    });
    cardRect.onPointerEnterObservable.add(() => {
      cardRect.scaleX = 1.05;
      cardRect.scaleY = 1.05;
    });
    cardRect.onPointerOutObservable.add(() => {
      cardRect.scaleX = 1;
      cardRect.scaleY = 1;
    });
  }

  return cardRect;
}

/**
 * React component that renders cards using BabylonJS GUI
 */
export function BabylonCardRenderer({
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

  useEffect(() => {
    if (!canvasRef.current || cards.length === 0) return;

    const dim = getDimensions(size);

    // Calculate canvas dimensions
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

    // Create engine and scene
    const engine = new Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    // Create camera (not actually used for GUI but required)
    const camera = new FreeCamera('camera', new Vector3(0, 0, -10), scene);
    camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

    // Create fullscreen UI
    const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

    // Create and position cards
    cards.forEach((card, index) => {
      const cardGUI = createCardGUI(card, size, isRevealed, isInteractive, onCardClick);

      // Position based on layout
      switch (layout) {
        case 'horizontal':
          cardGUI.left = index * (dim.width + spacing) - width / 2 + dim.width / 2;
          cardGUI.top = 0;
          break;
        case 'vertical':
          cardGUI.left = 0;
          cardGUI.top = index * (dim.height + spacing) - height / 2 + dim.height / 2;
          break;
        case 'stack':
          cardGUI.left = index * 2 - width / 2 + dim.width / 2;
          cardGUI.top = index * 2 - height / 2 + dim.height / 2;
          break;
      }

      advancedTexture.addControl(cardGUI);
    });

    // Set canvas size
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Store reference
    engineRef.current = engine;

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Cleanup
    return () => {
      engine.dispose();
    };
  }, [cards, size, isRevealed, isInteractive, layout, spacing, onCardClick]);

  const dim = getDimensions(size);
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
      {/* Invisible test automation overlays */}
      {isInteractive && onCardClick && cards.map((card, index) => (
        <button
          key={card.id}
          data-testid={`card-${card.id}`}
          onClick={() => onCardClick(card.id)}
          style={{
            position: 'absolute',
            left: layout === 'horizontal' ? `${index * (dim.width + spacing)}px` : 0,
            top: layout === 'vertical' ? `${index * (dim.height + spacing)}px` : 0,
            width: `${dim.width}px`,
            height: `${dim.height}px`,
            opacity: 0,
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: 0,
          }}
          aria-label={`Play ${card.name}`}
        />
      ))}
    </div>
  );
}
