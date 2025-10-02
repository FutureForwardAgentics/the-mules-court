import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MuleCardDesign = () => {
  const [selectedCard, setSelectedCard] = useState(0);

  const cards = [
    {
      value: 1,
      name: "Informant",
      count: 5,
      ability: "Name a character (not Informant). If another player has that card, they are eliminated.",
      color: "from-slate-700 to-slate-900",
      icon: "👤",
      quote: "I have reason to believe someone here is not who they claim...",
      description: "The most common of the converted"
    },
    {
      value: 2,
      name: "Han Pritcher",
      count: 1,
      ability: "Look at another player's hand.",
      color: "from-blue-800 to-blue-950",
      icon: "🎖️",
      quote: "Your position grants you no secrets from me...",
      description: "The converted captain who believes his loyalty is freely chosen"
    },
    {
      value: 2,
      name: "Bail Channis",
      count: 1,
      ability: "Look at another player's hand.",
      color: "from-indigo-800 to-indigo-950",
      icon: "🎭",
      quote: "Let me help you understand the situation...",
      description: "The agent playing a deeper game"
    },
    {
      value: 3,
      name: "Ebling Mis",
      count: 1,
      ability: "Compare hands with another player. Lower value is eliminated.",
      color: "from-amber-800 to-amber-950",
      icon: "📚",
      quote: "Let us compare what we know...",
      description: "The scholar racing toward a truth that will kill him"
    },
    {
      value: 3,
      name: "Magnifico Giganticus",
      count: 1,
      ability: "Compare hands with another player. Lower value is eliminated.",
      color: "from-purple-800 to-purple-950",
      icon: "🎵",
      quote: "Listen to my Visi-Sonor and reveal yourself...",
      description: "The clown whose performance compels truth"
    },
    {
      value: 4,
      name: "Shielded Mind",
      count: 2,
      ability: "Until your next turn, ignore effects from other players.",
      color: "from-cyan-800 to-cyan-950",
      icon: "🛡️",
      quote: "I know how to protect my thoughts from scrutiny...",
      description: "Protection that might itself be part of the design"
    },
    {
      value: 5,
      name: "Bayta Darell",
      count: 1,
      ability: "Choose any player to discard their hand and draw a new card.",
      color: "from-rose-800 to-rose-950",
      icon: "💫",
      quote: "You must reveal yourself - we're searching for the Mule!",
      description: "The woman whose intuition provides some immunity"
    },
    {
      value: 5,
      name: "Toran Darell",
      count: 1,
      ability: "Choose any player to discard their hand and draw a new card.",
      color: "from-red-800 to-red-950",
      icon: "⚔️",
      quote: "We will find him, no matter the cost...",
      description: "The searcher touched by the Mule's power"
    },
    {
      value: 6,
      name: "Mayor Indbur",
      count: 1,
      ability: "Trade hands with another player.",
      color: "from-yellow-700 to-yellow-900",
      icon: "👑",
      quote: "As Mayor of Terminus, I command an exchange...",
      description: "Certain of his independence, never suspecting his conversion"
    },
    {
      value: 7,
      name: "The First Speaker",
      count: 1,
      ability: "If you have this with Mayor Indbur or either Darell, you must discard this card.",
      color: "from-emerald-800 to-emerald-950",
      icon: "🔮",
      quote: "My presence must remain hidden from all eyes...",
      description: "Secrecy is paramount, even at the cost of influence"
    },
    {
      value: 8,
      name: "The Mule",
      count: 1,
      ability: "If you discard this card, you are eliminated from the round.",
      color: "from-red-950 to-black",
      icon: "👁️",
      quote: "I am the master of minds, the conqueror of wills...",
      description: "The mutant who rewrites emotion itself"
    }
  ];

  const currentCard = cards[selectedCard];

  const nextCard = () => {
    setSelectedCard((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setSelectedCard((prev) => (prev - 1 + cards.length) % cards.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4">
            The Mule
          </h1>
          <p className="text-gray-300 text-lg">A Foundation Universe Card Game</p>
          <p className="text-gray-400 text-sm mt-2 italic">
            "When the Mule touches your mind, you know no better love"
          </p>
        </header>

        <div className="flex items-center justify-center gap-8 mb-12">
          <button 
            onClick={prevCard}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeft className="w-8 h-8 text-gray-300" />
          </button>

          <div className={`relative w-96 h-[560px] bg-gradient-to-br ${currentCard.color} rounded-2xl shadow-2xl p-6 flex flex-col`}>
            {/* Card Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="text-6xl opacity-90">{currentCard.icon}</div>
              <div className="text-right">
                <div className="text-5xl font-bold text-white">{currentCard.value}</div>
                <div className="text-xs text-gray-300 mt-1">×{currentCard.count}</div>
              </div>
            </div>

            {/* Card Name */}
            <h2 className="text-3xl font-bold text-white mb-2">{currentCard.name}</h2>
            <p className="text-sm text-gray-300 italic mb-4">{currentCard.description}</p>

            {/* Divider */}
            <div className="border-t border-gray-400 opacity-30 my-4"></div>

            {/* Quote */}
            <div className="mb-6">
              <p className="text-sm text-gray-200 italic leading-relaxed">
                "{currentCard.quote}"
              </p>
            </div>

            {/* Ability */}
            <div className="mt-auto">
              <div className="bg-black bg-opacity-40 rounded-lg p-4 border border-gray-600">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Ability</div>
                <p className="text-sm text-white leading-relaxed">{currentCard.ability}</p>
              </div>
            </div>

            {/* Decorative corner elements */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-gray-400 opacity-20"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-gray-400 opacity-20"></div>
          </div>

          <button 
            onClick={nextCard}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-gray-300" />
          </button>
        </div>

        {/* Card Gallery */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCard(idx)}
              className={`p-3 rounded-lg transition-all ${
                selectedCard === idx 
                  ? 'bg-purple-600 ring-2 ring-purple-400' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="text-lg font-bold text-white">{card.value}</div>
              <div className="text-xs text-gray-300 truncate">{card.name}</div>
            </button>
          ))}
        </div>

        {/* Design Notes */}
        <div className="bg-gray-800 bg-opacity-50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Design Philosophy</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300 text-sm">
            <div>
              <h4 className="font-bold text-purple-400 mb-2">Color Palette</h4>
              <p>Dark gradients evoke the psychological manipulation and moral ambiguity of the Mule's conquest. Each character has a unique color that reflects their role and personality.</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-400 mb-2">Typography</h4>
              <p>Bold, modern fonts convey the science fiction setting while maintaining readability. The contrast between the elegant quotes and stark abilities reflects the gap between perceived freedom and actual control.</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-400 mb-2">Iconography</h4>
              <p>Simple emoji-based icons provide immediate visual recognition while maintaining a clean, minimalist aesthetic appropriate for card design.</p>
            </div>
            <div>
              <h4 className="font-bold text-purple-400 mb-2">Layout</h4>
              <p>The card layout prioritizes the value (most important for gameplay), followed by the character's identity, their tragic quote, and finally the mechanical ability in a distinct panel.</p>
            </div>
          </div>
        </div>

        {/* Devotion Tokens */}
        <div className="mt-8 bg-gray-800 bg-opacity-50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Devotion Tokens</h3>
          <div className="flex items-center gap-8">
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-900 border-2 border-red-400 flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
              ))}
            </div>
            <div className="text-gray-300 text-sm">
              <p className="font-bold text-purple-400 mb-2">Tokens of Devotion</p>
              <p>Each token represents a moment where your conversion is proven more complete than others. You believe you are winning, but you are simply demonstrating how thoroughly you have been conquered.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MuleCardDesign;