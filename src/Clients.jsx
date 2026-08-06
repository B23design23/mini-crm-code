import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import ClientDetail from './ClientDetail'

function Clients() {
  const [clients, setClients] = useState([])
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
    } else {
      setClients(data)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('clients')
      .insert({ nom, telephone, email, notes })
    if (error) {
      console.error(error)
      return
    }
    setNom('')
    setTelephone('')
    setEmail('')
    setNotes('')
    fetchClients()
  }

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onClientUpdated={fetchClients}
      />
    )
  }

  return (
    <div>
      <h2>Nouveau client</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input placeholder="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="submit">Créer</button>
      </form>

      <h2>Clients</h2>
      <ul>
        {clients.map((client) => (
          <li key={client.id} onClick={() => setSelectedClient(client)} style={{ cursor: 'pointer' }}>
            {client.nom} — {client.telephone}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Clients