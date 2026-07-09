import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import App from './App'
import './styles/normalize.css'
import './styles/globals.css'
import './styles/modes.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
