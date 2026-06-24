import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { FormField } from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Alert'
import { ngoRegisterSchema, NGO_SECTORS } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { setTokens } from '../../../lib/auth'
import { useAuth } from '../../../context/AuthContext'
import { ROUTES } from '../../../lib/routes'

export default function NgoRegister() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const [selectedSectors, setSelectedSectors] = useState([])
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(ngoRegisterSchema),
    defaultValues: { sectors: [] },
  })

  function toggleSector(sector) {
    const next = selectedSectors.includes(sector)
      ? selectedSectors.filter((s) => s !== sector)
      : [...selectedSectors, sector]
    setSelectedSectors(next)
    setValue('sectors', next, { shouldValidate: true })
  }

  async function onSubmit(data) {
    setError(null)
    try {
      const res = await api.post('/api/auth/ngo/register', data)
      setTokens(res.data)
      login(res.data)
      navigate(ROUTES.ngoVerification)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Register your NGO</h1>
      <p className="text-sm text-slate-600 mb-6">Join the SustainAlign marketplace and connect with corporates</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="NGO Name" htmlFor="ngoName" required error={errors.ngoName?.message}>
          <Input id="ngoName" {...register('ngoName')} />
        </FormField>
        <FormField label="Registration Number" htmlFor="registrationNumber" required error={errors.registrationNumber?.message}>
          <Input id="registrationNumber" {...register('registrationNumber')} placeholder="e.g. 12A/80G number" />
        </FormField>
        <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>
        <FormField label="Contact Person" htmlFor="contactPerson" required error={errors.contactPerson?.message}>
          <Input id="contactPerson" {...register('contactPerson')} />
        </FormField>
        <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
          <Input id="password" type="password" {...register('password')} />
        </FormField>
        <FormField label="Sectors" required error={errors.sectors?.message}>
          <div className="flex flex-wrap gap-2">
            {NGO_SECTORS.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => toggleSector(sector)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedSectors.includes(sector)
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sector}
              </button>
            ))}
          </div>
        </FormField>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Registering...' : 'Continue to Verification'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-slate-600 text-center">
        Already registered?{' '}
        <Link to={ROUTES.ngoLogin} className="text-primary-600 hover:underline">Log in</Link>
      </p>
    </Card>
  )
}
