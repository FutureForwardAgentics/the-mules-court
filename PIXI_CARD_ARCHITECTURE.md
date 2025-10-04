# PixiJS Card Graphics Architecture

## Executive Summary

This document outlines the architecture for integrating GPU-accelerated PixiJS v8 card graphics into The Mule's Court card game while maintaining the existing React-based game logic architecture.

**Core Principle**: React owns state and logic, PixiJS owns visual rendering and animations.

---

## 1. Architecture Overview

### 1.1 Component Hierarchy

```
App (React state)
├── PixiEffectsProvider (Context)
│   └── PixiEffects (Overlay canvas - effects only)
├── GameBoard (React layout)
│   ├── PlayerArea (React container)
│   │   └── PixiCardRenderer (PixiJS canvas - cards for this player)
│   │       ├── Hand Cards (PixiJS Sprites)
│   │       └── Discard Pile Cards (PixiJS Sprites)
│   └── CenterArea (React container)
│       └── PixiCardRenderer (PixiJS canvas - deck visualization)
```

### 1.2 Dual Canvas Architecture

**Strategy**: Use **multiple small PixiJS canvases** (one per card area) instead of a single global canvas.

**Rationale**:
- **Simpler React integration**: Each PlayerArea/CardArea gets its own PixiJS canvas
- **Better DOM layering**: Cards sit naturally in their React container hierarchy
- **Easier event handling**: Click/hover events naturally scoped to the correct player
- **Performance**: PixiJS v8 is highly optimized; 5-6 small canvases (4 players + deck + discard) is negligible overhead
- **CSS layout friendly**: Canvases can use Tailwind/Flexbox for positioning

**Canvas Types**:

1. **Card Rendering Canvases** (one per card display area)
   - Purpose: Render card sprites with interactions
   - Pointer events: `auto` (captures clicks/hovers)
   - Location: Inside React container divs (PlayerArea, CenterArea)
   - Count: 1 per player hand + 1 for deck + 1 for each discard pile = ~6-8 canvases

2. **Effects Overlay Canvas** (existing)
   - Purpose: Full-screen particle effects, animations
   - Pointer events: `none` (pass-through to cards)
   - Location: Fixed overlay at z-index 10
   - Count: 1 global canvas

---

## 2. Technical Decisions

### 2.1 Component Architecture: Hybrid React + PixiJS

**Decision**: Replace `GameCard.tsx` with `PixiCardRenderer.tsx` component that mounts PixiJS canvases.

**Structure**:
```tsx
// OLD: GameCard.tsx (HTML div with Tailwind)
<div className="card">...</div>

// NEW: PixiCardRenderer.tsx (React wrapper around PixiJS canvas)
<PixiCardRenderer
  cards={player.hand}
  size="small"
  isRevealed={isLocalPlayer}
  isInteractive={isCurrentPlayer}
  onCardClick={handleCardClick}
/>
```

**Why Hybrid**:
- React manages game state (no change to `useGameState.ts`)
- PixiJS renders visuals (GPU-accelerated, high-quality graphics)
- React props trigger PixiJS updates via `useEffect`
- Clean separation of concerns

### 2.2 Asset Strategy: Programmatic SVG + Texture Atlas

**Decision**: Generate card artwork programmatically using PixiJS Graphics API, then convert to textures.

**Phase 1** (MVP - Use Graphics API directly):
- Use `Graphics` class to draw cards similar to current HTML/CSS approach
- Gradient backgrounds via `graphics.beginFill()` with gradients
- Text via `Text` class for card name, value, ability
- Icons as emoji via `Text` class or custom emoji textures
- **Advantages**: Quick to implement, consistent with current design, no asset pipeline needed

**Phase 2** (Future - Real artwork):
- Source/create PNG/WebP card artwork (512x768px recommended)
- Load via PixiJS Assets API (`Assets.load()`)
- Pack into texture atlas for performance (`TexturePacker` or `@pixi/spritesheet`)
- **Advantages**: Professional look, better visual storytelling

**Texture Format** (Phase 2):
- Format: WebP (best compression) with PNG fallback
- Dimensions: 512x768px (2:3 aspect ratio, same as current cards)
- DPI: 2x for retina displays
- Atlas: Single spritesheet for all 16 cards + card back

**Asset Directory Structure**:
```
public/
  assets/
    cards/
      textures/
        card-back.webp
        informant.webp
        han-pritcher.webp
        ... (16 unique cards)
      spritesheet.json
      spritesheet.webp
```

### 2.3 Interaction Handling: PixiJS EventSystem → React Callbacks

**Decision**: Use PixiJS's built-in EventSystem (v8+) for hover/click, propagate to React via callbacks.

**Flow**:
```
User clicks card
  ↓
PixiJS EventSystem detects click on Sprite
  ↓
Sprite's onClick handler fires
  ↓
Calls React callback prop (onCardClick)
  ↓
React updates game state via useGameState
  ↓
State change triggers re-render
  ↓
useEffect updates PixiJS sprites
```

**Implementation**:
```tsx
// PixiCardRenderer.tsx (React component)
<canvas ref={canvasRef} /> // PixiJS mounts here

useEffect(() => {
  const sprite = createCardSprite(card);
  sprite.eventMode = 'static'; // Enable interactions (v8 API)
  sprite.cursor = 'pointer';
  sprite.on('pointerdown', () => {
    onCardClick?.(card.id); // Call React callback
  });
  sprite.on('pointerover', () => {
    sprite.scale.set(1.05); // Hover effect
  });
  sprite.on('pointerout', () => {
    sprite.scale.set(1.0);
  });
}, [card, onCardClick]);
```

**EventSystem Benefits** (PixiJS v8):
- Native event bubbling
- Touch + mouse unified
- Built-in hover/focus states
- Better than DOM event listeners (no z-index fighting)

### 2.4 State Synchronization: React State → PixiJS via useEffect

**Decision**: Use `useEffect` to watch React state and imperatively update PixiJS sprites.

**Pattern**:
```tsx
function PixiCardRenderer({ cards, size, isInteractive, onCardClick }) {
  const appRef = useRef<Application | null>(null);
  const spritesRef = useRef<Map<string, Sprite>>(new Map());

  // Initialize PixiJS app once
  useEffect(() => {
    const app = new Application();
    await app.init({ ... });
    appRef.current = app;
    return () => app.destroy();
  }, []);

  // Update sprites when cards change
  useEffect(() => {
    if (!appRef.current) return;

    // Diff cards and update sprites
    const newCardIds = new Set(cards.map(c => c.id));
    const existingSprites = spritesRef.current;

    // Remove old sprites
    for (const [id, sprite] of existingSprites) {
      if (!newCardIds.has(id)) {
        appRef.current.stage.removeChild(sprite);
        sprite.destroy();
        existingSprites.delete(id);
      }
    }

    // Add/update sprites
    cards.forEach((card, index) => {
      let sprite = existingSprites.get(card.id);
      if (!sprite) {
        sprite = createCardSprite(card, size);
        existingSprites.set(card.id, sprite);
        appRef.current.stage.addChild(sprite);
      }
      updateCardSprite(sprite, card, index, isInteractive, onCardClick);
    });
  }, [cards, size, isInteractive, onCardClick]);

  return <div ref={containerRef} />;
}
```

**Why This Works**:
- React state is source of truth
- PixiJS sprites are derived from React state
- Updates are batched by React
- No duplicate state management

### 2.5 Performance Optimization

**Sprite Pooling** (Deferred):
- Not needed for 16 cards (negligible overhead)
- PixiJS v8 sprite creation is fast (<1ms)
- Only implement if profiling shows bottleneck

**Texture Atlas** (Phase 2):
- All 16 cards + card back in single texture
- Single GPU upload, faster rendering
- Use `@pixi/spritesheet` or TexturePacker

**Container Hierarchy**:
```
Stage
├── HandContainer (position: player area)
│   ├── CardSprite (card 1)
│   └── CardSprite (card 2)
├── DiscardContainer (position: discard area)
│   ├── CardSprite (card 1)
│   └── CardSprite (card 2)
```

**Features to Use**:
- `Container`: Group cards per area (hand, discard)
- `Sprite`: Individual card rendering
- `Graphics`: Programmatic card drawing (Phase 1)
- `Text`: Card text rendering
- `Ticker`: Animations (card flip, deal, play)
- `EventSystem`: Click/hover interactions

---

## 3. Data Flow Architecture

### 3.1 One-Way Data Flow

```
React State (useGameState)
  ↓
React Props (cards, isInteractive, etc.)
  ↓
PixiCardRenderer (useEffect watches props)
  ↓
PixiJS Sprites (visual representation)
  ↓
User Interaction (click/hover)
  ↓
React Callback (onCardClick)
  ↓
React State Update (playCard action)
  ↓
[Loop back to top]
```

### 3.2 State Ownership

| State Type | Owner | Consumers |
|------------|-------|-----------|
| Game logic (phase, players, deck) | `useGameState.ts` | All React components |
| Card data (value, name, ability) | `cards.ts` | PixiJS renderers |
| Visual state (hover, animations) | PixiJS (local) | None (ephemeral) |
| Effect triggers (particles, rings) | React → PixiEffects | Effects canvas |

### 3.3 Integration with Existing PixiEffects

**Current**: `PixiEffects.tsx` creates a global canvas for particles/effects.

**New**: Card canvases sit **below** the effects canvas in z-order.

**Z-Index Layering**:
```
z-index: 10  → PixiEffects (overlay, pointer-events: none)
z-index: 1   → PixiCardRenderer canvases (interactive)
z-index: 0   → React DOM (GameBoard background, buttons)
```

**Effect Triggering** (unchanged):
```tsx
// App.tsx (already exists)
const enhancedPlayCard = (cardId: string) => {
  playCardEffect(window.innerWidth / 2, window.innerHeight / 2, 0xff6b6b);
  gameWithAI.playCard(cardId);
};
```

---

## 4. File Structure & Module Organization

### 4.1 New Directory Structure

```
src/
  components/
    GameCard.tsx               (DELETE - replaced by PixiCardRenderer)
    PixiCardRenderer.tsx       (NEW - React wrapper for PixiJS card canvas)
    PlayerArea.tsx             (MODIFY - use PixiCardRenderer instead of GameCard)
    GameBoard.tsx              (MODIFY - use PixiCardRenderer for deck)
    PixiEffects.tsx            (UNCHANGED - global effects canvas)
    CardInteractionModal.tsx   (UNCHANGED)
    SessionViewer.tsx          (UNCHANGED)
    GameBoard.tsx              (UNCHANGED)

  pixi/
    card/
      CardRenderer.ts          (NEW - PixiJS card rendering logic)
      CardSprite.ts            (NEW - Card sprite creation/updates)
      CardAnimations.ts        (NEW - Deal, flip, play animations)
      CardTextures.ts          (NEW - Texture loading/management)
    utils/
      PixiTypes.ts             (NEW - PixiJS type helpers)
      SpritePool.ts            (FUTURE - Sprite pooling if needed)

  data/
    cards.ts                   (UNCHANGED - card definitions)

  assets/                      (NEW - Phase 2 only)
    cards/
      textures/                (Card artwork files)
      spritesheet.json         (Texture atlas metadata)
      spritesheet.webp         (Texture atlas image)

  contexts/
    PixiEffectsContext.tsx     (UNCHANGED - global effects)

  types/
    game.ts                    (UNCHANGED - game state types)
    pixi.ts                    (NEW - PixiJS component props)

  hooks/
    useGameState.ts            (UNCHANGED - game logic)
    useGameWithAI.ts           (UNCHANGED - AI integration)
```

### 4.2 Module Responsibilities

**`PixiCardRenderer.tsx`** (React Component):
- Props: `cards`, `size`, `isRevealed`, `isInteractive`, `onCardClick`
- Responsibility: Mount PixiJS canvas, sync React state → PixiJS sprites
- Uses: `CardRenderer.ts` for PixiJS logic

**`CardRenderer.ts`** (PixiJS Logic):
- Exports: `createCardSprite()`, `updateCardSprite()`, `destroyCardSprite()`
- Responsibility: Create/update PixiJS sprites based on Card data
- Pure PixiJS code, no React dependencies

**`CardSprite.ts`** (Sprite Factory):
- Exports: `CardSprite` class or factory function
- Responsibility: Encapsulate card sprite creation (Graphics API or Texture-based)
- Handles: Size scaling, revealed/hidden states, interactive states

**`CardAnimations.ts`** (Animation Utilities):
- Exports: `animateDeal()`, `animateFlip()`, `animatePlay()`, `animateDiscard()`
- Responsibility: Tween-based animations using PixiJS Ticker
- Uses: `gsap` or native Ticker for frame-by-frame updates

**`CardTextures.ts`** (Asset Management):
- Exports: `loadCardTextures()`, `getCardTexture(type)`
- Responsibility: Load textures from assets, manage texture cache
- Uses: PixiJS Assets API (`Assets.load()`)

---

## 5. Asset Requirements Specification

### 5.1 Phase 1: Programmatic Graphics (MVP)

**No external assets needed.**

Card rendering via PixiJS Graphics API:
- Background: `Graphics.rect()` with gradient fill
- Border: `Graphics.stroke()` with rounded corners
- Text: `Text` class for name/value/ability
- Icon: `Text` class with emoji (👤, 🎖️, etc.)
- Decorative elements: `Graphics.moveTo/lineTo()` for corner accents

### 5.2 Phase 2: Real Artwork (Future)

**Texture Specifications**:

| Asset Type | Dimensions | Format | Purpose |
|------------|------------|--------|---------|
| Card face (16 unique) | 512x768px | WebP + PNG | Individual card artwork |
| Card back | 512x768px | WebP + PNG | Hidden card rendering |
| Icon sprites (optional) | 128x128px | WebP + PNG | Card icons (👤 → custom art) |

**Naming Convention**:
```
card-back.webp
informant.webp
han-pritcher.webp
bail-channis.webp
ebling-mis.webp
magnifico.webp
shielded-mind.webp
bayta-darell.webp
toran-darell.webp
mayor-indbur.webp
first-speaker.webp
mule.webp
```

**Directory Structure**:
```
public/assets/cards/
  textures/
    card-back.webp
    informant.webp
    ...
  spritesheet.json      (generated by TexturePacker)
  spritesheet.webp      (atlas image)
```

**Texture Atlas** (recommended for production):
- Tool: TexturePacker or `@pixi/spritesheet`
- Format: JSON + WebP
- Padding: 2px to prevent bleeding
- Max size: 2048x2048px (mobile GPU safe)

**Loading Strategy**:
```typescript
// CardTextures.ts
import { Assets } from 'pixi.js';

export async function loadCardTextures() {
  await Assets.load('/assets/cards/spritesheet.json');
}

export function getCardTexture(type: CardType): Texture {
  return Assets.get(`${type}.webp`);
}
```

### 5.3 Size Scaling

**Base Size**: 512x768px (2:3 ratio)

**Display Sizes** (match current GameCard.tsx):
- Small: 96x144px (w-24 h-36)
- Medium: 192x288px (w-48 h-72)
- Large: 256x384px (w-64 h-96)

**Scaling Strategy**:
```typescript
const scaleFactor = {
  small: 96 / 512,   // 0.1875
  medium: 192 / 512, // 0.375
  large: 256 / 512   // 0.5
}[size];

sprite.scale.set(scaleFactor);
```

---

## 6. Animation System

### 6.1 Core Animations

**Deal Animation**:
- Duration: 300ms
- Effect: Slide from deck position + fade in
- Easing: `ease-out`

**Flip Animation**:
- Duration: 400ms
- Effect: Scale X to 0 (flip), swap texture, scale X to 1
- Easing: `ease-in-out`

**Play Animation**:
- Duration: 500ms
- Effect: Slide to center + scale up + fade out
- Easing: `ease-in`
- Trigger: Particle effect on PixiEffects canvas

**Discard Animation**:
- Duration: 300ms
- Effect: Slide to discard pile + scale down
- Easing: `ease-out`

### 6.2 Implementation Approach

**Option A**: Native PixiJS Ticker (recommended for simplicity):
```typescript
function animateDeal(sprite: Sprite, from: Point, to: Point, duration: number) {
  const startTime = Date.now();
  const ticker = (delta: number) => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);

    sprite.x = from.x + (to.x - from.x) * eased;
    sprite.y = from.y + (to.y - from.y) * eased;
    sprite.alpha = eased;

    if (progress >= 1) {
      app.ticker.remove(ticker);
    }
  };
  app.ticker.add(ticker);
}
```

**Option B**: GSAP (more features, larger bundle):
```typescript
import gsap from 'gsap';

function animateDeal(sprite: Sprite, from: Point, to: Point) {
  sprite.x = from.x;
  sprite.y = from.y;
  sprite.alpha = 0;

  gsap.to(sprite, {
    x: to.x,
    y: to.y,
    alpha: 1,
    duration: 0.3,
    ease: 'power2.out'
  });
}
```

**Decision**: Start with native Ticker (no dependencies), migrate to GSAP if animations become complex.

---

## 7. Testing Strategy

### 7.1 Component Testing

**PixiCardRenderer.tsx**:
```typescript
// PixiCardRenderer.test.tsx
describe('PixiCardRenderer', () => {
  it('renders correct number of card sprites', async () => {
    const cards = [createTestCard('informant-0'), createTestCard('mule-0')];
    render(<PixiCardRenderer cards={cards} size="medium" />);

    // Wait for PixiJS initialization
    await waitFor(() => {
      const canvas = screen.getByRole('img'); // Canvas has implicit img role
      expect(canvas).toBeInTheDocument();
    });
  });

  it('calls onCardClick when sprite is clicked', async () => {
    const handleClick = vi.fn();
    const cards = [createTestCard('informant-0')];
    render(
      <PixiCardRenderer
        cards={cards}
        isInteractive
        onCardClick={handleClick}
      />
    );

    // Simulate click on canvas
    const canvas = screen.getByRole('img');
    fireEvent.click(canvas);

    await waitFor(() => {
      expect(handleClick).toHaveBeenCalledWith('informant-0');
    });
  });
});
```

### 7.2 Visual Regression Testing (Future)

**Tool**: `@pixi/playwright` or Percy.io

**Test Cases**:
- Card renders correctly for each type (16 snapshots)
- Card back renders correctly
- Hover state shows scale increase
- Revealed vs. hidden states

### 7.3 Integration Testing

**Existing Tests** (should pass unchanged):
- `useGameState.test.ts` - Game logic (UNCHANGED)
- `fullGamePlaythrough.test.ts` - End-to-end gameplay (UNCHANGED)

**New Test**: Verify PixiJS renders in React tree:
```typescript
// App.test.tsx
it('renders PixiCardRenderer for player hands', () => {
  render(<App />);

  // Start game
  fireEvent.click(screen.getByText('Begin the Game'));

  // Verify PixiJS canvases exist (one per player)
  const canvases = screen.getAllByRole('img');
  expect(canvases.length).toBeGreaterThan(0);
});
```

---

## 8. Migration Strategy

### 8.1 Incremental Rollout

**Phase 1**: Replace GameCard.tsx with PixiCardRenderer.tsx (Graphics API)
- Maintain visual parity with current HTML/CSS design
- No external assets needed
- Test thoroughly

**Phase 2**: Add real card artwork (Texture-based)
- Source or create 16 card images + card back
- Create texture atlas
- Load via Assets API
- Swap Graphics-based sprites for Texture-based sprites

**Phase 3**: Add animations
- Deal, flip, play, discard animations
- Polish hover/focus states
- Add particle trails for played cards

### 8.2 Backward Compatibility

**Fallback Strategy**: Keep old `GameCard.tsx` as `GameCard.legacy.tsx`

**Feature Flag** (optional):
```typescript
// App.tsx
const USE_PIXI_CARDS = import.meta.env.VITE_USE_PIXI_CARDS !== 'false';

function PlayerArea({ player }) {
  return USE_PIXI_CARDS
    ? <PixiCardRenderer cards={player.hand} />
    : player.hand.map(card => <GameCard key={card.id} card={card} />);
}
```

### 8.3 Performance Monitoring

**Metrics to Track**:
- FPS (should stay 60fps)
- Memory usage (watch for texture leaks)
- Time to first render (should be <100ms)

**Tools**:
- Chrome DevTools Performance tab
- PixiJS DevTools extension
- `app.ticker.FPS` for real-time FPS

---

## 9. Risk Mitigation

### 9.1 Potential Issues

| Risk | Impact | Mitigation |
|------|--------|-----------|
| PixiJS canvas doesn't resize | High | Add resize listener, update `app.renderer.resize()` |
| Sprites leak memory | Medium | Ensure `sprite.destroy()` called in cleanup |
| Event handlers don't fire | High | Verify `eventMode: 'static'` set on sprites |
| Textures don't load | Medium | Add error handling in `Assets.load()` |
| Performance degrades | Low | Profile with DevTools, implement sprite pooling if needed |

### 9.2 Testing Checklist

Before merging each stage:
- [ ] All existing tests pass
- [ ] New component tests added
- [ ] Visual regression tests pass (if implemented)
- [ ] Performance profiling shows no regressions
- [ ] Works on mobile (touch events)
- [ ] Works on different screen sizes
- [ ] Memory leaks tested (repeated card plays)

---

## 10. Open Questions & Future Considerations

### 10.1 Open Questions

1. **Card artwork source**: Where will we get the 16 card images?
   - Option A: Commission artist
   - Option B: AI-generated (DALL-E, Midjourney)
   - Option C: Public domain Foundation imagery

2. **Mobile performance**: Do we need texture compression (ASTC, ETC2)?
   - Decision: Profile on actual devices first

3. **Accessibility**: How do screen readers interact with PixiJS canvases?
   - Solution: Add ARIA labels to canvas elements, provide text alternative

### 10.2 Future Enhancements

- **3D card flips**: Use PixiJS Projection plugin for perspective transforms
- **Particle effects on cards**: Glow, shimmer for high-value cards
- **Animated backgrounds**: Per-card thematic animations
- **Sound effects**: Card whoosh, play sounds (via Howler.js)
- **Card shine effect**: Light sweep across card on hover

---

## Conclusion

This architecture maintains the existing React-based game logic while adding professional-quality GPU-accelerated card graphics via PixiJS v8. The dual-canvas approach (multiple small canvases for cards, one overlay for effects) provides clean separation, simple integration, and excellent performance.

**Key Principles**:
1. React owns state and logic (unchanged)
2. PixiJS owns visuals and animations (new)
3. Props flow down, events flow up
4. Incremental rollout via phases
5. Performance and accessibility considered from the start

**Next Steps**: See `IMPLEMENTATION_PLAN.md` for staged implementation.
