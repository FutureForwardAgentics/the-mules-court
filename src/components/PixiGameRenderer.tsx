import { useEffect, useMemo, useRef } from 'react';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameState } from '../types/game';
import { usePixiApp } from '../hooks/usePixiApp';
import { CardSprite } from '../pixi/CardSprite';

interface PixiGameRendererProps {
  gameState: GameState;
  localPlayerId: string;
  onCardClick: (cardId: string) => void;
  onDrawCard: () => void;
  onEndTurn: () => void;
}

export function PixiGameRenderer({
  gameState,
  localPlayerId,
  onCardClick,
  onDrawCard,
  onEndTurn,
}: PixiGameRendererProps) {
  // Memoize options to prevent unnecessary re-initialization
  const pixiOptions = useMemo(() => ({
    resizeTo: window,
    backgroundColor: 0x0f0a1e,
  }), []);

  const { canvasRef, app, isReady } = usePixiApp(pixiOptions);

  const sceneRef = useRef<Container | null>(null);
  const cardSpritesRef = useRef<Map<string, CardSprite>>(new Map());

  // Initialize scene
  useEffect(() => {
    if (!app || !isReady) {
      console.log('Waiting for app to be ready...', { app: !!app, isReady });
      return;
    }

    console.log('Initializing scene...');
    const scene = new Container();
    app.stage.addChild(scene);
    sceneRef.current = scene;
    console.log('Scene initialized and added to stage');

    return () => {
      console.log('Destroying scene...');
      scene.destroy({ children: true });
    };
  }, [app, isReady]);

  // Update scene based on game state
  useEffect(() => {
    if (!app || !sceneRef.current) {
      console.log('Waiting for scene...', { app: !!app, scene: !!sceneRef.current });
      return;
    }

    console.log('Rendering game scene...', { phase: gameState.phase, players: gameState.players.length });
    const scene = sceneRef.current;
    scene.removeChildren();
    cardSpritesRef.current.clear();

    renderGameScene(scene, gameState, localPlayerId, onCardClick, onDrawCard, onEndTurn, cardSpritesRef.current);
    console.log('Game scene rendered');
  }, [app, gameState, localPlayerId, onCardClick, onDrawCard, onEndTurn]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        overflow: 'hidden',
        backgroundColor: '#0f0a1e',
        border: '5px solid lime', // DEBUG: visible border
      }}
    >
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: 'red',
            padding: '20px',
            zIndex: 9999,
          }}
        >
          Loading game...
        </div>
      )}
      {/* DEBUG: Always visible element */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: 'yellow',
          fontSize: '16px',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '10px',
          zIndex: 10000,
          border: '2px solid yellow',
        }}
      >
        PixiJS: {isReady ? 'READY' : 'LOADING'} | Players: {gameState.players.length} | Phase: {gameState.phase}
      </div>
    </div>
  );
}

function renderGameScene(
  scene: Container,
  gameState: GameState,
  localPlayerId: string,
  onCardClick: (cardId: string) => void,
  onDrawCard: () => void,
  onEndTurn: () => void,
  cardSprites: Map<string, CardSprite>
) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Simple test rendering - deck
  const deckGraphics = new Graphics();
  deckGraphics.rect(0, 0, 120, 180);
  deckGraphics.fill({ color: 0x4b5563 });
  deckGraphics.stroke({ color: 0x9ca3af, width: 2 });
  deckGraphics.position.set(centerX - 60, centerY - 200);
  scene.addChild(deckGraphics);

  const deckText = new Text({
    text: `Deck: ${gameState.deck.length}`,
    style: { fontSize: 20, fill: 0xffffff },
  });
  deckText.anchor.set(0.5);
  deckText.position.set(centerX, centerY - 90);
  scene.addChild(deckText);

  // Render players as simple boxes
  const playerCount = gameState.players.length;
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;

  gameState.players.forEach((player, index) => {
    const angle = (index / playerCount) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const isCurrentPlayer = index === gameState.currentPlayerIndex;

    // Simple player box
    const playerBox = new Graphics();
    playerBox.rect(-100, -50, 200, 100);
    playerBox.fill({ color: isCurrentPlayer ? 0x991b1b : 0x1e293b });
    playerBox.stroke({ color: isCurrentPlayer ? 0xef4444 : 0x475569, width: 2 });
    playerBox.position.set(x, y);
    scene.addChild(playerBox);

    // Player name
    const nameText = new Text({
      text: player.name,
      style: { fontSize: 16, fill: 0xffffff },
    });
    nameText.anchor.set(0.5);
    nameText.position.set(x, y - 20);
    scene.addChild(nameText);

    // Card count
    const cardText = new Text({
      text: `Cards: ${player.hand.length}`,
      style: { fontSize: 14, fill: 0xcccccc },
    });
    cardText.anchor.set(0.5);
    cardText.position.set(x, y + 10);
    scene.addChild(cardText);
  });

  // Render current player indicator
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const phaseText = gameState.phase === 'draw' ? 'Draw a card' : gameState.phase === 'play' ? 'Play a card' : '';

  const statusStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0xffffff,
    align: 'center',
  });
  const statusText = new Text({
    text: `${currentPlayer.name}'s turn - ${phaseText}`,
    style: statusStyle,
  });
  statusText.anchor.set(0.5, 0);
  statusText.position.set(centerX, 40);
  scene.addChild(statusText);

  // Render game info
  const infoStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 0xcccccc,
  });
  const infoText = new Text({
    text: `Cards in deck: ${gameState.deck.length} | Tokens to win: ${gameState.tokensToWin}`,
    style: infoStyle,
  });
  infoText.anchor.set(0.5, 0);
  infoText.position.set(centerX, 80);
  scene.addChild(infoText);

  // Render end turn button if it's play phase and local player's turn
  const isLocalPlayerTurn = currentPlayer.id === localPlayerId;
  if (gameState.phase === 'play' && isLocalPlayerTurn) {
    const buttonContainer = new Container();
    buttonContainer.position.set(centerX, centerY + 150);

    const buttonBg = new Graphics();
    buttonBg.roundRect(-60, -20, 120, 40, 8);
    buttonBg.fill({ color: 0x7c3aed });
    buttonBg.stroke({ color: 0xa78bfa, width: 2 });
    buttonBg.eventMode = 'static';
    buttonBg.cursor = 'pointer';
    buttonBg.on('pointerdown', () => {
      onEndTurn();
    });
    buttonContainer.addChild(buttonBg);

    const buttonStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fontWeight: 'bold',
      fill: 0xffffff,
    });
    const buttonText = new Text({ text: 'End Turn', style: buttonStyle });
    buttonText.anchor.set(0.5);
    buttonContainer.addChild(buttonText);

    scene.addChild(buttonContainer);
  }
}

function renderDeck(
  scene: Container,
  gameState: GameState,
  x: number,
  y: number,
  onDrawCard: () => void,
  localPlayerId: string
) {
  const deckContainer = new Container();
  deckContainer.position.set(x, y);

  // Deck background
  const deckGraphics = new Graphics();
  deckGraphics.roundRect(-66, -96, 132, 192, 8);
  deckGraphics.fill({ color: 0x374151 });
  deckGraphics.stroke({ color: 0x4b5563, width: 2 });
  deckContainer.addChild(deckGraphics);

  // Eye icon
  const iconStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 64,
    fill: 0xffffff,
  });
  const icon = new Text({ text: '👁️', style: iconStyle });
  icon.anchor.set(0.5);
  icon.alpha = 0.5;
  deckContainer.addChild(icon);

  // Deck count
  const countStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 16,
    fill: 0xffffff,
    fontWeight: 'bold',
  });
  const countText = new Text({ text: gameState.deck.length.toString(), style: countStyle });
  countText.anchor.set(0.5, 0);
  countText.position.set(0, 100);
  deckContainer.addChild(countText);

  // Make deck clickable if it's draw phase and local player's turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isLocalPlayerTurn = currentPlayer.id === localPlayerId;

  if (gameState.phase === 'draw' && isLocalPlayerTurn && gameState.deck.length > 0) {
    deckGraphics.eventMode = 'static';
    deckGraphics.cursor = 'pointer';
    deckGraphics.on('pointerdown', () => {
      onDrawCard();
    });

    // Highlight effect
    deckGraphics.clear();
    deckGraphics.roundRect(-66, -96, 132, 192, 8);
    deckGraphics.fill({ color: 0x374151 });
    deckGraphics.stroke({ color: 0xf87171, width: 3 });
  }

  scene.addChild(deckContainer);
}

function renderPlayerArea(
  scene: Container,
  player: any,
  x: number,
  y: number,
  isLocalPlayer: boolean,
  isCurrentPlayer: boolean,
  phase: string,
  onCardClick: (cardId: string) => void,
  cardSprites: Map<string, CardSprite>
) {
  const playerContainer = new Container();
  playerContainer.position.set(x, y);

  // Player background
  const bgWidth = 280;
  const bgHeight = 200;
  const bg = new Graphics();
  bg.roundRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 8);
  bg.fill({ color: isCurrentPlayer ? 0x450a0a : 0x1a1a2e, alpha: 0.8 });
  bg.stroke({ color: isCurrentPlayer ? 0xef4444 : 0x4b5563, width: isCurrentPlayer ? 3 : 2 });
  playerContainer.addChild(bg);

  // Player name
  const nameStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 18,
    fontWeight: 'bold',
    fill: 0xffffff,
  });
  const nameText = new Text({ text: player.name, style: nameStyle });
  nameText.anchor.set(0.5, 0);
  nameText.position.set(0, -bgHeight / 2 + 10);
  playerContainer.addChild(nameText);

  // Status icons
  let iconX = 60;
  if (isCurrentPlayer) {
    const currentIcon = new Text({ text: '⚡', style: { fontSize: 16 } });
    currentIcon.position.set(iconX, -bgHeight / 2 + 10);
    playerContainer.addChild(currentIcon);
    iconX += 20;
  }
  if (player.isProtected) {
    const protectedIcon = new Text({ text: '🛡️', style: { fontSize: 16 } });
    protectedIcon.position.set(iconX, -bgHeight / 2 + 10);
    playerContainer.addChild(protectedIcon);
    iconX += 20;
  }
  if (player.isEliminated) {
    const eliminatedIcon = new Text({ text: '💀', style: { fontSize: 16 } });
    eliminatedIcon.position.set(iconX, -bgHeight / 2 + 10);
    playerContainer.addChild(eliminatedIcon);
    playerContainer.alpha = 0.5;
  }

  // Devotion tokens
  const tokenY = -bgHeight / 2 + 40;
  for (let i = 0; i < player.devotionTokens; i++) {
    const token = new Graphics();
    token.circle(0, 0, 12);
    token.fill({ color: 0x991b1b });
    token.stroke({ color: 0xef4444, width: 1 });
    token.position.set(-100 + i * 28, tokenY);
    playerContainer.addChild(token);

    const tokenIcon = new Text({ text: '👁️', style: { fontSize: 12 } });
    tokenIcon.anchor.set(0.5);
    tokenIcon.position.set(-100 + i * 28, tokenY);
    playerContainer.addChild(tokenIcon);
  }

  // Hand cards
  const cardY = -bgHeight / 2 + 80;
  player.hand.forEach((card: any, index: number) => {
    const cardSprite = new CardSprite({
      card,
      size: 'small',
      isRevealed: isLocalPlayer,
      isPlayable: isCurrentPlayer && isLocalPlayer && phase === 'play',
    });

    const cardX = -50 + index * 60;
    cardSprite.position.set(cardX, cardY);

    if (isCurrentPlayer && isLocalPlayer && phase === 'play') {
      cardSprite.eventMode = 'static';
      cardSprite.on('pointerdown', () => {
        onCardClick(card.id);
      });
    }

    playerContainer.addChild(cardSprite);
    cardSprites.set(card.id, cardSprite);
  });

  // Discard pile
  if (player.discardPile.length > 0) {
    const discardY = cardY + 80;
    const discardStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x9ca3af,
    });
    const discardLabel = new Text({ text: 'Played:', style: discardStyle });
    discardLabel.anchor.set(0.5, 0);
    discardLabel.position.set(0, discardY);
    playerContainer.addChild(discardLabel);

    const iconsText = player.discardPile.map((card: any) => card.icon).join(' ');
    const iconsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 20,
    });
    const icons = new Text({ text: iconsText, style: iconsStyle });
    icons.anchor.set(0.5, 0);
    icons.position.set(0, discardY + 20);
    icons.alpha = 0.7;
    playerContainer.addChild(icons);
  }

  scene.addChild(playerContainer);
}
