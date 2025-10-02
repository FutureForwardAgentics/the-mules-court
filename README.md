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

### Project Structure

```
src/
├── components/     # React components (GameBoard, GameCard, PlayerArea)
├── hooks/          # Game logic (useGameState)
├── types/          # TypeScript type definitions
├── data/           # Card definitions and deck creation
└── test/           # Test setup and utilities
```

### Building for Production

```bash
npm run build
npm run preview
```

## License

This is a fan-made game based on Isaac Asimov's Foundation series. All character names and concepts are property of the Asimov estate.
