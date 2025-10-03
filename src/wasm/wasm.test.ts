import { describe, it, expect, beforeAll } from 'vitest';
import { ensureWASMInit, testWASM, getCardValue, WASMCardType, cardTypeToWASM } from './loader';

describe.skip('WASM Module (Experimental - Optional)', () => {
  // Note: WASM is experimental and not used in the game.
  // These tests are skipped by default. To run them:
  // 1. Build WASM: npm run asbuild
  // 2. Run tests: npm test

  beforeAll(async () => {
    await ensureWASMInit();
  });

  it('should initialize and run basic test function', async () => {
    const result = testWASM(); // 5 + 3
    expect(result).toBe(8);
  });

  it('should get correct card values', () => {
    expect(getCardValue(WASMCardType.INFORMANT)).toBe(1);
    expect(getCardValue(WASMCardType.HAN_PRITCHER)).toBe(2);
    expect(getCardValue(WASMCardType.BAIL_CHANNIS)).toBe(2);
    expect(getCardValue(WASMCardType.EBLING_MIS)).toBe(3);
    expect(getCardValue(WASMCardType.MAGNIFICO)).toBe(3);
    expect(getCardValue(WASMCardType.SHIELDED_MIND)).toBe(4);
    expect(getCardValue(WASMCardType.BAYTA_DARELL)).toBe(5);
    expect(getCardValue(WASMCardType.TORAN_DARELL)).toBe(5);
    expect(getCardValue(WASMCardType.MAYOR_INDBUR)).toBe(6);
    expect(getCardValue(WASMCardType.FIRST_SPEAKER)).toBe(7);
    expect(getCardValue(WASMCardType.MULE)).toBe(8);
  });

  it('should convert TypeScript card types to WASM types', () => {
    expect(cardTypeToWASM('informant')).toBe(WASMCardType.INFORMANT);
    expect(cardTypeToWASM('han-pritcher')).toBe(WASMCardType.HAN_PRITCHER);
    expect(cardTypeToWASM('first-speaker')).toBe(WASMCardType.FIRST_SPEAKER);
    expect(cardTypeToWASM('mule')).toBe(WASMCardType.MULE);
  });
});
