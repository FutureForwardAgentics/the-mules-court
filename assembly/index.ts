// Main entry point for WASM module
export { Card, Player, GameState, CardType, GamePhase, CardInteractionChoice } from './types';
export {
  ValidationResult,
  validateCardPlay,
  checkFirstSpeakerAutoDiscard,
  validateTarget,
  getForcedPlayCardId
} from './validation';

// Simple test function to verify WASM is working
export function add(a: i32, b: i32): i32 {
  return a + b;
}

// Get card value by type
export function getCardValue(cardType: i32): i32 {
  if (cardType == 0) return 1; // INFORMANT
  if (cardType == 1 || cardType == 2) return 2; // PRITCHER, CHANNIS
  if (cardType == 3 || cardType == 4) return 3; // MIS, MAGNIFICO
  if (cardType == 5) return 4; // SHIELDED_MIND
  if (cardType == 6 || cardType == 7) return 5; // DARELLS
  if (cardType == 8) return 6; // INDBUR
  if (cardType == 9) return 7; // FIRST_SPEAKER
  if (cardType == 10) return 8; // MULE
  return 0;
}
