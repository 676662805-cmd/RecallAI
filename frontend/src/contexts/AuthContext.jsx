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
      
      // 如果有 session，发送 token 到后端
      if (session?.access_token) {
        await sendTokenToBackend(session.access_token)
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendTokenToBackend = async (token, retries = 5) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/set-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
        
        if (response.ok) {
          console.log('✅ Token sent to backend')
          return true
        } else {
          console.error('❌ Failed to send token to backend')
        }
      } catch (error) {
        console.error(`❌ Error sending token to backend (attempt ${i + 1}/${retries}):`, error.message)
        // 如果不是最后一次尝试，等待后重试
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // 等待 1 秒
        }
      }
    }
    console.error('❌ Failed to send token after all retries')
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
