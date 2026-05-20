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
import { corporateSignupSchema } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

export default function CorporateSignUp() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(corporateSignupSchema),
    defaultValues: { enableMfa: false, acceptTerms: false },
  })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/auth/corporate/signup', data)
      navigate(data.enableMfa ? ROUTES.mfa : ROUTES.inviteTeam)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create corporate account</h1>
      <p className="text-sm text-slate-600 mb-6">Start managing your CSR program on SustainAlign</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="Company Name" htmlFor="companyName" required error={errors.companyName?.message}>
          <Input id="companyName" {...register('companyName')} />
        </FormField>
        <FormField label="Work Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>
        <FormField label="Password" htmlFor="password" required error={errors.password?.message} hint="Minimum 8 characters">
          <Input id="password" type="password" {...register('password')} />
        </FormField>
        <Checkbox id="enableMfa" {...register('enableMfa')} label="Enable two-factor authentication (recommended)" />
        <Checkbox id="acceptTerms" {...register('acceptTerms')} label="I agree to the Terms & Conditions and Privacy Policy" />
        {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600 text-center">
        Already have an account?{' '}
        <Link to={ROUTES.corporateLogin} className="text-primary-600 hover:underline">Log in</Link>
      </p>
    </Card>
  )
}
