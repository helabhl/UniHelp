import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Power, PowerOff, Search, Plus, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { docsAPI } from '../../api/client'
import { Button, Badge, Input, Card, Spinner, EmptyState, PageHeader } from '../../components/UI'

const TYPE_LABELS = { pdf: 'PDF', rule: 'Règle' }
const TYPE_ICONS  = { pdf: '📄', rule: '📋' }

export default function DocsList() {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all')
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const nav = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.type = filter
      if (search)           params.search = search
      const r = await docsAPI.list(params)
      setDocs(r.data.documents)
    } catch {
      toast.error('Impossible de charger les documents')
    } finally {
      setLoading(false)
    }
  }, [filter, search])

  useEffect(() => { load() }, [load])

  async function handleDelete(doc) {
    if (!window.confirm(`Supprimer "${doc.name}" définitivement ?`)) return
    setDeleting(doc._id)
    try {
      await docsAPI.delete(doc._id)
      setDocs(d => d.filter(x => x._id !== doc._id))
      toast.success('Document supprimé')
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggle(doc) {
    setToggling(doc._id)
    try {
      const r = await docsAPI.toggle(doc._id)
      setDocs(d => d.map(x => x._id === doc._id ? { ...x, active: r.data.active } : x))
      toast.success(r.data.active ? 'Document activé' : 'Document désactivé')
    } catch {
      toast.error('Erreur')
    } finally {
      setToggling(null)
    }
  }

  const filtered = docs

  return (
    <div>
      <PageHeader
        title="Base Documentaire"
        subtitle={`${docs.length} document${docs.length !== 1 ? 's' : ''} indexé${docs.length !== 1 ? 's' : ''}`}
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={load}>
              Actualiser
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => nav('/admin/add')}>
              Ajouter
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Input
            icon={<Search size={15} />}
            placeholder="Rechercher un document…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all', 'Tous'], ['pdf', '📄 PDF'], ['rule', '📋 Règles']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12.5, fontFamily: 'var(--font-body)', fontWeight: 500,
                border: '1.5px solid',
                borderColor: filter === val ? 'var(--navy)' : 'var(--border)',
                background: filter === val ? 'var(--navy)' : 'var(--surface)',
                color: filter === val ? '#fff' : 'var(--text-2)',
                transition: 'var(--transition)',
              }}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📂"
          title="Aucun document"
          description="Importez un PDF ou ajoutez une règle pour commencer."
          action={<Button icon={<Plus size={14} />} onClick={() => nav('/admin/upload')}>Importer PDF</Button>}
        />
      ) : (
        <AnimatePresence>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((doc, i) => (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card style={{
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: doc.active ? 1 : 0.55,
                  borderLeft: `3px solid ${doc.active ? 'var(--navy)' : 'var(--border)'}`,
                }}>
                  <div style={{ fontSize: 26, flexShrink: 0 }}>
                    {TYPE_ICONS[doc.type] || '📄'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </span>
                      <Badge type={doc.type}>{TYPE_LABELS[doc.type] || doc.type}</Badge>
                      {!doc.active && (
                        <span style={{ fontSize: 10, background: 'var(--bg-2)', color: 'var(--muted)', borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>
                          INACTIF
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {(doc.char_count || 0).toLocaleString()} caractères
                      </span>
                      {doc.chunk_count > 0 && (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {doc.chunk_count} chunks
                        </span>
                      )}
                      {doc.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          {doc.tags.slice(0, 3).map(tag => (
                            <span key={tag} style={{ fontSize: 10.5, background: 'var(--bg-2)', borderRadius: 4, padding: '1px 6px', color: 'var(--text-3)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {doc.created_at ? formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: fr }) : ''}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    <Button
                      variant="ghost" size="sm"
                      icon={toggling === doc._id ? <Spinner size={13} /> : doc.active ? <PowerOff size={13} /> : <Power size={13} />}
                      onClick={() => handleToggle(doc)}
                      disabled={toggling === doc._id}
                      style={{ color: doc.active ? 'var(--gold)' : 'var(--green)' }}
                    >
                      {doc.active ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      icon={<Pencil size={13} />}
                      onClick={() => nav(`/admin/edit/${doc._id}`)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="danger" size="sm"
                      loading={deleting === doc._id}
                      icon={<Trash2 size={13} />}
                      onClick={() => handleDelete(doc)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
