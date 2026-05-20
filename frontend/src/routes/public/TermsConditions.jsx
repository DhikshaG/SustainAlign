import { Seo } from '../../components/seo/Seo'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'services', title: 'Description of Services' },
  { id: 'accounts', title: 'User Accounts' },
  { id: 'conduct', title: 'User Conduct' },
  { id: 'ip', title: 'Intellectual Property' },
  { id: 'payment', title: 'Payment Terms' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'termination', title: 'Termination' },
  { id: 'governing', title: 'Governing Law' },
]

export default function TermsConditions() {
  return (
    <>
      <Seo title="Terms & Conditions" description="SustainAlign terms and conditions for using our CSR and ESG management platform." path="/terms" />
      <Section bg="white" className="pt-12">
        <Container size="narrow">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms & Conditions</h1>
          <p className="text-sm text-slate-500 mb-8">Last updated: January 1, 2026</p>
          <nav className="mb-10 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-900 mb-2">Table of Contents</p>
            <ul className="space-y-1">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-sm text-primary-600 hover:underline">{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-8 text-slate-600 leading-relaxed">
            <section id="acceptance">
              <h2 className="text-2xl font-semibold text-slate-900">Acceptance of Terms</h2>
              <p>By accessing or using SustainAlign&apos;s platform, you agree to be bound by these Terms and Conditions. If you do not agree, do not use our services.</p>
            </section>
            <section id="services">
              <h2 className="text-2xl font-semibold text-slate-900">Description of Services</h2>
              <p>SustainAlign provides a cloud-based CSR and ESG management platform including NGO marketplace, project management, compliance automation, reporting, and AI-powered tools.</p>
            </section>
            <section id="accounts">
              <h2 className="text-2xl font-semibold text-slate-900">User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. Corporate accounts require authorized signatory approval.</p>
            </section>
            <section id="conduct">
              <h2 className="text-2xl font-semibold text-slate-900">User Conduct</h2>
              <p>You agree not to misuse the platform, upload false NGO verification documents, attempt unauthorized access, or use the platform for any unlawful purpose.</p>
            </section>
            <section id="ip">
              <h2 className="text-2xl font-semibold text-slate-900">Intellectual Property</h2>
              <p>All platform content, features, and functionality are owned by SustainAlign. You retain ownership of data you upload but grant us a license to process it for service delivery.</p>
            </section>
            <section id="payment">
              <h2 className="text-2xl font-semibold text-slate-900">Payment Terms</h2>
              <p>Subscription fees are billed monthly or annually as per your plan. All fees are exclusive of applicable taxes. Refunds are handled per our refund policy.</p>
            </section>
            <section id="liability">
              <h2 className="text-2xl font-semibold text-slate-900">Limitation of Liability</h2>
              <p>SustainAlign is provided &quot;as is&quot;. We are not liable for indirect, incidental, or consequential damages arising from platform use. Our total liability is limited to fees paid in the preceding 12 months.</p>
            </section>
            <section id="termination">
              <h2 className="text-2xl font-semibold text-slate-900">Termination</h2>
              <p>Either party may terminate with 30 days written notice. We may suspend accounts for Terms violations. Upon termination, you may export your data within 30 days.</p>
            </section>
            <section id="governing">
              <h2 className="text-2xl font-semibold text-slate-900">Governing Law</h2>
              <p>These Terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in Bangalore, Karnataka.</p>
            </section>
          </div>
        </Container>
      </Section>
    </>
  )
}
