import { useState } from 'react';
import type { Card, CardType, Player } from '../types/game';

interface CardInteractionModalProps {
  card: Card;
  players: Player[];
  currentPlayerId: string;
  onConfirm: (choice: CardInteractionChoice) => void;
  onCancel: () => void;
}

export interface CardInteractionChoice {
  targetPlayerId?: string;
  namedCharacter?: CardType;
}

export function CardInteractionModal({
  card,
  players,
  currentPlayerId,
  onConfirm,
  onCancel,
}: CardInteractionModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [namedCharacter, setNamedCharacter] = useState<CardType | ''>('');

  // Filter out current player and eliminated players for targeting
  const targetablePlayers = players.filter(
    p => p.id !== currentPlayerId && !p.isEliminated
  );

  // All character types except Informant for naming
  const namableCharacters: CardType[] = [
    'han-pritcher',
    'bail-channis',
    'ebling-mis',
    'magnifico',
    'shielded-mind',
    'bayta-darell',
    'toran-darell',
    'mayor-indbur',
    'first-speaker',
    'mule',
  ];

  const handleConfirm = () => {
    const choice: CardInteractionChoice = {};

    if (selectedPlayerId) {
      choice.targetPlayerId = selectedPlayerId;
    }

    if (namedCharacter) {
      choice.namedCharacter = namedCharacter;
    }

    onConfirm(choice);
  };

  const renderInteraction = () => {
    switch (card.type) {
      case 'informant':
        return (
          <div>
            <p style={{ marginBottom: '15px', color: '#d1d5db' }}>
              {card.ability}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Name a character:
            </label>
            <select
              value={namedCharacter}
              onChange={e => setNamedCharacter(e.target.value as CardType)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                backgroundColor: '#1f2937',
                color: 'white',
              }}
            >
              <option value="">-- Select a character --</option>
              {namableCharacters.map(type => (
                <option key={type} value={type}>
                  {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        );

      case 'han-pritcher':
      case 'bail-channis':
        return (
          <div>
            <p style={{ marginBottom: '15px', color: '#d1d5db' }}>
              {card.ability}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Choose a player:
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {targetablePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: selectedPlayerId === player.id ? '2px solid #60a5fa' : '1px solid #4b5563',
                    backgroundColor: selectedPlayerId === player.id ? '#1e40af' : '#1f2937',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        );

      case 'ebling-mis':
      case 'magnifico':
        return (
          <div>
            <p style={{ marginBottom: '15px', color: '#d1d5db' }}>
              {card.ability}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Choose a player to compare hands with:
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {targetablePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: selectedPlayerId === player.id ? '2px solid #60a5fa' : '1px solid #4b5563',
                    backgroundColor: selectedPlayerId === player.id ? '#1e40af' : '#1f2937',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        );

      case 'shielded-mind':
        return (
          <div>
            <p style={{ marginBottom: '15px', color: '#d1d5db' }}>
              {card.ability}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              You are now protected until your next turn.
            </p>
          </div>
        );

      case 'bayta-darell':
      case 'toran-darell':
        return (
          <div>
            <p style={{ marginBottom: '15px', color: '#d1d5db' }}>
              {card.ability}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Choose a player to discard and redraw:
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {players
                .filter(p => !p.isEliminated)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      border: selectedPlayerId === player.id ? '2px solid #60a5fa' : '1px solid #4b5563',
                      backgroundColor: selectedPlayerId === player.id ? '#1e40af' : '#1f2937',
                      color: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {player.name} {player.id === currentPlayerId && '(You)'}
                  </button>
                ))}
            </div>
          </div>
        );

      case 'mayor-indbur':
        return (
          <div>
            <p style={{ marginBottom: '15px', color: '#d1d5db' }}>
              {card.ability}
            </p>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Choose a player to trade hands with:
            </label>
            <div style={{ display: 'grid', gap: '8px' }}>
              {targetablePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayerId(player.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: selectedPlayerId === player.id ? '2px solid #60a5fa' : '1px solid #4b5563',
                    backgroundColor: selectedPlayerId === player.id ? '#1e40af' : '#1f2937',
                    color: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p style={{ color: '#d1d5db' }}>{card.ability}</p>
          </div>
        );
    }
  };

  const isValidChoice = () => {
    if (card.type === 'informant') {
      return namedCharacter !== '';
    }
    if (
      card.type === 'han-pritcher' ||
      card.type === 'bail-channis' ||
      card.type === 'ebling-mis' ||
      card.type === 'magnifico' ||
      card.type === 'bayta-darell' ||
      card.type === 'toran-darell' ||
      card.type === 'mayor-indbur'
    ) {
      return selectedPlayerId !== '';
    }
    // Shielded Mind, First Speaker, Mule don't require choices
    return true;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#111827',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          border: '2px solid #374151',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            {card.icon} {card.name}
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
            "{card.quote}"
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          {renderInteraction()}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              backgroundColor: '#374151',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValidChoice()}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isValidChoice() ? '#7c3aed' : '#4b5563',
              color: 'white',
              cursor: isValidChoice() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
