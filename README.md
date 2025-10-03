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

- **React 19** + **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Vitest** for testing
- **WebAssembly** (via AssemblyScript) for game validation

### Project Structure

```
src/
├── components/     # React components (GameBoard, GameCard, PlayerArea)
├── hooks/          # Game logic (useGameState, useGameWithAI)
├── types/          # TypeScript type definitions
├── data/           # Card definitions and deck creation
├── wasm/           # WASM loader and TypeScript bindings
├── ai/             # AI opponent logic
├── simulation/     # Game simulation for testing
└── test/           # Test setup and utilities

assembly/           # AssemblyScript source (compiles to WASM)
├── types.ts        # WASM type definitions
├── validation.ts   # Game validation logic in WASM
└── index.ts        # WASM module entry point

build/              # Compiled WASM output
├── release.wasm    # Optimized WASM module (6.1KB)
├── release.js      # WASM JavaScript loader
├── debug.wasm      # Debug WASM with source maps (14KB)
└── *.d.ts          # TypeScript definitions
```

### WebAssembly Integration

This project uses **WebAssembly** for performance-critical game validation logic. The WASM module is written in **AssemblyScript** (a TypeScript-like language that compiles to WASM).

#### Building WASM Modules

```bash
# Build both debug and release WASM modules
npm run asbuild

# Or build individually:
npm run asbuild:debug    # Creates build/debug.wasm (14KB with source maps)
npm run asbuild:release  # Creates build/release.wasm (6.1KB optimized)
```

The WASM module is **automatically built** when you run:
- `npm run dev` - Builds WASM, then starts dev server
- `npm run build` - Builds WASM, then builds production bundle
- `npm test` - Builds WASM, then runs tests

#### How WASM is Used

**WASM is NOT a standalone executable** - it runs inside your web application:

1. **AssemblyScript source** (`assembly/`) is compiled to `.wasm` binary
2. **JavaScript loader** (`build/release.js`) is auto-generated
3. **TypeScript bindings** (`src/wasm/loader.ts`) wrap WASM functions
4. **React components** call TypeScript functions, which call WASM

```typescript
// Example: TypeScript calling WASM
import { getCardValue, WASMCardType } from './wasm/loader';

const value = getCardValue(WASMCardType.MULE);  // Returns 8
```

#### WASM Execution Flow

```
┌─────────────────┐
│ AssemblyScript  │  assembly/validation.ts
│ (TypeScript-    │  export function validateCardPlay() { ... }
│  like syntax)   │
└────────┬────────┘
         │ npm run asbuild
         ↓
┌─────────────────┐
│ WASM Binary     │  build/release.wasm (6.1KB)
│ (WebAssembly)   │  Optimized machine code
└────────┬────────┘
         │
         │ Loaded by JavaScript
         ↓
┌─────────────────┐
│ TypeScript App  │  src/wasm/loader.ts
│ (React/Vite)    │  const result = wasmModule.validateCardPlay(...)
└─────────────────┘
```

#### WASM Functions Available

| Function | Purpose | Returns |
|----------|---------|---------|
| `add(a, b)` | Test function (5 + 3) | `8` |
| `getCardValue(type)` | Get card value by type | `1-8` |
| `validateCardPlay(...)` | Validate if card play is legal | `ValidationResult` |
| `checkFirstSpeakerAutoDiscard(...)` | Check auto-discard rule | `boolean` |
| `validateTarget(...)` | Check if target is valid | `boolean` |

#### Why Use WASM?

- **Performance**: Game validation runs at near-native speed
- **Type Safety**: AssemblyScript provides compile-time type checking
- **Portability**: WASM runs identically across all browsers
- **Future-proof**: Can move more logic to WASM as needed

### Building for Production

```bash
# Full build (includes WASM compilation)
npm run build

# Serve production build locally
npm start

# Or preview with Vite
npm run preview
```

**Production build includes:**
- Compiled WASM modules in `dist/build/`
- Optimized JavaScript bundles
- All assets and static files

## License

This is a fan-made game based on Isaac Asimov's Foundation series. All character names and concepts are property of the Asimov estate.
