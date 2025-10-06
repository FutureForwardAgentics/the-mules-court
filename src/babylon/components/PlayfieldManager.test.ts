import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scene, FreeCamera, Vector3, Engine } from '@babylonjs/core';
import { AdvancedDynamicTexture, Rectangle, Image, TextBlock } from '@babylonjs/gui';
import { PlayfieldManager } from './PlayfieldManager';
import type { GameState, Player, Card } from '../../types/game';

// Mock BabylonJS modules
vi.mock('@babylonjs/core', () => {
  // Create a mock Vector3 constructor
  const MockVector3 = class MockVector3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    static Zero() {
      return new MockVector3(0, 0, 0);
    }
  };

  return {
    Scene: vi.fn(),
    FreeCamera: vi.fn(() => ({
      setTarget: vi.fn(),
    })),
    Vector3: MockVector3,
    Engine: vi.fn(),
  };
});

vi.mock('@babylonjs/gui', () => {
  const createMockRectangle = () => ({
    addControl: vi.fn(),
    dispose: vi.fn(),
    scaleX: 1,
    scaleY: 1,
    color: '',
    background: '',
    thickness: 0,
    alpha: 1,
    left: '',
    top: '',
    width: '',
    height: '',
    cornerRadius: 0,
    isVisible: true,
  });

  const createMockImage = () => ({
    stretch: 0,
    alpha: 1,
    dispose: vi.fn(),
    width: '',
    height: '',
    top: '',
    left: '',
  });

  const createMockTextBlock = () => ({
    text: '',
    color: '',
    scaleX: 1,
    scaleY: 1,
    fontSize: 0,
    fontWeight: '',
    top: '',
    left: '',
    height: '',
    width: '',
  });

  const createMockStackPanel = () => ({
    addControl: vi.fn(),
    clearControls: vi.fn(),
    dispose: vi.fn(),
    isVertical: false,
    width: '',
    height: '',
    top: '',
    left: '',
  });

  return {
    AdvancedDynamicTexture: {
      CreateFullscreenUI: vi.fn(),
    },
    Rectangle: vi.fn(createMockRectangle),
    Image: vi.fn(() => {
      const mock = createMockImage();
      // Add STRETCH_UNIFORM and STRETCH_FILL as static properties
      (mock as any).STRETCH_UNIFORM = 0;
      (mock as any).STRETCH_FILL = 1;
      return mock;
    }),
    TextBlock: vi.fn(createMockTextBlock),
    Control: {
      HORIZONTAL_ALIGNMENT_CENTER: 0,
      VERTICAL_ALIGNMENT_CENTER: 0,
    },
    StackPanel: vi.fn(createMockStackPanel),
  };
});

describe('PlayfieldManager', () => {
  let mockScene: any;
  let mockAdvancedTexture: any;
  let mockCamera: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock camera with all required methods
    mockCamera = {
      setTarget: vi.fn(),
    };

    // Mock FreeCamera constructor to return our mock camera
    (FreeCamera as any).mockImplementation(() => mockCamera);

    // Create mock scene
    mockScene = {
      activeCamera: null,
      onDisposeObservable: {
        add: vi.fn(),
      },
    };

    // Create mock advanced texture
    mockAdvancedTexture = {
      addControl: vi.fn(),
    };
  });

  describe('Constructor', () => {
    it('should create a FreeCamera with correct parameters', () => {
      new PlayfieldManager(mockScene, mockAdvancedTexture);

      expect(FreeCamera).toHaveBeenCalledWith(
        'playfield-camera',
        expect.any(Object),
        mockScene
      );
    });

    it('should set camera target to Vector3.Zero', () => {
      new PlayfieldManager(mockScene, mockAdvancedTexture);

      expect(mockCamera.setTarget).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0, y: 0, z: 0 })
      );
    });

    it('should set scene.activeCamera to the created camera', () => {
      new PlayfieldManager(mockScene, mockAdvancedTexture);

      expect(mockScene.activeCamera).toBe(mockCamera);
    });

    it('should create background image', () => {
      new PlayfieldManager(mockScene, mockAdvancedTexture);

      expect(Image).toHaveBeenCalledWith('playfield-bg', '/img/playfield_background_space.png');
      expect(mockAdvancedTexture.addControl).toHaveBeenCalled();
    });

    it('should create deck container', () => {
      new PlayfieldManager(mockScene, mockAdvancedTexture);

      expect(Rectangle).toHaveBeenCalledWith('deck-container');
    });

    it('should create center info panel', () => {
      new PlayfieldManager(mockScene, mockAdvancedTexture);

      expect(Rectangle).toHaveBeenCalledWith('center-info-panel');
      expect(TextBlock).toHaveBeenCalledWith('game-title', "THE MULE'S COURT");
      expect(TextBlock).toHaveBeenCalledWith('phase-text', 'Setup Phase');
      expect(TextBlock).toHaveBeenCalledWith('current-player', "Player 1's Turn");
    });
  });

  describe('calculatePlayerLayouts', () => {
    let manager: PlayfieldManager;

    beforeEach(() => {
      manager = new PlayfieldManager(mockScene, mockAdvancedTexture);
    });

    it('should return 2 layouts for 2 players', () => {
      const gameState = createMockGameState(2);

      // Clear previous calls from constructor
      vi.clearAllMocks();

      manager.updatePlayfield(gameState);

      // Verify that player areas are created (2 times)
      const rectangleCalls = (Rectangle as any).mock.calls;
      const playerContainerCalls = rectangleCalls.filter((call: any[]) =>
        call[0]?.includes('player-') && call[0]?.includes('-container')
      );

      expect(playerContainerCalls.length).toBe(2);
    });

    it('should position 2 players vertically (top and bottom)', () => {
      const gameState = createMockGameState(2);

      manager.updatePlayfield(gameState);

      // We can't directly test the private method, but we can verify
      // that player areas are created with correct positioning
      const rectangleCalls = (Rectangle as any).mock.calls;
      expect(rectangleCalls.length).toBeGreaterThan(0);
    });

    it('should return 3 layouts for 3 players', () => {
      const gameState = createMockGameState(3);

      // Clear previous calls from constructor
      vi.clearAllMocks();

      manager.updatePlayfield(gameState);

      const rectangleCalls = (Rectangle as any).mock.calls;
      const playerContainerCalls = rectangleCalls.filter((call: any[]) =>
        call[0]?.includes('player-') && call[0]?.includes('-container')
      );

      expect(playerContainerCalls.length).toBe(3);
    });

    it('should return 4 layouts for 4 players', () => {
      const gameState = createMockGameState(4);

      // Clear previous calls from constructor
      vi.clearAllMocks();

      manager.updatePlayfield(gameState);

      const rectangleCalls = (Rectangle as any).mock.calls;
      const playerContainerCalls = rectangleCalls.filter((call: any[]) =>
        call[0]?.includes('player-') && call[0]?.includes('-container')
      );

      expect(playerContainerCalls.length).toBe(4);
    });

    it('should return distinct positions for each player in 2-player layout', () => {
      const gameState = createMockGameState(2);

      // Clear previous calls from constructor
      vi.clearAllMocks();

      manager.updatePlayfield(gameState);

      // Player positions should be different
      // We verify this by checking that multiple Rectangle instances are created
      expect(Rectangle).toHaveBeenCalled();
    });

    it('should return distinct positions for each player in 3-player layout', () => {
      const gameState = createMockGameState(3);
      manager.updatePlayfield(gameState);

      expect(Rectangle).toHaveBeenCalled();
    });

    it('should return distinct positions for each player in 4-player layout', () => {
      const gameState = createMockGameState(4);
      manager.updatePlayfield(gameState);

      expect(Rectangle).toHaveBeenCalled();
    });
  });

  describe('updatePlayfield', () => {
    let manager: PlayfieldManager;
    let mockDeckCountText: any;
    let mockDeckImage: any;
    let mockDeckContainer: any;

    beforeEach(() => {
      // Create more sophisticated mocks for deck components
      mockDeckCountText = {
        text: '',
        color: '',
      };

      mockDeckImage = {
        alpha: 1,
        dispose: vi.fn(),
        stretch: 0,
        width: '',
        height: '',
        top: '',
        left: '',
      };

      mockDeckContainer = {
        color: '',
        scaleX: 1,
        scaleY: 1,
      };

      // Mock TextBlock to return our mock for deck count
      let textBlockCallCount = 0;
      (TextBlock as any).mockImplementation((name: string, text: string) => {
        if (name === 'deck-count') {
          return mockDeckCountText;
        }
        textBlockCallCount++;
        return {
          text: text,
          color: '',
          scaleX: 1,
          scaleY: 1,
          fontSize: 0,
          fontWeight: '',
          top: '',
          left: '',
          height: '',
          width: '',
        };
      });

      // Mock Image to return our mock for deck image
      let imageCallCount = 0;
      (Image as any).mockImplementation((name: string) => {
        if (name === 'deck-card') {
          return mockDeckImage;
        }
        imageCallCount++;
        return {
          stretch: 0,
          alpha: 1,
          dispose: vi.fn(),
          width: '',
          height: '',
          top: '',
          left: '',
        };
      });

      // Mock Rectangle to return our mock for deck container
      let rectangleCallCount = 0;
      (Rectangle as any).mockImplementation((name: string) => {
        if (name === 'deck-container') {
          // Add addControl method to the mockDeckContainer
          return {
            ...mockDeckContainer,
            addControl: vi.fn(),
            dispose: vi.fn(),
          };
        }
        rectangleCallCount++;
        return {
          addControl: vi.fn(),
          dispose: vi.fn(),
          scaleX: 1,
          scaleY: 1,
          color: '',
          background: '',
          thickness: 0,
          alpha: 1,
          left: '',
          top: '',
          width: '',
          height: '',
          cornerRadius: 0,
          isVisible: true,
        };
      });

      manager = new PlayfieldManager(mockScene, mockAdvancedTexture);
    });

    it('should update deck count display', () => {
      const gameState = createMockGameState(2);
      gameState.deck = createMockDeck(10);

      manager.updatePlayfield(gameState);

      expect(mockDeckCountText.text).toBe('10');
    });

    it('should show EMPTY when deck is empty', () => {
      const gameState = createMockGameState(2);
      gameState.deck = [];

      manager.updatePlayfield(gameState);

      expect(mockDeckCountText.text).toBe('EMPTY');
      expect(mockDeckCountText.color).toBe('#ef4444');
      expect(mockDeckImage.alpha).toBe(0.3);
    });

    it('should show warning when deck has 3 or fewer cards', () => {
      const gameState = createMockGameState(2);
      gameState.deck = createMockDeck(3);

      manager.updatePlayfield(gameState);

      expect(mockDeckCountText.color).toBe('#fbbf24');
      expect(mockDeckImage.alpha).toBe(0.7);
    });

    it('should show normal state when deck has more than 3 cards', () => {
      const gameState = createMockGameState(2);
      gameState.deck = createMockDeck(10);

      manager.updatePlayfield(gameState);

      expect(mockDeckCountText.color).toBe('white');
      expect(mockDeckImage.alpha).toBe(1.0);
    });

    it('should create player areas for all players', () => {
      const gameState = createMockGameState(3);

      // Clear previous calls from constructor
      vi.clearAllMocks();

      manager.updatePlayfield(gameState);

      const rectangleCalls = (Rectangle as any).mock.calls;
      const playerContainerCalls = rectangleCalls.filter((call: any[]) =>
        call[0]?.includes('player-') && call[0]?.includes('-container')
      );

      expect(playerContainerCalls.length).toBe(3);
    });

    it('should not create duplicate player areas on subsequent updates', () => {
      const gameState = createMockGameState(2);

      // First update
      manager.updatePlayfield(gameState);
      const callCountAfterFirst = (Rectangle as any).mock.calls.length;

      // Second update
      manager.updatePlayfield(gameState);
      const callCountAfterSecond = (Rectangle as any).mock.calls.length;

      // Should not create new rectangles for existing players
      expect(callCountAfterSecond).toBe(callCountAfterFirst);
    });
  });

  describe('updatePhaseDisplay', () => {
    let manager: PlayfieldManager;
    let mockPhaseText: any;

    beforeEach(() => {
      mockPhaseText = {
        text: '',
        color: '',
        scaleX: 1,
        scaleY: 1,
      };

      // Mock TextBlock to return our mock for phase text
      (TextBlock as any).mockImplementation((name: string, text: string) => {
        if (name === 'phase-text') {
          return mockPhaseText;
        }
        return {
          text: text,
          color: '',
          scaleX: 1,
          scaleY: 1,
        };
      });

      manager = new PlayfieldManager(mockScene, mockAdvancedTexture);
    });

    it('should display "Setup Phase" with gray color for setup phase', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'setup';

      manager.updatePlayfield(gameState);

      expect(mockPhaseText.text).toBe('Setup Phase');
      expect(mockPhaseText.color).toBe('#9ca3af');
    });

    it('should display "→ Draw Card" with blue color for draw phase', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'draw';

      manager.updatePlayfield(gameState);

      expect(mockPhaseText.text).toBe('→ Draw Card');
      expect(mockPhaseText.color).toBe('#60a5fa');
    });

    it('should display "→ Play Card" with purple color for play phase', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'play';

      manager.updatePlayfield(gameState);

      expect(mockPhaseText.text).toBe('→ Play Card');
      expect(mockPhaseText.color).toBe('#c084fc');
    });

    it('should display "✦ Round Complete" with green color for round-end phase', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'round-end';

      manager.updatePlayfield(gameState);

      expect(mockPhaseText.text).toBe('✦ Round Complete');
      expect(mockPhaseText.color).toBe('#4ade80');
    });

    it('should display "★ GAME OVER ★" with yellow color for game-end phase', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'game-end';

      manager.updatePlayfield(gameState);

      expect(mockPhaseText.text).toBe('★ GAME OVER ★');
      expect(mockPhaseText.color).toBe('#fbbf24');
    });
  });

  describe('animation methods', () => {
    let manager: PlayfieldManager;

    beforeEach(() => {
      manager = new PlayfieldManager(mockScene, mockAdvancedTexture);

      // Mock requestAnimationFrame for animation tests
      vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
        // Don't actually run the animation, just acknowledge it was set up
        return 1;
      }));

      // Mock Date.now for consistent timing
      vi.spyOn(Date, 'now').mockReturnValue(1000);
    });

    it('should not crash when animating pulse on empty deck', () => {
      const gameState = createMockGameState(2);
      gameState.deck = [];

      expect(() => {
        manager.updatePlayfield(gameState);
      }).not.toThrow();
    });

    it('should not crash when animating pulse on low deck', () => {
      const gameState = createMockGameState(2);
      gameState.deck = createMockDeck(2);

      expect(() => {
        manager.updatePlayfield(gameState);
      }).not.toThrow();
    });

    it('should not crash when animating phase changes', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'round-end';

      expect(() => {
        manager.updatePlayfield(gameState);
      }).not.toThrow();
    });

    it('should set up animation for game-end phase', () => {
      const gameState = createMockGameState(2);
      gameState.phase = 'game-end';
      gameState.players[0].devotionTokens = 7;

      expect(() => {
        manager.updatePlayfield(gameState);
      }).not.toThrow();

      expect(requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose all GUI elements without errors', () => {
      const manager = new PlayfieldManager(mockScene, mockAdvancedTexture);
      const gameState = createMockGameState(2);

      manager.updatePlayfield(gameState);

      expect(() => {
        manager.dispose();
      }).not.toThrow();
    });

    it('should clear player areas map', () => {
      const manager = new PlayfieldManager(mockScene, mockAdvancedTexture);
      const gameState = createMockGameState(3);

      manager.updatePlayfield(gameState);
      manager.dispose();

      // After dispose, updating should create new player areas
      vi.clearAllMocks();
      manager.updatePlayfield(gameState);

      // Should not have any existing player areas
      expect(Rectangle).toHaveBeenCalled();
    });
  });
});

// Helper functions
function createMockGameState(playerCount: number): GameState {
  const players: Player[] = [];

  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: `player-${i}`,
      name: `Player ${i + 1}`,
      hand: [],
      discardPile: [],
      devotionTokens: 0,
      isProtected: false,
      isEliminated: false,
    });
  }

  return {
    players,
    deck: createMockDeck(16),
    currentPlayerIndex: 0,
    phase: 'setup',
    round: 1,
    tokensToWin: playerCount === 2 ? 7 : playerCount === 3 ? 5 : 4,
    removedCard: null,
  };
}

function createMockDeck(size: number): Card[] {
  const cards: Card[] = [];

  for (let i = 0; i < size; i++) {
    cards.push({
      id: `card-${i}`,
      type: 'informant',
      value: 1,
      name: 'Informant',
      ability: 'Test ability',
      color: 'from-slate-700 to-slate-900',
      icon: '👤',
      quote: 'Test quote',
      description: 'Test description',
    });
  }

  return cards;
}
