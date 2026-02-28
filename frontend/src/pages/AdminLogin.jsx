import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { Button, Input, Card } from '../components/UI'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    setError('')
    try {
      await login(password)
      toast.success('Connexion réussie !')
      nav('/admin/documents')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Mot de passe incorrect.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      {/* Back */}
      <Link to="/" style={{
        position: 'fixed', top: 20, left: 24,
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
        fontWeight: 500,
      }}>
        <ArrowLeft size={15} />Retour
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Card style={{ padding: '40px 36px' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: '0 auto 18px',
              background: 'linear-gradient(135deg, var(--navy), var(--navy-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={26} color="#fff" />
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
              Espace Administrateur
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Accès réservé au personnel de l'ENS
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••••••"
              error={error}
              autoFocus
            />

            <Button type="submit" loading={loading} fullWidth size="lg">
              Se connecter
            </Button>
          </form>

          <div style={{
            marginTop: 20, padding: '10px 14px',
            background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
            borderRadius: 8, fontSize: 12, color: 'var(--gold)',
            textAlign: 'center',
          }}>
            Par défaut : <code style={{ fontFamily: 'var(--font-mono)' }}>admin@iit2025</code>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
