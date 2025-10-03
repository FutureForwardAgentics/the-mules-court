// Game types for WebAssembly
// Note: AssemblyScript has limitations - no optional types, no union types directly

export class Card {
  id: i32;
  type: i32; // CardType enum as number
  value: i32;

  constructor(id: i32, type: i32, value: i32) {
    this.id = id;
    this.type = type;
    this.value = value;
  }
}

export class Player {
  id: i32;
  devotionTokens: i32;
  isProtected: bool;
  isEliminated: bool;
  hand: Array<Card>;
  discardPile: Array<Card>;

  constructor(id: i32) {
    this.id = id;
    this.devotionTokens = 0;
    this.isProtected = false;
    this.isEliminated = false;
    this.hand = new Array<Card>();
    this.discardPile = new Array<Card>();
  }
}

export class GameState {
  players: Array<Player>;
  deck: Array<Card>;
  currentPlayerIndex: i32;
  phase: i32; // GamePhase enum as number
  tokensToWin: i32;
  removedCardId: i32; // -1 if none

  constructor(playerCount: i32) {
    this.players = new Array<Player>();
    for (let i: i32 = 0; i < playerCount; i++) {
      this.players.push(new Player(i));
    }
    this.deck = new Array<Card>();
    this.currentPlayerIndex = 0;
    this.phase = 0; // DRAW
    this.tokensToWin = playerCount == 2 ? 7 : (playerCount == 3 ? 5 : 4);
    this.removedCardId = -1;
  }
}

// Enums as constants
export namespace CardType {
  export const INFORMANT: i32 = 0;
  export const HAN_PRITCHER: i32 = 1;
  export const BAIL_CHANNIS: i32 = 2;
  export const EBLING_MIS: i32 = 3;
  export const MAGNIFICO: i32 = 4;
  export const SHIELDED_MIND: i32 = 5;
  export const BAYTA_DARELL: i32 = 6;
  export const TORAN_DARELL: i32 = 7;
  export const MAYOR_INDBUR: i32 = 8;
  export const FIRST_SPEAKER: i32 = 9;
  export const MULE: i32 = 10;
}

export namespace GamePhase {
  export const DRAW: i32 = 0;
  export const PLAY: i32 = 1;
  export const ROUND_END: i32 = 2;
  export const GAME_END: i32 = 3;
}

export class CardInteractionChoice {
  targetPlayerId: i32; // -1 if none
  namedCharacter: i32; // -1 if none

  constructor() {
    this.targetPlayerId = -1;
    this.namedCharacter = -1;
  }
}
