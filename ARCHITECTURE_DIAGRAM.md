# PixiJS Card Graphics - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE MULE'S COURT                                │
│                    React + PixiJS v8 Architecture                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
┌──────────────────────────────────────────────────────────────────────────┐
│ App.tsx (React State Container)                                         │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ PixiEffectsProvider (Context)                                      │ │
│ │ - Manages global PixiEffects Application instance                 │ │
│ │ - Provides playCardEffect(), eliminationEffect(), etc.             │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ PixiEffects.tsx (Fixed Overlay Canvas)                            │ │
│ │ - Position: fixed, top: 0, left: 0                                │ │
│ │ - Size: 100vw x 100vh                                             │ │
│ │ - Z-index: 10                                                     │ │
│ │ - Pointer events: none (pass-through)                             │ │
│ │ - Renders: Particles, rings, global effects                       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ GameBoard.tsx (React Layout Container)                            │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ PlayerArea (Player 1)                                        │ │ │
│ │ │ ┌──────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ PixiCardRenderer (Hand Canvas)                           │ │ │ │
│ │ │ │ - Cards: player.hand                                     │ │ │ │
│ │ │ │ - Size: small (96x144px per card)                       │ │ │ │
│ │ │ │ - Interactive: true (if current player)                 │ │ │ │
│ │ │ │ - Canvas: ~300x150px (3 cards + spacing)               │ │ │ │
│ │ │ └──────────────────────────────────────────────────────────┘ │ │ │
│ │ │ ┌──────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ PixiCardRenderer (Discard Canvas)                        │ │ │ │
│ │ │ │ - Cards: player.discardPile                             │ │ │ │
│ │ │ │ - Size: small                                           │ │ │ │
│ │ │ │ - Interactive: false                                    │ │ │ │
│ │ │ └──────────────────────────────────────────────────────────┘ │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │                                                                  │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ PlayerArea (Player 2)                                        │ │ │
│ │ │ [Same structure as Player 1]                                 │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ │                                                                  │ │
│ │ ┌──────────────────────────────────────────────────────────────┐ │ │
│ │ │ CenterArea (Deck & Actions)                                 │ │ │
│ │ │ ┌──────────────────────────────────────────────────────────┐ │ │ │
│ │ │ │ PixiCardRenderer (Deck Canvas)                           │ │ │ │
│ │ │ │ - Cards: [gameState.deck[0]] (top card only)            │ │ │ │
│ │ │ │ - Size: medium (192x288px)                              │ │ │ │
│ │ │ │ - Revealed: false (always show card back)               │ │ │ │
│ │ │ │ - Interactive: false                                    │ │ │ │
│ │ │ └──────────────────────────────────────────────────────────┘ │ │ │
│ │ └──────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Canvas Layering (Z-Index)

```
┌─────────────────────────────────────────────────────────────────┐
│ Z-INDEX: 10 (TOP LAYER)                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PixiEffects Canvas (Fixed Overlay)                          │ │
│ │ - Full screen: 100vw x 100vh                                │ │
│ │ - Transparent background (backgroundAlpha: 0)               │ │
│ │ - Pointer events: none (clicks pass through)                │ │
│ │ - Renders: Particles, elimination rings, protection shields │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Z-INDEX: 1 (CARD LAYER)                                         │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│ │ Player 1  │  │ Player 2  │  │ Player 3  │  │ Player 4  │    │
│ │ Hand      │  │ Hand      │  │ Hand      │  │ Hand      │    │
│ │ Canvas    │  │ Canvas    │  │ Canvas    │  │ Canvas    │    │
│ └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                                                                 │
│ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│ │ Player 1  │  │ Player 2  │  │ Player 3  │  │ Player 4  │    │
│ │ Discard   │  │ Discard   │  │ Discard   │  │ Discard   │    │
│ │ Canvas    │  │ Canvas    │  │ Canvas    │  │ Canvas    │    │
│ └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                                                                 │
│ ┌───────────┐                                                   │
│ │ Deck      │                                                   │
│ │ Canvas    │                                                   │
│ └───────────┘                                                   │
│ - Pointer events: auto (captures clicks)                        │
│ - Interactive cards respond to hover/click                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Z-INDEX: 0 (BACKGROUND LAYER)                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ React DOM (HTML/CSS)                                        │ │
│ │ - Background gradients                                      │ │
│ │ - Buttons (Draw Card, End Turn)                             │ │
│ │ - Text labels (player names, status)                        │ │
│ │ - Modals (round end, game end)                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│ REACT STATE (Source of Truth)                                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ useGameState Hook                                              │ │
│ │ - players: Player[]                                            │ │
│ │ - deck: Card[]                                                 │ │
│ │ - phase: 'draw' | 'play' | 'round-end' | 'game-end'           │ │
│ │ - currentPlayerIndex: number                                   │ │
│ │                                                                │ │
│ │ Actions:                                                       │ │
│ │ - drawCard()                                                   │ │
│ │ - playCard(cardId)                                             │ │
│ │ - endTurn()                                                    │ │
│ │ - startNewRound()                                              │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ Props (one-way data flow)
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ REACT COMPONENTS (Presentational)                                  │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ GameBoard                                                      │ │
│ │ - gameState (prop)                                             │ │
│ │ - onCardClick (callback)                                       │ │
│ │ - onDrawCard (callback)                                        │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              │ Props                               │
│                              ↓                                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ PlayerArea                                                     │ │
│ │ - player (prop)                                                │ │
│ │ - isCurrentPlayer (prop)                                       │ │
│ │ - onCardClick (callback)                                       │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              │ Props                               │
│                              ↓                                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ PixiCardRenderer (React Wrapper)                               │ │
│ │ - cards: Card[] (prop)                                         │ │
│ │ - size: 'small' | 'medium' | 'large' (prop)                    │ │
│ │ - isRevealed: boolean (prop)                                   │ │
│ │ - isInteractive: boolean (prop)                                │ │
│ │ - onCardClick: (cardId) => void (callback)                     │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ useEffect (sync React → PixiJS)
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ PIXI.JS RENDERING (Visual Layer)                                   │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ CardRenderer.ts                                                │ │
│ │ - createCardSprite(card, size): Container                      │ │
│ │ - updateCardSprite(sprite, card): void                         │ │
│ │ - makeCardInteractive(sprite, onClick): void                   │ │
│ └────────────────────────────────────────────────────────────────┘ │
│                              │                                     │
│                              │ Creates                             │
│                              ↓                                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ PixiJS Stage                                                   │ │
│ │ ┌──────────────────────────────────────────────────────────┐  │ │
│ │ │ Container (Hand)                                         │  │ │
│ │ │ ┌──────────┐  ┌──────────┐  ┌──────────┐                │  │ │
│ │ │ │ Card 1   │  │ Card 2   │  │ Card 3   │                │  │ │
│ │ │ │ Sprite   │  │ Sprite   │  │ Sprite   │                │  │ │
│ │ │ │ (Graphics│  │ (Graphics│  │ (Graphics│                │  │ │
│ │ │ │ or       │  │ or       │  │ or       │                │  │ │
│ │ │ │ Texture) │  │ Texture) │  │ Texture) │                │  │ │
│ │ │ └──────────┘  └──────────┘  └──────────┘                │  │ │
│ │ └──────────────────────────────────────────────────────────┘  │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ User Interaction (click/hover)
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ PIXI.JS EVENTS                                                     │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ EventSystem (PixiJS v8)                                        │ │
│ │ sprite.on('pointerdown', () => onCardClick(card.id))           │ │
│ │ sprite.on('pointerover', () => sprite.scale.set(1.05))         │ │
│ │ sprite.on('pointerout', () => sprite.scale.set(1.0))           │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ Callback (events flow up)
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ REACT STATE UPDATE                                                 │
│ ┌────────────────────────────────────────────────────────────────┐ │
│ │ onCardClick(cardId)                                            │ │
│ │   ↓                                                            │ │
│ │ gameState.playCard(cardId)                                     │ │
│ │   ↓                                                            │ │
│ │ React state updates                                            │ │
│ │   ↓                                                            │ │
│ │ Re-render triggered                                            │ │
│ │   ↓                                                            │ │
│ │ useEffect detects card changes                                 │ │
│ │   ↓                                                            │ │
│ │ PixiJS sprites updated (diff and patch)                        │ │
│ └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

---

## PixiCardRenderer Internal Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ PixiCardRenderer.tsx (React Component)                             │
│                                                                     │
│ Props:                                                              │
│ - cards: Card[]                                                     │
│ - size: 'small' | 'medium' | 'large'                                │
│ - isRevealed: boolean                                               │
│ - isInteractive: boolean                                            │
│ - onCardClick: (cardId: string) => void                             │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ useEffect(() => { ... }, []) - Initialize PixiJS                ││
│ │ ┌─────────────────────────────────────────────────────────────┐ ││
│ │ │ const app = new Application()                               │ ││
│ │ │ await app.init({ width, height, backgroundAlpha: 0 })       │ ││
│ │ │ containerRef.current.appendChild(app.canvas)                │ ││
│ │ │ appRef.current = app                                        │ ││
│ │ │                                                             │ ││
│ │ │ return () => app.destroy() // Cleanup                      │ ││
│ │ └─────────────────────────────────────────────────────────────┘ ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐│
│ │ useEffect(() => { ... }, [cards, size, isInteractive])          ││
│ │                                                                  ││
│ │ // DIFF: Determine which sprites to add/remove/update          ││
│ │ const newCardIds = new Set(cards.map(c => c.id))               ││
│ │ const sprites = spritesRef.current                             ││
│ │                                                                  ││
│ │ // REMOVE: Sprites no longer in cards array                    ││
│ │ for (const [id, sprite] of sprites) {                          ││
│ │   if (!newCardIds.has(id)) {                                   ││
│ │     app.stage.removeChild(sprite)                              ││
│ │     sprite.destroy()                                           ││
│ │     sprites.delete(id)                                         ││
│ │   }                                                             ││
│ │ }                                                               ││
│ │                                                                  ││
│ │ // ADD/UPDATE: Sprites in cards array                          ││
│ │ cards.forEach((card, index) => {                               ││
│ │   let sprite = sprites.get(card.id)                            ││
│ │                                                                  ││
│ │   if (!sprite) {                                                ││
│ │     // NEW CARD: Create sprite                                 ││
│ │     sprite = createCardSprite(card, size)                      ││
│ │     sprites.set(card.id, sprite)                               ││
│ │     app.stage.addChild(sprite)                                 ││
│ │   }                                                             ││
│ │                                                                  ││
│ │   // UPDATE: Position and properties                           ││
│ │   sprite.x = index * (cardWidth + spacing)                     ││
│ │   sprite.y = 0                                                 ││
│ │                                                                  ││
│ │   // INTERACTIVITY: Enable/disable events                      ││
│ │   if (isInteractive) {                                          ││
│ │     makeCardInteractive(sprite, card.id, onCardClick)          ││
│ │   } else {                                                      ││
│ │     sprite.eventMode = 'none'                                  ││
│ │   }                                                             ││
│ │ })                                                              ││
│ └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│ return <div ref={containerRef} />                                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Card Sprite Structure (PixiJS)

```
Container (Card Root)
├── Graphics (Background)
│   ├── Rectangle (512x768px or scaled)
│   ├── Gradient Fill (from card.color)
│   └── Rounded Corners (radius: 16px)
│
├── Graphics (Border)
│   └── Stroke (2px, color: #CCCCCC)
│
├── Graphics (Decorative Corners)
│   ├── Top-left corner (L-shape)
│   └── Bottom-right corner (L-shape)
│
├── Text (Card Name)
│   ├── Position: (16, 112)
│   ├── Font: Bold, 32px
│   └── Color: White
│
├── Text (Card Value)
│   ├── Position: (448, 16)
│   ├── Font: Bold, 64px
│   └── Color: White
│
├── Text (Icon)
│   ├── Position: (16, 16)
│   ├── Font: 80px (emoji)
│   └── Color: White
│
├── Text (Description)
│   ├── Position: (16, 160)
│   ├── Font: Italic, 14px
│   └── Color: #CCCCCC
│
├── Graphics (Ability Box Background)
│   ├── Position: (16, 544)
│   ├── Rectangle (480x144px)
│   └── Fill: #000000 at 60% opacity
│
├── Text (Ability Label)
│   ├── Position: (32, 560)
│   ├── Font: 12px uppercase
│   └── Color: #AAAAAA
│
├── Text (Ability Text)
│   ├── Position: (32, 584)
│   ├── Font: 14px
│   └── Color: White
│
└── Text (Quote)
    ├── Position: (16, 704)
    ├── Font: Italic, 12px
    └── Color: #CCCCCC

Properties:
- eventMode: 'static' (if interactive)
- cursor: 'pointer' (if interactive)
- scale: { x: scaleFactor, y: scaleFactor }
- position: { x: index * (width + spacing), y: 0 }
```

---

## Animation Flow

```
┌────────────────────────────────────────────────────────────────────┐
│ DEAL ANIMATION (Round Start)                                       │
│                                                                     │
│ 1. React: startNewRound() called                                   │
│    ↓                                                                │
│ 2. Game state: players receive initial cards                       │
│    ↓                                                                │
│ 3. PixiCardRenderer: useEffect detects new cards                   │
│    ↓                                                                │
│ 4. CardRenderer: createCardSprite() called for each card           │
│    ↓                                                                │
│ 5. CardAnimations: animateDeal(sprite, from: deckPos, to: handPos) │
│    ┌────────────────────────────────────────────────────────────┐ │
│    │ sprite.x = deckX, sprite.y = deckY, sprite.alpha = 0       │ │
│    │ app.ticker.add(() => {                                     │ │
│    │   progress = (now - start) / duration                      │ │
│    │   sprite.x = lerp(deckX, handX, easeOut(progress))        │ │
│    │   sprite.y = lerp(deckY, handY, easeOut(progress))        │ │
│    │   sprite.alpha = progress                                  │ │
│    │ })                                                         │ │
│    └────────────────────────────────────────────────────────────┘ │
│    ↓                                                                │
│ 6. Animation completes, card sits in hand                          │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ PLAY ANIMATION (Card Played)                                       │
│                                                                     │
│ 1. User: Clicks card                                                │
│    ↓                                                                │
│ 2. PixiJS: sprite.on('pointerdown') fires                          │
│    ↓                                                                │
│ 3. React: onCardClick(cardId) called                                │
│    ↓                                                                │
│ 4. Game state: playCard(cardId) removes card from hand             │
│    ↓                                                                │
│ 5. PixiEffects: playCardEffect(x, y) triggers particles            │
│    ↓                                                                │
│ 6. PixiCardRenderer: useEffect detects card removed                │
│    ↓                                                                │
│ 7. CardAnimations: animatePlay(sprite, to: centerPos)              │
│    ┌────────────────────────────────────────────────────────────┐ │
│    │ app.ticker.add(() => {                                     │ │
│    │   progress = (now - start) / duration                      │ │
│    │   sprite.x = lerp(handX, centerX, easeIn(progress))       │ │
│    │   sprite.y = lerp(handY, centerY, easeIn(progress))       │ │
│    │   sprite.scale.set(1 + progress * 0.5) // Grow            │ │
│    │   sprite.alpha = 1 - progress // Fade out                 │ │
│    │ })                                                         │ │
│    └────────────────────────────────────────────────────────────┘ │
│    ↓                                                                │
│ 8. Animation completes, sprite.destroy() called                    │
│    ↓                                                                │
│ 9. Game state: Card added to discardPile                           │
│    ↓                                                                │
│ 10. PixiCardRenderer (discard): Creates new sprite in discard      │
└────────────────────────────────────────────────────────────────────┘
```

---

## State Synchronization Pattern

```
┌────────────────────────────────────────────────────────────────────┐
│ REACT STATE (Source of Truth)                                      │
│ player.hand = [                                                     │
│   { id: 'informant-0', type: 'informant', value: 1, ... },         │
│   { id: 'mule-0', type: 'mule', value: 8, ... }                    │
│ ]                                                                   │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ Props
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ PIXI CARD RENDERER                                                  │
│ useEffect(() => {                                                   │
│   const newCardIds = new Set(['informant-0', 'mule-0'])            │
│   const currentSprites = Map {                                     │
│     'informant-0' => SpriteA,                                      │
│     'han-pritcher-0' => SpriteB  // ← This card was removed!       │
│   }                                                                 │
│                                                                     │
│   // DIFF ALGORITHM:                                                │
│   // 1. Remove sprites not in newCardIds                            │
│   //    → Remove 'han-pritcher-0' sprite                            │
│   app.stage.removeChild(SpriteB)                                   │
│   SpriteB.destroy()                                                │
│   currentSprites.delete('han-pritcher-0')                          │
│                                                                     │
│   // 2. Add sprites in newCardIds but not in currentSprites        │
│   //    → Add 'mule-0' sprite                                      │
│   const muleSprite = createCardSprite(muleCard, 'small')           │
│   currentSprites.set('mule-0', muleSprite)                         │
│   app.stage.addChild(muleSprite)                                   │
│                                                                     │
│   // 3. Update existing sprites                                     │
│   //    → Update 'informant-0' position (index changed)            │
│   SpriteA.x = 0 * (96 + 8) // Index 0                              │
│   muleSprite.x = 1 * (96 + 8) // Index 1                           │
│ }, [cards])                                                         │
└────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization Strategy

```
┌────────────────────────────────────────────────────────────────────┐
│ OPTIMIZATION TECHNIQUES                                             │
│                                                                     │
│ 1. Texture Atlas (Phase 2)                                         │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ Single 2048x2048px texture contains all 17 card images   │   │
│    │ → Single GPU upload (faster than 17 individual uploads)  │   │
│    │ → Reduced draw calls                                     │   │
│    └──────────────────────────────────────────────────────────┘   │
│                                                                     │
│ 2. Multiple Small Canvases (Current)                               │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ Each canvas renders only its cards (~2-3 sprites)        │   │
│    │ → No need to redraw entire screen on card change         │   │
│    │ → Better batching (PixiJS optimizes per-canvas)          │   │
│    └──────────────────────────────────────────────────────────┘   │
│                                                                     │
│ 3. Sprite Diffing (useEffect)                                      │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ Only update sprites when cards actually change           │   │
│    │ → Stable card IDs prevent unnecessary recreation         │   │
│    │ → useMemo on card arrays prevents ref changes            │   │
│    └──────────────────────────────────────────────────────────┘   │
│                                                                     │
│ 4. Event Handling (PixiJS EventSystem)                             │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ Hover effects update sprites directly (no React state)   │   │
│    │ → No re-renders triggered on hover                       │   │
│    │ → Smooth 60fps hover animations                          │   │
│    └──────────────────────────────────────────────────────────┘   │
│                                                                     │
│ 5. Container Hierarchy                                             │
│    ┌──────────────────────────────────────────────────────────┐   │
│    │ Group sprites in Containers (hand, discard)              │   │
│    │ → PixiJS culls off-screen containers automatically       │   │
│    │ → Better transform batching                              │   │
│    └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## File Module Dependencies

```
src/
├── components/
│   ├── PixiCardRenderer.tsx
│   │   ├── Imports: pixi.js (Application)
│   │   ├── Imports: ../pixi/card/CardRenderer
│   │   ├── Imports: ../types/pixi (Props interfaces)
│   │   └── Exports: PixiCardRenderer component
│   │
│   ├── PlayerArea.tsx
│   │   ├── Imports: ./PixiCardRenderer
│   │   ├── Imports: ../types/game (Player interface)
│   │   └── Exports: PlayerArea component
│   │
│   ├── GameBoard.tsx
│   │   ├── Imports: ./PlayerArea
│   │   ├── Imports: ./PixiCardRenderer
│   │   ├── Imports: ../types/game (GameState interface)
│   │   └── Exports: GameBoard component
│   │
│   └── PixiEffects.tsx
│       ├── Imports: pixi.js (Application, Graphics, Container)
│       └── Exports: PixiEffects component, effect functions
│
├── pixi/
│   └── card/
│       ├── CardSprite.ts
│       │   ├── Imports: pixi.js (Container, Graphics, Text)
│       │   ├── Imports: ../../types/game (Card interface)
│       │   ├── Exports: createCardSprite()
│       │   ├── Exports: createCardBackSprite()
│       │   └── Exports: makeCardInteractive()
│       │
│       ├── CardRenderer.ts
│       │   ├── Imports: pixi.js (Application, Container)
│       │   ├── Imports: ./CardSprite
│       │   ├── Imports: ../../types/game (Card interface)
│       │   ├── Exports: createCardRenderer()
│       │   └── Exports: updateCardRenderer()
│       │
│       ├── CardAnimations.ts
│       │   ├── Imports: pixi.js (Container, Ticker)
│       │   ├── Exports: animateDeal()
│       │   ├── Exports: animatePlay()
│       │   ├── Exports: animateDiscard()
│       │   └── Exports: animateFlip()
│       │
│       └── CardTextures.ts (Phase 2)
│           ├── Imports: pixi.js (Assets, Texture)
│           ├── Imports: ../../types/game (CardType enum)
│           ├── Exports: loadCardTextures()
│           ├── Exports: getCardTexture()
│           └── Exports: getCardBackTexture()
│
└── types/
    ├── game.ts
    │   ├── Exports: Card interface
    │   ├── Exports: Player interface
    │   ├── Exports: GameState interface
    │   └── Exports: CardType enum
    │
    └── pixi.ts
        ├── Exports: PixiCardRendererProps interface
        ├── Exports: CardSpriteData interface
        └── Exports: RenderOptions interface
```

---

## Summary

This architecture achieves:

1. **Clean Separation**: React owns state/logic, PixiJS owns visuals
2. **Performance**: Multiple small canvases, texture atlasing, smart diffing
3. **Maintainability**: Modular file structure, clear dependencies
4. **Flexibility**: Easy to swap Graphics API for textures (phased approach)
5. **Testability**: React components testable separately from PixiJS rendering

**Next Steps**: See `IMPLEMENTATION_PLAN.md` for staged rollout (5 phases, 13-19 hours total).
