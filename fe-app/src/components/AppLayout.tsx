import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'
import SendMessageForm from './SendMessageForm'

interface AppLayoutProps {
  username: string
}

export default function AppLayout({ username }: AppLayoutProps) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="primary" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="/app">App</Navbar.Brand>
          <Navbar.Text className="ms-auto text-white">
            Signed in as {username}
          </Navbar.Text>
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
