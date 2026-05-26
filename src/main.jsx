import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suprime erro interno do React 19 com extensoes de navegador
window.addEventListener('error', e => {
  if (e.error?.message?.includes("removeChild")) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')).render(<App />)
