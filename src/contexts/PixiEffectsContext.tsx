import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Application } from 'pixi.js';
import {
  createCardPlayEffect,
  createEliminationEffect,
  createProtectionEffect,
} from '../components/PixiEffects';

interface PixiEffectsContextType {
  app: Application | null;
  setApp: (app: Application) => void;
  playCardEffect: (x: number, y: number, color?: number) => void;
  eliminationEffect: (x: number, y: number) => void;
  protectionEffect: (x: number, y: number) => void;
}

const PixiEffectsContext = createContext<PixiEffectsContextType | null>(null);

export function PixiEffectsProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<Application | null>(null);

  const playCardEffect = (x: number, y: number, color?: number) => {
    if (app) createCardPlayEffect(app, x, y, color);
  };

  const eliminationEffect = (x: number, y: number) => {
    if (app) createEliminationEffect(app, x, y);
  };

  const protectionEffect = (x: number, y: number) => {
    if (app) createProtectionEffect(app, x, y);
  };

  return (
    <PixiEffectsContext.Provider
      value={{
        app,
        setApp,
        playCardEffect,
        eliminationEffect,
        protectionEffect,
      }}
    >
      {children}
    </PixiEffectsContext.Provider>
  );
}

export function usePixiEffects() {
  const context = useContext(PixiEffectsContext);
  if (!context) {
    throw new Error('usePixiEffects must be used within PixiEffectsProvider');
  }
  return context;
}
