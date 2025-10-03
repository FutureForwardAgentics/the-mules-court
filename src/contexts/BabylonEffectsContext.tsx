import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Engine, Scene, Color3 } from '@babylonjs/core';
import {
  createCardPlayEffect,
  createEliminationEffect,
  createProtectionEffect,
  createCelebrationEffect,
} from '../components/BabylonEffects';

interface BabylonEffectsContextType {
  engine: Engine | null;
  scene: Scene | null;
  setEngineAndScene: (engine: Engine, scene: Scene) => void;
  playCardEffect: (x: number, y: number, color?: Color3) => void;
  eliminationEffect: (x: number, y: number) => void;
  protectionEffect: (x: number, y: number) => void;
  celebrationEffect: (x: number, y: number) => void;
}

const BabylonEffectsContext = createContext<BabylonEffectsContextType | null>(null);

export function BabylonEffectsProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<Engine | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);

  const setEngineAndScene = (eng: Engine, scn: Scene) => {
    setEngine(eng);
    setScene(scn);
  };

  const playCardEffect = (x: number, y: number, color?: Color3) => {
    if (scene) createCardPlayEffect(scene, x, y, color);
  };

  const eliminationEffect = (x: number, y: number) => {
    if (scene) createEliminationEffect(scene, x, y);
  };

  const protectionEffect = (x: number, y: number) => {
    if (scene) createProtectionEffect(scene, x, y);
  };

  const celebrationEffect = (x: number, y: number) => {
    if (scene) createCelebrationEffect(scene, x, y);
  };

  return (
    <BabylonEffectsContext.Provider
      value={{
        engine,
        scene,
        setEngineAndScene,
        playCardEffect,
        eliminationEffect,
        protectionEffect,
        celebrationEffect,
      }}
    >
      {children}
    </BabylonEffectsContext.Provider>
  );
}

export function useBabylonEffects() {
  const context = useContext(BabylonEffectsContext);
  if (!context) {
    throw new Error('useBabylonEffects must be used within BabylonEffectsProvider');
  }
  return context;
}
