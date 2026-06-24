import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Seo } from '../../components/seo/Seo'
import { Hero } from '../../components/marketing/Hero'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { FormField } from '../../components/ui/FormField'
import { Alert } from '../../components/ui/Alert'
import { demoBookingSchema } from '../../lib/validation/schemas'
import { api } from '../../lib/api'

export default function DemoBooking() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(demoBookingSchema),
  })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/demo-booking', data)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <Seo title="Book a Demo" description="Schedule a personalized demo of SustainAlign's CSR and ESG management platform." path="/demo" />
      <Hero title="See SustainAlign in action" subtitle="Schedule a 30-minute demo tailored to your CSR program needs." primaryCta={null} secondaryCta={null} />
      <Section bg="white">
        <Container size="narrow">
          <Card>
            {submitted ? (
              <Alert variant="success" title="Demo request received!">
                Our team will confirm your demo slot within 1 business day. Check your email for a calendar invite.
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <Alert variant="error">{error}</Alert>}
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Full Name" htmlFor="name" required error={errors.name?.message}>
                    <Input id="name" {...register('name')} />
                  </FormField>
                  <FormField label="Work Email" htmlFor="email" required error={errors.email?.message}>
                    <Input id="email" type="email" {...register('email')} />
                  </FormField>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Company" htmlFor="company" required error={errors.company?.message}>
                    <Input id="company" {...register('company')} />
                  </FormField>
                  <FormField label="Your Role" htmlFor="role" required error={errors.role?.message}>
                    <Input id="role" {...register('role')} placeholder="e.g. CSR Head" />
                  </FormField>
                </div>
                <FormField label="Company Size" htmlFor="employees" required error={errors.employees?.message}>
                  <Select id="employees" {...register('employees')}>
                    <option value="">Select size</option>
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </Select>
                </FormField>
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField label="Preferred Date" htmlFor="preferredDate" required error={errors.preferredDate?.message}>
                    <Input id="preferredDate" type="date" {...register('preferredDate')} />
                  </FormField>
                  <FormField label="Preferred Time" htmlFor="preferredTime" required error={errors.preferredTime?.message}>
                    <Select id="preferredTime" {...register('preferredTime')}>
                      <option value="">Select time</option>
                      <option value="10:00">10:00 AM IST</option>
                      <option value="11:00">11:00 AM IST</option>
                      <option value="14:00">2:00 PM IST</option>
                      <option value="15:00">3:00 PM IST</option>
                      <option value="16:00">4:00 PM IST</option>
                    </Select>
                  </FormField>
                </div>
                <FormField label="Notes (optional)" htmlFor="notes" error={errors.notes?.message}>
                  <Textarea id="notes" {...register('notes')} placeholder="Tell us about your CSR program or specific interests" />
                </FormField>
                <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                  {isSubmitting ? 'Submitting...' : 'Request Demo'}
                </Button>
              </form>
            )}
          </Card>
        </Container>
      </Section>
    </>
  )
}
