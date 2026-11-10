import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Motion } from './components/kit'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Motion>
      <App />
    </Motion>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => {
        document.addEventListener('visibilitychange', () => !document.hidden && reg.update().catch(() => {}))
      })
      .catch(() => {})
  })
}
