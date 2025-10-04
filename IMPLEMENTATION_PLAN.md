# PixiJS Card Graphics Implementation Plan

This plan breaks down the PixiJS card graphics integration into 5 independent, testable stages. Each stage delivers a working feature and can be validated before moving to the next.

---

## Stage 1: Foundation - PixiJS Card Rendering Core

**Goal**: Create the core PixiJS card rendering infrastructure with programmatic graphics (no external assets).

**Success Criteria**:
- [ ] `PixiCardRenderer` component renders a PixiJS canvas
- [ ] Single card renders with Graphics API (gradient background, text, borders)
- [ ] Card displays correct data (name, value, icon, ability)
- [ ] Three size variants work (small, medium, large)
- [ ] Card back rendering works (hidden state)
- [ ] Component tests pass
- [ ] No memory leaks (verified with Chrome DevTools)

**Tests**:
```typescript
// PixiCardRenderer.test.tsx
- renders PixiJS canvas element
- displays card with correct name and value
- shows card back when isRevealed=false
- scales card to correct size (small/medium/large)
- destroys PixiJS app on unmount (no memory leak)
```

**Technical Tasks**:

1. **Create PixiJS type definitions**
   - File: `src/types/pixi.ts`
   - Define `PixiCardRendererProps` interface
   - Define `CardSpriteData` interface

2. **Create CardSprite factory**
   - File: `src/pixi/card/CardSprite.ts`
   - Function: `createCardSprite(card: Card, size: Size): Container`
   - Use Graphics API to draw:
     - Rectangle with gradient fill (match current Tailwind gradients)
     - Border with rounded corners
     - Corner decorative elements
   - Use Text API to render:
     - Card name (top)
     - Card value (top-right)
     - Ability text (bottom, in box)
     - Icon (emoji via Text)
   - Function: `createCardBackSprite(size: Size): Container`
   - Return Container with all graphics/text as children

3. **Create CardRenderer logic**
   - File: `src/pixi/card/CardRenderer.ts`
   - Function: `createCardRenderer(app: Application, cards: Card[], options: RenderOptions): void`
   - Manage Container hierarchy (one Container per card)
   - Position cards in a row (with spacing)
   - Handle size scaling

4. **Create React component wrapper**
   - File: `src/components/PixiCardRenderer.tsx`
   - Props: `cards`, `size`, `isRevealed`, `isInteractive`, `onCardClick`
   - Initialize PixiJS Application in `useEffect`
   - Call `createCardRenderer()` to render cards
   - Clean up on unmount (`app.destroy()`)

5. **Create tests**
   - File: `src/components/PixiCardRenderer.test.tsx`
   - Test rendering, sizing, revealed/hidden states

6. **Create demo page** (temporary, for visual testing)
   - File: `src/components/PixiCardDemo.tsx`
   - Display all 16 cards in a grid
   - Toggle between sizes and revealed/hidden states
   - Visual verification tool

**Files Created**:
- `src/types/pixi.ts`
- `src/pixi/card/CardSprite.ts`
- `src/pixi/card/CardRenderer.ts`
- `src/components/PixiCardRenderer.tsx`
- `src/components/PixiCardRenderer.test.tsx`
- `src/components/PixiCardDemo.tsx` (temporary)

**Status**: Not Started

---

## Stage 2: Interaction - Click & Hover Events

**Goal**: Add interactive hover and click events to PixiJS cards, bridging to React callbacks.

**Success Criteria**:
- [ ] Cards show hover effect (scale 1.05) when pointer enters
- [ ] Cards reset scale when pointer leaves
- [ ] Clicking a card calls `onCardClick` React callback
- [ ] Only interactive cards respond to events (controlled by `isInteractive` prop)
- [ ] Cursor changes to pointer on hover
- [ ] Touch events work on mobile (tested in responsive mode)
- [ ] Integration tests with `PlayerArea` component pass

**Tests**:
```typescript
// PixiCardRenderer.test.tsx (expanded)
- card scales up on hover
- card scales down on pointer leave
- clicking card calls onCardClick with correct card ID
- non-interactive cards do not respond to clicks
- cursor changes to pointer when hovering interactive cards
```

**Technical Tasks**:

1. **Add event handling to CardSprite**
   - File: `src/pixi/card/CardSprite.ts` (modify)
   - Function: `makeCardInteractive(container: Container, cardId: string, onClick: (id: string) => void): void`
   - Set `container.eventMode = 'static'` (PixiJS v8 API)
   - Set `container.cursor = 'pointer'`
   - Add listeners:
     - `pointerover`: Scale to 1.05, add glow filter (optional)
     - `pointerout`: Scale to 1.0, remove glow
     - `pointerdown`: Call `onClick(cardId)`

2. **Update CardRenderer to handle interactions**
   - File: `src/pixi/card/CardRenderer.ts` (modify)
   - Accept `isInteractive` and `onCardClick` in options
   - Conditionally call `makeCardInteractive()` for each card

3. **Update PixiCardRenderer component**
   - File: `src/components/PixiCardRenderer.tsx` (modify)
   - Pass `isInteractive` and `onCardClick` to CardRenderer
   - Memoize onClick callback with `useCallback`

4. **Integration test with PlayerArea**
   - File: `src/components/PlayerArea.test.tsx` (create)
   - Render PlayerArea with PixiCardRenderer
   - Simulate click, verify callback fires
   - Verify only current player's cards are interactive

5. **Update demo page**
   - File: `src/components/PixiCardDemo.tsx` (modify)
   - Add click counter to demonstrate interaction
   - Add toggle for interactive mode

**Files Modified**:
- `src/pixi/card/CardSprite.ts`
- `src/pixi/card/CardRenderer.ts`
- `src/components/PixiCardRenderer.tsx`
- `src/components/PixiCardRenderer.test.tsx`
- `src/components/PixiCardDemo.tsx`

**Files Created**:
- `src/components/PlayerArea.test.tsx`

**Status**: Not Started

---

## Stage 3: Integration - Replace GameCard with PixiCardRenderer

**Goal**: Integrate PixiCardRenderer into the actual game components (PlayerArea, GameBoard).

**Success Criteria**:
- [ ] PlayerArea uses PixiCardRenderer for player hands
- [ ] PlayerArea uses PixiCardRenderer for discard piles (as small icons or mini-cards)
- [ ] GameBoard uses PixiCardRenderer for deck visualization
- [ ] All existing game functionality works (draw, play, discard)
- [ ] All existing tests pass (useGameState, fullGamePlaythrough)
- [ ] Visual parity with old HTML/CSS cards (same layout, similar appearance)
- [ ] GameCard.tsx deleted (or moved to legacy)

**Tests**:
```typescript
// Integration tests (existing tests should pass)
- useGameState.test.ts (UNCHANGED, should pass)
- fullGamePlaythrough.test.ts (UNCHANGED, should pass)
- PlayerArea.test.tsx (verify PixiCardRenderer renders)
- GameBoard.test.tsx (verify deck renders)
```

**Technical Tasks**:

1. **Modify PlayerArea to use PixiCardRenderer**
   - File: `src/components/PlayerArea.tsx` (modify)
   - Replace `GameCard` import with `PixiCardRenderer`
   - Update hand rendering:
     ```tsx
     {/* OLD */}
     {player.hand.map(card => (
       <GameCard key={card.id} card={card} size="small" />
     ))}

     {/* NEW */}
     <PixiCardRenderer
       cards={player.hand}
       size="small"
       isRevealed={isLocalPlayer}
       isInteractive={isCurrentPlayer && isLocalPlayer}
       onCardClick={onCardClick}
     />
     ```
   - Update discard pile rendering:
     - Option A: Keep as emoji icons (current approach)
     - Option B: Use PixiCardRenderer with very small size (recommended)

2. **Modify GameBoard to use PixiCardRenderer for deck**
   - File: `src/components/GameBoard.tsx` (modify)
   - Replace deck placeholder div with:
     ```tsx
     <PixiCardRenderer
       cards={[gameState.deck[0]]} {/* Just show top card */}
       size="medium"
       isRevealed={false} {/* Always show card back */}
       isInteractive={false}
     />
     ```

3. **Handle empty states**
   - When `cards` array is empty (no cards in hand):
     - PixiCardRenderer should render nothing (or placeholder text)
   - When deck is empty:
     - Show empty space or "Deck Empty" message

4. **Update CardRenderer to handle layouts**
   - File: `src/pixi/card/CardRenderer.ts` (modify)
   - Add `layout` option: `horizontal`, `vertical`, `stack`
   - Horizontal: Cards in a row (hand)
   - Vertical: Cards in a column (rare)
   - Stack: Cards overlapping (discard pile, deck)

5. **Test game flow**
   - Start game
   - Draw card (verify PixiJS updates)
   - Play card (verify PixiJS updates, card removed from hand)
   - Discard pile updates (verify PixiJS shows played cards)
   - End round, start new round (verify state resets)

6. **Delete old GameCard.tsx**
   - Move to `GameCard.legacy.tsx` (backup)
   - Or delete entirely if confident

7. **Update tests**
   - Run all existing tests
   - Fix any failing tests (likely due to component structure changes)
   - Add new tests for PixiCardRenderer in PlayerArea/GameBoard

**Files Modified**:
- `src/components/PlayerArea.tsx`
- `src/components/GameBoard.tsx`
- `src/pixi/card/CardRenderer.ts`
- `src/components/PixiCardRenderer.tsx`

**Files Deleted**:
- `src/components/GameCard.tsx` (or moved to `.legacy.tsx`)

**Files Created**:
- `src/components/GameBoard.test.tsx` (if doesn't exist)

**Status**: Not Started

---

## Stage 4: Animation - Card Movement & Transitions

**Goal**: Add smooth animations for card actions (deal, play, discard, flip).

**Success Criteria**:
- [ ] Cards animate when dealt at round start (slide from deck + fade in)
- [ ] Cards animate when played (slide to center + scale up + fade out)
- [ ] Cards animate when discarded (slide to discard pile + scale down)
- [ ] Card flip animation when revealing hidden cards
- [ ] Hover animation smooth (not instant snap)
- [ ] Animations don't block game logic (can click during animation)
- [ ] Frame rate stays at 60fps (verified with DevTools)

**Tests**:
```typescript
// CardAnimations.test.ts
- animateDeal completes in correct duration
- animatePlay moves card to target position
- animateFlip swaps texture at midpoint
- animations can be interrupted/cancelled
```

**Technical Tasks**:

1. **Create animation utilities**
   - File: `src/pixi/card/CardAnimations.ts`
   - Function: `animateDeal(sprite: Container, from: Point, to: Point, duration: number): Promise<void>`
   - Function: `animatePlay(sprite: Container, to: Point, duration: number): Promise<void>`
   - Function: `animateDiscard(sprite: Container, to: Point, duration: number): Promise<void>`
   - Function: `animateFlip(sprite: Container, onMidpoint: () => void, duration: number): Promise<void>`
   - Use PixiJS Ticker for frame-by-frame updates
   - Implement easing functions (easeOut, easeInOut)

2. **Add animation triggers to CardRenderer**
   - File: `src/pixi/card/CardRenderer.ts` (modify)
   - Detect when cards are added (deal animation)
   - Detect when cards are removed (play/discard animation)
   - Store previous card positions for diff

3. **Update PixiCardRenderer to trigger animations**
   - File: `src/components/PixiCardRenderer.tsx` (modify)
   - Add `useEffect` to watch `cards` array changes
   - Diff cards to detect additions/removals
   - Call appropriate animation functions

4. **Integrate with game actions**
   - When `drawCard()` is called:
     - New card animates from deck position to hand
   - When `playCard()` is called:
     - Card animates from hand to center (play area)
     - Particle effect triggers (existing PixiEffects)
     - Card then animates to discard pile
   - When round starts:
     - All initial cards animate from deck to hands

5. **Add animation preferences**
   - File: `src/contexts/GameSettingsContext.tsx` (create if doesn't exist)
   - Setting: `enableAnimations` (boolean, default true)
   - Setting: `animationSpeed` (0.5x, 1x, 2x)
   - Allow users to disable animations for faster play

6. **Polish hover animation**
   - Replace instant scale with smooth tween (100ms)
   - Add subtle glow effect on hover (optional)

7. **Test animations**
   - Visual testing in demo page
   - Performance profiling (ensure 60fps)
   - Test on mobile devices (touch events)

**Files Created**:
- `src/pixi/card/CardAnimations.ts`
- `src/pixi/card/CardAnimations.test.ts`
- `src/contexts/GameSettingsContext.tsx` (optional)

**Files Modified**:
- `src/pixi/card/CardRenderer.ts`
- `src/components/PixiCardRenderer.tsx`

**Status**: Not Started

---

## Stage 5: Asset Pipeline - Real Card Artwork (Optional)

**Goal**: Replace programmatic graphics with professional card artwork (textures).

**Success Criteria**:
- [ ] 16 unique card images sourced/created
- [ ] Card back image sourced/created
- [ ] Texture atlas generated (spritesheet.json + spritesheet.webp)
- [ ] Assets load via PixiJS Assets API
- [ ] Texture-based sprites render correctly
- [ ] Fallback to Graphics API if textures fail to load
- [ ] Loading screen shows while assets load
- [ ] Asset size is reasonable (<2MB total)

**Tests**:
```typescript
// CardTextures.test.ts
- loadCardTextures resolves successfully
- getCardTexture returns valid texture for each card type
- handles missing texture gracefully (fallback)
- textures are cached (second call is instant)
```

**Technical Tasks**:

1. **Source card artwork**
   - Option A: Commission artist (highest quality)
   - Option B: AI-generated via DALL-E/Midjourney
   - Option C: Use placeholder images from free sources
   - Specifications: 512x768px, PNG or WebP, Foundation universe theme

2. **Create texture atlas**
   - Tool: TexturePacker (free tier) or `@pixi/spritesheet`
   - Input: 17 images (16 cards + 1 back)
   - Output: `spritesheet.json` + `spritesheet.webp`
   - Settings:
     - Max size: 2048x2048px
     - Padding: 2px
     - Format: JSON (pixi.js compatible)
     - Extrude: 1px (prevent bleeding)

3. **Create asset loading utilities**
   - File: `src/pixi/card/CardTextures.ts`
   - Function: `loadCardTextures(): Promise<void>`
     - Calls `Assets.load('/assets/cards/spritesheet.json')`
     - Caches textures in memory
   - Function: `getCardTexture(type: CardType): Texture`
     - Returns texture for card type
     - Throws error if not loaded

4. **Update CardSprite to use textures**
   - File: `src/pixi/card/CardSprite.ts` (modify)
   - Function: `createCardSpriteFromTexture(card: Card, size: Size): Sprite`
     - Create Sprite from texture
     - Scale to correct size
     - Add overlay for text (name, value, ability)
   - Keep old Graphics-based function as fallback

5. **Add loading screen**
   - File: `src/components/AssetLoader.tsx` (create)
   - Show loading spinner while `loadCardTextures()` runs
   - Display progress if possible (PixiJS Assets API supports progress)
   - Error handling: Show error message if load fails

6. **Update App to load assets**
   - File: `src/App.tsx` (modify)
   - Call `loadCardTextures()` before rendering game
   - Show `<AssetLoader />` while loading

7. **Optimize assets**
   - Compress images with TinyPNG or ImageOptim
   - Generate WebP + PNG fallback
   - Target <2MB total size

8. **Test asset loading**
   - Test on slow network (throttle in DevTools)
   - Test with missing assets (404 error)
   - Test cache behavior (reload page)

**Files Created**:
- `public/assets/cards/spritesheet.json`
- `public/assets/cards/spritesheet.webp`
- `public/assets/cards/textures/*.webp` (17 images)
- `src/pixi/card/CardTextures.ts`
- `src/pixi/card/CardTextures.test.ts`
- `src/components/AssetLoader.tsx`

**Files Modified**:
- `src/pixi/card/CardSprite.ts`
- `src/App.tsx`

**Status**: Not Started

---

## Stage Completion Checklist

After completing each stage:

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Visual testing done in browser
- [ ] Performance profiling shows no regressions (60fps maintained)
- [ ] Memory profiling shows no leaks (Chrome DevTools)
- [ ] Works on mobile (tested in responsive mode or actual device)
- [ ] Code reviewed (self-review or peer review)
- [ ] Documentation updated (if needed)

---

## Dependencies & Risks

### Dependencies Between Stages

```
Stage 1 (Foundation)
  ↓
Stage 2 (Interaction)
  ↓
Stage 3 (Integration) ← Can start Stage 4 in parallel
  ↓
Stage 4 (Animation)
  ↓
Stage 5 (Assets) ← Optional, can defer indefinitely
```

**Critical Path**: Stages 1-3 must be done sequentially. Stage 4 can start after Stage 3 is complete. Stage 5 is optional.

### Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| PixiJS learning curve slows Stage 1 | High | Allocate extra time, refer to PixiJS docs in `public/llms.txt` |
| Existing tests break in Stage 3 | Medium | Keep `GameCard.tsx` as backup, incremental integration |
| Animations cause performance issues | Medium | Profile early, use sprite pooling if needed |
| Asset sourcing delays Stage 5 | Low | Stage 5 is optional, can ship without it |
| React/PixiJS state sync bugs | High | Write thorough integration tests in Stage 3 |

---

## Success Metrics

### Performance Targets

- **Frame Rate**: 60fps sustained during gameplay
- **Initial Load**: <2s to first render (excluding asset loading)
- **Asset Load**: <5s to load all textures (Stage 5)
- **Memory Usage**: <100MB total (measured in Chrome DevTools)
- **Bundle Size**: <50KB added for PixiJS integration code (PixiJS itself is ~400KB)

### Quality Targets

- **Test Coverage**: >80% for new PixiJS code
- **Visual Parity**: Stage 3 should look identical to current HTML/CSS cards
- **Accessibility**: Canvas elements have ARIA labels, keyboard navigation works
- **Mobile Support**: Touch events work, scales correctly on small screens

---

## Post-Implementation

### Cleanup Tasks

After all stages complete:

1. **Remove demo page**
   - Delete `src/components/PixiCardDemo.tsx`

2. **Remove legacy code**
   - Delete `src/components/GameCard.legacy.tsx` (if exists)

3. **Update documentation**
   - Update `CLAUDE.md` with PixiJS integration notes
   - Add PixiJS architecture section to README

4. **Performance audit**
   - Run Lighthouse audit
   - Profile with Chrome DevTools
   - Optimize if needed

### Future Enhancements

After successful deployment:

- [ ] 3D card flips (PixiJS Projection plugin)
- [ ] Particle effects per card (shimmer on high-value cards)
- [ ] Sound effects (card whoosh, play sounds)
- [ ] Animated card backgrounds (per-character themes)
- [ ] Card shine effect (light sweep on hover)
- [ ] Accessibility improvements (screen reader descriptions)

---

## Notes

- **Incremental commits**: Commit after each stage passes tests
- **Branch strategy**: Use feature branch `feature/pixi-card-graphics`
- **Code review**: Request review after Stages 2 and 4
- **User testing**: Get feedback after Stage 3 before proceeding to animations

**Estimated Timeline**:
- Stage 1: 4-6 hours
- Stage 2: 2-3 hours
- Stage 3: 3-4 hours
- Stage 4: 4-6 hours
- Stage 5: 6-8 hours (if pursued)

**Total**: 13-19 hours (excluding optional Stage 5)
