import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Alert } from '../../../components/ui/Alert'
import { api } from '../../../lib/api'
import { setTokens, getMfaSessionId, clearMfaSessionId } from '../../../lib/auth'
import { useAuth } from '../../../context/AuthContext'
import { ROUTES } from '../../../lib/routes'

export default function MfaVerify() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const inputs = useRef([])

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < 5) inputs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) {
      setError('Enter the full 6-digit code')
      return
    }
    const mfaSessionId = getMfaSessionId()
    if (!mfaSessionId) {
      setError('Session expired — please log in again')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const res = await api.post('/api/auth/corporate/mfa/verify', { mfaSessionId, code })
      setTokens(res.data)
      login(res.data)
      clearMfaSessionId()
      navigate(ROUTES.dashboard)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Verify your identity</h1>
      <p className="text-sm text-slate-600 mb-6">Enter the 6-digit code sent to your email</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Verifying...' : 'Verify'}
        </Button>
        <div className="text-center space-y-2">
          <button type="button" className="text-sm text-primary-600 hover:underline">Resend code</button>
          <p className="text-sm text-slate-500">
            <Link to={ROUTES.corporateLogin} className="text-primary-600 hover:underline">Use backup code instead</Link>
          </p>
        </div>
      </form>
    </Card>
  )
}
