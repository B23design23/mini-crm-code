import { useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutDashboard, Users, LogOut } from 'lucide-react'
import mateLogoBadge from './assets/mate-logo-badge.svg'
import mateLogoIcon from './assets/mate-logo-icon.svg'

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
        'group relative flex items-center text-sm font-medium transition-colors ' +
        (collapsed
          ? 'aspect-square w-full justify-center rounded-[20%]'
          : 'w-full gap-2 rounded-xl px-3 py-2 text-left') +
        ' ' +
        (active
          ? 'bg-red-50 text-accent'
          : 'text-text-secondary hover:bg-red-50 hover:text-accent')
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

function Layout({ view, onNavigate, onSignOut, children }) {
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 1024
  )

  const pageTitle = view === 'dashboard' ? 'Tableau de bord' : 'Clients'

  return (
    <div className="flex min-h-screen bg-page">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-border bg-surface px-4 pt-[env(safe-area-inset-top)] pl-[calc(1rem+env(safe-area-inset-left))] pr-[calc(1rem+env(safe-area-inset-right))] sm:hidden">
        <span className="font-heading text-base font-semibold text-text-primary">{pageTitle}</span>
        <button
          onClick={onSignOut}
          aria-label="Se déconnecter"
          className="flex items-center justify-center rounded-xl p-1.5 text-text-secondary hover:bg-page hover:text-text-primary"
        >
          <LogOut size={20} />
        </button>
      </header>

      <nav className="fixed inset-x-4 bottom-4 z-30 flex overflow-hidden rounded-2xl border border-border bg-surface shadow-soft sm:hidden">
        <MobileTabLink
          icon={LayoutDashboard}
          label="Tableau de bord"
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
          'sticky top-4 ml-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface/85 shadow-soft transition-all duration-200 ease-in-out sm:flex ' +
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
          {!collapsed && (
            <span className="flex items-center gap-2">
              <img src={mateLogoIcon} alt="" className="h-6 w-auto" />
              <span className="font-heading text-lg font-bold text-text-primary">Mate</span>
            </span>
          )}
          {collapsed && <img src={mateLogoBadge} alt="Mate" className="h-8 w-8 rounded-[20%]" />}
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
            Tableau de bord
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
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:underline"
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

      <main className="flex-1 bg-page p-4 pb-20 pt-[calc(4rem+env(safe-area-inset-top))] sm:p-8 sm:pt-10">{children}</main>
    </div>
  )
}

export default Layout
