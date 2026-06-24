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
import { Textarea } from '../../components/ui/Textarea'
import { FormField } from '../../components/ui/FormField'
import { Alert } from '../../components/ui/Alert'
import { contactSchema } from '../../lib/validation/schemas'
import { api } from '../../lib/api'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(contactSchema),
  })

  async function onSubmit(data) {
    setError(null)
    try {
      await api.post('/api/contact', data)
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <Seo title="Contact" description="Get in touch with the SustainAlign team for demos, support, or partnership inquiries." path="/contact" />
      <Hero title="Get in touch" subtitle="Have questions? We'd love to hear from you." primaryCta={null} secondaryCta={null} />
      <Section bg="white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Email</p>
                    <p className="text-sm text-slate-600">hello@sustainalign.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Phone</p>
                    <p className="text-sm text-slate-600">+91 80 4567 8900</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Office</p>
                    <p className="text-sm text-slate-600">Bangalore, Karnataka, India</p>
                  </div>
                </div>
              </div>
            </div>
            <Card>
              {submitted ? (
                <Alert variant="success" title="Message sent!">
                  Thank you for reaching out. Our team will get back to you within 1 business day.
                </Alert>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {error && <Alert variant="error">{error}</Alert>}
                  <FormField label="Name" htmlFor="name" required error={errors.name?.message}>
                    <Input id="name" {...register('name')} error={errors.name} />
                  </FormField>
                  <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
                    <Input id="email" type="email" {...register('email')} error={errors.email} />
                  </FormField>
                  <FormField label="Company" htmlFor="company" error={errors.company?.message}>
                    <Input id="company" {...register('company')} />
                  </FormField>
                  <FormField label="Message" htmlFor="message" required error={errors.message?.message}>
                    <Textarea id="message" {...register('message')} error={errors.message} />
                  </FormField>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </Container>
      </Section>
    </>
  )
}
