import { Seo } from '../../components/seo/Seo'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'

const sections = [
  { id: 'intro', title: 'Introduction' },
  { id: 'collection', title: 'Information We Collect' },
  { id: 'usage', title: 'How We Use Information' },
  { id: 'sharing', title: 'Information Sharing' },
  { id: 'security', title: 'Data Security' },
  { id: 'retention', title: 'Data Retention' },
  { id: 'rights', title: 'Your Rights' },
  { id: 'contact', title: 'Contact Us' },
]

export default function PrivacyPolicy() {
  return (
    <>
      <Seo title="Privacy Policy" description="SustainAlign privacy policy — how we collect, use, and protect your data." path="/privacy" />
      <Section bg="white" className="pt-12">
        <Container size="narrow">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
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
          <div className="prose prose-slate max-w-none space-y-8 text-slate-600 leading-relaxed">
            <section id="intro">
              <h2 className="text-2xl font-semibold text-slate-900">Introduction</h2>
              <p>SustainAlign (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.</p>
            </section>
            <section id="collection">
              <h2 className="text-2xl font-semibold text-slate-900">Information We Collect</h2>
              <p>We collect information you provide directly (name, email, company details, NGO registration documents), information generated through platform usage (project data, compliance records, audit logs), and technical information (IP address, browser type, device information).</p>
            </section>
            <section id="usage">
              <h2 className="text-2xl font-semibold text-slate-900">How We Use Information</h2>
              <p>We use collected information to provide and improve our services, process NGO verifications, generate compliance reports, communicate with you, and ensure platform security.</p>
            </section>
            <section id="sharing">
              <h2 className="text-2xl font-semibold text-slate-900">Information Sharing</h2>
              <p>We do not sell your personal information. We may share data with verified NGO partners (with consent), service providers under confidentiality agreements, and regulatory authorities when required by law.</p>
            </section>
            <section id="security">
              <h2 className="text-2xl font-semibold text-slate-900">Data Security</h2>
              <p>We implement industry-standard security measures including encryption in transit and at rest, role-based access controls, and regular security audits.</p>
            </section>
            <section id="retention">
              <h2 className="text-2xl font-semibold text-slate-900">Data Retention</h2>
              <p>We retain your data for as long as your account is active or as needed to provide services. Compliance-related data is retained per regulatory requirements (minimum 8 years for CSR records).</p>
            </section>
            <section id="rights">
              <h2 className="text-2xl font-semibold text-slate-900">Your Rights</h2>
              <p>You have the right to access, correct, or delete your personal data. Contact us at privacy@sustainalign.com to exercise these rights.</p>
            </section>
            <section id="contact">
              <h2 className="text-2xl font-semibold text-slate-900">Contact Us</h2>
              <p>For privacy-related inquiries, contact us at privacy@sustainalign.com or write to SustainAlign Pvt. Ltd., Bangalore, Karnataka, India.</p>
            </section>
          </div>
        </Container>
      </Section>
    </>
  )
}
