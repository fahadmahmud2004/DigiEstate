import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '@/api/auth'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Notification {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  // Add other fields as needed
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  notifications: Notification[]
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      console.log('[AuthContext] Initial auth state: AUTHENTICATED')
      setIsAuthenticated(true)
    } else {
      console.log('[AuthContext] Initial auth state: NOT_AUTHENTICATED')
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log(`[AuthContext] Attempting login for email: ${email}`)
      const response = await apiLogin({ email, password }) as any
      console.log('[AuthContext] Login response:', JSON.stringify(response).substring(0, 200) + '...')
      
      // Check if response has the expected structure
      if (response.success && response.data && response.data.accessToken) {
        const { accessToken, refreshToken, user: userData } = response.data
        
        localStorage.setItem('accessToken', accessToken)
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken)
        }
        
        setUser(userData)
        setIsAuthenticated(true)
        console.log('[AuthContext] Login successful, user authenticated')
      } else {
        console.error('[AuthContext] Login failed - invalid response structure')
        console.error('[AuthContext] Expected: response.success && response.data.accessToken')
        console.error('[AuthContext] Received:', response)
        throw new Error('Login failed - invalid response')
      }
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      console.log(`[AuthContext] Attempting registration for email: ${email}`)
      const response = await apiRegister({ email, password, name }) as any
      console.log('[AuthContext] Registration response:', JSON.stringify(response).substring(0, 200) + '...')
      
      // Check if response has the expected structure
      if (response.success && response.data && response.data.accessToken) {
        const { accessToken, user: userData } = response.data
        
        localStorage.setItem('accessToken', accessToken)
        // Note: Registration doesn't return refreshToken according to the backend
        
        setUser(userData)
        setIsAuthenticated(true)
        console.log('[AuthContext] Registration successful, user authenticated')
      } else {
        console.error('[AuthContext] Registration failed - invalid response structure')
        console.error('[AuthContext] Expected: response.success && response.data.accessToken')
        console.error('[AuthContext] Received:', response)
        throw new Error('Registration failed - invalid response')
      }
    } catch (error: any) {
      console.error('[AuthContext] Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log('[AuthContext] Attempting logout')
      await apiLogout()
    } catch (error) {
      console.error('[AuthContext] Logout API call failed:', error)
      // Continue with local logout even if API call fails
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setUser(null)
      setIsAuthenticated(false)
      console.log('[AuthContext] User logged out, tokens cleared')
    }
  }

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated,
    notifications, // Ensure this is defined in your provider
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}