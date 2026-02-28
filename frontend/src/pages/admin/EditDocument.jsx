import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { docsAPI } from '../../api/client'
import { Button, Input, Textarea, Select, Card, Spinner, PageHeader } from '../../components/UI'

export default function EditDocument() {
  const { id } = useParams()
  const nav = useNavigate()
  const [form, setForm]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    docsAPI.get(id)
      .then(r => {
        const d = r.data
        setForm({ name: d.name, type: d.type, content: d.content, tags: (d.tags || []).join(', ') })
      })
      .catch(() => { toast.error('Document introuvable'); nav('/admin/documents') })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      await docsAPI.update(id, { name: form.name.trim(), type: form.type, content: form.content.trim(), tags })
      toast.success('Document mis à jour !')
      nav('/admin/documents')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={32} /></div>

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="Modifier le Document" subtitle={`Editing: ${form?.name || ''}`} />
      <Card style={{ padding: '32px 28px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
            <Input
              label="Titre *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
            <Select
              label="Type"
              value={form.type}
              onChange={e => set('type', e.target.value)}
              options={[
                { value: 'pdf',  label: '📄 PDF' },
                { value: 'rule', label: '📋 Règlement' },
                
              ]}
              style={{ minWidth: 180 }}
            />
          </div>
          <Input
            label="Tags"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="inscription, absences, délais"
          />
          <div>
            <Textarea
              label="Contenu *"
              value={form.content}
              onChange={e => set('content', e.target.value)}
              style={{ minHeight: 320, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {form.content.length.toLocaleString()} caractères
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" loading={saving} size="lg">💾 Enregistrer les modifications</Button>
            <Button type="button" variant="ghost" onClick={() => nav('/admin/documents')}>Annuler</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
