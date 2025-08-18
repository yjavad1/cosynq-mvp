import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Load environment debugging utility for production debugging
import './utils/envDebug';

// Load API debugging utility for Railway deployment debugging
import './utils/apiDebug';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)