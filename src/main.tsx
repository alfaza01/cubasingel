import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Expose prompt API globally using index.html's early initialized variables
(window as any).getDeferredPrompt = () => (window as any).deferredPrompt;
(window as any).clearDeferredPrompt = () => { (window as any).deferredPrompt = null; };

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Sinyal bahwa aplikasi sukses dimuat dan menghentikan routine pembersihan darurat di index.html
(window as any).__APP_MOUNTED__ = true;
