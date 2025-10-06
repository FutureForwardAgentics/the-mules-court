import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BaytaCardDemo } from './components/BaytaCardDemo';
import './index.css';

/**
 * Demo entry point for Bayta's Card
 *
 * Access via: /demo.html after building
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BaytaCardDemo />
  </StrictMode>,
);
