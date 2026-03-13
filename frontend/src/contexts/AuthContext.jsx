import { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on mount
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setToken(session?.access_token ?? null)
      setLoading(false)
      
      // 如果有新的 session，发送 token 到后端
      if (session?.access_token) {
        await sendTokenToBackend(session.access_token)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setToken(session?.access_token ?? null)
      
      // ✨ 总是发送 token 到后端（即使是从 localStorage 恢复的 session）
      // 因为后端可能是新启动的进程，内存中没有 token
      if (session?.access_token) {
        await sendTokenToBackend(session.access_token)
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTokenToBackend = async (token, retries = 10) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        if (response.ok) {
          console.log('✅ Token sent to backend successfully')
          return true
        } else {
          console.warn(`⚠️ Failed to send token (status: ${response.status})`)
        }
      } catch (error) {
        console.warn(`⚠️ Backend not ready yet (attempt ${i + 1}/${retries}):`, error.message)
        // 如果不是最后一次尝试，等待后重试（使用指数退避）
        if (i < retries - 1) {
          const delay = Math.min(1000 * Math.pow(1.5, i), 5000) // 1s, 1.5s, 2.25s, ... 最多5s
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    console.error('❌ Failed to send token to backend after all retries')
    console.error('   Please ensure the backend is running and try restarting the app')
    return false
  }

  const login = async (token, user) => {
    setToken(token)
    setUser(user)
    
    // Send token to local backend
    await sendTokenToBackend(token)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
