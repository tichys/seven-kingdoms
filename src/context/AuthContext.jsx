import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const validateSession = useCallback(async () => {
    const token = api.getToken()
    if (!token) {
      setLoading(false)
      return false
    }

    try {
      const data = await api.validateSession()
      if (data.status === 'ok') {
        setUser(data.player)
        setLoading(false)
        return true
      }
      api.setToken(null)
      setUser(null)
      setLoading(false)
      return false
    } catch {
      api.setToken(null)
      setUser(null)
      setLoading(false)
      return false
    }
  }, [])

  useEffect(() => {
    validateSession()
  }, [validateSession])

  const login = useCallback(async (avatarKey, loginCode) => {
    setError(null)
    try {
      const data = await api.login(avatarKey, loginCode)
      if (data.status === 'ok' && data.session) {
        api.setToken(data.session)
        setUser(data.player)
        return { success: true }
      }
      setError(data.error || 'Login failed')
      return { success: false, error: data.error }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // ignore errors on logout
    }
    api.setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    validateSession,
    isAuthenticated: !!user,
    isAdmin: user?.admin_level >= 1,
    adminLevel: user?.admin_level || 0,
    characterApproved: user?.character_approved === 1,
    hasArchetype: !!user?.has_archetype
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
