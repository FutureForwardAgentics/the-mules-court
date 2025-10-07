# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Mule's Court** is a 2-4 player card game based on Isaac Asimov's Foundation universe, built as a single-page React application. The game is inspired by Love Letter, featuring deduction, risk, and elimination mechanics with 16 unique cards.

**Rendering**: This project uses **BabylonJS** for graphics rendering via WebGL/WebGPU, providing high-performance card animations, visual effects, and interactive gameplay elements.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Type-check with tsc then build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint on all files
```

### Testing
```bash
npm test             # Run Vitest in watch mode
npm run test:ui      # Run Vitest with UI interface
npm run test:coverage # Generate test coverage report
```

## Architecture

### Core Game State Pattern

The application uses a **centralized state management pattern** via the `useGameState` hook (`src/hooks/useGameState.ts`), which manages the entire game lifecycle:

- **Phase-based gameplay**: `setup` → `draw` → `play` → `round-end` → `game-end`
- **Immutable state updates**: All state mutations return new objects
- **Validation at boundaries**: Game rules enforced in state transitions, not components

### Key Architectural Decisions

1. **Delayed initialization**: Game state is only created after the user selects player count and starts the game (`App.tsx:68-70`). This prevents initialization errors during initial render.

2. **Separation of concerns**:
   - `src/types/game.ts` - All TypeScript interfaces and types
   - `src/data/cards.ts` - Card definitions, deck creation, shuffling
   - `src/hooks/useGameState.ts` - Game logic, state management, rule enforcement
   - `src/components/` - Pure presentational components

3. **Card identity**: Each card instance has a unique `id` (e.g., `informant-0`, `informant-1`) even though multiple cards share the same `type`. This allows tracking individual cards through the game lifecycle.

4. **Player state tracking**: Each player maintains:
   - `hand` - Current cards (1 during draw phase, 2 during play phase)
   - `discardPile` - Played cards used for tiebreaker scoring
   - `devotionTokens` - Cumulative wins across rounds
   - `isProtected` - Immunity flag (from Shielded Mind card)
   - `isEliminated` - Round elimination status

### Game Flow

```
Setup → Deal 1 card to each player
  ↓
Draw Phase → Current player draws 1 card (now has 2)
  ↓
Play Phase → Player plays 1 card, activates ability
  ↓
Check win conditions:
  - Only 1 player remaining? → Round end
  - Deck empty? → Highest card value wins
  - Otherwise → Next player's draw phase
  ↓
Round End → Award devotion token, check game end
  ↓
Check if winner has enough tokens:
  - Yes → Game end
  - No → Reset for new round
```

### Testing Approach

- **Vitest** with JSDOM for React component testing
- **Testing Library** (@testing-library/react) for component queries
- Test setup in `src/test/setup.ts` (imported by vitest.config.ts)
- Tests co-located with implementation files (e.g., `useGameState.test.ts`)

### Component Structure

- **App.tsx** - Entry point, player count selection, conditional game initialization
- **GameBoard.tsx** - Main game container, renders all players and central controls
- **PlayerArea.tsx** - Individual player display (hand, discard pile, tokens, status)
- **GameCard.tsx** - Reusable card visualization component

### Styling

- **Tailwind CSS 4.x** with PostCSS integration
- Gradient backgrounds and themed card colors per character
- Responsive grid layout (1 column mobile, 2 columns desktop)

### BabylonJS Rendering Engine

**BabylonJS** is the rendering library used for this project, providing GPU-accelerated graphics via WebGL and WebGPU.

**API Documentation**: Comprehensive BabylonJS documentation is available at https://doc.babylonjs.com/

**Key BabylonJS concepts for this project**:
- **Engine**: The main entry point that manages the rendering pipeline
- **Scene**: Contains all game objects, cameras, and lights
- **GUI (AdvancedDynamicTexture)**: 2D UI system for rendering cards and effects
- **Meshes**: 3D objects that can be used for visual elements
- **ParticleSystem**: For visual effects like explosions, confetti, etc.
- **Animations**: Built-in animation system for smooth transitions
- **Color3/Color4**: Color management for materials and effects

**Integration approach**: BabylonJS is integrated alongside React. React manages game state and UI structure, while BabylonJS handles the visual rendering layer. Use refs to mount the BabylonJS Engine canvas into the React component tree.

## Important Patterns

### State Updates Must Follow Phases

The `playCard` function only works during the `play` phase, and requires the player to have 2 cards. Similarly, `drawCard` only works during the `draw` phase. Always respect the current phase when implementing new features.

### Card Removal for Different Player Counts

The game removes cards from the deck before dealing based on player count:
- 2 players: Remove 3 cards (1 face-up, stored in `removedCard`)
- 3 players: Remove 1 card face-down
- 4 players: No cards removed

This is handled in `initializeRound()` at `useGameState.ts:134-136`.

### Protection Mechanics

The `isProtected` flag is cleared at the start of each player's turn (except for the player who just played Shielded Mind). See `useGameState.ts:48-52`.

## Game Rules Reference

- **Tokens to win**: 7 (2p), 5 (3p), 4 (4p)
- **Deck composition**: 16 cards total (5 Informants + 11 unique characters)
- **Card values**: 1-8 (Informant to The Mule)
- **Tiebreaker**: If deck empties, highest card value wins; ties broken by discard pile total

## Agent Usage Guidelines

This project has specialized agents in `.claude/agents/` for different development workflows. Use the appropriate agent based on the task:

### Planning & Architecture

**code-architect** - Use when:
- Planning new game features (e.g., "Design architecture for multiplayer mode")
- Planning BabylonJS integration strategy
- Designing new card ability systems
- Refactoring component structure
- Establishing patterns for new modules

### Implementation

**frontend-developer** - Use when:
- Building/modifying React components (GameBoard, PlayerArea, etc.)
- Implementing BabylonJS animations and visual effects
- Working with Tailwind CSS styling
- Optimizing React rendering performance
- Implementing responsive layouts
- Adding new UI features or screens

**whimsy-injector** - Use PROACTIVELY after:
- Any UI/UX implementation or change
- Creating new game screens or flows
- Adding loading states, errors, or empty states
- Implementing new animations or transitions
- The agent adds delightful micro-interactions and personality

### Testing & Debugging

**test-writer-fixer** - Use when:
- Code changes are made (proactively run tests)
- Adding new game logic that needs test coverage
- Test failures occur after refactoring
- Vitest tests need updating for new behavior
- Critical game logic lacks tests

**debugger** - Use when:
- Encountering errors or unexpected behavior
- Test failures need investigation
- Game state bugs occur
- Performance issues arise
- BabylonJS rendering problems happen

### Quality Assurance

**code-reviewer** - Use:
- After implementing significant features
- Before major commits
- When code quality needs assessment
- To catch security issues or code smells

### Specialized Tasks

**visual-storyteller** - Use for:
- Creating game tutorial graphics/infographics
- Designing onboarding visual flows
- Building marketing materials
- Explaining complex game mechanics visually

**changelog-generator** - Use for:
- Documenting sprint work
- Creating release notes
- Generating change summaries for commits

### Not Applicable to This Project

❌ **backend-architect** - This is a pure frontend SPA with no backend
❌ **react-native-dev** - This is React web, not React Native

### Common Workflow Patterns

**New Feature Flow:**
1. `code-architect` - Design the feature architecture
2. `frontend-developer` - Implement the UI/logic
3. `whimsy-injector` - Add delightful touches
4. `test-writer-fixer` - Write/run tests
5. `code-reviewer` - Final quality check

**Bug Fix Flow:**
1. `debugger` - Identify root cause
2. `frontend-developer` - Implement fix
3. `test-writer-fixer` - Verify fix with tests
4. `code-reviewer` - Review the changes

**BabylonJS Integration Flow:**
1. `code-architect` - Plan integration approach
2. `frontend-developer` - Implement rendering layer
3. `whimsy-injector` - Add animations/effects
4. `test-writer-fixer` - Test rendering logic

## BabylonJS Critical Lessons Learned

This project uses `babylon.js` for 3D rendering. The documents can be found at https://doc.babylonjs.com and the API calls can be found at https://doc.babylonjs.com/typedoc/modules/BABYLON.

### Double-Sided Objects (CRITICAL)

**DO NOT use `Mesh.DOUBLESIDE` for objects that need different textures on each side.**

❌ **WRONG Approach** (what doesn't work):
- Using `Mesh.DOUBLESIDE` sideOrientation → shows SAME texture on both sides (mirrored)
- Setting `backFaceCulling = false` → prevents proper face culling, causes mirroring issues
- Using `frontUVs`/`backUVs` for separate textures → only works for texture atlases, not separate images
- Using `uScale = -1` to flip textures → causes textures to disappear or not render properly

✅ **CORRECT Approach** (double-sided with different textures):
1. Create **TWO separate plane meshes** (front and back)
2. Both use `Mesh.FRONTSIDE` orientation (NOT DOUBLESIDE)
3. Both use `backFaceCulling = true` (NOT false!) - like CSS `backface-visibility: hidden`
4. Parent back mesh to front mesh for unified transforms
5. Rotate back mesh 180° on Y axis in local space: `new Vector3(0, Math.PI, 0)`
6. Position back mesh slightly offset on Z: `new Vector3(0, 0, -0.001)` to prevent z-fighting
7. Each mesh has its own separate material/texture

**Code Example:**
```typescript
// Create front mesh
const frontMesh = MeshBuilder.CreatePlane("front", {
  width: 2, height: 3,
  sideOrientation: Mesh.FRONTSIDE  // FRONTSIDE, not DOUBLESIDE
}, scene);

const frontMaterial = new StandardMaterial("frontMat", scene);
frontMaterial.diffuseTexture = frontTexture;
frontMaterial.backFaceCulling = true;  // TRUE, not false!
frontMesh.material = frontMaterial;

// Create back mesh
const backMesh = MeshBuilder.CreatePlane("back", {
  width: 2, height: 3,
  sideOrientation: Mesh.FRONTSIDE  // FRONTSIDE, not DOUBLESIDE
}, scene);

const backMaterial = new StandardMaterial("backMat", scene);
backMaterial.diffuseTexture = backTexture;
backMaterial.backFaceCulling = true;  // TRUE, not false!
backMesh.material = backMaterial;

// Parent and position
backMesh.parent = frontMesh;
backMesh.position = new Vector3(0, 0, -0.001);  // Slight offset
backMesh.rotation = new Vector3(0, Math.PI, 0);  // 180° on Y
```

**This mirrors the HTML5 approach:**
- HTML: Two divs with `backface-visibility: hidden`, back div rotated 180°
- BabylonJS: Two meshes with `backFaceCulling = true`, back mesh rotated 180°

### Texture Quality Settings

For crisp text/graphics at oblique viewing angles:
- Use `texture.anisotropicFilteringLevel = 16` (maximum quality)
- Use `texture.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE)`
- Resolution: 2048×3072 is sufficient for cards (4K+ causes performance issues)
- Focus on contrast (opaque backgrounds: 0.9-0.95 alpha) rather than just increasing resolution

### Texture Flipping

- `texture.uScale = -1` can cause textures to disappear or render incorrectly
- If mirroring is needed, consider rotating the mesh instead or fixing the source image