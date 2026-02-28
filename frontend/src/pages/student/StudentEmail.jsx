import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, Download, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { emailAPI } from '../../api/client'
import { Button, Input, Textarea, Select, Card, Spinner } from '../../components/UI'

// Fallback aligné sur les nouvelles clés de models.py
const FALLBACK_TYPES = [
  { value: 'attestation_scolarite',   label: "Demande d'attestation de scolarité" },
  { value: 'attestation_inscription', label: "Demande d'attestation d'inscription" },
  { value: 'releve_notes',            label: 'Demande de relevé de notes officiel' },
  { value: 'justification_absence',   label: "Justification d'absence" },
  { value: 'reclamation_note',        label: "Réclamation sur une note d'examen" },
  { value: 'examen_substitution',     label: "Demande d'examen de substitution" },
  { value: 'convention_stage',        label: 'Demande de convention de stage' },
  { value: 'demande_bourse',          label: 'Demande de bourse universitaire' },
  { value: 'paiement_echelonne',      label: 'Demande de paiement échelonné' },
  { value: 'transfert',               label: 'Demande de transfert' },
]

export default function StudentEmail() {
  const [emailTypes, setEmailTypes] = useState([])
  const [form, setForm] = useState({
    email_type: 'attestation_scolarite', nom: '', prenom: '',
    cin: '', email_etudiant: '', niveau: '', motif: '',
  })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    emailAPI.types()
      .then(r => setEmailTypes(r.data.types))
      .catch(() => {})
  }, [])

  async function generate(e) {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim()) {
      toast.error('Le nom et prénom sont requis.')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const r = await emailAPI.generate(form)
      setResult(r.data)
      toast.success('Email généré avec succès !')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la génération')
    } finally {
      setLoading(false)
    }
  }

  function copyEmail() {
    const full = `Objet: ${result.subject}\n\n${result.body}`
    navigator.clipboard.writeText(full)
    setCopied(true)
    toast.success('Email copié !')
    setTimeout(() => setCopied(false), 2500)
  }

  function downloadEmail() {
    const full = `Objet: ${result.subject}\n\n${result.body}`
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `email_${form.email_type}_${form.nom}_${form.prenom}.txt`
    a.click(); URL.revokeObjectURL(url)
  }

  const typeOptions = emailTypes.length > 0
    ? emailTypes.map(t => ({ value: t.key, label: t.label }))
    : FALLBACK_TYPES

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 5px' }}>
            ✉️ Générateur d'Emails Administratifs
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: 0 }}>
            Remplissez le formulaire — un email formel et officiel est généré automatiquement à partir des procédures de l'ENS.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 28 }}>
          {/* ── Formulaire ── */}
          <Card style={{ padding: '28px 24px' }}>
            <form onSubmit={generate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Select
                label="Type de demande *"
                value={form.email_type}
                onChange={e => set('email_type', e.target.value)}
                options={typeOptions}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input label="Nom *"    value={form.nom}    onChange={e => set('nom', e.target.value)}    required />
                <Input label="Prénom *" value={form.prenom} onChange={e => set('prenom', e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input label="N° CIN"        placeholder="12345678"    value={form.cin}            onChange={e => set('cin', e.target.value)} />
                <Input label="Email étudiant" placeholder="@iit.ens.tn" type="email" value={form.email_etudiant} onChange={e => set('email_etudiant', e.target.value)} />
              </div>

              <Input
                label="Niveau d'études"
                placeholder="ex: Licence 2 Génie Informatique"
                value={form.niveau}
                onChange={e => set('niveau', e.target.value)}
              />

              <Textarea
                label="Motif / Détails supplémentaires"
                placeholder="Précisez le contexte, les dates ou tout détail utile…"
                value={form.motif}
                onChange={e => set('motif', e.target.value)}
                style={{ minHeight: 90 }}
              />

              <Button type="submit" variant="gold" loading={loading} fullWidth size="lg" icon={!loading && '✨'}>
                {loading ? 'Génération en cours…' : 'Générer l\'email'}
              </Button>
            </form>
          </Card>

          {/* ── Résultat ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Card style={{ flex: 1, padding: '24px', minHeight: 400 }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: 'var(--muted)' }}>
                  <Spinner size={32} />
                  <div style={{ fontSize: 13, textAlign: 'center' }}>
                    L'IA rédige votre email en se basant<br />sur les procédures officielles…
                  </div>
                </div>
              ) : result ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Destinataire — affiché seulement si l'API le retourne */}
                  {result.recipient_name && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'var(--surface-2, #f4f6fb)',
                      border: '1px solid var(--border)',
                      borderRadius: 8, padding: '8px 12px',
                      fontSize: 12.5, color: 'var(--muted)',
                    }}>
                      <Mail size={13} style={{ flexShrink: 0, color: 'var(--navy)' }} />
                      <span>
                        Envoyé à&nbsp;
                        <strong style={{ color: 'var(--navy)' }}>{result.recipient_name}</strong>
                        {result.recipient_email && (
                          <> — <span style={{ fontFamily: 'monospace' }}>{result.recipient_email}</span></>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Objet */}
                  <div style={{
                    background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
                    borderRadius: 8, padding: '10px 14px',
                    fontSize: 13, fontWeight: 600, color: 'var(--gold)',
                  }}>
                    📋 Objet : {result.subject}
                  </div>

                  {/* Corps */}
                  <div style={{
                    flex: 1, fontSize: 13, lineHeight: 1.85,
                    color: 'var(--text)', whiteSpace: 'pre-wrap',
                    fontFamily: 'Georgia, serif', overflowY: 'auto',
                  }}>
                    {result.body}
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', textAlign: 'center', gap: 12 }}>
                  <div style={{ fontSize: 44 }}>✉️</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>L'email apparaîtra ici</div>
                  <div style={{ fontSize: 12.5 }}>Remplissez le formulaire et cliquez sur<br />"Générer l'email"</div>
                </div>
              )}
            </Card>

            {result && (
              <div style={{ display: 'flex', gap: 10 }}>
                <Button
                  onClick={copyEmail}
                  variant={copied ? 'success' : 'primary'}
                  icon={copied ? <Check size={15} /> : <Copy size={15} />}
                  style={{ flex: 1 }}
                >
                  {copied ? 'Copié !' : 'Copier l\'email'}
                </Button>
                <Button onClick={downloadEmail} variant="ghost" icon={<Download size={15} />}>
                  Télécharger
                </Button>
                <Button onClick={() => setResult(null)} variant="ghost" icon={<RefreshCw size={15} />}>
                  Nouveau
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
