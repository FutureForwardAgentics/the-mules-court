import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  Texture
} from '@babylonjs/core';

/**
 * PlayingBoard
 *
 * Displays a 3D playing board with labeled spots for card placement.
 * Shows the game layout structure with positions for:
 * - Deck
 * - Discard pile
 * - Player hands (4 positions)
 * - Play area
 */
export function PlayingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    // Dark starfield background
    scene.clearColor = new Color4(0.02, 0.02, 0.05, 1.0);

    // Camera positioned above the table looking down
    const camera = new ArcRotateCamera(
      'board-camera',
      Math.PI / 2, // alpha: looking from side
      Math.PI / 3, // beta: 60 degrees from horizontal
      35, // radius: distance
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 20;
    camera.upperRadiusLimit = 50;

    // Lighting
    const ambientLight = new HemisphericLight(
      'ambient',
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.7;
    ambientLight.diffuse = new Color3(0.8, 0.8, 1.0);

    const mainLight = new DirectionalLight(
      'main',
      new Vector3(-0.5, -1, -0.3),
      scene
    );
    mainLight.intensity = 0.8;
    mainLight.position = new Vector3(10, 20, 10);

    const shadowGenerator = new ShadowGenerator(1024, mainLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Create table surface
    const table = MeshBuilder.CreateBox(
      'table',
      { width: 30, height: 0.5, depth: 20 },
      scene
    );
    table.position.y = -0.5;

    const tableMaterial = new StandardMaterial('table-mat', scene);
    tableMaterial.diffuseColor = new Color3(0.15, 0.1, 0.2); // Dark purple table
    tableMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
    table.material = tableMaterial;
    table.receiveShadows = true;

    // Helper function to create a card spot placeholder
    const createCardSpot = (
      name: string,
      position: Vector3,
      label: string,
      count: number = 1
    ) => {
      const cardWidth = 2.0;
      const cardHeight = 3.0;
      const spacing = 0.3;

      for (let i = 0; i < count; i++) {
        const offsetX = i * (cardWidth + spacing) - ((count - 1) * (cardWidth + spacing)) / 2;
        const spotPosition = position.add(new Vector3(offsetX, 0, 0));

        // Create card-shaped outline
        const spot = MeshBuilder.CreatePlane(
          `${name}-${i}`,
          { width: cardWidth, height: cardHeight },
          scene
        );
        spot.position = spotPosition;
        spot.rotation.x = Math.PI / 2; // Lay flat on table

        const spotMaterial = new StandardMaterial(`${name}-mat-${i}`, scene);
        spotMaterial.diffuseColor = new Color3(0.3, 0.2, 0.4); // Purple outline
        spotMaterial.alpha = 0.3;
        spotMaterial.emissiveColor = new Color3(0.2, 0.1, 0.3);
        spotMaterial.wireframe = true;
        spot.material = spotMaterial;

        shadowGenerator.addShadowCaster(spot);
      }

      // Create label
      const labelPlane = MeshBuilder.CreatePlane(
        `${name}-label`,
        { width: 4, height: 0.8 },
        scene
      );
      labelPlane.position = position.add(new Vector3(0, 0.1, cardHeight / 2 + 1));
      labelPlane.rotation.x = Math.PI / 2;

      const labelMaterial = new StandardMaterial(`${name}-label-mat`, scene);
      labelMaterial.emissiveColor = new Color3(0.8, 0.6, 1.0);

      // Use dynamic texture for label text
      const dynamicTexture = new Texture(
        'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="512" height="128">
            <rect width="512" height="128" fill="rgba(0,0,0,0)"/>
            <text x="256" y="80" font-family="Arial, sans-serif" font-size="48"
                  fill="white" text-anchor="middle" font-weight="bold">${label}</text>
          </svg>
        `),
        scene
      );
      labelMaterial.diffuseTexture = dynamicTexture;
      labelMaterial.opacityTexture = dynamicTexture;
      labelPlane.material = labelMaterial;
    };

    // Layout positions (bird's eye view)
    // Center play area
    createCardSpot('play-area', new Vector3(0, 0.3, 0), 'PLAY AREA', 4);

    // Deck (left side)
    createCardSpot('deck', new Vector3(-8, 0.3, 0), 'DECK', 1);

    // Discard pile (right side)
    createCardSpot('discard', new Vector3(8, 0.3, 0), 'DISCARD', 3);

    // Player positions around the table
    // Player 1 (bottom - local player)
    createCardSpot('player-1-hand', new Vector3(0, 0.3, 7), 'PLAYER 1', 2);

    // Player 2 (top)
    createCardSpot('player-2-hand', new Vector3(0, 0.3, -7), 'PLAYER 2', 2);

    // Player 3 (left)
    createCardSpot('player-3-hand', new Vector3(-10, 0.3, 3), 'PLAYER 3', 2);

    // Player 4 (right)
    createCardSpot('player-4-hand', new Vector3(10, 0.3, 3), 'PLAYER 4', 2);

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* UI Overlay */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gray-900/90 rounded-xl px-8 py-4 border-2 border-purple-600 shadow-2xl backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
            Playing Board Layout
          </h1>
          <p className="text-gray-400 text-center text-sm mt-2">
            Card placement positions for The Mule's Court
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gray-900/90 rounded-xl px-6 py-4 border border-purple-600/50 backdrop-blur-sm">
          <h3 className="text-white font-bold mb-2 text-center">Board Layout Guide</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>🃏 <strong>Deck:</strong> Draw pile (left side)</li>
            <li>🗑️ <strong>Discard:</strong> Played cards (right side)</li>
            <li>🎮 <strong>Play Area:</strong> Active card zone (center)</li>
            <li>👤 <strong>Hands:</strong> Player positions (around table)</li>
          </ul>
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
