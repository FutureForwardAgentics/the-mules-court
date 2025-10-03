// WASM Module Loader
/* eslint-disable @typescript-eslint/no-unused-vars */

let wasmModule: any = null;

// @ts-expect-error - process is not available in all environments
const isNode = typeof process !== 'undefined' && (process as any).versions && (process as any).versions.node;

export interface WASMValidationResult {
  valid: boolean;
  errorCode: number;
}

/**
 * Initialize the WASM module
 */
export async function initWASM(): Promise<void> {
  if (wasmModule) return; // Already initialized

  try {
    if (isNode) {
      // Node.js environment (tests) - use dynamic imports
      // @ts-expect-error - Node.js modules only available in test environment
      const { readFile } = await import('fs/promises');
      // @ts-expect-error - Node.js modules only available in test environment
      const { fileURLToPath } = await import('url');
      // @ts-expect-error - Node.js modules only available in test environment
      const { dirname, join } = await import('path');

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const wasmPath = join(__dirname, '../../build/release.wasm');
      const wasmBuffer = await readFile(wasmPath);
      const wasmModuleInstance = await WebAssembly.instantiate(wasmBuffer, {
        env: {
          abort: (msg: number, file: number, line: number, column: number) => {
            console.error(`WASM abort: ${msg} at ${file}:${line}:${column}`);
          }
        }
      });
      wasmModule = wasmModuleInstance.instance.exports;
      console.log('✅ WASM module initialized successfully (Node.js)');
    } else {
      // Browser environment
      const releaseModule = await import('../../build/release.js');
      const module = await (releaseModule as any).default.instantiate();
      wasmModule = module.exports;
      console.log('✅ WASM module initialized successfully (browser)');
    }
  } catch (error) {
    console.error('❌ Failed to initialize WASM module:', error);
    throw error;
  }
}

/**
 * Test function to verify WASM is working
 */
export function testWASM(): number {
  if (!wasmModule) throw new Error('WASM not initialized');
  return wasmModule.add(5, 3);
}

/**
 * Get card value by type index
 */
export function getCardValue(cardType: number): number {
  if (!wasmModule) throw new Error('WASM not initialized');
  return wasmModule.getCardValue(cardType);
}

/**
 * Card type enum mapping
 */
export const WASMCardType = {
  INFORMANT: 0,
  HAN_PRITCHER: 1,
  BAIL_CHANNIS: 2,
  EBLING_MIS: 3,
  MAGNIFICO: 4,
  SHIELDED_MIND: 5,
  BAYTA_DARELL: 6,
  TORAN_DARELL: 7,
  MAYOR_INDBUR: 8,
  FIRST_SPEAKER: 9,
  MULE: 10,
} as const;

/**
 * Game phase enum mapping
 */
export const WASMGamePhase = {
  DRAW: 0,
  PLAY: 1,
  ROUND_END: 2,
  GAME_END: 3,
} as const;

/**
 * Convert TypeScript card type to WASM card type
 */
export function cardTypeToWASM(type: string): number {
  const mapping: Record<string, number> = {
    'informant': WASMCardType.INFORMANT,
    'han-pritcher': WASMCardType.HAN_PRITCHER,
    'bail-channis': WASMCardType.BAIL_CHANNIS,
    'ebling-mis': WASMCardType.EBLING_MIS,
    'magnifico': WASMCardType.MAGNIFICO,
    'shielded-mind': WASMCardType.SHIELDED_MIND,
    'bayta-darell': WASMCardType.BAYTA_DARELL,
    'toran-darell': WASMCardType.TORAN_DARELL,
    'mayor-indbur': WASMCardType.MAYOR_INDBUR,
    'first-speaker': WASMCardType.FIRST_SPEAKER,
    'mule': WASMCardType.MULE,
  };
  return mapping[type] ?? 0;
}

/**
 * Convert TypeScript game phase to WASM game phase
 */
export function gamePhaseToWASM(phase: string): number {
  const mapping: Record<string, number> = {
    'draw': WASMGamePhase.DRAW,
    'play': WASMGamePhase.PLAY,
    'round-end': WASMGamePhase.ROUND_END,
    'game-end': WASMGamePhase.GAME_END,
  };
  return mapping[phase] ?? 0;
}

/**
 * Validation error code messages
 */
export function getValidationErrorMessage(errorCode: number): string {
  const messages: Record<number, string> = {
    0: 'Valid',
    1: 'Not in play phase',
    2: 'Not your turn',
    3: 'Player is eliminated',
    4: 'No cards in hand',
    5: 'Card not in hand',
    6: 'Must discard First Speaker when holding Mayor Indbur or either Darell',
  };
  return messages[errorCode] ?? 'Unknown error';
}

// Auto-initialize when module loads
let initPromise: Promise<void> | null = null;

export function ensureWASMInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initWASM();
  }
  return initPromise;
}

// Initialize immediately
ensureWASMInit();
