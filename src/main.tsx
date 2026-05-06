import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installVersionRefresh } from './lib/versionRefresh.ts'
import './index.css'
import App from './App.tsx'

installVersionRefresh()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
