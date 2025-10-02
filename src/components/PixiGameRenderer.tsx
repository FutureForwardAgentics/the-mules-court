import { useEffect, useRef } from 'react';
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
  const { canvasRef, app, isReady } = usePixiApp({
    resizeTo: window,
    backgroundColor: 0x0f0a1e,
  });

  const sceneRef = useRef<Container | null>(null);
  const cardSpritesRef = useRef<Map<string, CardSprite>>(new Map());

  // Initialize scene
  useEffect(() => {
    if (!app || !isReady) return;

    const scene = new Container();
    app.stage.addChild(scene);
    sceneRef.current = scene;

    return () => {
      scene.destroy({ children: true });
    };
  }, [app, isReady]);

  // Update scene based on game state
  useEffect(() => {
    if (!app || !sceneRef.current) return;

    const scene = sceneRef.current;
    scene.removeChildren();
    cardSpritesRef.current.clear();

    renderGameScene(scene, gameState, localPlayerId, onCardClick, onDrawCard, onEndTurn, cardSpritesRef.current);
  }, [app, gameState, localPlayerId, onCardClick, onDrawCard, onEndTurn]);

  return (
    <div
      ref={canvasRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
      }}
    />
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

  // Render deck in center
  renderDeck(scene, gameState, centerX, centerY - 100, onDrawCard, localPlayerId);

  // Render players in a circle around the center
  const playerCount = gameState.players.length;
  const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;

  gameState.players.forEach((player, index) => {
    const angle = (index / playerCount) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    const isLocalPlayer = player.id === localPlayerId;
    const isCurrentPlayer = index === gameState.currentPlayerIndex;

    renderPlayerArea(
      scene,
      player,
      x,
      y,
      isLocalPlayer,
      isCurrentPlayer,
      gameState.phase,
      onCardClick,
      cardSprites
    );
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
