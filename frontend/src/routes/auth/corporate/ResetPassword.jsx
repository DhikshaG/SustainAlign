import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Alert'
import { resetPasswordSchema } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/auth/corporate/reset-password', { ...data, token })
      navigate(ROUTES.corporateLogin)
    } catch (err) {
      setError(err.message)
    }
  }

  if (!token) {
    return (
      <Card>
        <Alert variant="error" title="Invalid reset link">
          This password reset link is invalid or has expired.
        </Alert>
        <p className="mt-4 text-sm text-center">
          <Link to={ROUTES.forgotPassword} className="text-primary-600 hover:underline">Request a new link</Link>
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Reset password</h1>
      <p className="text-sm text-slate-600 mb-6">Enter your new password</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="New Password" htmlFor="password" required error={errors.password?.message}>
          <Input id="password" type="password" {...register('password')} />
        </FormField>
        <FormField label="Confirm Password" htmlFor="confirmPassword" required error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>
    </Card>
  )
}
