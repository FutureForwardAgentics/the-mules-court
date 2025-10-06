# BabylonJS GUI Implementation Plan for The Mule's Court

## Executive Summary

After comprehensive research of BabylonJS documentation, this plan outlines a GPU-accelerated card game interface using BabylonJS 2D GUI system. The approach leverages BabylonJS's strengths while maintaining React for state management.

## Novel & Unique BabylonJS Features for Card Games

### 1. **GPU-Accelerated 2D Rendering**
- **Advantage**: Unlike DOM-based solutions, all rendering happens on GPU via WebGL/WebGPU
- **Impact**: Smooth 60fps animations even with dozens of cards on screen
- **Use Case**: Simultaneous card flips, slides, and particle effects

### 2. **AdvancedDynamicTexture System**
- **Unique Feature**: Fullscreen 2D UI layer that intercepts all clicks
- **Advantage**: Complete control over z-ordering and layering
- **Use Case**: Card hands overlapping, discard piles, floating tooltips

### 3. **Sprite Sheet Animation in Image Controls**
- **Novel Feature**: Built-in support for animating through sprite frames
- **Advantage**: No external animation library needed
- **Use Case**: Card flip animation frames, character portrait variations

### 4. **Animation Groups with Normalization**
- **Unique Feature**: Synchronize multiple animations with different durations
- **Advantage**: Coordinate complex card interactions (deal + flip + slide)
- **Use Case**: Round start dealing sequence, elimination animations

### 5. **Observable Pattern for Events**
- **Novel Feature**: Event system integrated at engine level
- **Advantage**: Clean separation between rendering and game logic
- **Use Case**: Card click → React state update → re-render flow

### 6. **Grid and Container Layout System**
- **Unique Feature**: Declarative layout within GPU-rendered context
- **Advantage**: Responsive positioning without CSS
- **Use Case**: Player areas, card hands, adaptive layouts for 2-4 players

### 7. **Control Freezing for Performance**
- **Novel Feature**: `freezeControls()` optimizes static UI elements
- **Advantage**: Render only animated elements, freeze static cards
- **Use Case**: Freeze opponent hands, animate only active player's cards

## Architecture Design

### Layer 1: React State Management (Existing)
```
useGameState hook → Game logic and rules
React components → UI structure decisions
```

### Layer 2: BabylonJS Rendering Engine (New)
```
Engine → Scene → AdvancedDynamicTexture → GUI Controls
```

### Layer 3: Integration Pattern
```typescript
React Component (GameBoard)
  └─> useEffect: Initialize BabylonJS Scene
      └─> Create Engine + Canvas
      └─> Create Scene
      └─> Create AdvancedDynamicTexture (fullscreen)
      └─> Populate GUI controls based on game state
  └─> useEffect: Update GUI when game state changes
      └─> React state → Update BabylonJS GUI controls
```

## Implementation Stages

### Stage 1: Foundation Setup
**Goal**: BabylonJS rendering pipeline integrated with React

**Tasks**:
- Create `BabylonCanvas.tsx` component with canvas ref
- Initialize Engine, Scene, AdvancedDynamicTexture in useEffect
- Implement cleanup on unmount
- Establish pattern: React state → BabylonJS GUI sync

**Success Criteria**:
- Canvas renders without errors
- Scene updates on game state changes
- No memory leaks (verified via dev tools)

### Stage 2: Card Component System
**Goal**: Individual card rendering with BabylonJS GUI.Image

**Tasks**:
- Create `BabylonCard` class for card GUI controls
- Implement texture loading for card backs and fronts
- Support multiple portrait variants per character
- Add hover effects using `onPointerEnterObservable`
- Implement click handling via `onPointerUpObservable`

**Card Structure**:
```typescript
class BabylonCard {
  container: Rectangle;        // Card boundary
  background: Image;           // Card front/back texture
  portrait: Image;             // Character portrait
  nameText: TextBlock;         // Card name
  valueText: TextBlock;        // Card value

  flip(): void;                // Animate front ↔ back
  moveTo(x, y): AnimationGroup; // Slide to position
  highlight(): void;           // Show selection state
}
```

**Textures**:
- Card backs: `card_back_3.png`
- Card fronts: `card_front_3.png`
- Portraits: `5_bayta_darell.png`, `5_bayta_darell_1.png`, etc.

**Success Criteria**:
- Cards render with correct textures
- Portrait variants selectable per card instance
- Hover shows visual feedback
- Click events propagate to React

### Stage 3: Animation System
**Goal**: Smooth card animations for game actions

**Animation Types**:
1. **Card Deal** - Slide from deck to player hand
2. **Card Flip** - Rotate effect (simulate 3D flip with scale)
3. **Card Play** - Move to discard pile with fade
4. **Card Draw** - Slide from deck with flip
5. **Elimination** - Fade out + particle effect

**Implementation**:
```typescript
class CardAnimator {
  static createDealAnimation(card: BabylonCard, targetPos: Vector2): AnimationGroup;
  static createFlipAnimation(card: BabylonCard): AnimationGroup;
  static createPlayAnimation(card: BabylonCard, discardPos: Vector2): AnimationGroup;
  static createEliminationEffect(card: BabylonCard): AnimationGroup;
}
```

**Novel Techniques**:
- Use Animation normalization for synchronized dealing
- Chain animations via `onAnimationEndObservable`
- Apply easing functions for natural motion

**Success Criteria**:
- All 5 animation types work smoothly
- Animations chainable (deal → flip → settle)
- No visual glitches or stuttering

### Stage 4: Layout System
**Goal**: Responsive card positioning for 2-4 players

**Layout Requirements**:
- **Player Hand**: Fanned arc of 1-2 cards
- **Discard Pile**: Stacked overlapping cards
- **Deck Position**: Fixed location with card count indicator
- **Opponent Areas**: Compact card backs

**BabylonJS Features**:
- Use `Grid` for player area boundaries
- Use `Rectangle` containers for card groups
- Calculate positions programmatically (fan angle, stack offset)

**Responsive Behavior**:
```typescript
function calculatePlayerLayout(playerCount: 2 | 3 | 4) {
  // Return grid configuration for player areas
  // 2p: horizontal split
  // 3p: triangular arrangement
  // 4p: quadrant layout
}
```

**Success Criteria**:
- All player counts render correctly
- Cards don't overlap inappropriately
- Layout scales to window size

### Stage 5: Interactive Features
**Goal**: Rich interactivity for card selection and targeting

**Features**:
1. **Hover Effects** - Card lifts slightly, glows
2. **Selection State** - Persistent highlight when selected
3. **Target Mode** - Click player to target with card ability
4. **Disabled State** - Grayed out when not playable
5. **Tooltip System** - Show card ability on hover

**BabylonJS Implementation**:
```typescript
card.onPointerEnterObservable.add(() => {
  // Animate card lift
  // Show tooltip with card ability
});

card.onPointerDownObservable.add(() => {
  // Play click sound
  // Set selection state
  // Notify React of card selection
});
```

**Success Criteria**:
- All 5 interactive features work
- No input lag or missed clicks
- Visual feedback is immediate (<16ms)

### Stage 6: Visual Polish
**Goal**: Delightful micro-interactions and effects

**Effects**:
1. **Particle Systems** - Confetti on round win
2. **Glow Effects** - Pulsing glow on protected players
3. **Card Trails** - Motion blur on fast card movement
4. **Smooth Transitions** - All state changes animated
5. **Sound Hooks** - Trigger points for sound effects

**Novel BabylonJS Features**:
- Use `ParticleSystem` for confetti/sparkles
- Use `GlowLayer` for protected status
- Use Animation Groups for coordinated effects

**Success Criteria**:
- Effects enhance without distracting
- Performance remains 60fps
- Effects are subtle and themed

## Technical Decisions

### Why BabylonJS 2D GUI (Not 3D GUI)
- **Reasoning**: Card game is fundamentally 2D interface
- **3D GUI** is for XR/spatial interfaces (overkill)
- **2D GUI** is simpler, more performant, easier to reason about

### React + BabylonJS Integration Pattern
```
React: "What to render" (game state, UI structure)
BabylonJS: "How to render" (GPU acceleration, animations)
```

**Data Flow**:
1. User clicks card in BabylonJS canvas
2. Observable fires → calls React callback
3. React updates game state via `useGameState`
4. React triggers useEffect with new state
5. useEffect updates BabylonJS GUI controls
6. BabylonJS renders new state to canvas

### Texture Loading Strategy
**Approach**: Preload all textures on game start
```typescript
const textureCache = new Map<string, Texture>();

async function preloadTextures(scene: Scene) {
  const textures = [
    'card_back_3.png',
    'card_front_3.png',
    ...allPortraits
  ];

  await Promise.all(
    textures.map(url =>
      new Promise(resolve => {
        const texture = new Texture(url, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
        texture.onLoadObservable.addOnce(() => {
          textureCache.set(url, texture);
          resolve(texture);
        });
      })
    )
  );
}
```

### Performance Optimization
1. **Freeze static controls** - Use `freezeControls()` on opponent hands
2. **Limit particle counts** - Cap confetti at 50 particles
3. **Texture atlasing** - Combine card portraits into sprite sheet (future)
4. **Animation pooling** - Reuse animation objects
5. **Conditional rendering** - Only render visible cards

## File Structure

```
src/
  babylon/
    engine/
      BabylonEngine.ts       # Engine + Scene setup
      BabylonCanvas.tsx      # React wrapper component

    components/
      BabylonCard.ts         # Card GUI control class
      CardAnimator.ts        # Animation factory
      LayoutManager.ts       # Position calculation

    effects/
      ParticleEffects.ts     # Particle systems
      GlowEffects.ts         # Glow layers

    utils/
      TextureLoader.ts       # Texture caching
      ObservableHelpers.ts   # Event bridge to React
```

## Testing Strategy

### Unit Tests (Vitest)
- Test layout calculations (player positions)
- Test animation parameters (duration, easing)
- Test texture cache logic

### Integration Tests
- Test React → BabylonJS state sync
- Test event propagation (click → state update)
- Test cleanup on unmount

### Visual Tests (Manual)
- Verify all card portraits render correctly
- Verify animations are smooth
- Verify responsive layout works

## Migration Path

### Phase 1: Parallel Implementation
- Keep existing React components working
- Build BabylonJS layer alongside
- Toggle via feature flag

### Phase 2: Feature Parity
- Implement all existing features in BabylonJS
- A/B test performance and UX
- Fix any bugs or visual issues

### Phase 3: Cutover
- Make BabylonJS default
- Remove old React card components
- Keep React for game logic only

## Risk Mitigation

### Risk: BabylonJS Learning Curve
**Mitigation**: Start with simple single card, iterate
**Fallback**: Keep React components as backup

### Risk: Performance on Low-End Devices
**Mitigation**: Test on mobile, add quality settings
**Fallback**: Detect GPU and fallback to React if weak

### Risk: Bundle Size Increase
**Mitigation**: BabylonJS modules are already included (package.json)
**Impact**: No additional bundle cost

## Success Metrics

### Performance Targets
- **FPS**: Maintain 60fps with 16 cards on screen
- **Load Time**: Textures load in <2 seconds
- **Memory**: Scene uses <100MB RAM
- **Bundle**: BabylonJS code adds <50KB (already installed)

### UX Targets
- **Animation Duration**: Card actions feel instant (<300ms)
- **Interaction Lag**: Click response <16ms (1 frame)
- **Visual Polish**: Users comment on smooth animations

## Next Steps

1. **Review this plan** - Get feedback on approach
2. **Implement Stage 1** - Foundation setup
3. **Build Bayta's card** - Proof of concept with all 4 portraits
4. **Iterate** - Refine based on learnings
5. **Scale to full deck** - Apply pattern to all 11 card types

## Bayta's Card Specification

As first implementation target:

**Assets**:
- Back: `img/card_back_3.png`
- Front: `img/card_front_3.png`
- Portraits (4 variants):
  - `img/5_bayta_darell.png`
  - `img/5_bayta_darell_1.png`
  - `img/5_bayta_darell_2.png`
  - `img/5_bayta_darell_3.png`

**Card Data** (from cards.ts:65-72):
- Value: 5
- Name: "Bayta Darell"
- Ability: "Choose any player to discard their hand and draw a new card."
- Color: Rose gradient (from-rose-800 to-rose-950)
- Quote: "You must reveal yourself - we're searching for the Mule!"

**Implementation Goal**:
Single interactive card with:
- Portrait variant selection (dropdown/toggle)
- Hover effect (lift + glow)
- Click handler (logs to console)
- Flip animation (front ↔ back)
- Basic positioning

This proves the pattern for remaining 10 card types.
