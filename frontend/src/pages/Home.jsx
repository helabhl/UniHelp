import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const cards = [
  {
    role: 'admin',
    icon: '🔐',
    title: 'Administrateur',
    desc: 'Gérer les documents officiels, règlements et procédures. Suivre les statistiques d\'utilisation.',
    features: ['Upload de PDFs', 'Gestion CRUD', 'Statistiques'],
    path: '/admin/login',
    accent: '#0d1f3c',
  },
  {
    role: 'student',
    icon: '🎓',
    title: 'Étudiant',
    desc: 'Poser vos questions administratives et générer automatiquement vos emails officiels.',
    features: ['Chat IA basé sur documents', 'Génération d\'emails', 'Réponses instantanées'],
    path: '/student/chat',
    accent: '#1e40af',
  },
]

export default function Home() {
  const nav = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative background */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(13,31,60,0.05) 0%, transparent 70%)',
        }} />
        {/* Grid pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025 }}>
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#0d1f3c" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', width: '100%', maxWidth: 680, textAlign: 'center' }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          style={{
            width: 80, height: 80, borderRadius: 22, margin: '0 auto 28px',
            background: 'linear-gradient(135deg, var(--navy), var(--navy-2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(13,31,60,0.3)',
          }}
        >
          <span style={{ fontSize: 38 }}>🏛️</span>
        </motion.div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 900,
          color: 'var(--navy)', margin: '0 0 10px', letterSpacing: '-1px',
          lineHeight: 1.1,
        }}>
          UniHelp
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-3)', margin: '0 0 6px', fontWeight: 400 }}>
          Assistant IA · ENS
        </p>
        

        {/* Role cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {cards.map((card, i) => (
            <motion.button
              key={card.role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => nav(card.path)}
              whileHover={{ y: -4, boxShadow: `0 20px 48px rgba(0,0,0,0.12)` }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'var(--surface)', border: '1.5px solid var(--border)',
                borderRadius: 20, padding: '28px 24px', cursor: 'pointer',
                textAlign: 'left', transition: 'border-color 0.2s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = card.accent + '60' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ fontSize: 42, marginBottom: 14 }}>{card.icon}</div>
              <div style={{
                fontWeight: 800, fontSize: 17, color: 'var(--text)', marginBottom: 8,
                fontFamily: 'var(--font-display)',
              }}>{card.title}</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                {card.desc}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {card.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: card.accent, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </motion.button>
          ))}
        </div>

        <p style={{ marginTop: 32, fontSize: 12, color: 'var(--muted)' }}>
          ainightchallenge 2026 · ENS Tunis
        </p>
      </motion.div>
    </div>
  )
}
