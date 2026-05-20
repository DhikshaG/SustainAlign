import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { FormField } from '../../../components/ui/FormField'
import { Alert } from '../../../components/ui/Alert'
import { inviteTeamSchema, CORPORATE_ROLES } from '../../../lib/validation/schemas'
import { api } from '../../../lib/api'
import { ROUTES } from '../../../lib/routes'

export default function InviteTeam() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(inviteTeamSchema),
    defaultValues: { invites: [{ email: '', role: 'csr_head' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'invites' })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/auth/corporate/invite-team', data)
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    }
  }

  if (success) {
    return (
      <Card>
        <Alert variant="success" title="Invitations sent!">
          Team members will receive email invitations to join your SustainAlign workspace.
        </Alert>
        <Button onClick={() => navigate(ROUTES.home)} className="w-full mt-6">
          Go to Dashboard
        </Button>
      </Card>
    )
  }

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Invite your team</h1>
      <p className="text-sm text-slate-600 mb-6">Add colleagues who will manage CSR with you</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2 items-start">
            <FormField label={index === 0 ? 'Email' : undefined} htmlFor={`invites.${index}.email`} error={errors.invites?.[index]?.email?.message} className="flex-1">
              <Input id={`invites.${index}.email`} type="email" placeholder="colleague@company.com" {...register(`invites.${index}.email`)} />
            </FormField>
            <FormField label={index === 0 ? 'Role' : undefined} htmlFor={`invites.${index}.role`} className="w-40">
              <Select id={`invites.${index}.role`} {...register(`invites.${index}.role`)}>
                {CORPORATE_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </FormField>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)} className="mt-7 p-2 text-slate-400 hover:text-red-500" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ email: '', role: 'csr_head' })}>
          <Plus className="h-4 w-4" /> Add another
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending invites...' : 'Send Invitations'}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(ROUTES.home)}>
          Skip for now
        </Button>
      </form>
    </Card>
  )
}
