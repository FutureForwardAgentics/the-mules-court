import { useState, useEffect } from 'react';
import { gameDB, type GameSession } from '../services/gameDatabase';

export function SessionViewer() {
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const allSessions = await gameDB.getAllSessions();
    setSessions(allSessions);
  };

  const viewSession = async (sessionId: string) => {
    const session = await gameDB.getSession(sessionId);
    setSelectedSession(session);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: number, end?: number) => {
    if (!end) return 'In progress';
    const duration = Math.round((end - start) / 1000);
    return `${duration}s`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '10px 20px',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 10000,
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
        }}
      >
        📊 View Game Sessions ({sessions.length})
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 10000,
        overflow: 'auto',
        padding: '20px',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Game Sessions</h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setSelectedSession(null);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        {!selectedSession ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={loadSessions}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginRight: '10px',
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {sessions.map(session => (
                <div
                  key={session.id}
                  style={{
                    padding: '15px',
                    backgroundColor: '#1f2937',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Session: {session.id.slice(-8)}</span>
                    <span style={{ color: '#9ca3af' }}>{formatTime(session.startTime)}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '8px' }}>
                    <div>Players: {session.playerCount}</div>
                    <div>Duration: {formatDuration(session.startTime, session.endTime)}</div>
                    <div>Events: {session.events?.length || 0}</div>
                    {session.winner && <div>Winner: {session.winner}</div>}
                  </div>
                  <button
                    onClick={() => viewSession(session.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedSession(null)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              ← Back to Sessions
            </button>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Session: {selectedSession.id.slice(-8)}</h3>
              <div style={{ fontSize: '14px', color: '#d1d5db' }}>
                <div>Started: {formatTime(selectedSession.startTime)}</div>
                {selectedSession.endTime && (
                  <div>Ended: {formatTime(selectedSession.endTime)}</div>
                )}
                <div>Players: {selectedSession.playerCount}</div>
                {selectedSession.winner && <div>Winner: {selectedSession.winner}</div>}
              </div>
            </div>

            <h4 style={{ fontSize: '18px', marginBottom: '10px' }}>Events ({selectedSession.events?.length || 0})</h4>
            <div style={{ display: 'grid', gap: '8px', maxHeight: '600px', overflow: 'auto' }}>
              {selectedSession.events?.map((event, index) => (
                <div
                  key={event.id}
                  style={{
                    padding: '12px',
                    backgroundColor: '#111827',
                    borderRadius: '6px',
                    border: '1px solid #374151',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>
                      {index + 1}. {event.type}
                    </span>
                    <span style={{ color: '#9ca3af' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ color: '#d1d5db' }}>
                    <div>Player: {event.playerId}</div>
                    <div>Data: {JSON.stringify(event.data)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
