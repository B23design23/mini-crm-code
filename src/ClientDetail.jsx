import { useEffect, useState } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
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
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false)
  const [sortBy, setSortBy] = useState('date')
  const [sortDirection, setSortDirection] = useState('desc')

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
    setIsOrderDrawerOpen(false)
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

  function openNewOrderDrawer() {
    resetForm()
    setIsOrderDrawerOpen(true)
  }

  function openEditOrderDrawer(commande) {
    startEdit(commande)
    setIsOrderDrawerOpen(true)
  }

  function closeOrderDrawer() {
    setIsOrderDrawerOpen(false)
  }

  function handleSort(column) {
    if (sortBy === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const sortedCommandes = [...commandes].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'montant') {
      cmp = Number(a.montant) - Number(b.montant)
    } else if (sortBy === 'statut') {
      cmp = (a.statut ?? '').localeCompare(b.statut ?? '')
    } else {
      cmp = new Date(a.date_commande) - new Date(b.date_commande)
    }
    return sortDirection === 'asc' ? cmp : -cmp
  })

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        ← Retour
      </button>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="min-w-0 rounded-2xl border border-border bg-surface/85 p-6 shadow-soft xl:col-span-5">
          <h3 className="font-heading text-lg font-semibold text-text-primary">Informations du client</h3>
          <form onSubmit={handleSaveClient} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="detail-nom" className="text-sm font-medium text-text-primary">
                Nom
              </label>
              <input
                id="detail-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="detail-telephone" className="text-sm font-medium text-text-primary">
                Téléphone
              </label>
              <input
                id="detail-telephone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Téléphone"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="detail-email" className="text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="detail-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="detail-notes" className="text-sm font-medium text-text-primary">
                Notes
              </label>
              <textarea
                id="detail-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                rows={3}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Enregistrer les modifications
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                className="text-sm font-medium text-danger hover:underline"
              >
                Supprimer ce client
              </button>
            </div>
          </form>
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-surface/85 p-6 shadow-soft xl:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-text-primary">Historique des commandes</h3>
            <button
              onClick={openNewOrderDrawer}
              className="rounded-xl bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              + Nouvelle commande
            </button>
          </div>

          {commandes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border p-6 text-center text-text-secondary">
              Aucune commande pour ce client.
            </div>
          ) : (
            <>
              <div className="relative mt-4 sm:hidden">
                <select
                  value={`${sortBy}-${sortDirection}`}
                  onChange={(e) => {
                    const [column, direction] = e.target.value.split('-')
                    setSortBy(column)
                    setSortDirection(direction)
                  }}
                  className="w-full appearance-none rounded-xl border border-border bg-surface py-2 pl-3 pr-9 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="date-desc">Date (plus récent)</option>
                  <option value="date-asc">Date (plus ancien)</option>
                  <option value="montant-asc">Montant (croissant)</option>
                  <option value="montant-desc">Montant (décroissant)</option>
                  <option value="statut-asc">Statut (A→Z)</option>
                  <option value="statut-desc">Statut (Z→A)</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:hidden">
                {sortedCommandes.map((commande) => (
                  <div key={commande.id} className="rounded-xl border border-border p-4">
                    <dl className="flex flex-col gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Date</dt>
                        <dd className="text-text-primary">{commande.date_commande}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Description</dt>
                        <dd className="text-right text-text-primary">{commande.description}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Montant</dt>
                        <dd className="text-text-primary">{commande.montant}€</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-text-secondary">Statut</dt>
                        <dd>
                          <select
                            value={commande.statut}
                            onChange={(e) => handleStatusChange(commande, e.target.value)}
                            className="rounded-xl border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="En cours">En cours</option>
                            <option value="Livré">Livré</option>
                            <option value="Payé">Payé</option>
                          </select>
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => openEditOrderDrawer(commande)}
                        aria-label="Modifier la commande"
                        title="Modifier la commande"
                        className="flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-2 text-accent hover:bg-page"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCommande(commande.id)}
                        aria-label="Supprimer la commande"
                        title="Supprimer la commande"
                        className="flex flex-1 items-center justify-center rounded-xl border border-border px-3 py-2 text-danger hover:bg-page"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border sm:block">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-text-secondary">
                      <th className="whitespace-nowrap px-4 py-3 font-medium">
                        <SortHeader label="Date" column="date" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Description</th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">
                        <SortHeader label="Montant" column="montant" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">
                        <SortHeader label="Statut" column="statut" sortBy={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCommandes.map((commande) => (
                      <tr key={commande.id} className="border-b border-border odd:bg-surface even:bg-page last:border-b-0">
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">
                          {commande.date_commande}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">
                          {commande.description}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-text-primary">
                          {commande.montant}€
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <select
                            value={commande.statut}
                            onChange={(e) => handleStatusChange(commande, e.target.value)}
                            className="rounded-xl border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                          >
                            <option value="En cours">En cours</option>
                            <option value="Livré">Livré</option>
                            <option value="Payé">Payé</option>
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex gap-3">
                            <button
                              onClick={() => openEditOrderDrawer(commande)}
                              aria-label="Modifier la commande"
                              title="Modifier la commande"
                              className="text-accent hover:opacity-70"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCommande(commande.id)}
                              aria-label="Supprimer la commande"
                              title="Supprimer la commande"
                              className="text-danger hover:opacity-70"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className={
          'fixed inset-0 z-40 transition-opacity ' +
          (isOrderDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')
        }
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeOrderDrawer} />
        <div
          className={
            'absolute inset-x-0 bottom-0 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-xl border-t border-border bg-surface p-6 shadow-drawer transition-transform duration-300 ' +
            'sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:h-full sm:max-h-none sm:w-full sm:max-w-sm sm:rounded-t-none sm:border-t-0 sm:border-l ' +
            (isOrderDrawerOpen
              ? 'translate-y-0 sm:translate-x-0'
              : 'translate-y-full sm:translate-y-0 sm:translate-x-full')
          }
        >
          <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">
              {editingId ? 'Modifier la commande' : 'Nouvelle commande'}
            </h3>
            <button
              onClick={closeOrderDrawer}
              className="text-text-secondary hover:text-text-primary"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="commande-description" className="text-sm font-medium text-text-primary">
                Description
              </label>
              <input
                id="commande-description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="commande-montant" className="text-sm font-medium text-text-primary">
                Montant
              </label>
              <input
                id="commande-montant"
                type="number"
                step="0.01"
                placeholder="Montant"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                required
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="commande-statut" className="text-sm font-medium text-text-primary">
                Statut
              </label>
              <select
                id="commande-statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="En cours">En cours</option>
                <option value="Livré">Livré</option>
                <option value="Payé">Payé</option>
              </select>
            </div>

            <div className="mt-2 flex items-center gap-4">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    closeOrderDrawer()
                  }}
                  className="text-sm font-medium text-text-secondary hover:underline"
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
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

export default ClientDetail
