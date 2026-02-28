import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { docsAPI } from '../../api/client'
import { Button, Input, Textarea, Select, Card, PageHeader } from '../../components/UI'

export default function AddDocument() {
  const [form, setForm]     = useState({ name: '', type: 'rule', content: '', tags: '' })
  const [saving, setSaving] = useState(false)
  const nav = useNavigate()
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.content.trim()) {
      toast.error('Remplissez le titre et le contenu.')
      return
    }
    setSaving(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      await docsAPI.create({ name: form.name.trim(), type: form.type, content: form.content.trim(), tags })
      toast.success('Document ajouté avec succès !')
      nav('/admin/documents')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        title="Ajouter un Document"
        subtitle="Saisissez manuellement un règlement, une FAQ ou une note interne."
      />
      <Card style={{ padding: '32px 28px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
            <Input
              label="Titre du document *"
              placeholder="ex: Procédure de demande d'attestation"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
            <Select
              label="Type"
              value={form.type}
              onChange={e => set('type', e.target.value)}
              options={[
                { value: 'rule', label: '📋 Règlement / Procédure' },
                { value: 'faq',  label: '❓ FAQ' },
                { value: 'note', label: '📝 Note Interne' },
              ]}
              style={{ minWidth: 200 }}
            />
          </div>

          <Input
            label="Tags (séparés par des virgules)"
            placeholder="inscription, absences, délais"
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
          />

          <div>
            <Textarea
              label="Contenu *"
              placeholder={`Rédigez ici le contenu complet du document…\n\nPlus le contenu est détaillé et structuré, plus les réponses de l'IA seront précises et pertinentes.`}
              value={form.content}
              onChange={e => set('content', e.target.value)}
              style={{ minHeight: 280 }}
              required
            />
            <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--muted)', marginTop: 5 }}>
              {form.content.length.toLocaleString()} caractères
              {form.content.length > 100 && (
                <span style={{ marginLeft: 10, color: 'var(--text-3)' }}>
                  ≈ {Math.ceil(form.content.length / 600)} chunk{Math.ceil(form.content.length / 600) > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" variant="gold" loading={saving} size="lg">
              ✅ Ajouter à la base documentaire
            </Button>
            <Button type="button" variant="ghost" onClick={() => nav('/admin/documents')}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
