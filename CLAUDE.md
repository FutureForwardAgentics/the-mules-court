# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Mule's Court** is a 2-4 player card game based on Isaac Asimov's Foundation universe, built as a single-page React application. The game is inspired by Love Letter, featuring deduction, risk, and elimination mechanics with 16 unique cards.

**Rendering**: This project uses **PixiJS v8** for 2D graphics rendering via WebGL/WebGPU, providing high-performance card animations, visual effects, and interactive gameplay elements.

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

### PixiJS Rendering Engine

**PixiJS v8** is the 2D rendering library used for this project, providing GPU-accelerated graphics via WebGL and WebGPU.

**API Documentation**: Comprehensive PixiJS v8 documentation for LLMs is available in:
- `./public/llms.txt` - Curated links to specific documentation sections
- `./public/llms-full.txt` - Complete API documentation in a single file

**Key PixiJS concepts for this project**:
- **Application**: The main entry point that manages the renderer, stage, and ticker
- **Scene Graph**: Container hierarchy for organizing visual elements (cards, players, effects)
- **Sprites**: 2D image rendering for cards and game elements
- **Textures**: GPU-managed images loaded via the Assets API
- **Ticker**: Game loop for animations and updates
- **Events**: Mouse/touch interaction system for card selection and dragging
- **Graphics**: Vector drawing API for UI elements, borders, and effects
- **Filters**: Post-processing effects (glow, shadows, blur) for visual polish

**Integration approach**: PixiJS should be integrated alongside React, not replace it. React manages game state and UI structure, while PixiJS handles the visual rendering layer. Use refs to mount the PixiJS Application canvas into the React component tree.

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
- Planning PixiJS integration strategy
- Designing new card ability systems
- Refactoring component structure
- Establishing patterns for new modules

### Implementation

**frontend-developer** - Use when:
- Building/modifying React components (GameBoard, PlayerArea, etc.)
- Implementing PixiJS animations and visual effects
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
- PixiJS rendering problems happen

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

**PixiJS Integration Flow:**
1. `code-architect` - Plan integration approach
2. `frontend-developer` - Implement rendering layer
3. `whimsy-injector` - Add animations/effects
4. `test-writer-fixer` - Test rendering logic
