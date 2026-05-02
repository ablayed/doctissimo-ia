import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/doctissimo.css'
import App from './App.tsx'

console.log('%c Salut petit hacker !', 'font-size: 24px; color: #E5007E; font-weight: bold;')
console.log(
  '%cTu cherches le code ? Le repo est public à H+48 :love:\nEn attendant : github.com/ablaye/doctissimo-ia\nStack : LangGraph + Azure OpenAI + RAG médical Ameli/HAS\nDisclaimer : ne mange pas une gousse d\'ail au clair de lune.',
  'font-size: 14px; color: #CC0066;',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
