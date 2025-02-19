import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW Registered"))
      .catch((error) => console.error("SW Registration Failed:", error));
  });
}

createRoot(document.getElementById('root')!).render(
  <App />
)
