import { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import SendMessageForm from './SendMessageForm'

interface AppLayoutProps {
  username: string
}

export default function AppLayout({ username }: AppLayoutProps) {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } finally {
      window.location.href = '/login/'
    }
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="/app" className="brand-dymocks">
            Dymocks Penrith
          </Navbar.Brand>
          <div className="ms-auto d-flex align-items-center gap-3">
            <Navbar.Text className="text-white">
              Signed in as {username.charAt(0).toUpperCase() + username.slice(1)}
            </Navbar.Text>
            <Button
              className="btn-logout"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Logging out…' : 'Logout'}
            </Button>
          </div>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-4">
        <Container>
          <h1>Welcome to the app</h1>
          <p className="text-muted">You are authenticated via session cookie.</p>
          <SendMessageForm />
        </Container>
      </main>

      <footer className="bg-light border-top py-3 mt-auto">
        <Container className="text-center text-muted small">
          &copy; {new Date().getFullYear()} App
        </Container>
      </footer>
    </div>
  )
}
