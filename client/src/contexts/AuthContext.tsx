import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile } from '@/api/auth'
import { getNotifications, Notification } from '@/api/notifications'

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  notifications: Notification[]
  unreadCount: number
  isAuthenticated: boolean
  isLoading: boolean
  refreshNotifications: () => Promise<void>
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
  const [isLoading, setIsLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications()
      if (response.success) {
        setNotifications(response.notifications)
        const unread = response.notifications.filter((n: Notification) => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching notifications:', error)
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('[AuthContext] Starting auth check...')
      setIsLoading(true)
      
      const token = localStorage.getItem('accessToken')
      if (token) {
        try {
          console.log('[AuthContext] Token found, fetching profile...')
          const response = await getProfile() as any
          if (response.success && response.data) {
            setUser(response.data)
            setIsAuthenticated(true)
            console.log('[AuthContext] Profile fetched, user authenticated')
            // Fetch notifications after successful authentication
            await fetchNotifications()
          } else {
            console.log('[AuthContext] Profile fetch failed, clearing tokens')
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            setUser(null)
            setIsAuthenticated(false)
          }
        } catch (error) {
          console.error('[AuthContext] Error fetching profile:', error)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          setUser(null)
          setIsAuthenticated(false)
        }
      } else {
        console.log('[AuthContext] No token found, user not authenticated')
        setUser(null)
        setIsAuthenticated(false)
      }
      
      console.log('[AuthContext] Auth check complete, setting loading to false')
      setIsLoading(false)
    }
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('[AuthContext] Auth check timeout, forcing loading to false')
      setIsLoading(false)
    }, 10000) // 10 second timeout
    
    checkAuthStatus().finally(() => {
      clearTimeout(timeoutId)
    })
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
    isLoading,
    notifications,
    unreadCount,
    refreshNotifications,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}