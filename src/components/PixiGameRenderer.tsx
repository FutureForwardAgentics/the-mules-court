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
  _onCardClick: (cardId: string) => void,
  onDrawCard: () => void,
  onEndTurn: () => void,
  _cardSprites: Map<string, CardSprite>
) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Deck with click interaction
  const deckPlayer = gameState.players[gameState.currentPlayerIndex];
  const deckIsLocalPlayerTurn = deckPlayer.id === localPlayerId;
  const canDrawCard = gameState.phase === 'draw' && deckIsLocalPlayerTurn && gameState.deck.length > 0;

  const deckGraphics = new Graphics();
  deckGraphics.rect(0, 0, 120, 180);
  deckGraphics.fill({ color: canDrawCard ? 0x6b7280 : 0x4b5563 });
  deckGraphics.stroke({ color: canDrawCard ? 0xf87171 : 0x9ca3af, width: canDrawCard ? 3 : 2 });
  deckGraphics.position.set(centerX - 60, centerY - 200);

  if (canDrawCard) {
    deckGraphics.eventMode = 'static';
    deckGraphics.cursor = 'pointer';
    deckGraphics.on('pointerdown', () => {
      console.log('Deck clicked!');
      onDrawCard();
    });
  }

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
    playerBox.rect(-150, -80, 300, 160);
    playerBox.fill({ color: isCurrentPlayer ? 0x991b1b : 0x1e293b });
    playerBox.stroke({ color: isCurrentPlayer ? 0xef4444 : 0x475569, width: 2 });
    playerBox.position.set(x, y);
    scene.addChild(playerBox);

    // Player name
    const nameText = new Text({
      text: player.name,
      style: { fontSize: 16, fill: 0xffffff, fontWeight: 'bold' },
    });
    nameText.anchor.set(0.5);
    nameText.position.set(x, y - 60);
    scene.addChild(nameText);

    // Render player's cards
    const isLocalPlayer = player.id === localPlayerId;
    const cardY = y - 20;
    const cardSpacing = 70;
    const startX = x - (player.hand.length - 1) * (cardSpacing / 2);

    player.hand.forEach((card: any, cardIndex: number) => {
      const cardX = startX + cardIndex * cardSpacing;

      // Card background
      const cardGfx = new Graphics();
      cardGfx.roundRect(0, 0, 60, 90, 4);

      if (isLocalPlayer) {
        // Show actual card for local player
        const colors: Record<string, number> = {
          'from-slate-700 to-slate-900': 0x334155,
          'from-blue-800 to-blue-950': 0x1e40af,
          'from-indigo-800 to-indigo-950': 0x3730a3,
          'from-amber-800 to-amber-950': 0x92400e,
          'from-purple-800 to-purple-950': 0x6b21a8,
          'from-cyan-800 to-cyan-950': 0x155e75,
          'from-rose-800 to-rose-950': 0x9f1239,
          'from-red-800 to-red-950': 0x991b1b,
          'from-yellow-700 to-yellow-900': 0xa16207,
          'from-emerald-800 to-emerald-950': 0x065f46,
          'from-red-950 to-black': 0x450a0a,
        };
        cardGfx.fill({ color: colors[card.color] || 0x334155 });
        cardGfx.stroke({ color: 0x9ca3af, width: 2 });
      } else {
        // Card back for opponent
        cardGfx.fill({ color: 0x374151 });
        cardGfx.stroke({ color: 0x6b7280, width: 2 });
      }

      cardGfx.position.set(cardX - 30, cardY);

      // Make card clickable if it's player's turn and their card
      if (isCurrentPlayer && isLocalPlayer && gameState.phase === 'play') {
        cardGfx.eventMode = 'static';
        cardGfx.cursor = 'pointer';
        cardGfx.on('pointerover', () => {
          cardGfx.scale.set(1.1);
        });
        cardGfx.on('pointerout', () => {
          cardGfx.scale.set(1);
        });
        cardGfx.on('pointerdown', () => {
          console.log('Card clicked:', card.name);
          _onCardClick(card.id);
        });
      }

      scene.addChild(cardGfx);

      // Card value
      if (isLocalPlayer) {
        const valueText = new Text({
          text: card.value.toString(),
          style: { fontSize: 24, fill: 0xffffff, fontWeight: 'bold' },
        });
        valueText.anchor.set(0.5);
        valueText.position.set(cardX, cardY + 20);
        scene.addChild(valueText);

        // Card icon
        const iconText = new Text({
          text: card.icon,
          style: { fontSize: 20 },
        });
        iconText.anchor.set(0.5);
        iconText.position.set(cardX, cardY + 50);
        scene.addChild(iconText);
      } else {
        // Card back icon
        const backIcon = new Text({
          text: '👁️',
          style: { fontSize: 32 },
        });
        backIcon.anchor.set(0.5);
        backIcon.position.set(cardX, cardY + 45);
        backIcon.alpha = 0.5;
        scene.addChild(backIcon);
      }
    });
  });

  // Render current player indicator
  const statusPlayer = gameState.players[gameState.currentPlayerIndex];
  const phaseText = gameState.phase === 'draw' ? 'Draw a card' : gameState.phase === 'play' ? 'Play a card' : '';

  const statusStyle = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 'bold',
    fill: 0xffffff,
    align: 'center',
  });
  const statusText = new Text({
    text: `${statusPlayer.name}'s turn - ${phaseText}`,
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
  const buttonIsLocalPlayerTurn = statusPlayer.id === localPlayerId;
  if (gameState.phase === 'play' && buttonIsLocalPlayerTurn) {
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

