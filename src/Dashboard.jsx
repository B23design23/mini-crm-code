import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { supabase } from './supabaseClient'

function daysSince(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function Dashboard() {
  const [commandes, setCommandes] = useState([])
  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  async function fetchCommandes() {
    const { data, error } = await supabase
      .from('commandes')
      .select('*, clients(nom, email)')
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

  const facturesFiltrees = facturesARelancer
    .filter((c) => (c.clients?.nom ?? '').toLowerCase().includes(searchText.toLowerCase()))
    .filter((c) => {
      if (statusFilter === 'j15') return c.jours < 30
      if (statusFilter === 'j30') return c.jours >= 30
      return true
    })

  const facturesAffichees = sortBy
    ? [...facturesFiltrees].sort((a, b) => {
        let cmp = 0
        if (sortBy === 'client') {
          cmp = (a.clients?.nom ?? '').localeCompare(b.clients?.nom ?? '')
        } else if (sortBy === 'montant') {
          cmp = Number(a.montant) - Number(b.montant)
        }
        return sortDirection === 'asc' ? cmp : -cmp
      })
    : facturesFiltrees

  function handleSort(column) {
    if (sortBy === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  async function handleRelance(commande) {
    try {
      const res = await fetch(import.meta.env.VITE_MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: commande.clients?.nom,
          email: commande.clients?.email,
          description: commande.description,
          montant: commande.montant,
          jours: commande.jours,
        }),
      })
      if (!res.ok) throw new Error('Réponse non OK')
      alert(`Relance envoyée à ${commande.clients?.nom}`)
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'envoi de la relance")
    }
  }

  return (
    <div>
      <h2 className="hidden text-2xl font-bold text-text-primary sm:block">Dashboard</h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-3xl font-bold text-text-primary">{caTotal.toFixed(2)}€</p>
          <p className="mt-1 text-sm text-text-secondary">CA encaissé (Payé)</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-3xl font-bold text-text-primary">{nbEnCours}</p>
          <p className="mt-1 text-sm text-text-secondary">Commandes en cours</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-3xl font-bold text-text-primary">{nbLivre}</p>
          <p className="mt-1 text-sm text-text-secondary">
            Commandes livrées (en attente de paiement)
          </p>
        </div>
      </div>

      <h3 className="mt-10 text-lg font-semibold text-text-primary">Factures à relancer</h3>

      {facturesARelancer.length === 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-surface p-6 text-center text-text-secondary">
          Rien à relancer pour l'instant.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto"
            />
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-md border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto"
              >
                <option value="all">Tous les statuts</option>
                <option value="j15">Relance (J+15)</option>
                <option value="j30">Relance ferme (J+30)</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
            </div>
          </div>

          {facturesAffichees.length === 0 ? (
            <div className="mt-4 rounded-lg border border-border bg-surface p-6 text-center text-text-secondary">
              Aucune facture ne correspond aux filtres.
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3 sm:hidden">
                {facturesAffichees.map((c) => (
                  <div key={c.id} className="rounded-lg border border-border bg-surface p-4">
                    <dl className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Client</dt>
                        <dd className="font-medium text-text-primary">{c.clients?.nom}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Description</dt>
                        <dd className="text-text-primary">{c.description}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Montant</dt>
                        <dd className="text-text-primary">{c.montant}€</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Retard</dt>
                        <dd className="text-text-primary">{c.jours} jours</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Statut</dt>
                        <dd>
                          <StatusBadge jours={c.jours} />
                        </dd>
                      </div>
                    </dl>
                    <button
                      onClick={() => handleRelance(c)}
                      className="mt-4 w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Envoyer la relance
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border bg-surface sm:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">
                        <SortHeader label="Client" column="client" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Description</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">
                        <SortHeader label="Montant" column="montant" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Retard</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Statut</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturesAffichees.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">{c.clients?.nom}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">{c.description}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">{c.montant}€</td>
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">{c.jours} jours</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge jours={c.jours} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            onClick={() => handleRelance(c)}
                            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                          >
                            Envoyer la relance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function StatusBadge({ jours }) {
  return jours >= 30 ? (
    <span className="inline-block rounded-full bg-danger px-2.5 py-1 text-xs font-medium text-white">
      Relance ferme (J+30)
    </span>
  ) : (
    <span className="inline-block rounded-full bg-warning px-2.5 py-1 text-xs font-medium text-white">
      Relance (J+15)
    </span>
  )
}

function SortHeader({ label, column, sortBy, sortDirection, onSort }) {
  const active = sortBy === column
  return (
    <button
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 hover:text-text-primary"
    >
      {label}
      <span className={active ? 'text-text-primary' : 'text-text-secondary/40'}>
        {active && sortDirection === 'desc' ? '▼' : '▲'}
      </span>
    </button>
  )
}

export default Dashboard