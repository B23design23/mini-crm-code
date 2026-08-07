import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Clients from './Clients'
import Dashboard from './Dashboard'
import Layout from './Layout'

function App() {
  const [session, setSession] = useState(null)
  const [view, setView] = useState('dashboard')

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
    <Layout
      view={view}
      onNavigate={setView}
      userEmail={session.user.email}
      onSignOut={() => supabase.auth.signOut()}
    >
      {view === 'clients' && <Clients />}
      {view === 'dashboard' && <Dashboard />}
    </Layout>
  )
}

export default App