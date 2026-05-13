import AuthLayout from './AuthLayout.jsx'
import { useState, useEffect, useRef } from 'react'
import { apiPost } from '../../lib/api'
import { setTokens } from '../../lib/auth'

export default function LoginPage() {
  const [form, setForm] = useState({ role: 'corporate', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const formRef = useRef(null)
  const buttonRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    // Add animation classes after component mounts
    const timer = setTimeout(() => {
      const formFields = document.querySelectorAll('.form-field')
      const submitBtn = document.querySelector('.submit-btn')
      const authHeader = document.querySelector('.auth-header')
      
      if (formFields) {
        formFields.forEach((field, index) => {
          setTimeout(() => {
            field.classList.add('animate-in')
          }, index * 150)
        })
      }
      
      if (submitBtn) {
        setTimeout(() => {
          submitBtn.classList.add('animate-in')
        }, 600)
      }
      
      if (authHeader) {
        authHeader.classList.add('animate-in')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Animate error message when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.classList.add('animate-error')
    }
  }, [error])

  // Button hover animation
  const handleButtonHover = (e) => {
    e.target.classList.add('button-hover')
  }

  const handleButtonLeave = (e) => {
    e.target.classList.remove('button-hover')
  }

  // Loading animation
  const startLoadingAnimation = () => {
    if (buttonRef.current) {
      buttonRef.current.classList.add('loading')
    }
  }

  const stopLoadingAnimation = () => {
    if (buttonRef.current) {
      buttonRef.current.classList.remove('loading')
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Start loading animation
    startLoadingAnimation()
    
    try {
      const data = await apiPost('/api/auth/login', { email: form.email, password: form.password, role: form.role })
      setTokens(data)

      // Success animation before redirect
      if (formRef.current) {
        formRef.current.classList.add('success-exit')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 500)
      }
    } catch (err) {
      setError(err.message)
      stopLoadingAnimation()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
        title="Secure sign in"
        subtitle="Minimal, CSR-themed access for corporates, NGOs and regulators"
        footer={<span>New here? <a className="text-emerald-700 hover:underline" href="/signup">Create an account</a></span>}
      >
              <div ref={formRef} className="form-container">
          <div className="auth-header">
            <h2 className="text-xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-600 text-sm mb-6">Sign in to continue your sustainability journey.</p>
          </div>
        
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="form-field">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">👤</span>
              <select 
                className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 hover:border-emerald-400" 
                value={form.role} 
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="corporate">Corporate</option>
                <option value="ngo">NGO</option>
                <option value="regulator">Regulator</option>
              </select>
            </div>
          </div>
          
          <div className="form-field">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">📧</span>
              <input 
                type="email" 
                className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 hover:border-emerald-400" 
                placeholder="you@company.com" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="form-field">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">🔒</span>
              <input 
                type="password" 
                className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 hover:border-emerald-400" 
                placeholder="••••••••" 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })} 
              />
            </div>
          </div>
          
          {error && (
            <div ref={errorRef} className="error-message text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="form-field">
            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center">
                <input type="checkbox" className="mr-2" /> Remember me
              </label>
              <a className="text-emerald-700 hover:underline" href="/forgot-password">Forgot password?</a>
            </div>
          </div>
          
          <button 
            ref={buttonRef}
            type="submit" 
            disabled={loading} 
            className="submit-btn w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-md py-2 shadow-sm transition-all duration-300"
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
                 </form>
       </div>
           </AuthLayout>
    )
  }


