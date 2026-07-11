import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import UpdatePrompt from './UpdatePrompt'
import './index.css'

// UpdatePrompt mounts beside App (not inside it) so App stays free of the
// virtual service-worker module and remains directly testable under vitest.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UpdatePrompt />
  </StrictMode>,
)
