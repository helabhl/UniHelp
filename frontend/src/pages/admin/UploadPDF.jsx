import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Upload, FileText, X, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import { docsAPI } from '../../api/client'
import { Button, Input, Card, PageHeader } from '../../components/UI'

const STATUS = { idle: 'idle', uploading: 'uploading', done: 'done', error: 'error' }

export default function UploadPDF() {
  const [files,   setFiles]   = useState([]) // [{file, name, tags, status, message}]
  const [running, setRunning] = useState(false)
  const nav = useNavigate()

  const onDrop = useCallback((accepted) => {
    const newFiles = accepted.map(f => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      name: f.name.replace(/\.pdf$/i, ''),
      tags: '',
      status: STATUS.idle,
      message: '',
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxSize: 20 * 1024 * 1024,
    onDropRejected: (r) => {
      r.forEach(f => {
        const err = f.errors[0]
        toast.error(err.code === 'file-too-large' ? `${f.file.name} dépasse 20 MB` : err.message)
      })
    },
  })

  function remove(id) {
    setFiles(f => f.filter(x => x.id !== id))
  }

  function update(id, key, val) {
    setFiles(f => f.map(x => x.id === id ? { ...x, [key]: val } : x))
  }

  async function processAll() {
    setRunning(true)
    let successCount = 0

    for (const item of files.filter(f => f.status === STATUS.idle)) {
      update(item.id, 'status', STATUS.uploading)
      try {
        const r = await docsAPI.uploadPDF(item.file, item.name, item.tags)
        update(item.id, 'status', STATUS.done)
        update(item.id, 'message', r.data.message)
        successCount++
      } catch (err) {
        update(item.id, 'status', STATUS.error)
        update(item.id, 'message', err.response?.data?.detail || 'Erreur lors du traitement')
      }
    }

    setRunning(false)
    if (successCount > 0) {
      toast.success(`${successCount} PDF${successCount > 1 ? 's' : ''} indexé${successCount > 1 ? 's' : ''} avec succès !`)
    }
  }

  const pendingCount = files.filter(f => f.status === STATUS.idle).length
  const doneCount    = files.filter(f => f.status === STATUS.done).length

  return (
    <div style={{ maxWidth: 760 }}>
      <PageHeader
        title="Importer des PDFs"
        subtitle="Le texte est extrait automatiquement et indexé pour le RAG."
      />

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--navy)' : 'var(--border-2)'}`,
          borderRadius: 'var(--radius-lg)', padding: '52px 32px',
          textAlign: 'center', cursor: 'pointer',
          background: isDragActive ? 'rgba(13,31,60,0.03)' : 'var(--surface)',
          transition: 'var(--transition)', marginBottom: 24,
        }}
      >
        <input {...getInputProps()} />
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
          background: isDragActive ? 'var(--navy)' : 'var(--bg-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'var(--transition)',
        }}>
          <Upload size={24} color={isDragActive ? '#fff' : 'var(--muted)'} />
        </div>
        <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: '0 0 6px' }}>
          {isDragActive ? 'Relâchez les fichiers…' : 'Glissez vos PDFs ici'}
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
          ou <span style={{ color: 'var(--navy)', textDecoration: 'underline' }}>cliquez pour sélectionner</span> · max 20 MB par fichier
        </p>
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginBottom: 12 }}
          >
            <Card style={{
              padding: '16px 18px',
              borderLeft: `3px solid ${
                item.status === STATUS.done  ? 'var(--green)' :
                item.status === STATUS.error ? 'var(--red)'   :
                item.status === STATUS.uploading ? 'var(--gold)' : 'var(--border)'
              }`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <FileText size={20} color="var(--navy)" style={{ marginTop: 2, flexShrink: 0 }} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                      {item.file.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {(item.file.size / 1024).toFixed(0)} KB
                      </span>
                      {item.status === STATUS.uploading && <Loader size={15} color="var(--gold)" style={{ animation: 'spin 1s linear infinite' }} />}
                      {item.status === STATUS.done  && <CheckCircle size={16} color="var(--green)" />}
                      {item.status === STATUS.error && <XCircle size={16} color="var(--red)" />}
                      {item.status === STATUS.idle  && (
                        <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {item.status === STATUS.idle && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Input
                        placeholder="Nom du document"
                        value={item.name}
                        onChange={e => update(item.id, 'name', e.target.value)}
                        style={{ fontSize: 12.5 }}
                      />
                      <Input
                        placeholder="Tags (séparés par ,)"
                        value={item.tags}
                        onChange={e => update(item.id, 'tags', e.target.value)}
                        style={{ fontSize: 12.5 }}
                      />
                    </div>
                  )}

                  {item.message && (
                    <p style={{
                      fontSize: 12, margin: 0,
                      color: item.status === STATUS.done ? 'var(--green)' : 'var(--red)',
                    }}>
                      {item.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Actions */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Button
            variant="gold"
            loading={running}
            disabled={pendingCount === 0}
            icon={<Upload size={15} />}
            onClick={processAll}
          >
            {running ? 'Traitement…' : `Indexer ${pendingCount} fichier${pendingCount > 1 ? 's' : ''}`}
          </Button>
          {doneCount > 0 && (
            <Button variant="primary" onClick={() => nav('/admin/documents')}>
              Voir les documents →
            </Button>
          )}
          {!running && (
            <Button variant="ghost" onClick={() => setFiles([])}>
              Tout effacer
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
