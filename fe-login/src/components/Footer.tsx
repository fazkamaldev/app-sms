import Container from 'react-bootstrap/Container'

export default function Footer() {
  return (
    <footer className="bg-light border-top py-3 mt-auto">
      <Container className="text-center text-muted small">
        &copy; {new Date().getFullYear()} Login App
      </Container>
    </footer>
  )
}
