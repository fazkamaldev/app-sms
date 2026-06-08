import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'

export default function Header() {
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/login" className="brand-dymocks">
          Dymocks Penrith
        </Navbar.Brand>
      </Container>
    </Navbar>
  )
}
