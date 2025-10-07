import { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  Color3,
  Color4
} from '@babylonjs/core';
import { BabylonCardMesh } from '../babylon/components/BabylonCardMesh';
import { createDeck } from '../data/cards';
import type { Card } from '../types/game';

/**
 * CardShowcase
 *
 * Interactive showcase displaying all 16 cards in a grid layout.
 * Features 2.5D perspective and holographic cursor-following effects.
 */
export function CardShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sceneRef = useRef<Scene | null>(null);
  const mousePositionRef = useRef({ x: 0.5, y: 0.5 });
  const cardMeshesRef = useRef<BabylonCardMesh[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    sceneRef.current = scene;

    // Dark background for visual contrast
    scene.clearColor = new Color4(0.05, 0.05, 0.1, 1.0);

    // Setup camera with good viewing angle
    const camera = new ArcRotateCamera(
      'showcase-camera',
      Math.PI / 4, // alpha: 45 degrees rotation
      Math.PI / 3, // beta: 60 degrees tilt
      30, // radius: distance from target
      Vector3.Zero(), // target: center of grid
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 50;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2;

    // Setup lighting
    const ambientLight = new HemisphericLight(
      'ambient-light',
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.6;
    ambientLight.diffuse = new Color3(0.8, 0.8, 1.0);
    ambientLight.groundColor = new Color3(0.3, 0.3, 0.4);

    const mainLight = new DirectionalLight(
      'main-light',
      new Vector3(-0.5, -1, -0.3),
      scene
    );
    mainLight.intensity = 0.8;
    mainLight.position = new Vector3(10, 20, 10);

    const shadowGenerator = new ShadowGenerator(1024, mainLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Create all 16 cards in 4x4 grid
    const deck = createDeck();
    const uniqueCards: Card[] = [];
    const seenTypes = new Set<string>();

    // Get one card of each type (1-8, with variants)
    deck.forEach(card => {
      const typeKey = `${card.value}-${card.type}`;
      if (!seenTypes.has(typeKey)) {
        seenTypes.add(typeKey);
        uniqueCards.push(card);
      }
    });

    // Sort by value for organized display
    uniqueCards.sort((a, b) => a.value - b.value);

    // Grid layout: 4 columns x 4 rows
    const cols = 4;
    const spacing = 3.5; // Space between cards
    const totalCards = uniqueCards.length;

    uniqueCards.forEach((card, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      // Center the grid around origin
      const x = (col - cols / 2 + 0.5) * spacing;
      const y = -(row - Math.ceil(totalCards / cols) / 2 + 0.5) * spacing;
      const position = new Vector3(x, y, 0);

      // Create card mesh with holographic shader
      const cardMesh = new BabylonCardMesh(scene, {
        card,
        size: 'medium',
        isRevealed: true, // Show all card fronts
        isInteractive: true,
        position,
        rotation: new Vector3(0.1, 0, 0), // Slight forward tilt
        shadowGenerator,
        useHoloShader: true, // Enable holographic effect
        onCardClick: (cardId) => {
          console.log(`Card clicked: ${cardId}`, card);
        }
      });

      cardMeshesRef.current.push(cardMesh);
    });

    // Mouse tracking for holographic effect
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const normalizedX = (event.clientX - rect.left) / rect.width;
      const normalizedY = (event.clientY - rect.top) / rect.height;

      mousePositionRef.current = {
        x: normalizedX,
        y: normalizedY
      };

      // Update all card materials with mouse position
      cardMeshesRef.current.forEach(cardMesh => {
        cardMesh.updateMousePosition(normalizedX, normalizedY);
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    setIsLoading(false);

    // Cleanup
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cardMeshesRef.current.forEach(cardMesh => cardMesh.dispose());
      cardMeshesRef.current = [];
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-white text-2xl animate-pulse">
            Loading Card Showcase...
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* UI Overlay */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gray-900/90 rounded-xl px-8 py-4 border-2 border-purple-600 shadow-2xl backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
            The Mule's Court - Card Showcase
          </h1>
          <p className="text-gray-400 text-center text-sm mt-2">
            Hover over cards to see effects • Click and drag to rotate view
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-xl"
        >
          ← Back to Game
        </button>
      </div>
    </div>
  );
}
