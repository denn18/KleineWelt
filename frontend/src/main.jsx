import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import Seo from './seo/Seo.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { MessengerRealtimeProvider } from './context/MessengerRealtimeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MessengerRealtimeProvider>
          <Seo />
          <App />
        </MessengerRealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker registration failed', error);
    });
  });
}
