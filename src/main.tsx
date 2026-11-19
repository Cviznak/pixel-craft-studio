import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import { AppRouter } from './AppRouter.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRouter />
      <Analytics />
    </BrowserRouter>
  </StrictMode>,
)

// Register PWA service worker
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Pixel Craft Studio PWA registered:', reg.scope);
      })
      .catch((err) => {
        console.warn('PWA service worker registration:', err);
      });
  });
}
