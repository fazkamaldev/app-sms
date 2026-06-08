import 'bootstrap/dist/css/bootstrap.min.css'
import './theme.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { store } from './store/store.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter basename="/app">
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
