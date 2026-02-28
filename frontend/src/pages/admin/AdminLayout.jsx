import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Files, Upload, PlusCircle, BarChart2,
  LogOut, Home, ChevronRight, Menu, X
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { docsAPI } from '../../api/client'

const navItems = [
  { to: '/admin/documents', icon: Files,      label: 'Documents',     end: false },
  { to: '/admin/upload',    icon: Upload,      label: 'Importer PDF',  end: false },
  { to: '/admin/add',       icon: PlusCircle,  label: 'Ajouter Règle', end: false },
  { to: '/admin/stats',     icon: BarChart2,   label: 'Statistiques',  end: false },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [docCount, setDocCount] = useState(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    docsAPI.stats()
      .then(r => setDocCount(r.data.total_documents))
      .catch(() => {})
  }, [])

  function handleLogout() {
    logout()
    nav('/')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240, transition: 'width 0.2s ease',
        background: 'var(--navy)', display: 'flex', flexDirection: 'column',
        flexShrink: 0, position: 'relative',
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
                UniHelp
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Admin · IIT/ENS
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}
          >
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={false}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: '9px 10px', borderRadius: 8,
                textDecoration: 'none', transition: 'var(--transition)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13.5,
                borderLeft: isActive ? '2px solid #d4a017' : '2px solid transparent',
              })}
            >
              <Icon size={17} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Status */}
        {!collapsed && docCount !== null && (
          <div style={{
            margin: '0 12px 12px',
            background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Base active</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#d4a017', fontFamily: 'var(--font-display)' }}>{docCount}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>document{docCount !== 1 ? 's' : ''} indexé{docCount !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Logout */}
        <div style={{ padding: '0 8px 12px' }}>
          <button
            onClick={handleLogout}
            title={collapsed ? 'Déconnexion' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 8, padding: '9px 10px', borderRadius: 8,
              border: 'none', background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
              fontSize: 13.5, fontFamily: 'var(--font-body)', transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <LogOut size={16} />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          padding: '0 28px', gap: 8,
        }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)', textDecoration: 'none' }}>
            <Home size={14} />
          </NavLink>
          <ChevronRight size={13} color="var(--border-2)" />
          <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 500 }}>Administration</span>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
