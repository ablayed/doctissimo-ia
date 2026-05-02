import { useState } from 'react'

type SmokeResponse =
  | {
      status: 'ok'
      azure_says: string
    }
  | {
      status: 'error'
      detail: string
    }

function App() {
  const [result, setResult] = useState<SmokeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  async function testConnection() {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/smoke')
      const data = (await response.json()) as SmokeResponse
      setResult(data)
    } catch (error) {
      setResult({
        status: 'error',
        detail: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="doctissimo-page">
      <div className="header">Doctissimo.IA — Construction en cours</div>
      <table className="layout-table" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td className="main-cell">
              <main className="post-content">
                <button className="btn-pink" onClick={testConnection} disabled={loading}>
                  Tester la connexion :bounce:
                </button>
                <div
                  className={
                    result?.status === 'error'
                      ? 'smoke-result smoke-result-error'
                      : 'smoke-result smoke-result-ok'
                  }
                >
                  {loading && 'Connexion en cours...'}
                  {!loading && result?.status === 'ok' && `✅ ${result.azure_says}`}
                  {!loading && result?.status === 'error' && `❌ ${result.detail}`}
                </div>
              </main>
              <div className="visitor-counter">
                Vous êtes le <span>00001ème</span> visiteur
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <footer>© Doctissimo.IA 2026 — site parodique pour DEFENDHACK</footer>
    </div>
  )
}

export default App
