import { Card, Player, GameState, CardType, GamePhase } from './types';

export class ValidationResult {
  valid: bool;
  // Error codes: 0=none, 1=not play phase, 2=not your turn, 3=eliminated, 4=no cards, 5=card not in hand, 6=must discard first speaker
  errorCode: i32;

  constructor(valid: bool, errorCode: i32) {
    this.valid = valid;
    this.errorCode = errorCode;
  }
}

/**
 * Validate if a card can be played
 */
export function validateCardPlay(
  gameState: GameState,
  playerId: i32,
  cardId: i32
): ValidationResult {
  // Must be play phase
  if (gameState.phase != GamePhase.PLAY) {
    return new ValidationResult(false, 1);
  }

  // Must be current player
  let playerIndex: i32 = -1;
  for (let i: i32 = 0; i < gameState.players.length; i++) {
    if (gameState.players[i].id == playerId) {
      playerIndex = i;
      break;
    }
  }

  if (playerIndex != gameState.currentPlayerIndex) {
    return new ValidationResult(false, 2);
  }

  let player = gameState.players[playerIndex];

  // Player must not be eliminated
  if (player.isEliminated) {
    return new ValidationResult(false, 3);
  }

  // Must have at least 1 card
  if (player.hand.length < 1) {
    return new ValidationResult(false, 4);
  }

  // Card must be in hand
  let cardIndex: i32 = -1;
  for (let i: i32 = 0; i < player.hand.length; i++) {
    if (player.hand[i].id == cardId) {
      cardIndex = i;
      break;
    }
  }

  if (cardIndex == -1) {
    return new ValidationResult(false, 5);
  }

  // Check if First Speaker must be discarded instead
  let hasFirstSpeaker: bool = false;
  let hasForbiddenCard: bool = false;

  for (let i: i32 = 0; i < player.hand.length; i++) {
    let cardType = player.hand[i].type;
    if (cardType == CardType.FIRST_SPEAKER) {
      hasFirstSpeaker = true;
    }
    if (cardType == CardType.MAYOR_INDBUR ||
        cardType == CardType.BAYTA_DARELL ||
        cardType == CardType.TORAN_DARELL) {
      hasForbiddenCard = true;
    }
  }

  if (hasFirstSpeaker && hasForbiddenCard && player.hand[cardIndex].type != CardType.FIRST_SPEAKER) {
    return new ValidationResult(false, 6);
  }

  return new ValidationResult(true, 0);
}

/**
 * Check if First Speaker must be auto-discarded
 */
export function checkFirstSpeakerAutoDiscard(player: Player): bool {
  let hasFirstSpeaker: bool = false;
  let hasForbiddenCard: bool = false;

  for (let i: i32 = 0; i < player.hand.length; i++) {
    let cardType = player.hand[i].type;
    if (cardType == CardType.FIRST_SPEAKER) {
      hasFirstSpeaker = true;
    }
    if (cardType == CardType.MAYOR_INDBUR ||
        cardType == CardType.BAYTA_DARELL ||
        cardType == CardType.TORAN_DARELL) {
      hasForbiddenCard = true;
    }
  }

  return hasFirstSpeaker && hasForbiddenCard;
}

/**
 * Check if a target is valid for a card effect
 */
export function validateTarget(
  gameState: GameState,
  playerId: i32,
  targetPlayerId: i32,
  cardType: i32
): bool {
  // Find target player
  let targetPlayer: Player | null = null;
  for (let i: i32 = 0; i < gameState.players.length; i++) {
    if (gameState.players[i].id == targetPlayerId) {
      targetPlayer = gameState.players[i];
      break;
    }
  }

  if (targetPlayer == null) {
    return false;
  }

  if (targetPlayer.isEliminated) {
    return false;
  }

  // Some cards can target self, others cannot
  let canTargetSelf: bool = (cardType == CardType.BAYTA_DARELL || cardType == CardType.TORAN_DARELL);

  if (!canTargetSelf && targetPlayerId == playerId) {
    return false;
  }

  // Protected players cannot be targeted (unless by Darell cards)
  let ignoresProtection: bool = (cardType == CardType.BAYTA_DARELL || cardType == CardType.TORAN_DARELL);

  if (targetPlayer.isProtected && !ignoresProtection && targetPlayerId != playerId) {
    return false;
  }

  return true;
}

/**
 * Get forced play card ID (-1 if none)
 */
export function getForcedPlayCardId(player: Player): i32 {
  let hasFirstSpeaker: bool = false;
  let hasForbiddenCard: bool = false;
  let firstSpeakerCardId: i32 = -1;

  for (let i: i32 = 0; i < player.hand.length; i++) {
    let cardType = player.hand[i].type;
    if (cardType == CardType.FIRST_SPEAKER) {
      hasFirstSpeaker = true;
      firstSpeakerCardId = player.hand[i].id;
    }
    if (cardType == CardType.MAYOR_INDBUR ||
        cardType == CardType.BAYTA_DARELL ||
        cardType == CardType.TORAN_DARELL) {
      hasForbiddenCard = true;
    }
  }

  if (hasFirstSpeaker && hasForbiddenCard) {
    return firstSpeakerCardId;
  }

  return -1;
}
