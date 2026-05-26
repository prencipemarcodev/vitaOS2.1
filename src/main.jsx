import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Self-healing mechanism for chunk load and MIME type errors
window.addEventListener('error', (e) => {
  const errorMessage = e.message || '';
  const isMimeError = errorMessage.includes('MIME type') || 
                      errorMessage.includes('text/html') ||
                      (e.target && e.target.tagName === 'SCRIPT' && !e.target.ok);
  
  if (isMimeError) {
    console.warn('[VitaOS] MIME type error or chunk load failure detected. Forcing reload...', e);
    const lastReload = sessionStorage.getItem('vitaos-last-chunk-reload');
    const now = Date.now();
    if (!lastReload || (now - parseInt(lastReload, 10) > 10000)) {
      sessionStorage.setItem('vitaos-last-chunk-reload', now.toString());
      window.location.reload(true);
    }
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  const reason = (e.reason && e.reason.message) || '';
  if (reason.includes('Failed to fetch dynamically imported module') || 
      reason.includes('MIME type')) {
    console.warn('[VitaOS] Unhandled promise rejection (chunk load failure). Forcing reload...');
    const lastReload = sessionStorage.getItem('vitaos-last-chunk-reload');
    const now = Date.now();
    if (!lastReload || (now - parseInt(lastReload, 10) > 10000)) {
      sessionStorage.setItem('vitaos-last-chunk-reload', now.toString());
      window.location.reload(true);
    }
  }
});


// Registrazione del Service Worker per le notifiche PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[Service Worker] Registrato con successo:', reg.scope)
      })
      .catch((err) => {
        console.error('[Service Worker] Errore di registrazione:', err)
      })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
