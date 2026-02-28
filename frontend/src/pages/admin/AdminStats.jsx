import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { docsAPI } from '../../api/client'
import { Spinner, StatCard, Card, PageHeader } from '../../components/UI'

export default function AdminStats() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    docsAPI.stats()
      .then(r => setStats(r.data))
      .catch(() => setError('Impossible de charger les statistiques'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>
  if (error)   return <p style={{ color: 'var(--red)', padding: 32 }}>{error}</p>

  const byType = stats?.by_type || {}
  const total  = stats?.total_documents || 0
  const typeLabels = { pdf: 'PDFs', rule: 'Règlements'}
  const typeColors = { pdf: 'var(--blue)', rule: 'var(--green)'}

  return (
    <div>
      <PageHeader title="Statistiques" subtitle="Vue d'ensemble de la base documentaire" />

      {/* Main stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '📂', label: 'Documents total',     value: stats.total_documents, color: 'var(--navy)' },
          { icon: '✅', label: 'Documents actifs',     value: stats.active_documents, color: 'var(--green)' },
          { icon: '🔤', label: 'Caractères indexés',   value: (stats.total_chars || 0).toLocaleString(), color: 'var(--blue)', sub: `≈ ${Math.round((stats.total_chars || 0) / 4).toLocaleString()} tokens` },
          { icon: '🧩', label: 'Chunks RAG',            value: (stats.total_chunks || 0).toLocaleString(), color: 'var(--gold)', sub: 'Blocs de 600 chars' },
          { icon: '💬', label: 'Questions posées',     value: stats.total_chats, color: 'var(--navy-2)' },
          { icon: '✉️', label: 'Emails générés',       value: stats.total_emails, color: '#9d174d' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      {/* Type breakdown */}
      {total > 0 && Object.keys(byType).length > 0 && (
        <Card style={{ padding: '24px 28px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 20px' }}>
            Répartition par type
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 80, fontSize: 12.5, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {typeLabels[type] || type}
                </span>
                <div style={{ flex: 1, background: 'var(--bg-2)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / total) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{
                      height: '100%', borderRadius: 6,
                      background: typeColors[type] || 'var(--navy)',
                    }}
                  />
                </div>
                <span style={{ width: 28, fontSize: 14, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{count}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>({Math.round(count / total * 100)}%)</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
