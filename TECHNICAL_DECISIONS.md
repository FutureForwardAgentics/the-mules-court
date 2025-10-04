# Technical Decisions: PixiJS Card Graphics Integration

This document provides detailed rationale for key architectural decisions made in the PixiJS card graphics integration.

---

## Decision 1: Multiple Small Canvases vs. Single Global Canvas

### Decision: Use multiple small PixiJS canvases (one per card display area)

### Alternatives Considered

**Option A: Single Global Canvas** (Like PixiEffects)
- One PixiJS Application covering the entire screen
- All cards rendered as sprites on the global stage
- Event handling via PixiJS EventSystem
- Positioning calculated in PixiJS world coordinates

**Option B: Multiple Small Canvases** (Selected)
- One PixiJS Application per card display area (hand, discard, deck)
- Each canvas sits inside its React container
- Event handling via PixiJS EventSystem (local to canvas)
- Positioning uses React/Tailwind layout, PixiJS handles only card arrangement

**Option C: Hybrid DOM + Canvas**
- React divs for layout
- Canvas overlays for each card
- Event handling via DOM

### Rationale for Option B

**Pros**:
1. **Simpler React Integration**
   - Canvases naturally fit into React component tree
   - No need to calculate absolute screen positions from React state
   - CSS Flexbox/Grid works naturally for layout

2. **Event Handling Simplicity**
   - Click events are scoped to the correct canvas
   - No need to map screen coordinates to game entities
   - Touch events work naturally (touch target is the canvas)

3. **DOM Layering**
   - Z-index works naturally (cards sit below effects overlay)
   - Can still use React components for UI overlays (modals, tooltips)
   - Easier to debug (inspect individual canvases in DevTools)

4. **Performance**
   - PixiJS v8 is highly optimized; 6-8 small canvases is negligible overhead
   - Each canvas is small (192x288px for medium cards)
   - Avoids redrawing entire screen when one player's hand changes

5. **Responsive Design**
   - Canvases resize with their React containers
   - Works naturally with Tailwind's responsive grid

**Cons**:
1. **More PixiJS Applications**
   - Each canvas creates an Application instance (~50KB memory overhead each)
   - More WebGL contexts (but well within browser limits)
   - Slightly more initialization code

2. **Animations Between Canvases**
   - Cards moving from hand to discard cross canvas boundaries
   - Solution: Animate on the effects overlay canvas, then update card positions

**Mitigation of Cons**:
- Modern browsers support 16+ WebGL contexts (we use 6-8)
- Memory overhead is small (<500KB total for 8 canvases)
- Cross-canvas animations solved by using effects overlay for transitions

### Implementation Details

```typescript
// PlayerArea.tsx
<div className="flex gap-2">
  {/* Each card area gets its own canvas */}
  <PixiCardRenderer
    cards={player.hand}
    size="small"
    // Canvas will be sized to fit cards
  />
</div>

// PixiCardRenderer.tsx
function PixiCardRenderer({ cards, size }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const app = new Application();
    await app.init({
      width: calculateWidth(cards.length, size),
      height: calculateHeight(size),
      backgroundAlpha: 0,
    });
    containerRef.current?.appendChild(app.canvas);
    appRef.current = app;

    return () => app.destroy();
  }, []);

  // ... render cards on this canvas
}
```

---

## Decision 2: Programmatic Graphics vs. Texture-based Sprites

### Decision: Start with Graphics API (Phase 1), migrate to Textures (Phase 2)

### Alternatives Considered

**Option A: Graphics API Only** (Phase 1)
- Use PixiJS Graphics class to draw cards
- Gradients, text, shapes all rendered programmatically
- No external assets needed
- Similar to current HTML/CSS approach

**Option B: Texture-based Sprites Only**
- Require card artwork upfront
- Load via Assets API
- Professional appearance from day one
- Blocks development until artwork is sourced

**Option C: Hybrid Graphics + Textures** (Selected)
- Phase 1: Graphics API for MVP
- Phase 2: Textures for production
- Easy migration path (swap sprite creation logic)

### Rationale for Option C

**Pros of Graphics API (Phase 1)**:
1. **No Asset Dependency**
   - Can implement immediately without artwork
   - Maintains current visual style (gradients, emoji icons)
   - Unblocks development

2. **Visual Parity**
   - Easier to match current HTML/CSS design
   - Can verify functionality before changing appearance

3. **Rapid Iteration**
   - Tweak colors/sizes in code (no Photoshop needed)
   - Faster development cycle

**Pros of Textures (Phase 2)**:
1. **Professional Appearance**
   - High-quality artwork elevates game feel
   - Better Foundation universe immersion
   - More visually engaging

2. **Performance**
   - Textures render faster than complex Graphics
   - Texture atlas reduces draw calls
   - Better for mobile devices

3. **Design Flexibility**
   - Artists can create complex illustrations
   - Lighting, shadows, effects baked into artwork
   - Not limited by Graphics API capabilities

**Migration Path**:
```typescript
// Phase 1: Graphics API
function createCardSprite(card: Card, size: Size): Container {
  const container = new Container();
  const bg = new Graphics();
  bg.rect(0, 0, width, height);
  bg.fill({ color: parseGradient(card.color) });
  container.addChild(bg);
  // ... add text, icons, borders
  return container;
}

// Phase 2: Texture-based (drop-in replacement)
function createCardSprite(card: Card, size: Size): Sprite {
  const texture = getCardTexture(card.type);
  const sprite = new Sprite(texture);
  sprite.scale.set(calculateScale(size));
  return sprite;
}
```

**Why Not Hybrid?**
- Don't use Graphics for some cards, Textures for others
- Creates inconsistent visual style
- Complicates code (two rendering paths)

### Implementation Strategy

**Phase 1 Deliverable**:
- Fully functional PixiJS card rendering
- Visual parity with current HTML/CSS
- All game features working
- Shippable product

**Phase 2 Trigger**:
- Artwork becomes available
- User feedback requests better visuals
- Marketing needs professional screenshots

---

## Decision 3: Event Handling - PixiJS EventSystem vs. DOM Events

### Decision: Use PixiJS EventSystem exclusively for card interactions

### Alternatives Considered

**Option A: PixiJS EventSystem** (Selected)
- Set `eventMode: 'static'` on interactive sprites
- Use `sprite.on('pointerdown', callback)`
- PixiJS handles hit testing, touch/mouse unification

**Option B: DOM Event Listeners**
- Add `addEventListener('click')` to canvas element
- Calculate which card was clicked via coordinates
- Manual touch/mouse handling

**Option C: Hybrid**
- PixiJS for visual hover effects
- DOM for actual click handling
- Complex synchronization

### Rationale for Option A

**Pros**:
1. **Native PixiJS Integration**
   - EventSystem is built-in (v8+)
   - Optimized for sprite-based hit testing
   - Handles z-order automatically (overlapping cards)

2. **Touch + Mouse Unified**
   - `pointerdown`, `pointerover`, etc. work for both
   - No need for separate touch/mouse code
   - Mobile-friendly out of the box

3. **Per-Sprite Events**
   - Each card sprite has its own event handlers
   - Easy to enable/disable interactivity per card
   - Event bubbling through container hierarchy

4. **Hover Effects**
   - Can animate sprites directly in event handlers
   - No React state updates needed for hover (performance)
   - Smooth, 60fps hover animations

**Cons**:
1. **Learning Curve**
   - PixiJS EventSystem API differs from DOM
   - New `eventMode` property (v8 API change)

2. **React Integration**
   - Need to bridge PixiJS events to React callbacks
   - Careful with closure scopes (stale props)

**Mitigation**:
- Use `useCallback` to keep callbacks fresh
- Clear event listeners on cleanup

### Implementation Example

```typescript
// CardSprite.ts
export function makeCardInteractive(
  sprite: Container,
  cardId: string,
  onClick: (id: string) => void
): void {
  sprite.eventMode = 'static'; // Enable events (v8 API)
  sprite.cursor = 'pointer';

  // Hover effect (no React state update needed!)
  sprite.on('pointerover', () => {
    sprite.scale.set(1.05);
  });

  sprite.on('pointerout', () => {
    sprite.scale.set(1.0);
  });

  // Click handler (calls React callback)
  sprite.on('pointerdown', (event: FederatedPointerEvent) => {
    event.stopPropagation(); // Prevent bubbling if needed
    onClick(cardId);
  });
}

// PixiCardRenderer.tsx (React side)
const handleCardClick = useCallback((cardId: string) => {
  onCardClick?.(cardId); // Propagate to parent
}, [onCardClick]);

useEffect(() => {
  cards.forEach(card => {
    const sprite = createCardSprite(card, size);
    if (isInteractive) {
      makeCardInteractive(sprite, card.id, handleCardClick);
    }
  });
}, [cards, isInteractive, handleCardClick]);
```

---

## Decision 4: State Synchronization - useEffect vs. Imperative Ref API

### Decision: Use `useEffect` to sync React state → PixiJS sprites

### Alternatives Considered

**Option A: useEffect + Declarative Updates** (Selected)
- React state is source of truth
- `useEffect` watches state changes
- Imperatively update PixiJS sprites in effect
- Diffing to minimize updates

**Option B: Imperative Ref API**
- Expose `ref.current.updateCards(cards)` method
- Parent component calls method when state changes
- PixiJS component has internal state

**Option C: Two-Way Binding**
- PixiJS maintains its own state
- React subscribes to PixiJS state changes
- Complex synchronization logic

### Rationale for Option A

**Pros**:
1. **React-Idiomatic**
   - Props flow down, data is declarative
   - Consistent with React philosophy
   - Easy to understand for React developers

2. **Automatic Updates**
   - No need to remember to call `updateCards()`
   - React guarantees updates happen when state changes
   - Batching and scheduling handled by React

3. **No Duplicate State**
   - React state is single source of truth
   - PixiJS sprites are derived from React state
   - No risk of desync between React and PixiJS

4. **Testability**
   - Can test React component with `render()` + `rerender()`
   - No need to mock ref methods
   - Easier to write integration tests

**Cons**:
1. **Effect Timing**
   - Effects run after render (slight delay)
   - Could cause visual flicker if not careful

2. **Performance**
   - Need to diff cards to avoid recreating unchanged sprites
   - Potential for unnecessary updates

**Mitigation**:
- Use `useMemo` to memoize card arrays (prevent ref changes)
- Implement diffing in effect (only update changed sprites)
- Use sprite IDs for stable identity

### Implementation Pattern

```typescript
function PixiCardRenderer({ cards, size, isInteractive, onCardClick }) {
  const appRef = useRef<Application | null>(null);
  const spritesRef = useRef<Map<string, Container>>(new Map());

  // Initialize PixiJS once
  useEffect(() => {
    const app = new Application();
    // ... init
    appRef.current = app;
    return () => app.destroy();
  }, []);

  // Update sprites when cards/props change
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    const sprites = spritesRef.current;
    const newCardIds = new Set(cards.map(c => c.id));

    // REMOVE: Cards no longer in the array
    for (const [id, sprite] of sprites) {
      if (!newCardIds.has(id)) {
        app.stage.removeChild(sprite);
        sprite.destroy();
        sprites.delete(id);
      }
    }

    // ADD/UPDATE: Cards in the array
    cards.forEach((card, index) => {
      let sprite = sprites.get(card.id);

      if (!sprite) {
        // Card is new, create sprite
        sprite = createCardSprite(card, size);
        sprites.set(card.id, sprite);
        app.stage.addChild(sprite);
      }

      // Update sprite properties (position, interactivity, etc.)
      sprite.x = index * (cardWidth + spacing);
      sprite.y = 0;

      // Update interactivity
      if (isInteractive) {
        makeCardInteractive(sprite, card.id, onCardClick);
      } else {
        sprite.eventMode = 'none';
      }
    });
  }, [cards, size, isInteractive, onCardClick]);

  return <div ref={containerRef} />;
}
```

**Why This Works**:
- Diffing ensures only changed cards are updated
- Stable card IDs prevent unnecessary recreation
- Effect dependency array ensures updates when needed

---

## Decision 5: Animation System - Native Ticker vs. GSAP

### Decision: Use PixiJS Ticker for Phase 1, consider GSAP for Phase 2

### Alternatives Considered

**Option A: PixiJS Ticker** (Phase 1)
- Use `app.ticker.add(callback)` for animations
- Manual easing functions
- No external dependencies

**Option B: GSAP** (Phase 2+)
- `gsap.to(sprite, { x: 100, duration: 1 })`
- Powerful easing, sequencing, timelines
- +20KB bundle size

**Option C: React Spring**
- React-based animation library
- Works well with React state
- Doesn't integrate with PixiJS (needs adapter)

### Rationale for Option A (Initially)

**Pros of Ticker**:
1. **Zero Dependencies**
   - PixiJS Ticker is built-in
   - No additional bundle size
   - One less library to learn

2. **Simple Animations**
   - Deal, flip, play animations are straightforward
   - Linear/easeOut curves are easy to implement
   - Full control over frame updates

3. **PixiJS Integration**
   - Ticker runs on render loop (synced with PixiJS)
   - Can update sprites directly
   - No React state updates needed

**Cons of Ticker**:
1. **Manual Easing**
   - Need to implement easing functions
   - Harder to create complex sequences
   - More code to maintain

2. **No Timeline**
   - Sequential animations require callbacks
   - Parallel animations need manual coordination

**When to Migrate to GSAP**:
- Animations become complex (>3 sequential steps)
- Need advanced easing (bounce, elastic)
- User requests more polished animations
- Budget allows for larger bundle (+20KB)

### Implementation Comparison

**Ticker Example**:
```typescript
function animateDeal(
  sprite: Container,
  from: Point,
  to: Point,
  duration: number,
  app: Application
): Promise<void> {
  return new Promise(resolve => {
    sprite.x = from.x;
    sprite.y = from.y;
    sprite.alpha = 0;

    const startTime = Date.now();

    const ticker = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress); // Custom easing function

      sprite.x = from.x + (to.x - from.x) * eased;
      sprite.y = from.y + (to.y - from.y) * eased;
      sprite.alpha = eased;

      if (progress >= 1) {
        app.ticker.remove(ticker);
        resolve();
      }
    };

    app.ticker.add(ticker);
  });
}

// Easing function (manual)
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
```

**GSAP Example** (Phase 2):
```typescript
import gsap from 'gsap';

function animateDeal(
  sprite: Container,
  from: Point,
  to: Point,
  duration: number
): Promise<void> {
  sprite.x = from.x;
  sprite.y = from.y;
  sprite.alpha = 0;

  return gsap.to(sprite, {
    x: to.x,
    y: to.y,
    alpha: 1,
    duration: duration / 1000,
    ease: 'power3.out'
  });
}
```

**Decision**: Start with Ticker, migrate to GSAP if animations become complex.

---

## Decision 6: Canvas Sizing Strategy

### Decision: Canvas size matches card display area (dynamic sizing)

### Alternatives Considered

**Option A: Fixed Canvas Size**
- Canvas is always 512x512px
- Scale content to fit
- Simpler sizing logic

**Option B: Dynamic Canvas Size** (Selected)
- Canvas resizes based on number of cards and size
- Width = `cardCount * cardWidth + (cardCount - 1) * spacing`
- Height = `cardHeight`
- More complex but precise

**Option C: Responsive Canvas**
- Canvas fills container (100% width/height)
- Cards scale to fit available space
- Most flexible

### Rationale for Option B

**Pros**:
1. **Pixel-Perfect Rendering**
   - Canvas is exactly the size needed
   - No wasted GPU memory
   - Crisp rendering (no scaling artifacts)

2. **Layout Integration**
   - Canvas fits naturally in React layout
   - Flexbox/Grid work as expected
   - No overflow or clipping issues

3. **Performance**
   - Smaller canvases = less GPU memory
   - Only render visible pixels
   - Multiple small canvases are efficient

**Cons**:
1. **Resize Complexity**
   - Need to recalculate canvas size when cards change
   - Must call `app.renderer.resize(width, height)`
   - Requires re-layout of sprites

**Mitigation**:
- Memoize size calculations
- Only resize when card count or size changes

### Implementation

```typescript
function PixiCardRenderer({ cards, size }) {
  const dimensions = useMemo(() => {
    const cardWidth = CARD_SIZES[size].width;
    const cardHeight = CARD_SIZES[size].height;
    const spacing = 8;

    const width = cards.length * cardWidth + (cards.length - 1) * spacing;
    const height = cardHeight;

    return { width, height };
  }, [cards.length, size]);

  useEffect(() => {
    if (!appRef.current) return;
    appRef.current.renderer.resize(dimensions.width, dimensions.height);
  }, [dimensions]);

  useEffect(() => {
    const app = new Application();
    await app.init({
      width: dimensions.width,
      height: dimensions.height,
      // ...
    });
  }, [dimensions]);
}
```

---

## Summary of Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canvas Architecture | Multiple small canvases | Simpler React integration, natural layout |
| Asset Strategy | Graphics API → Textures (phased) | Unblocks development, migration path |
| Event Handling | PixiJS EventSystem | Native touch/mouse, per-sprite events |
| State Sync | useEffect (React → PixiJS) | Declarative, React-idiomatic, single source of truth |
| Animations | Ticker → GSAP (phased) | Zero deps initially, upgrade if needed |
| Canvas Sizing | Dynamic (content-based) | Pixel-perfect, efficient, layout-friendly |

---

## Future Decisions to Make

1. **Accessibility**: How to make PixiJS canvases screen-reader friendly?
   - Add ARIA labels to canvas elements
   - Provide text alternatives for cards
   - Consider DOM-based fallback for screen readers

2. **Mobile Performance**: Do we need texture compression (ASTC, ETC2)?
   - Profile on actual mobile devices first
   - Implement if frame rate drops below 60fps

3. **Bundle Size**: Is PixiJS v8 full bundle too large?
   - Current: ~400KB (full build)
   - Alternative: Custom build with only needed features
   - Decision: Defer until bundle size becomes an issue

4. **3D Effects**: Use PixiJS Projection for perspective card flips?
   - Requires additional plugin
   - Adds ~30KB to bundle
   - Decision: User feedback will guide this

---

## Lessons from Existing PixiEffects Implementation

The existing `PixiEffects.tsx` component provides valuable lessons:

**What Works Well**:
1. **Fixed overlay approach** for global effects
2. **Transparent background** (`backgroundAlpha: 0`)
3. **Pointer events disabled** (`pointerEvents: 'none'`) for pass-through
4. **High z-index** (10) to sit above content
5. **Resize handling** for responsive behavior

**Adapted for Cards**:
1. **Canvas per area** instead of global canvas
2. **Pointer events enabled** for interactions
3. **Lower z-index** (1) to sit below effects overlay
4. **Content-sized** instead of full-screen
5. **Positioned in DOM** instead of fixed

This dual-canvas strategy (effects overlay + card canvases) provides the best of both worlds.
