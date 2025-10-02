import type { Card, CardType } from '../types/game';

const cardDefinitions: Omit<Card, 'id'>[] = [
  {
    type: 'informant',
    value: 1,
    name: 'Informant',
    ability: 'Name a character (not Informant). If another player has that card, they are eliminated.',
    color: 'from-slate-700 to-slate-900',
    icon: '👤',
    quote: 'I have reason to believe someone here is not who they claim...',
    description: 'The most common of the converted'
  },
  {
    type: 'han-pritcher',
    value: 2,
    name: 'Han Pritcher',
    ability: 'Look at another player\'s hand.',
    color: 'from-blue-800 to-blue-950',
    icon: '🎖️',
    quote: 'Your position grants you no secrets from me...',
    description: 'The converted captain who believes his loyalty is freely chosen'
  },
  {
    type: 'bail-channis',
    value: 2,
    name: 'Bail Channis',
    ability: 'Look at another player\'s hand.',
    color: 'from-indigo-800 to-indigo-950',
    icon: '🎭',
    quote: 'Let me help you understand the situation...',
    description: 'The agent playing a deeper game'
  },
  {
    type: 'ebling-mis',
    value: 3,
    name: 'Ebling Mis',
    ability: 'Compare hands with another player. Lower value is eliminated.',
    color: 'from-amber-800 to-amber-950',
    icon: '📚',
    quote: 'Let us compare what we know...',
    description: 'The scholar racing toward a truth that will kill him'
  },
  {
    type: 'magnifico',
    value: 3,
    name: 'Magnifico Giganticus',
    ability: 'Compare hands with another player. Lower value is eliminated.',
    color: 'from-purple-800 to-purple-950',
    icon: '🎵',
    quote: 'Listen to my Visi-Sonor and reveal yourself...',
    description: 'The clown whose performance compels truth'
  },
  {
    type: 'shielded-mind',
    value: 4,
    name: 'Shielded Mind',
    ability: 'Until your next turn, ignore effects from other players.',
    color: 'from-cyan-800 to-cyan-950',
    icon: '🛡️',
    quote: 'I know how to protect my thoughts from scrutiny...',
    description: 'Protection that might itself be part of the design'
  },
  {
    type: 'bayta-darell',
    value: 5,
    name: 'Bayta Darell',
    ability: 'Choose any player to discard their hand and draw a new card.',
    color: 'from-rose-800 to-rose-950',
    icon: '💫',
    quote: 'You must reveal yourself - we\'re searching for the Mule!',
    description: 'The woman whose intuition provides some immunity'
  },
  {
    type: 'toran-darell',
    value: 5,
    name: 'Toran Darell',
    ability: 'Choose any player to discard their hand and draw a new card.',
    color: 'from-red-800 to-red-950',
    icon: '⚔️',
    quote: 'We will find him, no matter the cost...',
    description: 'The searcher touched by the Mule\'s power'
  },
  {
    type: 'mayor-indbur',
    value: 6,
    name: 'Mayor Indbur',
    ability: 'Trade hands with another player.',
    color: 'from-yellow-700 to-yellow-900',
    icon: '👑',
    quote: 'As Mayor of Terminus, I command an exchange...',
    description: 'Certain of his independence, never suspecting his conversion'
  },
  {
    type: 'first-speaker',
    value: 7,
    name: 'The First Speaker',
    ability: 'If you have this with Mayor Indbur or either Darell, you must discard this card.',
    color: 'from-emerald-800 to-emerald-950',
    icon: '🔮',
    quote: 'My presence must remain hidden from all eyes...',
    description: 'Secrecy is paramount, even at the cost of influence'
  },
  {
    type: 'mule',
    value: 8,
    name: 'The Mule',
    ability: 'If you discard this card, you are eliminated from the round.',
    color: 'from-red-950 to-black',
    icon: '👁️',
    quote: 'I am the master of minds, the conqueror of wills...',
    description: 'The mutant who rewrites emotion itself'
  }
];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  let idCounter = 0;

  // Add cards according to their count in the game
  const cardCounts: Record<CardType, number> = {
    'informant': 5,
    'han-pritcher': 1,
    'bail-channis': 1,
    'ebling-mis': 1,
    'magnifico': 1,
    'shielded-mind': 2,
    'bayta-darell': 1,
    'toran-darell': 1,
    'mayor-indbur': 1,
    'first-speaker': 1,
    'mule': 1
  };

  cardDefinitions.forEach(cardDef => {
    const count = cardCounts[cardDef.type];
    for (let i = 0; i < count; i++) {
      deck.push({
        ...cardDef,
        id: `${cardDef.type}-${idCounter++}`
      });
    }
  });

  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardDefinition(type: CardType): Omit<Card, 'id'> {
  const def = cardDefinitions.find(c => c.type === type);
  if (!def) throw new Error(`Unknown card type: ${type}`);
  return def;
}
