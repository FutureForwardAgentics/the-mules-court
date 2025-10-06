import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayfieldDemo } from './components/PlayfieldDemo';
import './index.css';

/**
 * Playfield Demo Entry Point
 *
 * Access via: /playfield.html
 * Shows complete game playfield with BabylonJS rendering
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PlayfieldDemo />
  </StrictMode>,
);
