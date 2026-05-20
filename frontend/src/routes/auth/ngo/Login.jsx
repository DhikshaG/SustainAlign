import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Alert'
import { ngoLoginSchema } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

export default function NgoLogin() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(ngoLoginSchema),
  })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/auth/ngo/login', data)
      navigate(ROUTES.home)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">NGO login</h1>
      <p className="text-sm text-slate-600 mb-6">Sign in to your NGO account</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        </FormField>
        <div className="text-right">
          <Link to={ROUTES.forgotPassword} className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600 text-center">
        New NGO?{' '}
        <Link to={ROUTES.ngoSignup} className="text-primary-600 hover:underline">Register here</Link>
      </p>
    </Card>
  )
}
