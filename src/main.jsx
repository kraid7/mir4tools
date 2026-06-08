import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SetsProvider } from './context/SetsContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <SetsProvider>
        <App />
      </SetsProvider>
    </HashRouter>
  </StrictMode>,
)
