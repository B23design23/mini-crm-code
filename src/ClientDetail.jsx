import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function computeLivreLe(currentLivreLe, newStatut) {
  if (newStatut === 'Livré' && !currentLivreLe) {
    return new Date().toISOString()
  }
  if (newStatut === 'En cours') {
    return null
  }
  return currentLivreLe
}

function ClientDetail({ client, onBack, onClientUpdated }) {
  const [commandes, setCommandes] = useState([])
  const [description, setDescription] = useState('')
  const [montant, setMontant] = useState('')
  const [statut, setStatut] = useState('En cours')
  const [editingId, setEditingId] = useState(null)

  const [nom, setNom] = useState(client.nom)
  const [telephone, setTelephone] = useState(client.telephone || '')
  const [email, setEmail] = useState(client.email || '')
  const [notes, setNotes] = useState(client.notes || '')

  async function fetchCommandes() {
    const { data, error } = await supabase
      .from('commandes')
      .select('*')
      .eq('client_id', client.id)
      .order('date_commande', { ascending: false })
    if (error) {
      console.error(error)
    } else {
      setCommandes(data)
    }
  }

  useEffect(() => {
    fetchCommandes()
  }, [client.id])

  function resetForm() {
    setDescription('')
    setMontant('')
    setStatut('En cours')
    setEditingId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const current = editingId ? commandes.find((c) => c.id === editingId) : null
    const livre_le = computeLivreLe(current?.livre_le ?? null, statut)

    if (editingId) {
      const { error } = await supabase
        .from('commandes')
        .update({ description, montant: parseFloat(montant), statut, livre_le })
        .eq('id', editingId)
      if (error) {
        console.error(error)
        return
      }
    } else {
      const { error } = await supabase.from('commandes').insert({
        client_id: client.id,
        description,
        montant: parseFloat(montant),
        statut,
        livre_le,
      })
      if (error) {
        console.error(error)
        return
      }
    }
    resetForm()
    fetchCommandes()
  }

  function startEdit(commande) {
    setEditingId(commande.id)
    setDescription(commande.description)
    setMontant(commande.montant)
    setStatut(commande.statut)
  }

  async function handleStatusChange(commande, newStatut) {
    const updates = {
      statut: newStatut,
      livre_le: computeLivreLe(commande.livre_le, newStatut),
    }
    const { error } = await supabase.from('commandes').update(updates).eq('id', commande.id)
    if (error) {
      console.error(error)
      return
    }
    fetchCommandes()
  }

  async function handleDeleteCommande(commandeId) {
    if (!window.confirm('Supprimer cette commande ?')) return
    const { error } = await supabase.from('commandes').delete().eq('id', commandeId)
    if (error) {
      console.error(error)
      return
    }
    fetchCommandes()
  }

  async function handleSaveClient(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('clients')
      .update({ nom, telephone, email, notes })
      .eq('id', client.id)
    if (error) {
      console.error(error)
      return
    }
    onClientUpdated?.()
    alert('Client mis à jour.')
  }

  async function handleDeleteClient() {
    if (!window.confirm('Supprimer ce client ? Action irréversible.')) return
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) {
      if (error.code === '23503') {
        alert('Impossible de supprimer : ce client a des commandes enregistrées.')
      } else {
        console.error(error)
      }
      return
    }
    onClientUpdated?.()
    onBack()
  }

  return (
    <div>
      <button onClick={onBack}>← Retour</button>

      <h2>Infos client</h2>
      <form onSubmit={handleSaveClient}>
        <input value={nom} onChange={(e) => setNom(e.target.value)} required />
        <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        <button type="submit">Enregistrer les modifications</button>
      </form>
      <button onClick={handleDeleteClient}>Supprimer ce client</button>

      <h3>{editingId ? 'Modifier la commande' : 'Nouvelle commande'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          placeholder="Montant"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          required
        />
        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="En cours">En cours</option>
          <option value="Livré">Livré</option>
          <option value="Payé">Payé</option>
        </select>
        <button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
        {editingId && (
          <button type="button" onClick={resetForm}>
            Annuler
          </button>
        )}
      </form>

      <h3>Historique des commandes</h3>
      <ul>
        {commandes.map((commande) => (
          <li key={commande.id}>
            {commande.date_commande} — {commande.description} — {commande.montant}€ —{' '}
            <select
              value={commande.statut}
              onChange={(e) => handleStatusChange(commande, e.target.value)}
            >
              <option value="En cours">En cours</option>
              <option value="Livré">Livré</option>
              <option value="Payé">Payé</option>
            </select>{' '}
            <button onClick={() => startEdit(commande)}>Modifier</button>
            <button onClick={() => handleDeleteCommande(commande.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ClientDetail