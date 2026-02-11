import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Log the environment for debugging
console.log('Current Router Basename:', import.meta.env.BASE_URL);
console.log('Current URL Path:', window.location.pathname);

// Strip trailing slash from basename if it exists for better matching
let basename = import.meta.env.BASE_URL.replace(/\/$/, "");

// CRITICAL FIX: If we are in relative mode (./) but on GoDaddy subfolder (/alice)
if (basename === "." || basename === "") {
  if (window.location.pathname.startsWith('/alice')) {
    basename = '/alice';
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
