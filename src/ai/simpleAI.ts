import type { GameState, CardType } from '../types/game';

export interface AIDecision {
  action: 'draw' | 'play' | 'end_turn';
  cardId?: string;
  choice?: {
    targetPlayerId?: string;
    namedCharacter?: CardType;
  };
}

/**
 * Simple AI that makes random but valid moves
 */
export class SimpleAI {
  /**
   * Decide what action the AI should take
   */
  static decideAction(gameState: GameState, playerId: string): AIDecision | null {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.isEliminated) return null;

    const playerIndex = gameState.players.findIndex(p => p.id === playerId);
    if (playerIndex !== gameState.currentPlayerIndex) return null;

    // Draw phase: always draw a card
    if (gameState.phase === 'draw') {
      if (gameState.deck.length > 0) {
        return { action: 'draw' };
      }
    }

    // Play phase: play a card with appropriate choice
    if (gameState.phase === 'play') {
      if (player.hand.length >= 2) {
        // Simple strategy: play the lowest value card to keep high cards
        const sortedHand = [...player.hand].sort((a, b) => a.value - b.value);
        const cardToPlay = sortedHand[0];

        // Make choice for interactive cards
        const choice = this.makeCardChoice(gameState, playerId, cardToPlay.type);

        return { action: 'play', cardId: cardToPlay.id, choice };
      } else if (player.hand.length === 1) {
        // Must play the only card
        const cardToPlay = player.hand[0];
        const choice = this.makeCardChoice(gameState, playerId, cardToPlay.type);
        return { action: 'play', cardId: cardToPlay.id, choice };
      }
    }

    return null;
  }

  /**
   * Make a choice for an interactive card
   */
  private static makeCardChoice(
    gameState: GameState,
    playerId: string,
    cardType: CardType
  ): { targetPlayerId?: string; namedCharacter?: CardType } | undefined {
    // Get valid targets (non-eliminated, non-protected players, excluding self)
    const validTargets = gameState.players.filter(
      p => p.id !== playerId && !p.isEliminated && !p.isProtected
    );

    switch (cardType) {
      case 'informant':
        // Name a random character (except Informant)
        const namableCards: CardType[] = [
          'han-pritcher',
          'bail-channis',
          'ebling-mis',
          'magnifico',
          'shielded-mind',
          'bayta-darell',
          'toran-darell',
          'mayor-indbur',
          'first-speaker',
          'mule',
        ];
        return {
          namedCharacter: namableCards[Math.floor(Math.random() * namableCards.length)],
        };

      case 'han-pritcher':
      case 'bail-channis':
      case 'ebling-mis':
      case 'magnifico':
      case 'mayor-indbur':
        // Pick a random valid target
        if (validTargets.length > 0) {
          const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
          return { targetPlayerId: randomTarget.id };
        }
        return undefined;

      case 'bayta-darell':
      case 'toran-darell':
        // Can target any non-eliminated player (including self for strategic reasons)
        const allTargets = gameState.players.filter(
          p => !p.isEliminated && (!p.isProtected || p.id === playerId)
        );
        if (allTargets.length > 0) {
          // Prefer targeting opponents
          const opponents = allTargets.filter(p => p.id !== playerId);
          const targetPool = opponents.length > 0 ? opponents : allTargets;
          const randomTarget = targetPool[Math.floor(Math.random() * targetPool.length)];
          return { targetPlayerId: randomTarget.id };
        }
        return undefined;

      default:
        // Cards that don't need choices
        return undefined;
    }
  }

  /**
   * Get a random delay for AI actions (to simulate thinking)
   */
  static getActionDelay(): number {
    return 500 + Math.random() * 1000; // 500-1500ms
  }
}

/**
 * Advanced AI with better strategy (future implementation)
 */
export class AdvancedAI extends SimpleAI {
  static decideAction(gameState: GameState, playerId: string): AIDecision | null {
    // TODO: Implement smarter AI
    // - Track which cards have been played
    // - Deduce what opponents might have
    // - Play strategically based on game state
    // - Use card abilities effectively

    return super.decideAction(gameState, playerId);
  }
}
