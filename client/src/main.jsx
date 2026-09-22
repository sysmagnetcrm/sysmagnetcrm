import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './styles/app.css'

// Prevent non-critical Navigator LockManager lock contention errors from bubbling as uncaught exceptions
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason?.message || event.reason || '');
    if (reason.includes('LockManager') || reason.includes('auth-token')) {
      event.preventDefault();
      console.warn('[Supabase Auth Lock] Suppressed LockManager contention:', reason);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
