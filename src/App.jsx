import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Clients from './Clients'
import Dashboard from './Dashboard'

function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('clients')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (!session) {
    return <Login />
  }

  return (
    <div>
      <p>Connecté en tant que {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>

      <nav>
        <button onClick={() => setView('clients')}>Clients</button>
        <button onClick={() => setView('dashboard')}>Dashboard</button>
      </nav>

      {view === 'clients' && <Clients />}
      {view === 'dashboard' && <Dashboard />}
    </div>
  )
}

export default App