import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

// ── Intercepteur : ajoute le token JWT ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ua_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Intercepteur : gestion des erreurs ──────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ua_token')
      window.dispatchEvent(new Event('ua:logout'))
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:  (password)  => api.post('/auth/login', { password }),
  verify: ()          => api.get('/auth/me'),
}

// ── Documents ────────────────────────────────────────────────────────────────
export const docsAPI = {
  list: (params = {}) =>
    api.get('/documents/', { params }),

  get: (id) =>
    api.get(`/documents/${id}`),

  create: (body) =>
    api.post('/documents/', body),

  uploadPDF: (file, name, tags) => {
    const form = new FormData()
    form.append('file', file)
    if (name)  form.append('name', name)
    if (tags)  form.append('tags', tags)
    return api.post('/documents/upload-pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: undefined,
    })
  },

  update: (id, body) =>
    api.patch(`/documents/${id}`, body),

  toggle: (id) =>
    api.patch(`/documents/${id}/toggle`),

  delete: (id) =>
    api.delete(`/documents/${id}`),

  stats: () =>
    api.get('/documents/meta/stats'),
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  ask: (question, sessionId, history = [], topK = 8) =>
    api.post('/chat/', { question, session_id: sessionId, history, top_k: topK }),

  history: (sessionId) =>
    api.get(`/chat/history/${sessionId}`),
}

// ── Email ────────────────────────────────────────────────────────────────────
export const emailAPI = {
  generate: (body) =>
    api.post('/email/generate', body),

  types: () =>
    api.get('/email/types'),
}

export default api
