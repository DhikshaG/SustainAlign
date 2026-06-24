import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Alert'
import { forgotPasswordSchema } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/auth/corporate/forgot-password', data)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Forgot password</h1>
      <p className="text-sm text-slate-600 mb-6">Enter your email and we&apos;ll send a reset link</p>
      {submitted ? (
        <Alert variant="success" title="Check your email">
          If an account exists with that email, we&apos;ve sent password reset instructions.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" {...register('email')} />
          </FormField>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      )}
      <p className="mt-6 text-sm text-slate-600 text-center">
        <Link to={ROUTES.corporateLogin} className="text-primary-600 hover:underline">&larr; Back to login</Link>
      </p>
    </Card>
  )
}
