import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/open-sauce-one/400.css'
import '@fontsource/open-sauce-one/500.css'
import '@fontsource/open-sauce-one/700.css'
import '@fontsource/open-sauce-one/900.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
