import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getAccessToken, getStoredUser, logout as authLogout, refreshAccessToken } from '../lib/auth'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      return null
    }
    try {
      const res = await api.get('/api/auth/me')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
      return res.data
    } catch {
      setUser(getStoredUser())
      return getStoredUser()
    }
  }, [])

  useEffect(() => {
    async function init() {
      if (getAccessToken()) {
        await refreshUser().catch(() => {})
      }
      setIsLoading(false)
    }
    init()
  }, [refreshUser])

  const login = useCallback((data) => {
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user && getAccessToken()),
      isLoading,
      login,
      logout,
      refreshUser,
      refreshAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
