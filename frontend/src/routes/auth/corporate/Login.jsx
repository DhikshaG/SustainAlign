import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Checkbox } from '../../../components/ui/Checkbox'
import { FormField } from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Alert'
import { corporateLoginSchema } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

export default function CorporateLogin() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(corporateLoginSchema),
  })

  async function onSubmit(data) {
    setError(null)
    try {
      const res = await api.post('/api/auth/corporate/login', data)
      if (res.data?.requiresMfa) {
        navigate(ROUTES.mfa)
      } else {
        navigate(ROUTES.home)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Corporate login</h1>
      <p className="text-sm text-slate-600 mb-6">Sign in to your SustainAlign account</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        </FormField>
        <div className="flex items-center justify-between">
          <Checkbox id="rememberMe" {...register('rememberMe')} label="Remember me" />
          <Link to={ROUTES.forgotPassword} className="text-sm text-primary-600 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600 text-center">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.corporateSignup} className="text-primary-600 hover:underline">Sign up</Link>
      </p>
    </Card>
  )
}
