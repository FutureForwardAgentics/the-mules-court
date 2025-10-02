import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

console.log('Mounting React application...');

// Removed StrictMode to prevent double initialization of PixiJS
createRoot(rootElement).render(<App />);

console.log('React application mounted');
