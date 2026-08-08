import { useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, LogOut } from 'lucide-react'

function Tooltip({ label }) {
  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-text-primary px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
      {label}
    </span>
  )
}

function NavLink({ icon: Icon, active, collapsed, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        'group relative flex items-center rounded-xl text-sm font-medium transition-colors ' +
        (collapsed ? 'w-full justify-center py-2' : 'w-full gap-2 px-3 py-2 text-left') +
        ' ' +
        (active
          ? 'bg-accent text-white'
          : 'text-text-secondary hover:bg-page hover:text-text-primary')
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{children}</span>}
      {collapsed && <Tooltip label={children} />}
    </button>
  )
}

function MobileTabLink({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium ' +
        (active ? 'text-accent' : 'text-text-secondary')
      }
    >
      <Icon size={20} />
      {label}
    </button>
  )
}

function Layout({ view, onNavigate, userEmail, onSignOut, children }) {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 1024
  )

  const pageTitle = view === 'dashboard' ? 'Dashboard' : 'Clients'

  return (
    <div className="flex min-h-screen bg-page">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-border bg-surface px-4 pt-[env(safe-area-inset-top)] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] sm:hidden">
        <span className="text-base font-semibold text-text-primary">{pageTitle}</span>
        <button
          onClick={onSignOut}
          aria-label="Se déconnecter"
          className="flex items-center justify-center rounded-xl p-1.5 text-text-secondary hover:bg-page hover:text-text-primary"
        >
          <LogOut size={20} />
        </button>
      </header>

      <nav className="fixed inset-x-4 bottom-0 z-30 mb-[calc(1rem+env(safe-area-inset-bottom))] flex overflow-hidden rounded-2xl border border-border bg-surface/85 shadow-soft sm:hidden">
        <MobileTabLink
          icon={LayoutDashboard}
          label="Dashboard"
          active={view === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        />
        <MobileTabLink
          icon={Users}
          label="Clients"
          active={view === 'clients'}
          onClick={() => onNavigate('clients')}
        />
      </nav>

      <aside
        className={
          'sticky top-4 ml-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface/85 shadow-soft transition-all duration-200 sm:flex ' +
          (collapsed ? 'w-16' : 'w-64')
        }
      >
        <div
          className={
            collapsed
              ? 'flex flex-col items-center gap-3 px-3 py-6'
              : 'flex items-center justify-between px-5 py-6'
          }
        >
          {!collapsed && <span className="text-lg font-bold text-text-primary">Mini CRM</span>}
          {collapsed && (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">
              M
            </span>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Déplier la sidebar' : 'Replier la sidebar'}
            className="flex items-center justify-center rounded-xl p-1.5 text-text-secondary hover:bg-page hover:text-text-primary"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav
          className={
            (collapsed ? 'flex flex-col items-center gap-1 px-2' : 'flex flex-col gap-1 px-3') +
            ' flex-1 overflow-y-auto'
          }
        >
          <NavLink
            icon={LayoutDashboard}
            active={view === 'dashboard'}
            collapsed={collapsed}
            onClick={() => onNavigate('dashboard')}
          >
            Dashboard
          </NavLink>
          <NavLink
            icon={Users}
            active={view === 'clients'}
            collapsed={collapsed}
            onClick={() => onNavigate('clients')}
          >
            Clients
          </NavLink>
        </nav>

        {!collapsed ? (
          <div className="mt-auto border-t border-border px-5 py-4">
            <p className="truncate text-sm text-text-secondary">{userEmail}</p>
            <button
              onClick={onSignOut}
              className="mt-2 flex items-center gap-2 text-sm font-medium text-text-secondary hover:underline"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          </div>
        ) : (
          <div className="mt-auto flex flex-col items-center gap-1 border-t border-border px-2 py-4">
            <button
              onClick={onSignOut}
              className="group relative flex w-full items-center justify-center rounded-xl py-2 text-text-secondary hover:bg-page hover:text-text-primary"
            >
              <LogOut size={18} />
              <Tooltip label="Se déconnecter" />
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 bg-page p-4 pb-20 pt-[calc(4rem+env(safe-area-inset-top))] sm:p-8">{children}</main>
    </div>
  )
}

export default Layout
