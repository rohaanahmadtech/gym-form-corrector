import { useState, Component } from 'react'
import Navbar         from './components/Navbar.jsx'
import LandingPage    from './pages/LandingPage.jsx'
import ExercisePage   from './pages/ExercisePage.jsx'
import AnalysisPage   from './pages/AnalysisPage.jsx'
import ResultsPage    from './pages/ResultsPage.jsx'
import HowItWorksPage from './pages/HowItWorksPage.jsx'
import ProgressPage   from './pages/ProgressPage.jsx'

// Shows a readable error instead of white screen
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fff1f2',
                      minHeight: '100vh', color: '#991b1b' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>App Error (check console F12)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: '#fee2e2',
                        padding: 16, borderRadius: 8 }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: '8px 20px', background: '#dc2626',
                     color: 'white', borderRadius: 8, border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const [page,     setPage]     = useState('landing')
  const [exercise, setExercise] = useState(null)
  const [results,  setResults]  = useState(null)

  function navigate(to, data = {}) {
    if (data.exercise) setExercise(data.exercise)
    if (data.results)  setResults(data.results)
    setPage(to)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <Navbar page={page} navigate={navigate} />
        <main className="flex-1">
          {page === 'landing'    && <LandingPage    navigate={navigate} />}
          {page === 'choose'     && <ExercisePage   navigate={navigate} />}
          {page === 'howitworks' && <HowItWorksPage navigate={navigate} />}
          {page === 'progress'   && <ProgressPage   navigate={navigate} />}
          {page === 'analysis'   && (
            <AnalysisPage exercise={exercise} navigate={navigate} />
          )}
          {page === 'results' && (
            <ResultsPage results={results} exercise={exercise} navigate={navigate} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}