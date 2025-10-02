import type { GameState } from '../types/game';

export interface AIDecision {
  action: 'draw' | 'play' | 'end_turn';
  cardId?: string;
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

    // Play phase: play a random card
    if (gameState.phase === 'play') {
      if (player.hand.length >= 2) {
        // Simple strategy: play the lowest value card to keep high cards
        const sortedHand = [...player.hand].sort((a, b) => a.value - b.value);
        const cardToPlay = sortedHand[0];

        return { action: 'play', cardId: cardToPlay.id };
      } else if (player.hand.length === 1) {
        // Must play the only card
        return { action: 'play', cardId: player.hand[0].id };
      }
    }

    return null;
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
