import { useEffect, useState } from 'react'
import { ChevronDown, Euro, Clock, Package } from 'lucide-react'
import { supabase } from './supabaseClient'

function daysSince(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function Dashboard() {
  const [commandes, setCommandes] = useState([])
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
      <h2 className="hidden font-heading text-2xl font-bold text-text-primary sm:block">Dashboard</h2>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-accent/85 p-6 text-white shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <p className="text-3xl font-bold">{caTotal.toFixed(2)}€</p>
            <Euro size={28} className="shrink-0 text-white" />
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-white/90">CA encaissé (Payé)</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/85 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <p className="text-3xl font-bold text-text-primary">{nbEnCours}</p>
            <Clock size={28} className="shrink-0 text-text-secondary" />
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">Commandes en cours</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/85 p-6 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <p className="text-3xl font-bold text-text-primary">{nbLivre}</p>
            <Package size={28} className="shrink-0 text-text-secondary" />
          </div>
          <p className="mt-1 text-xs uppercase tracking-wide text-text-secondary">
            Commandes livrées (en attente de paiement)
          </p>
        </div>
      </div>

      <h3 className="mt-10 font-heading text-lg font-semibold text-text-primary">Factures à relancer</h3>

      {facturesARelancer.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-border bg-surface/85 p-6 text-center text-text-secondary shadow-soft">
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
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto"
            />
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent sm:w-auto"
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

          {facturesFiltrees.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-border bg-surface/85 p-6 text-center text-text-secondary shadow-soft">
              Aucune facture ne correspond aux filtres.
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-3 sm:hidden">
                {facturesFiltrees.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-border bg-surface/85 p-4 shadow-soft">
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
                      className="mt-4 w-full rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Envoyer la relance
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden flex-col gap-3 sm:flex">
                {facturesFiltrees.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-start gap-x-8 gap-y-3 rounded-2xl border border-border bg-surface/85 p-4 shadow-soft"
                  >
                    <div className="min-w-[8rem]">
                      <p className="text-xs uppercase tracking-wide text-text-secondary">Client</p>
                      <p className="mt-2 text-sm font-medium text-text-primary">{c.clients?.nom}</p>
                    </div>
                    <div className="min-w-[10rem]">
                      <p className="text-xs uppercase tracking-wide text-text-secondary">Description</p>
                      <p className="mt-2 text-sm text-text-primary">{c.description}</p>
                    </div>
                    <div className="min-w-[5rem]">
                      <p className="text-xs uppercase tracking-wide text-text-secondary">Montant</p>
                      <p className="mt-2 text-sm text-text-primary">{c.montant}€</p>
                    </div>
                    <div className="min-w-[5rem]">
                      <p className="text-xs uppercase tracking-wide text-text-secondary">Retard</p>
                      <p className="mt-2 text-sm text-text-primary">{c.jours} jours</p>
                    </div>
                    <div className="min-w-[9rem]">
                      <p className="text-xs uppercase tracking-wide text-text-secondary">Statut</p>
                      <div className="mt-1">
                        <StatusBadge jours={c.jours} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRelance(c)}
                      className="ml-auto shrink-0 self-center rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Envoyer la relance
                    </button>
                  </div>
                ))}
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

export default Dashboard