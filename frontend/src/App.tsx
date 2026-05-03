import ThreadPage from './components/ThreadPage'
import { AdminPage } from './pages/AdminPage'

function App() {
  if (window.location.pathname === '/admin') return <AdminPage />
  return <ThreadPage />
}

export default App
