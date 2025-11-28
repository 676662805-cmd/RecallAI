import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './LoginPage.css'

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true) // Toggle between Login/Signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('✅ Login successful:', data.user.email)
      
      // Get the access token
      const token = data.session.access_token
      console.log('🔑 Token obtained (length:', token.length, ')')
      
      // Call parent callback
      onLoginSuccess(token, data.user)
      
    } catch (error) {
      console.error('❌ Login error:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // 如果邮箱验证被禁用，用户会自动确认
          emailRedirectTo: window.location.origin,
        }
      })

      if (error) throw error

      console.log('✅ Signup successful:', data.user?.email)
      
      // 检查用户是否需要验证邮箱
      if (data.user && !data.user.confirmed_at) {
        alert('Account created! Please check your email to verify your account.')
        setIsLogin(true) // Switch to login view
      } else {
        // 如果邮箱验证已禁用，直接登录
        console.log('🔑 Auto-login after signup')
        const token = data.session?.access_token
        if (token) {
          onLoginSuccess(token, data.user)
        } else {
          alert('Account created! You can now login.')
          setIsLogin(true)
        }
      }
      
    } catch (error) {
      console.error('❌ Signup error:', error.message)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">RecallAI</h1>
        <p className="login-subtitle">AI-Powered Interview Assistant</p>

        <div className="login-toggle">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignup}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="login-footer">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <a onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Login'}
          </a>
        </p>
      </div>
    </div>
  )
}
