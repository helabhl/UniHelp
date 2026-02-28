import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, BookOpen } from 'lucide-react'
import { v4 as uuid } from "uuid";
import { chatAPI } from '../../api/client'
import { Button, TypingDots, Card } from '../../components/UI'

const SUGGESTED = [
  'Comment obtenir une attestation de scolarité ?',
  'Combien d\'absences sont autorisées par module ?',
  'Quelles sont les conditions pour la bourse ?',
  'Comment établir une convention de stage ?',
  'Quand payer la 2ème tranche des frais ?',
  'Quel est le délai pour le rattrapage ?',
]

function genSession() {
  return 'sess_' + Math.random().toString(36).slice(2, 10)
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/^(\d+)\. (.+)$/gm, '<span style="color:var(--navy);font-weight:700">$1.</span> $2')
    .replace(/\n/g, '<br/>')
}

export default function StudentChat() {
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [sessionId,  setSessionId]  = useState(genSession)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async (text) => {
    const q = (text || input).trim()
    if (!q || loading) return
    setInput('')
    setLoading(true)

    const userMsg = { role: 'user', content: q, ts: new Date() }
    setMessages(prev => [...prev, userMsg])

    const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))

    try {
      const r = await chatAPI.ask(q, sessionId, history)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: r.data.answer,
        sources: r.data.sources,
        chunks: r.data.chunks_used,
        ts: new Date(),
      }])
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur de connexion au service IA. Vérifiez votre réseau.'
      setMessages(prev => [...prev, { role: 'assistant', content: msg, sources: [], ts: new Date(), isError: true }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [input, loading, messages, sessionId])

  function clearChat() {
    setMessages([])
    setSessionId(genSession())
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Suggestions sidebar */}
      {sidebarOpen && (
        <aside style={{
          width: 252, background: 'var(--bg-2)',
          borderRight: '1px solid var(--border)',
          padding: '20px 14px', overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Questions fréquentes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SUGGESTED.map((q, i) => (
              <button
                key={i}
                onClick={() => send(q)}
                disabled={loading}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '9px 11px', cursor: 'pointer',
                  fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
                  fontFamily: 'var(--font-body)', textAlign: 'left',
                  transition: 'var(--transition)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--navy)'; e.currentTarget.style.color = 'var(--navy)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={{
            marginTop: 24, padding: '12px 14px',
            background: 'rgba(13,31,60,0.05)', borderRadius: 8,
            border: '1px solid rgba(13,31,60,0.1)',
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              📚 Comment ça marche
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.6 }}>
              L'IA analyse les <strong>documents officiels</strong> déposés par l'administration et y extrait la réponse la plus précise.
            </div>
          </div>
        </aside>
      )}

      {/* Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          padding: '10px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--surface)', flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, fontFamily: 'var(--font-body)' }}
          >
            <BookOpen size={14} />
            {sidebarOpen ? 'Masquer les suggestions' : 'Afficher les suggestions'}
          </button>

          {hasMessages && (
            <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={clearChat}>
              Nouvelle conversation
            </Button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!hasMessages && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '60px 32px' }}
            >
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏛️</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--navy)', marginBottom: 10 }}>
                Bonjour, comment puis-je vous aider ?
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 420, margin: '0 auto', lineHeight: 1.65 }}>
                Je réponds à toutes vos questions administratives à partir des <strong>documents officiels</strong> de l'ENS.
                Inscriptions, certificats, bourses, stages, absences…
              </p>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}
              >
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginTop: 2,
                    background: 'linear-gradient(135deg, var(--navy), var(--navy-2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, boxShadow: '0 2px 8px rgba(13,31,60,0.2)',
                  }}>🎓</div>
                )}

                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--navy), var(--navy-2))'
                      : msg.isError ? 'var(--red-bg)' : 'var(--surface)',
                    border: msg.role === 'user' ? 'none' : `1px solid ${msg.isError ? 'var(--red-border)' : 'var(--border)'}`,
                    color: msg.role === 'user' ? '#fff' : msg.isError ? 'var(--red)' : 'var(--text)',
                    fontSize: 13.5, lineHeight: 1.72,
                    boxShadow: msg.role === 'user' ? '0 2px 8px rgba(13,31,60,0.25)' : 'var(--shadow-sm)',
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                  </div>

                  {msg.sources?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {msg.sources.map((s, si) => (
                        <span key={si} style={{
                          background: 'var(--gold-bg)', border: '1px solid var(--gold-border)',
                          borderRadius: 5, padding: '2px 8px',
                          fontSize: 11, color: 'var(--gold)', fontWeight: 600,
                        }}>📄 {s}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: msg.role === 'user' ? 'right' : 'left', marginTop: 1 }}>
                    {msg.ts?.toLocaleTimeString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                    {msg.chunks > 0 && <span style={{ marginLeft: 8 }}>· {msg.chunks} sources analysées</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--navy), var(--navy-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>🎓</div>
              <Card style={{ padding: '10px 16px', borderRadius: '4px 16px 16px 16px' }}>
                <TypingDots />
              </Card>
            </motion.div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '14px 20px', background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 10, flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Posez votre question administrative… (Entrée pour envoyer)"
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 10,
              border: '1.5px solid var(--border)', background: 'var(--bg)',
              fontSize: 13.5, fontFamily: 'var(--font-body)', color: 'var(--text)', outline: 'none',
              transition: 'var(--transition)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--navy)'; e.target.style.boxShadow = '0 0 0 3px rgba(13,31,60,0.07)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = ''; }}
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            icon={<Send size={15} />}
            style={{ padding: '11px 20px' }}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
