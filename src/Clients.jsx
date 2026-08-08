import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { supabase } from './supabaseClient'
import ClientDetail from './ClientDetail'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function Clients() {
  const [clients, setClients] = useState([])
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [sortBy, setSortBy] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')

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
    setIsFormOpen(false)
    fetchClients()
  }

  if (selectedClient) {
    return (
      <div>
        <h2 className="font-heading text-2xl font-bold text-text-primary">
          Fiche client : {selectedClient.nom}
        </h2>
        <div className="mt-6">
          <ClientDetail
            client={selectedClient}
            onBack={() => setSelectedClient(null)}
            onClientUpdated={fetchClients}
          />
        </div>
      </div>
    )
  }

  const filteredClients = clients.filter((client) =>
    client.nom.toLowerCase().includes(searchText.toLowerCase())
  )

  const displayedClients =
    sortBy === 'date'
      ? [...filteredClients].sort((a, b) => {
          const cmp = new Date(a.created_at) - new Date(b.created_at)
          return sortDirection === 'asc' ? cmp : -cmp
        })
      : filteredClients

  function handleSort(column) {
    if (sortBy === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  return (
    <div>
      <h2 className="hidden font-heading text-2xl font-bold text-text-primary sm:block">Clients</h2>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Rechercher un client..."
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent sm:max-w-xs"
        />
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 sm:w-auto"
        >
          + Ajouter un client
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:hidden">
        {displayedClients.map((client) => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-surface/85 p-4 shadow-soft"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{client.nom}</p>
              <p className="truncate text-sm text-text-secondary">{client.telephone}</p>
              <p className="truncate text-sm text-text-secondary">{client.email}</p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-text-secondary" />
          </div>
        ))}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-border bg-surface/85 shadow-soft sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Nom</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Téléphone</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Email</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">
                <SortHeader
                  label="Date de création"
                  column="date"
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {displayedClients.map((client) => (
              <tr
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="cursor-pointer border-b border-border odd:bg-surface even:bg-page last:border-b-0 hover:bg-accent/10"
              >
                <td className="whitespace-nowrap px-4 py-3 text-text-primary">{client.nom}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-primary">{client.telephone}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-primary">{client.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-primary">
                  {formatDate(client.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <ChevronRight size={16} className="inline-block text-text-secondary" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={
          'fixed inset-0 z-40 transition-opacity ' +
          (isFormOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')
        }
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsFormOpen(false)}
        />
        <div
          className={
            'absolute inset-x-0 bottom-0 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-xl border-t border-border bg-surface p-6 shadow-drawer transition-transform duration-300 ' +
            'sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:h-full sm:max-h-none sm:w-full sm:max-w-sm sm:rounded-t-none sm:border-t-0 sm:border-l ' +
            (isFormOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full')
          }
        >
          <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">Nouveau client</h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-text-secondary hover:text-text-primary"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="client-nom" className="text-sm font-medium text-text-primary">
                Nom
              </label>
              <input
                id="client-nom"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="client-telephone" className="text-sm font-medium text-text-primary">
                Téléphone
              </label>
              <input
                id="client-telephone"
                placeholder="Téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="client-email" className="text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="client-email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="client-notes" className="text-sm font-medium text-text-primary">
                Notes
              </label>
              <textarea
                id="client-notes"
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Créer
            </button>
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

export default Clients