import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    sessionStorage.setItem('pwa-updated', '1')
    updateSW(true)
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update()
        }
      })
      // Poll every 15 minutes (iOS standalone doesn't reliably fire visibilitychange)
      setInterval(() => {
        registration.update()
      }, 15 * 60 * 1000)
    }
  },
})
