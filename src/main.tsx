import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped/failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
