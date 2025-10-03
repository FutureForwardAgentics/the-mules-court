# PixiJS Card Graphics Integration - Executive Summary

## Overview

This document provides a high-level summary of the PixiJS v8 card graphics integration architecture for The Mule's Court card game.

---

## Core Architecture Principles

### 1. Separation of Concerns

**React Owns**:
- Game state and logic (`useGameState.ts`)
- UI layout and structure (`GameBoard.tsx`, `PlayerArea.tsx`)
- User interactions and callbacks
- Game rules and validation

**PixiJS Owns**:
- Card visual rendering (GPU-accelerated)
- Animations and transitions
- Hover effects and visual feedback
- Particle effects and visual polish

**Clear Boundary**: React state flows down to PixiJS as props, PixiJS events flow up to React as callbacks.

### 2. Dual Canvas Strategy

```
┌─────────────────────────────────────────┐
│  PixiEffects Canvas (Overlay)           │  z-index: 10
│  - Particles, rings, visual effects     │  pointer-events: none
│  - Full screen, transparent background  │
└─────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  z-index: 1
│ Player 1 Cards   │  │ Player 2 Cards   │  pointer-events: auto
│ (PixiJS Canvas)  │  │ (PixiJS Canvas)  │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│ Player 3 Cards   │  │ Player 4 Cards   │
└──────────────────┘  └──────────────────┘

┌──────────────────┐
│ Deck (Canvas)    │
└──────────────────┘
```

**Why Multiple Canvases**:
- Simpler React integration (each canvas in its container)
- Natural CSS/Flexbox layout
- Scoped event handling (clicks go to correct player)
- Better performance (only redraw changed canvases)

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ React State (useGameState)                                  │
│ - players: [{ hand: Card[], isEliminated, ... }]           │
│ - deck: Card[]                                              │
│ - phase: 'draw' | 'play' | 'round-end' | 'game-end'        │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Props
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PixiCardRenderer (React Component)                          │
│ <PixiCardRenderer                                           │
│   cards={player.hand}                                       │
│   size="small"                                              │
│   isInteractive={isCurrentPlayer}                           │
│   onCardClick={handleCardClick}                             │
│ />                                                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ useEffect (sync)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PixiJS Sprites (Visual Representation)                      │
│ - Container for each card                                   │
│ - Graphics/Sprite for card artwork                          │
│ - Text for name, value, ability                             │
│ - EventMode for interactivity                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ User Interaction
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ PixiJS EventSystem                                          │
│ sprite.on('pointerdown', () => onCardClick(card.id))        │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Callback
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ React State Update (playCard action)                        │
│ gameState = useGameState.playCard(cardId)                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         └─── [Loop back to top]
```

**Key Insight**: One-way data flow. React state is the source of truth, PixiJS sprites are derived from React state.

---

## File Structure

```
src/
├── components/
│   ├── PixiCardRenderer.tsx       [NEW] React wrapper for PixiJS canvas
│   ├── PlayerArea.tsx              [MODIFIED] Use PixiCardRenderer
│   ├── GameBoard.tsx               [MODIFIED] Use PixiCardRenderer for deck
│   ├── PixiEffects.tsx             [UNCHANGED] Global effects overlay
│   └── GameCard.tsx                [DELETED] Replaced by PixiCardRenderer
│
├── pixi/
│   ├── card/
│   │   ├── CardRenderer.ts         [NEW] PixiJS rendering logic
│   │   ├── CardSprite.ts           [NEW] Sprite creation/updates
│   │   ├── CardAnimations.ts       [NEW] Animation utilities
│   │   └── CardTextures.ts         [NEW] Asset loading (Phase 2)
│   └── utils/
│       └── PixiTypes.ts            [NEW] TypeScript helpers
│
├── data/
│   └── cards.ts                    [UNCHANGED] Card definitions
│
├── types/
│   ├── game.ts                     [UNCHANGED] Game state types
│   └── pixi.ts                     [NEW] PixiJS component props
│
└── hooks/
    ├── useGameState.ts             [UNCHANGED] Game logic
    └── useGameWithAI.ts            [UNCHANGED] AI integration
```

---

## Implementation Phases

### Phase 1: Foundation (MVP)
**Goal**: Replace HTML/CSS cards with PixiJS Graphics API

**Deliverables**:
- `PixiCardRenderer.tsx` component working
- Cards render with Graphics API (gradients, text, borders)
- Three size variants (small, medium, large)
- Card back for hidden cards
- Tests pass

**Timeline**: 4-6 hours

### Phase 2: Interaction
**Goal**: Add click and hover events

**Deliverables**:
- Cards respond to hover (scale 1.05)
- Clicking card calls `onCardClick` callback
- Only interactive cards respond to events
- Touch events work on mobile

**Timeline**: 2-3 hours

### Phase 3: Integration
**Goal**: Integrate into actual game components

**Deliverables**:
- `PlayerArea` uses `PixiCardRenderer`
- `GameBoard` uses `PixiCardRenderer` for deck
- All existing tests pass
- Visual parity with old HTML/CSS cards
- `GameCard.tsx` deleted

**Timeline**: 3-4 hours

### Phase 4: Animations
**Goal**: Add smooth card animations

**Deliverables**:
- Deal animation (slide from deck + fade in)
- Play animation (slide to center + scale up)
- Discard animation (slide to discard pile)
- Flip animation (reveal card)
- 60fps performance

**Timeline**: 4-6 hours

### Phase 5: Assets (Optional)
**Goal**: Replace Graphics API with real card artwork

**Deliverables**:
- 16 card images + card back sourced/created
- Texture atlas generated
- Assets load via PixiJS Assets API
- Loading screen while assets load

**Timeline**: 6-8 hours (if pursued)

**Total**: 13-19 hours (excluding optional Phase 5)

---

## Key Technical Decisions

| Question | Decision | Why |
|----------|----------|-----|
| Canvas architecture? | Multiple small canvases | Simpler React integration, natural layout |
| Asset strategy? | Graphics API → Textures (phased) | Unblocks development, provides migration path |
| Event handling? | PixiJS EventSystem | Native touch/mouse, per-sprite events |
| State sync? | React state → PixiJS via useEffect | Declarative, single source of truth |
| Animations? | PixiJS Ticker → GSAP (phased) | Zero dependencies initially, upgrade if needed |

---

## API Example

### Using PixiCardRenderer in a Component

```tsx
import { PixiCardRenderer } from './components/PixiCardRenderer';

function PlayerArea({ player, isCurrentPlayer, isLocalPlayer, onCardClick }) {
  return (
    <div className="player-area">
      {/* Player hand */}
      <div className="hand">
        <PixiCardRenderer
          cards={player.hand}
          size="small"
          isRevealed={isLocalPlayer}
          isInteractive={isCurrentPlayer && isLocalPlayer}
          onCardClick={onCardClick}
        />
      </div>

      {/* Discard pile */}
      <div className="discard">
        <PixiCardRenderer
          cards={player.discardPile}
          size="small"
          isRevealed={true}
          isInteractive={false}
        />
      </div>
    </div>
  );
}
```

### PixiCardRenderer Props

```typescript
interface PixiCardRendererProps {
  cards: Card[];              // Array of cards to render
  size: 'small' | 'medium' | 'large';  // Display size
  isRevealed?: boolean;       // Show card faces or backs
  isInteractive?: boolean;    // Enable click/hover events
  onCardClick?: (cardId: string) => void;  // Click callback
  layout?: 'horizontal' | 'vertical' | 'stack';  // Arrangement
}
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Frame Rate | 60fps | Sustained during gameplay |
| Initial Load | <2s | Time to first render |
| Asset Load | <5s | Texture loading (Phase 5) |
| Memory Usage | <100MB | Total memory (measured in DevTools) |
| Bundle Size | <50KB | PixiJS integration code (PixiJS itself is ~400KB) |

---

## Risk Mitigation

### Potential Issues & Solutions

**Issue**: PixiJS canvas doesn't resize properly
- **Solution**: Add window resize listener, call `app.renderer.resize()`

**Issue**: Memory leaks from sprites
- **Solution**: Ensure `sprite.destroy()` called in cleanup, use Chrome DevTools memory profiler

**Issue**: Events don't fire on sprites
- **Solution**: Verify `eventMode: 'static'` set, check PixiJS version (v8+ required)

**Issue**: Textures fail to load
- **Solution**: Add error handling in `Assets.load()`, provide fallback to Graphics API

**Issue**: Performance degrades on mobile
- **Solution**: Profile with DevTools, implement sprite pooling, reduce texture sizes

---

## Testing Strategy

### Unit Tests
```typescript
// PixiCardRenderer.test.tsx
- renders correct number of card sprites
- calls onCardClick when sprite is clicked
- shows card back when isRevealed=false
- scales cards to correct size
- destroys PixiJS app on unmount
```

### Integration Tests
```typescript
// Existing tests should pass unchanged
- useGameState.test.ts
- fullGamePlaythrough.test.ts

// New integration tests
- PlayerArea renders PixiCardRenderer
- GameBoard renders deck with PixiJS
- Clicking card in PlayerArea triggers game action
```

### Visual Tests (Manual)
- All 16 cards render correctly
- Hover effects smooth
- Click events work
- Touch events work on mobile
- Animations smooth at 60fps

---

## Migration Checklist

Before merging each phase:

- [ ] All existing tests pass
- [ ] New component tests added and passing
- [ ] Visual regression tests pass (if implemented)
- [ ] Performance profiling shows no regressions
- [ ] Works on mobile (touch events)
- [ ] Works on different screen sizes (responsive)
- [ ] Memory leaks tested (repeated card plays)
- [ ] Code reviewed (self or peer)
- [ ] Documentation updated

---

## Success Criteria

The integration is successful when:

1. **Functionality**: All game features work identically to HTML/CSS version
2. **Performance**: 60fps sustained, <100MB memory usage
3. **Visual Quality**: Cards look professional, animations smooth
4. **Maintainability**: Code is clean, well-tested, easy to modify
5. **Accessibility**: Canvas elements have ARIA labels, keyboard navigation works
6. **Mobile**: Touch events work, scales correctly on small screens

---

## Future Enhancements

After successful deployment, consider:

- 3D card flips (PixiJS Projection plugin)
- Per-card particle effects (shimmer on high-value cards)
- Sound effects (card whoosh, play sounds via Howler.js)
- Animated card backgrounds (per-character themes)
- Card shine effect (light sweep on hover)
- Advanced animations (bounce, elastic, spring)

---

## Resources

### Documentation
- **Architecture**: `PIXI_CARD_ARCHITECTURE.md` (detailed design)
- **Implementation**: `IMPLEMENTATION_PLAN.md` (5-stage plan)
- **Technical Decisions**: `TECHNICAL_DECISIONS.md` (rationale)
- **PixiJS v8 Docs**: `public/llms.txt` (curated links)
- **PixiJS v8 Full API**: `public/llms-full.txt` (complete reference)

### PixiJS v8 Key APIs
- `Application` - Main entry point, manages renderer and stage
- `Container` - Group sprites (hand, discard pile)
- `Graphics` - Draw shapes programmatically (Phase 1)
- `Sprite` - Render textures (Phase 2)
- `Text` - Render text (card name, value, ability)
- `Assets` - Load textures (Phase 2)
- `EventSystem` - Handle clicks/hover (`eventMode: 'static'`)
- `Ticker` - Animation loop

### Code Locations
- Current card rendering: `src/components/GameCard.tsx`
- Current effects: `src/components/PixiEffects.tsx`
- Card data: `src/data/cards.ts`
- Game state: `src/hooks/useGameState.ts`

---

## Questions?

For detailed information, see:
- **Design Questions** → `PIXI_CARD_ARCHITECTURE.md`
- **Implementation Steps** → `IMPLEMENTATION_PLAN.md`
- **Decision Rationale** → `TECHNICAL_DECISIONS.md`

**Next Step**: Begin Stage 1 of `IMPLEMENTATION_PLAN.md`
