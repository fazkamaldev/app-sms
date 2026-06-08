import { Route, Routes } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'

function App() {
  return (
    <Routes>
      <Route path="/*" element={<AuthGuard />} />
    </Routes>
  )
}

export default App
