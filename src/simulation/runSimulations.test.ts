import { describe, it, expect } from 'vitest';
import { GameSimulator } from './gameSimulator';

describe('Game Simulation', () => {
  it('should complete a single 2-player game without errors', () => {
    const result = GameSimulator.simulateGame(2);
    expect(result.errors).toHaveLength(0);
    expect(result.winner).toBeTruthy();
    expect(result.totalTurns).toBeGreaterThan(0);
  });

  it('should complete a single 3-player game without errors', () => {
    const result = GameSimulator.simulateGame(3);
    expect(result.errors).toHaveLength(0);
    expect(result.winner).toBeTruthy();
  });

  it('should complete a single 4-player game without errors', () => {
    const result = GameSimulator.simulateGame(4);
    expect(result.errors).toHaveLength(0);
    expect(result.winner).toBeTruthy();
  });

  it('should run 10 simulations for 2 players', () => {
    const results = GameSimulator.runSimulations(10, 2);
    expect(results).toHaveLength(10);

    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    console.log(`Total errors in 10 games: ${totalErrors}`);

    // Most games should complete without errors
    const gamesWithoutErrors = results.filter(r => r.errors.length === 0).length;
    expect(gamesWithoutErrors).toBeGreaterThan(7); // At least 70% should be error-free
  });

  it('should run 100 simulations and analyze results', () => {
    const results = GameSimulator.runSimulations(100, 3);
    expect(results).toHaveLength(100);

    GameSimulator.analyzeResults(results);

    // Check that most games complete successfully
    const gamesWithoutErrors = results.filter(r => r.errors.length === 0).length;
    expect(gamesWithoutErrors).toBeGreaterThan(80); // At least 80% should be error-free

    // Check that all games have a winner
    const gamesWithWinner = results.filter(r => r.winner !== null).length;
    expect(gamesWithWinner).toBe(100);
  });

  it('should detect First Speaker auto-discard violations', () => {
    // Run multiple games and check if any First Speaker violations occur
    const results = GameSimulator.runSimulations(50, 2);

    const firstSpeakerErrors = results.flatMap(r =>
      r.errors.filter(e => e.error.includes('First Speaker'))
    );

    console.log(`First Speaker violations found: ${firstSpeakerErrors.length}`);

    // There should be no First Speaker violations with proper validation
    expect(firstSpeakerErrors).toHaveLength(0);
  });

  it('should validate all card plays', () => {
    const results = GameSimulator.runSimulations(50, 4);

    const invalidPlayErrors = results.flatMap(r =>
      r.errors.filter(e => e.error.includes('Invalid play'))
    );

    console.log(`Invalid play errors found: ${invalidPlayErrors.length}`);

    // All plays should be valid
    expect(invalidPlayErrors).toHaveLength(0);
  });
});

// Manual test runner for development
if (import.meta.vitest === undefined) {
  // This runs when file is executed directly (not through vitest)
  console.log('🎲 Running manual game simulations...\n');

  // Run 1000 simulations for each player count
  [2, 3, 4].forEach(playerCount => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${playerCount}-player games`);
    console.log('='.repeat(60));

    const results = GameSimulator.runSimulations(1000, playerCount);
    GameSimulator.analyzeResults(results);
  });
}
