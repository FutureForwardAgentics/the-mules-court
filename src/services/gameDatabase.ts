// Game Database using IndexedDB for session recording

export interface GameEvent {
  id: string;
  sessionId: string;
  timestamp: number;
  type: 'game_start' | 'draw_card' | 'play_card' | 'end_turn' | 'round_end' | 'game_end';
  playerId: string;
  data: any;
  gameState: any;
}

export interface GameSession {
  id: string;
  startTime: number;
  endTime?: number;
  playerCount: number;
  winner?: string;
  events: GameEvent[];
}

class GameDatabase {
  private dbName = 'mules-court-db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Game database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('startTime', 'startTime');
        }

        // Create events store
        if (!db.objectStoreNames.contains('events')) {
          const eventsStore = db.createObjectStore('events', { keyPath: 'id' });
          eventsStore.createIndex('sessionId', 'sessionId');
          eventsStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  async createSession(playerCount: number): Promise<GameSession> {
    if (!this.db) await this.init();

    const session: GameSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      playerCount,
      events: [],
    };

    await this.saveSession(session);
    console.log('Game session created:', session.id);
    return session;
  }

  async saveSession(session: GameSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async recordEvent(event: Omit<GameEvent, 'id' | 'timestamp'>): Promise<GameEvent> {
    if (!this.db) throw new Error('Database not initialized');

    const fullEvent: GameEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const request = store.put(fullEvent);

      request.onsuccess = () => {
        console.log('Event recorded:', fullEvent.type, fullEvent);
        resolve(fullEvent);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions', 'events'], 'readonly');
      const sessionsStore = transaction.objectStore('sessions');
      const eventsStore = transaction.objectStore('events');

      const sessionRequest = sessionsStore.get(sessionId);

      sessionRequest.onsuccess = () => {
        const session = sessionRequest.result as GameSession | undefined;
        if (!session) {
          resolve(null);
          return;
        }

        // Get all events for this session
        const eventsIndex = eventsStore.index('sessionId');
        const eventsRequest = eventsIndex.getAll(sessionId);

        eventsRequest.onsuccess = () => {
          session.events = eventsRequest.result;
          resolve(session);
        };
        eventsRequest.onerror = () => reject(eventsRequest.error);
      };
      sessionRequest.onerror = () => reject(sessionRequest.error);
    });
  }

  async getAllSessions(): Promise<GameSession[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.getAll();

      request.onsuccess = () => {
        const sessions = request.result as GameSession[];
        resolve(sessions.sort((a, b) => b.startTime - a.startTime));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async endSession(sessionId: string, winner?: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    session.endTime = Date.now();
    session.winner = winner;
    await this.saveSession(session);
    console.log('Game session ended:', sessionId, 'Winner:', winner);
  }
}

export const gameDB = new GameDatabase();
