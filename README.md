# The Mule's Court

A Foundation Universe Card Game

> _"When the Mule touches your mind, you know no better love"_

## Overview

**The Mule's Court** is a 2-4 player card game of deduction, risk, and elimination set in Isaac Asimov's Foundation universe. Inspired by Love Letter, this game explores the tragic irony of the Mule's mind control: every player believes they act independently, but all have been emotionally converted.

You are not trying to reach the Mule. You have already been touched by his power—your emotions fundamentally rewritten, though you do not consciously know it. Every clever play, every successful round, is simply proof of how thoroughly the Mule has conquered your mind.

## Quick Start

### Installation

```bash
npm install
```

### Running the Game

```bash
npm run dev
```

Visit `http://localhost:5173` to play.

### Running Tests

```bash
npm test          # Run tests
npm run test:ui   # Run with UI
npm run test:coverage  # Generate coverage report
```

## Game Rules

### Objective

Be the first player to earn the required number of **Devotion Tokens**:
- **2 players**: 7 tokens to win
- **3 players**: 5 tokens to win
- **4 players**: 4 tokens to win

### Setup

1. Each player starts with 0 Devotion Tokens
2. Shuffle the 16-card deck
3. Remove cards from play:
   - **2 players**: Remove 3 cards (1 face-up, 2 face-down)
   - **3 players**: Remove 1 card face-down
   - **4 players**: No cards removed
4. Deal 1 card to each player

### Turn Structure

On your turn:

1. **Draw** a card from the deck (you now have 2 cards)
2. **Play** one of your two cards face-up
3. **Resolve** the card's ability (targeting other players)
4. **End** your turn (the played card goes to your discard pile)

### Winning a Round

A round ends when:
- Only one player remains (others eliminated) → That player wins
- The deck runs out → Player with the highest card value wins (ties broken by discard pile total)

The round winner earns 1 Devotion Token. Reset the round and continue until a player reaches the winning token count.

### Elimination

You are eliminated from the round if:
- Another player's card effect eliminates you
- You discard **The Mule** card (value 8)
- You must discard **The First Speaker** when holding Mayor Indbur or either Darell

## The Cards

The deck contains 16 cards representing characters from the Foundation series:

| Card | Value | Count | Ability |
|------|-------|-------|---------|
| **Informant** | 1 | 5 | Name a character (not Informant). If another player has that card, they are eliminated. |
| **Han Pritcher** | 2 | 1 | Look at another player's hand. |
| **Bail Channis** | 2 | 1 | Look at another player's hand. |
| **Ebling Mis** | 3 | 1 | Compare hands with another player. Lower value is eliminated. |
| **Magnifico Giganticus** | 3 | 1 | Compare hands with another player. Lower value is eliminated. |
| **Shielded Mind** | 4 | 2 | Until your next turn, ignore effects from other players. |
| **Bayta Darell** | 5 | 1 | Choose any player to discard their hand and draw a new card. |
| **Toran Darell** | 5 | 1 | Choose any player to discard their hand and draw a new card. |
| **Mayor Indbur** | 6 | 1 | Trade hands with another player. |
| **The First Speaker** | 7 | 1 | If you have this with Mayor Indbur or either Darell, you must discard this card. |
| **The Mule** | 8 | 1 | If you discard this card, you are eliminated from the round. |

### Key Mechanics

- **Protection**: Playing Shielded Mind grants immunity until your next turn
- **Targeting**: You cannot target eliminated or protected players
- **The Mule**: Never willingly discard The Mule (value 8)—hold it to win if the deck runs out
- **The First Speaker**: Automatically discards if paired with specific high-value cards

## Development

### Tech Stack

- **React 19** + **TypeScript** with strict type checking
- **Vite** for fast development and HMR
- **Tailwind CSS 4** for modern utility-first styling
- **PixiJS v8** for GPU-accelerated visual effects and animations
- **Vitest** + **Testing Library** for unit and integration testing
- **IndexedDB** for game session recording and replay

### Features

- **Visual Effects**: GPU-accelerated particle effects, animations, and visual feedback using PixiJS v8
  - Particle burst animations on card plays
  - Elimination effects (expanding red circles)
  - Protection effects (pulsing cyan shields for Shielded Mind)
  - Auto-triggered visual feedback based on game state changes
- **AI Opponent**: Play against computer-controlled opponents with strategic decision-making
- **Game Session Recording**: Complete game history captured via IndexedDB for replay and analysis
- **Type-Safe Architecture**: Full TypeScript coverage with strict type checking and validation
- **Modular Card Effects**: Individual effect functions for each card type with shared helper utilities

### Project Structure

```
src/
├── components/     # React UI components
│   ├── GameBoard.tsx        # Main game board layout
│   ├── GameCard.tsx         # Individual card component
│   ├── PlayerArea.tsx       # Player hand and status display
│   ├── CardInteractionModal.tsx  # Card target selection
│   ├── PixiEffects.tsx      # PixiJS canvas overlay for visual effects
│   └── SessionViewer.tsx    # Game session replay viewer
├── contexts/       # React context providers
│   └── PixiEffectsContext.tsx  # Effect trigger management
├── hooks/          # Custom React hooks
│   ├── useGameState.ts      # Core game state management
│   └── useGameWithAI.ts     # Game state + AI integration
├── game/           # Core game logic
│   ├── cardEffects.ts       # Card effect implementations (11 per-card functions)
│   └── gameValidation.ts    # Card play and target validation
├── services/       # External services
│   └── gameDatabase.ts      # IndexedDB game session recording
├── ai/             # AI opponent
│   └── simpleAI.ts          # Strategic AI decision-making
├── data/           # Static game data
│   └── cards.ts             # Card definitions and deck creation
├── types/          # TypeScript type definitions
│   └── game.ts              # Game state, card, player types
├── simulation/     # Testing utilities
│   └── gameSimulator.ts     # Full game simulation for testing
└── test/           # Test configuration
    └── setup.ts             # Vitest + Testing Library setup
```

### Game Validation

All game logic validation is implemented in **pure TypeScript** (`src/game/gameValidation.ts` and `src/game/cardEffects.ts`):

- **Card Play Validation**: Ensures cards are played legally according to game rules
- **Target Validation**: Validates player targeting for card effects (protection, elimination)
- **Forced Play Detection**: Automatically enforces First Speaker auto-discard rule
- **Effect Resolution**: 11 individual card effect functions with shared helper utilities

> **Note**: The project includes an experimental AssemblyScript WASM module (`assembly/`) for performance research, but the game currently runs entirely on TypeScript validation. WASM is **not built automatically**. To experiment with WASM compilation, run `npm run asbuild` manually.

### Building for Production

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Or serve with simple HTTP server
npm start
```

**Production build includes:**
- Optimized JavaScript bundles (React, PixiJS, game logic)
- Compiled CSS (Tailwind)
- Static assets (images, fonts)
- Source maps for debugging

## Recent Updates

### Graphics Enhancements (October 2025)

- **PixiJS v8 Integration**: Added GPU-accelerated visual effects system
  - Particle burst animations on card plays
  - Elimination effect (expanding red circle with particle spray)
  - Protection effect (pulsing cyan shield for Shielded Mind)
  - PixiJS canvas overlay integrated with React component tree
  - Auto-triggered effects based on game state changes

### Architecture Improvements

- **Card Effect Refactoring**: Migrated from monolithic switch statement to individual per-card effect functions
  - `applyInformantEffect()` - Guess card type elimination
  - `applyHanPritcherEffect()` / `applyBailChannisEffect()` - View hand
  - `applyEblingMisEffect()` / `applyMagnificoEffect()` - Compare hands
  - `applyShieldedMindEffect()` - Grant protection
  - `applyBaytaDarellEffect()` / `applyToranDarellEffect()` - Discard and draw
  - `applyMayorIndbur()` - Trade hands
  - `applyFirstSpeakerEffect()` - Auto-discard logic
  - `applyMuleEffect()` - Elimination on play
  - Internal helper functions for shared logic (DRY principle)

- **State Change Callback Pattern**: Event recording system now captures correct updated game state in real-time

### Bug Fixes

- **The Mule Elimination**: Fixed player elimination when The Mule card is played (was not eliminating correctly)
- **Event Recording Synchronization**: Events now capture the correct game state after state updates
- **TypeScript Strict Mode**: Resolved all strict type checking issues for improved type safety

## License

This is a fan-made game based on Isaac Asimov's Foundation series. All character names and concepts are property of the Asimov estate.
