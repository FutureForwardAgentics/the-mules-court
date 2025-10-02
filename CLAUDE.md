# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Mule's Court** is a 2-4 player card game based on Isaac Asimov's Foundation universe, built as a single-page React application. The game is inspired by Love Letter, featuring deduction, risk, and elimination mechanics with 16 unique cards.

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
