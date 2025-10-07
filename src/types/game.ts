export type CardType =
  | 'informant'
  | 'han-pritcher'
  | 'bail-channis'
  | 'ebling-mis'
  | 'magnifico'
  | 'shielded-mind'
  | 'bayta-darell'
  | 'toran-darell'
  | 'mayor-indbur'
  | 'first-speaker'
  | 'mule';

export interface Card {
  id: string;
  type: CardType;
  value: number;
  name: string;
  ability: string;
  color: string;
  icon: string;
  quote: string;
  description: string;
  portraitPath: string; // Path to portrait image (randomly selected per game load)
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  discardPile: Card[];
  devotionTokens: number;
  isProtected: boolean;
  isEliminated: boolean;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  phase: 'setup' | 'draw' | 'play' | 'round-end' | 'game-end';
  tokensToWin: number;
  removedCard: Card | null;
}
