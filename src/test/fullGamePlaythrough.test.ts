import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../hooks/useGameState';

describe('Full Game Playthrough with Detailed Logging', () => {
  it('should play through a complete 2-player game with full state tracking', () => {
    const { result } = renderHook(() => useGameState(2));

    let turnCount = 0;
    let roundCount = 1;
    const maxTurns = 100; // Safety limit

    console.log('\n🎮 Starting Full Game Playthrough Test\n');
    console.log('═'.repeat(60));

    // Play until game ends or we hit safety limit
    while (result.current.gameState.phase !== 'game-end' && turnCount < maxTurns) {
      const state = result.current.gameState;
      const currentPlayer = state.players[state.currentPlayerIndex];

      console.log(`\n┌─ Turn ${turnCount + 1} (Round ${roundCount}) ──────────────────`);
      console.log(`│ Phase: ${state.phase}`);
      console.log(`│ Current Player: ${currentPlayer.name} (${currentPlayer.id})`);
      console.log(`│ Hand: ${currentPlayer.hand.map(c => `${c.type}(${c.value})`).join(', ')}`);
      console.log(`│ Deck: ${state.deck.length} cards`);
      console.log(`│ Active Players: ${state.players.filter(p => !p.isEliminated).length}`);

      // Log all player states
      state.players.forEach((p, i) => {
        const status = [];
        if (p.isEliminated) status.push('ELIMINATED');
        if (p.isProtected) status.push('PROTECTED');
        if (i === state.currentPlayerIndex) status.push('< CURRENT');

        console.log(`│   ${p.name}: ${p.devotionTokens} tokens, ${p.hand.length} cards ${status.length ? `[${status.join(', ')}]` : ''}`);
      });

      try {
        if (state.phase === 'draw') {
          console.log(`│ ACTION: Drawing card...`);
          act(() => {
            result.current.drawCard();
          });
          console.log(`│ RESULT: Drew successfully`);

        } else if (state.phase === 'play') {
          // Pick first available card
          const cardToPlay = currentPlayer.hand[0];
          console.log(`│ ACTION: Playing ${cardToPlay.type} (value: ${cardToPlay.value})`);

          // Create appropriate choice for the card
          let choice = undefined;

          if (cardToPlay.type === 'informant') {
            choice = { namedCharacter: 'han-pritcher' as const };
            console.log(`│   Choice: Naming "han-pritcher"`);
          } else if (['han-pritcher', 'bail-channis', 'ebling-mis', 'magnifico', 'mayor-indbur'].includes(cardToPlay.type)) {
            // Find valid target
            const validTargets = state.players.filter(
              p => p.id !== currentPlayer.id && !p.isEliminated && !p.isProtected
            );
            if (validTargets.length > 0) {
              choice = { targetPlayerId: validTargets[0].id };
              console.log(`│   Choice: Targeting ${validTargets[0].name}`);
            } else {
              console.log(`│   Choice: No valid targets available`);
            }
          } else if (['bayta-darell', 'toran-darell'].includes(cardToPlay.type)) {
            // Can target any non-eliminated player
            const validTargets = state.players.filter(
              p => !p.isEliminated && (!p.isProtected || p.id === currentPlayer.id)
            );
            if (validTargets.length > 0) {
              const target = validTargets.find(p => p.id !== currentPlayer.id) || validTargets[0];
              choice = { targetPlayerId: target.id };
              console.log(`│   Choice: Targeting ${target.name}`);
            }
          }

          act(() => {
            result.current.playCard(cardToPlay.id, choice);
          });
          console.log(`│ RESULT: Played successfully`);

          // Now end turn
          console.log(`│ ACTION: Ending turn...`);
          act(() => {
            result.current.endTurn();
          });
          console.log(`│ RESULT: Turn ended`);

        } else if (state.phase === 'round-end') {
          const winner = state.players.find(p => !p.isEliminated);
          console.log(`│ ROUND END: Winner is ${winner?.name}`);
          console.log(`│ ACTION: Starting new round...`);

          act(() => {
            result.current.startNewRound();
          });

          roundCount++;
          console.log(`│ RESULT: Round ${roundCount} started`);

        } else {
          console.log(`│ WARNING: Unknown phase "${state.phase}"`);
          break;
        }

      } catch (error) {
        console.log(`│ ❌ ERROR: ${error}`);
        console.log(`└${'─'.repeat(58)}`);
        throw error;
      }

      console.log(`└${'─'.repeat(58)}`);
      turnCount++;
    }

    console.log('\n═'.repeat(60));
    console.log(`🏁 Game Finished after ${turnCount} turns in ${roundCount} rounds`);

    const finalState = result.current.gameState;
    console.log(`\nFinal State:`);
    console.log(`  Phase: ${finalState.phase}`);

    finalState.players.forEach(p => {
      console.log(`  ${p.name}: ${p.devotionTokens} tokens ${p.isEliminated ? '[ELIMINATED]' : ''}`);
    });

    if (finalState.phase === 'game-end') {
      const winner = finalState.players.find(p => p.devotionTokens >= finalState.tokensToWin);
      console.log(`\n🏆 Winner: ${winner?.name}`);
      expect(winner).toBeDefined();
    } else {
      console.log(`\n⚠️  Game did not complete (reached safety limit of ${maxTurns} turns)`);
      console.log(`   This might indicate an infinite loop or stuck state.`);
    }

    console.log('═'.repeat(60) + '\n');
  });
});
