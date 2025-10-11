import type { GameState, Player, Card } from '../types/game';

/**
 * AI Player Logic
 *
 * Simple heuristic-based AI for automated gameplay demonstration.
 * Prioritizes keeping higher-value cards and makes random target selections.
 */

export interface AIDecision {
  cardId: string;
  targetPlayerId?: string;
  guessedCardValue?: number;
}

/**
 * Make an AI decision for which card to play
 */
export function makeAICardChoice(player: Player, _gameState: GameState): string {
  if (player.hand.length === 0) {
    throw new Error('AI player has no cards to play');
  }

  if (player.hand.length === 1) {
    return player.hand[0].id;
  }

  // Strategy: Play the lower-value card to keep the higher one
  const sortedHand = [...player.hand].sort((a, b) => a.value - b.value);

  // Exception: If holding The Mule (8) and another card, play the other card
  const muleCard = player.hand.find(c => c.value === 8);
  if (muleCard && player.hand.length === 2) {
    const otherCard = player.hand.find(c => c.id !== muleCard.id);
    return otherCard!.id;
  }

  return sortedHand[0].id;
}

/**
 * Choose a target player for card abilities
 */
export function chooseAITarget(
  currentPlayer: Player,
  gameState: GameState,
  _cardValue: number
): string | undefined {
  const eligiblePlayers = gameState.players.filter(p =>
    p.id !== currentPlayer.id &&
    !p.isEliminated &&
    !p.isProtected
  );

  if (eligiblePlayers.length === 0) {
    return undefined;
  }

  // For most targeting cards, choose randomly
  const randomIndex = Math.floor(Math.random() * eligiblePlayers.length);
  return eligiblePlayers[randomIndex].id;
}

/**
 * Guess a card value for Informant (card value 1)
 */
export function makeAICardGuess(): number {
  // Random guess from possible card values (2-8, can't guess Informant)
  const possibleValues = [2, 3, 4, 5, 6, 7, 8];
  const randomIndex = Math.floor(Math.random() * possibleValues.length);
  return possibleValues[randomIndex];
}

/**
 * Get a human-readable description of the AI's action
 */
export function describeAIAction(
  player: Player,
  card: Card,
  targetPlayer?: Player,
  guessedValue?: number
): string {
  let description = `${player.name} played ${card.icon} ${card.name}`;

  if (targetPlayer) {
    description += ` targeting ${targetPlayer.name}`;
  }

  if (guessedValue !== undefined) {
    description += ` (guessed value ${guessedValue})`;
  }

  return description;
}
