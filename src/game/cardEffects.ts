import type { GameState, Card, Player } from '../types/game';
import type { CardInteractionChoice } from '../components/CardInteractionModal';

export interface CardEffectResult {
  gameState: GameState;
  message?: string;
  eliminatedPlayers?: string[];
  viewedHand?: Card[];
}

/**
 * Apply the effect of a played card to the game state
 */
export function applyCardEffect(
  gameState: GameState,
  playedCard: Card,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  let result: CardEffectResult = { gameState };

  switch (playedCard.type) {
    case 'informant':
      result = applyInformantEffect(gameState, playerId, choice);
      break;

    case 'han-pritcher':
      result = applyHanPritcherEffect(gameState, playerId, choice);
      break;

    case 'bail-channis':
      result = applyBailChannisEffect(gameState, playerId, choice);
      break;

    case 'ebling-mis':
      result = applyEblingMisEffect(gameState, playerId, choice);
      break;

    case 'magnifico':
      result = applyMagnificoEffect(gameState, playerId, choice);
      break;

    case 'shielded-mind':
      result = applyShieldedMindEffect(gameState, playerId);
      break;

    case 'bayta-darell':
      result = applyBaytaDarellEffect(gameState, playerId, choice);
      break;

    case 'toran-darell':
      result = applyToranDarellEffect(gameState, playerId, choice);
      break;

    case 'mayor-indbur':
      result = applyMayorIndbur(gameState, playerId, choice);
      break;

    case 'first-speaker':
      result = applyFirstSpeakerEffect(gameState, playerId);
      break;

    case 'mule':
      result = applyMuleEffect(gameState, playerId);
      break;

    default:
      result = { gameState };
  }

  return result;
}

/**
 * Informant: Name a character. If another player has that card, they are eliminated.
 */
function applyInformantEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  if (!choice?.namedCharacter) {
    return { gameState, message: 'No character named' };
  }

  const newPlayers = [...gameState.players];
  const eliminatedPlayers: string[] = [];

  newPlayers.forEach(player => {
    if (player.id === playerId || player.isEliminated || player.isProtected) return;

    const hasNamedCard = player.hand.some(card => card.type === choice.namedCharacter);
    if (hasNamedCard) {
      player.isEliminated = true;
      eliminatedPlayers.push(player.id);
    }
  });

  const message = eliminatedPlayers.length > 0
    ? `Eliminated ${eliminatedPlayers.length} player(s) with ${choice.namedCharacter}!`
    : `No one has ${choice.namedCharacter}`;

  return {
    gameState: { ...gameState, players: newPlayers },
    message,
    eliminatedPlayers,
  };
}

/**
 * Shared helper: Look at another player's hand
 */
function _viewHandHelper(
  gameState: GameState,
  _playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  if (!choice?.targetPlayerId) {
    return { gameState, message: 'No target selected' };
  }

  const targetPlayer = gameState.players.find(p => p.id === choice.targetPlayerId);
  if (!targetPlayer || targetPlayer.isEliminated || targetPlayer.isProtected) {
    return { gameState, message: 'Invalid target' };
  }

  return {
    gameState,
    message: `Viewing ${targetPlayer.name}'s hand`,
    viewedHand: targetPlayer.hand,
  };
}

/**
 * Han Pritcher: Look at another player's hand
 */
function applyHanPritcherEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  return _viewHandHelper(gameState, playerId, choice);
}

/**
 * Bail Channis: Look at another player's hand
 */
function applyBailChannisEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  return _viewHandHelper(gameState, playerId, choice);
}

/**
 * Shared helper: Compare hands. Lower value is eliminated.
 */
function _compareHandsHelper(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  if (!choice?.targetPlayerId) {
    return { gameState, message: 'No target selected' };
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const targetPlayer = gameState.players.find(p => p.id === choice.targetPlayerId);

  if (!currentPlayer || !targetPlayer || targetPlayer.isEliminated || targetPlayer.isProtected) {
    return { gameState, message: 'Invalid target' };
  }

  // Get highest card value from each hand
  const currentHighest = Math.max(...currentPlayer.hand.map(c => c.value), 0);
  const targetHighest = Math.max(...targetPlayer.hand.map(c => c.value), 0);

  const newPlayers = [...gameState.players];
  const eliminatedPlayers: string[] = [];

  if (currentHighest > targetHighest) {
    const idx = newPlayers.findIndex(p => p.id === targetPlayer.id);
    newPlayers[idx].isEliminated = true;
    eliminatedPlayers.push(targetPlayer.id);
  } else if (targetHighest > currentHighest) {
    const idx = newPlayers.findIndex(p => p.id === currentPlayer.id);
    newPlayers[idx].isEliminated = true;
    eliminatedPlayers.push(currentPlayer.id);
  }

  const message =
    currentHighest === targetHighest
      ? `Tie! Both have ${currentHighest}`
      : eliminatedPlayers.includes(playerId)
      ? `You lost! (${currentHighest} vs ${targetHighest})`
      : `You won! (${currentHighest} vs ${targetHighest})`;

  return {
    gameState: { ...gameState, players: newPlayers },
    message,
    eliminatedPlayers,
  };
}

/**
 * Ebling Mis: Compare hands with another player. Lower value is eliminated.
 */
function applyEblingMisEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  return _compareHandsHelper(gameState, playerId, choice);
}

/**
 * Magnifico: Compare hands with another player. Lower value is eliminated.
 */
function applyMagnificoEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  return _compareHandsHelper(gameState, playerId, choice);
}

/**
 * Shielded Mind: Protected until next turn
 */
function applyShieldedMindEffect(
  gameState: GameState,
  playerId: string
): CardEffectResult {
  const newPlayers = [...gameState.players];
  const playerIdx = newPlayers.findIndex(p => p.id === playerId);

  if (playerIdx !== -1) {
    newPlayers[playerIdx].isProtected = true;
  }

  return {
    gameState: { ...gameState, players: newPlayers },
    message: 'Protected until your next turn',
  };
}

/**
 * Shared helper: Force a player to discard and draw
 */
function _forceDiscardHelper(
  gameState: GameState,
  _playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  if (!choice?.targetPlayerId) {
    return { gameState, message: 'No target selected' };
  }

  const targetPlayer = gameState.players.find(p => p.id === choice.targetPlayerId);
  if (!targetPlayer || targetPlayer.isEliminated || targetPlayer.isProtected) {
    return { gameState, message: 'Invalid target' };
  }

  const newPlayers = [...gameState.players];
  const targetIdx = newPlayers.findIndex(p => p.id === choice.targetPlayerId);

  // Discard entire hand
  const discardedCards = [...newPlayers[targetIdx].hand];
  newPlayers[targetIdx].discardPile.push(...discardedCards);
  newPlayers[targetIdx].hand = [];

  // Draw one new card if deck has cards
  let newDeck = [...gameState.deck];
  if (newDeck.length > 0) {
    const drawnCard = newDeck.pop()!;
    newPlayers[targetIdx].hand.push(drawnCard);
  }

  return {
    gameState: { ...gameState, players: newPlayers, deck: newDeck },
    message: `${targetPlayer.name} discarded ${discardedCards.length} card(s) and drew 1`,
  };
}

/**
 * Bayta Darell: Choose any player to discard their hand and draw a new card
 */
function applyBaytaDarellEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  return _forceDiscardHelper(gameState, playerId, choice);
}

/**
 * Toran Darell: Choose any player to discard their hand and draw a new card
 */
function applyToranDarellEffect(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  return _forceDiscardHelper(gameState, playerId, choice);
}

/**
 * Mayor Indbur: Trade hands with another player
 */
function applyMayorIndbur(
  gameState: GameState,
  playerId: string,
  choice?: CardInteractionChoice
): CardEffectResult {
  if (!choice?.targetPlayerId) {
    return { gameState, message: 'No target selected' };
  }

  const targetPlayer = gameState.players.find(p => p.id === choice.targetPlayerId);
  if (!targetPlayer || targetPlayer.isEliminated || targetPlayer.isProtected) {
    return { gameState, message: 'Invalid target' };
  }

  const newPlayers = [...gameState.players];
  const currentIdx = newPlayers.findIndex(p => p.id === playerId);
  const targetIdx = newPlayers.findIndex(p => p.id === choice.targetPlayerId);

  // Swap hands
  const tempHand = newPlayers[currentIdx].hand;
  newPlayers[currentIdx].hand = newPlayers[targetIdx].hand;
  newPlayers[targetIdx].hand = tempHand;

  return {
    gameState: { ...gameState, players: newPlayers },
    message: `Traded hands with ${targetPlayer.name}`,
  };
}

/**
 * First Speaker: No active effect (passive auto-discard handled elsewhere)
 */
function applyFirstSpeakerEffect(
  gameState: GameState,
  _playerId: string
): CardEffectResult {
  // First Speaker has only a passive effect (auto-discard with certain cards)
  // This is handled by checkFirstSpeakerAutoDiscard and autoDiscardFirstSpeaker
  return {
    gameState,
    message: 'The First Speaker remains hidden...',
  };
}

/**
 * The Mule: Player who discards this card is eliminated
 */
function applyMuleEffect(
  gameState: GameState,
  playerId: string
): CardEffectResult {
  const newPlayers = [...gameState.players];
  const playerIdx = newPlayers.findIndex(p => p.id === playerId);

  if (playerIdx !== -1) {
    newPlayers[playerIdx].isEliminated = true;
  }

  return {
    gameState: { ...gameState, players: newPlayers },
    message: 'You revealed yourself as The Mule and are eliminated!',
    eliminatedPlayers: [playerId],
  };
}

/**
 * Check if First Speaker must be discarded (if holding Mayor Indbur or Darells)
 */
export function checkFirstSpeakerAutoDiscard(player: Player): boolean {
  const hasFirstSpeaker = player.hand.some(c => c.type === 'first-speaker');
  if (!hasFirstSpeaker) return false;

  const hasForbiddenCard = player.hand.some(
    c =>
      c.type === 'mayor-indbur' ||
      c.type === 'bayta-darell' ||
      c.type === 'toran-darell'
  );

  return hasForbiddenCard;
}

/**
 * Auto-discard First Speaker if conditions are met
 */
export function autoDiscardFirstSpeaker(gameState: GameState, playerId: string): GameState {
  const newPlayers = [...gameState.players];
  const playerIdx = newPlayers.findIndex(p => p.id === playerId);

  if (playerIdx === -1) return gameState;

  const player = newPlayers[playerIdx];
  const firstSpeakerCard = player.hand.find(c => c.type === 'first-speaker');

  if (firstSpeakerCard) {
    newPlayers[playerIdx] = {
      ...player,
      hand: player.hand.filter(c => c.id !== firstSpeakerCard.id),
      discardPile: [...player.discardPile, firstSpeakerCard],
    };
  }

  return { ...gameState, players: newPlayers };
}
