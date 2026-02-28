import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13.5px',
            fontWeight: 500,
            borderRadius: '10px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
          success: { style: { background: '#0d2e1c', color: '#86efb0' } },
          error:   { style: { background: '#2e0d0d', color: '#fca5a5' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
