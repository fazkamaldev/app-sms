import Header from './components/Header'
import Footer from './components/Footer'
import LoginForm from './components/LoginForm'

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <main className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <LoginForm />
      </main>
      <Footer />
    </div>
  )
}

export default App
