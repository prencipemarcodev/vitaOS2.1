import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

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
