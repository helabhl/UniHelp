import { Outlet, NavLink, Link } from 'react-router-dom'
import { MessageSquare, Mail, Home } from 'lucide-react'

export default function StudentLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--navy)', color: '#fff',
        padding: '0 28px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 16px rgba(13,31,60,0.3)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17,
          }}>🏛️</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#fff' }}>UniHelp</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}> ENS Tunis</div>
          </div>
        </div>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12.5, textDecoration: 'none', fontWeight: 500 }}>
          <Home size={14} />Accueil
        </Link>
      </header>

      {/* Tabs */}
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 28px', display: 'flex', gap: 0, flexShrink: 0,
      }}>
        {[
          { to: '/student/chat',  icon: MessageSquare, label: 'Assistant IA' },
          { to: '/student/email', icon: Mail,          label: 'Générer Email' },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px', textDecoration: 'none',
              fontSize: 13.5, fontWeight: 600,
              color: isActive ? 'var(--navy)' : 'var(--muted)',
              borderBottom: `2.5px solid ${isActive ? 'var(--navy)' : 'transparent'}`,
              transition: 'var(--transition)',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <Outlet />
      </div>
    </div>
  )
}
