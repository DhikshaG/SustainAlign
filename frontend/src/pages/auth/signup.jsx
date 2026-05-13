import AuthLayout from './AuthLayout.jsx'
import { useState, useEffect, useRef } from 'react'
import { apiPost } from '../../lib/api'
import { setTokens } from '../../lib/auth'


export default function SignupPage() {
  const [form, setForm] = useState({ role: 'corporate', name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const formRef = useRef(null)
  const buttonRef = useRef(null)
  const errorRef = useRef(null)
  const successModalRef = useRef(null)

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
          }, index * 120)
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

  // Animate success modal when it appears
  useEffect(() => {
    if (success) {
      const overlay = document.querySelector('.success-overlay')
      const modal = successModalRef.current
      const icon = document.querySelector('.success-icon')
      
      if (overlay) overlay.classList.add('animate-in')
      if (modal) modal.classList.add('animate-in')
      if (icon) {
        setTimeout(() => {
          icon.classList.add('animate-in')
        }, 200)
      }
    }
  }, [success])

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

  // Close success modal with animation
  const closeSuccessModal = () => {
    const modal = successModalRef.current
    const overlay = document.querySelector('.success-overlay')
    
    if (modal) modal.classList.add('animate-out')
    if (overlay) overlay.classList.add('animate-out')
    
    setTimeout(() => {
      setSuccess(false)
    }, 300)
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password || form.password !== form.confirm) {
      setError('Please enter email and matching passwords')
      return
    }
    setLoading(true)
    
    // Start loading animation
    startLoadingAnimation()
    
    try {
      const data = await apiPost('/api/auth/signup', { email: form.email, password: form.password, role: form.role })
      setTokens(data)
      stopLoadingAnimation()
      // If NGO role, send to onboarding first
      if ((form.role || '').toLowerCase() === 'ngo') {
        window.location.href = '/ngo-onboarding'
        return
      }
      // If corporate role, send to company details form first
      if ((form.role || '').toLowerCase() === 'corporate') {
        localStorage.setItem('newCorporateUser', 'true')
        window.location.href = '/profile/company-details'
        return
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message)
      stopLoadingAnimation()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
        title="Create your SustainAlign account"
        subtitle="Guided onboarding for corporates, NGOs, and regulators"
        footer={<span>Already have an account? <a className="text-emerald-700 hover:underline" href="/login">Sign in</a></span>}
      >
      <div ref={formRef}>
        <div className="auth-header">
          <h2 className="text-xl font-bold text-gray-900">Get started</h2>
          <p className="text-gray-600 text-sm mb-6">Set up your account to unlock personalized dashboards.</p>
        </div>
        
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="form-field md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">👥</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">🧑</span>
              <input 
                className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 hover:border-emerald-400" 
                placeholder="Jane Doe" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="form-field">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">📧</span>
              <input 
                type="email" 
                className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 hover:border-emerald-400" 
                placeholder="you@org.org" 
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
          
          <div className="form-field">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-2.5">✅</span>
              <input 
                type="password" 
                className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 transition-all duration-300 hover:border-emerald-400" 
                placeholder="••••••••" 
                value={form.confirm} 
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} 
              />
            </div>
          </div>
          
          {error && (
            <div ref={errorRef} className="error-message md:col-span-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="md:col-span-2">
            <button 
              ref={buttonRef}
              type="submit" 
              disabled={loading} 
              className="submit-btn w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-md py-2 shadow-sm transition-all duration-300"
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>

      {success && (
        <div className="success-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div 
          ref={successModalRef}
          className="success-modal bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 max-w-md w-full text-center"
        >
            <div className="success-icon mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">✅</div>
            <h3 className="text-2xl font-extrabold text-emerald-700">Account created!</h3>
            <p className="text-gray-700 mt-2">Welcome to SustainAlign. Your account is ready.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <a 
                href="/dashboard" 
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all duration-300 hover:scale-105"
              >
                Go to dashboard
              </a>
              <button 
                onClick={closeSuccessModal} 
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-300 hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}


