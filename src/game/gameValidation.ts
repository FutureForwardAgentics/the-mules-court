import type { GameState, Card, Player } from '../types/game';

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate if a card can be played
 */
export function validateCardPlay(
  gameState: GameState,
  playerId: string,
  cardId: string
): ValidationResult {
  // Must be play phase
  if (gameState.phase !== 'play') {
    return { valid: false, reason: 'Not in play phase' };
  }

  // Must be current player
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex !== gameState.currentPlayerIndex) {
    return { valid: false, reason: 'Not your turn' };
  }

  const player = gameState.players[playerIndex];

  // Player must not be eliminated
  if (player.isEliminated) {
    return { valid: false, reason: 'Player is eliminated' };
  }

  // Must have at least 1 card to play
  if (player.hand.length < 1) {
    return { valid: false, reason: 'No cards in hand' };
  }

  // Card must be in hand
  const card = player.hand.find(c => c.id === cardId);
  if (!card) {
    return { valid: false, reason: 'Card not in hand' };
  }

  // Check if First Speaker must be discarded instead
  const hasFirstSpeaker = player.hand.some(c => c.type === 'first-speaker');
  const hasForbiddenCard = player.hand.some(
    c => c.type === 'mayor-indbur' || c.type === 'bayta-darell' || c.type === 'toran-darell'
  );

  if (hasFirstSpeaker && hasForbiddenCard && card.type !== 'first-speaker') {
    return {
      valid: false,
      reason: 'You must discard First Speaker when holding Mayor Indbur or either Darell',
    };
  }

  return { valid: true };
}

/**
 * Get the card that must be played (if any forced play exists)
 */
export function getForcedPlay(player: Player): Card | null {
  const hasFirstSpeaker = player.hand.some(c => c.type === 'first-speaker');
  const hasForbiddenCard = player.hand.some(
    c => c.type === 'mayor-indbur' || c.type === 'bayta-darell' || c.type === 'toran-darell'
  );

  if (hasFirstSpeaker && hasForbiddenCard) {
    return player.hand.find(c => c.type === 'first-speaker') || null;
  }

  return null;
}

/**
 * Get all valid cards that can be played
 */
export function getValidPlays(player: Player): Card[] {
  if (player.hand.length < 2) {
    return player.hand; // Can play any card if only 1 left
  }

  const forcedCard = getForcedPlay(player);
  if (forcedCard) {
    return [forcedCard];
  }

  return player.hand;
}

/**
 * Validate if a target selection is valid for a card effect
 */
export function validateTarget(
  gameState: GameState,
  playerId: string,
  targetPlayerId: string,
  cardType: string
): ValidationResult {
  const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);

  if (!targetPlayer) {
    return { valid: false, reason: 'Target player not found' };
  }

  if (targetPlayer.isEliminated) {
    return { valid: false, reason: 'Target player is eliminated' };
  }

  // Some cards can target self, others cannot
  const canTargetSelf = ['bayta-darell', 'toran-darell'].includes(cardType);

  if (!canTargetSelf && targetPlayerId === playerId) {
    return { valid: false, reason: 'Cannot target yourself' };
  }

  // Protected players cannot be targeted (unless by Darell cards which can target anyone)
  const ignoresProtection = ['bayta-darell', 'toran-darell'].includes(cardType);

  if (targetPlayer.isProtected && !ignoresProtection && targetPlayerId !== playerId) {
    return { valid: false, reason: 'Target player is protected' };
  }

  return { valid: true };
}

/**
 * Check if there are any valid targets for a card
 */
export function hasValidTargets(
  gameState: GameState,
  playerId: string,
  cardType: string
): boolean {
  const canTargetSelf = ['bayta-darell', 'toran-darell'].includes(cardType);
  const ignoresProtection = ['bayta-darell', 'toran-darell'].includes(cardType);

  const validTargets = gameState.players.filter(p => {
    if (p.isEliminated) return false;
    if (p.id === playerId && !canTargetSelf) return false;
    if (p.isProtected && !ignoresProtection && p.id !== playerId) return false;
    return true;
  });

  return validTargets.length > 0;
}
