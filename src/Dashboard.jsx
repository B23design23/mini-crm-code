import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function daysSince(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function Dashboard() {
  const [commandes, setCommandes] = useState([])

  async function fetchCommandes() {
    const { data, error } = await supabase
      .from('commandes')
      .select('*, clients(nom)')
    if (error) {
      console.error(error)
    } else {
      setCommandes(data)
    }
  }

  useEffect(() => {
    fetchCommandes()
  }, [])

  const caTotal = commandes
    .filter((c) => c.statut === 'Payé')
    .reduce((sum, c) => sum + Number(c.montant), 0)

  const nbEnCours = commandes.filter((c) => c.statut === 'En cours').length
  const nbLivre = commandes.filter((c) => c.statut === 'Livré').length

  const facturesARelancer = commandes
    .filter((c) => c.statut === 'Livré' && c.livre_le && daysSince(c.livre_le) >= 15)
    .map((c) => ({ ...c, jours: daysSince(c.livre_le) }))
    .sort((a, b) => b.jours - a.jours)

  return (
    <div>
      <h2>Dashboard</h2>
      <p>CA encaissé (Payé) : {caTotal.toFixed(2)}€</p>
      <p>Commandes en cours : {nbEnCours}</p>
      <p>Commandes livrées (en attente de paiement) : {nbLivre}</p>

      <h3>Factures à relancer</h3>
      {facturesARelancer.length === 0 && <p>Rien à relancer pour l'instant.</p>}
      <ul>
        {facturesARelancer.map((c) => (
          <li key={c.id}>
            {c.clients?.nom} — {c.description} — {c.montant}€ — livré depuis {c.jours} jours
            {c.jours >= 30 ? ' — ⚠️ relance ferme (J+30)' : ' — relance (J+15)'}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Dashboard