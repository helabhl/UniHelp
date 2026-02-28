import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem('ua_token'))
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('ua_token')
    setToken(null)
    setIsAdmin(false)
  }, [])

  useEffect(() => {
    const handle = () => logout()
    window.addEventListener('ua:logout', handle)
    return () => window.removeEventListener('ua:logout', handle)
  }, [logout])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    authAPI.verify()
      .then(() => setIsAdmin(true))
      .catch(() => logout())
      .finally(() => setLoading(false))
  }, [token, logout])

  const login = async (password) => {
    const res = await authAPI.login(password)
    const t = res.data.token
    localStorage.setItem('ua_token', t)
    setToken(t)
    setIsAdmin(true)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ token, isAdmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
