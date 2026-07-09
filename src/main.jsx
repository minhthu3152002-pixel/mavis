import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Service worker is registered by OneSignal's page.js (OneSignalSDKWorker.js),
// which also imports our offline cache logic — so we don't register one here.
