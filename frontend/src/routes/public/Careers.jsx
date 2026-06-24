import { useState, useMemo } from 'react'
import { Seo } from '../../components/seo/Seo'
import { Hero } from '../../components/marketing/Hero'
import { Container } from '../../components/ui/Container'
import { Section } from '../../components/ui/Section'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { jobs, jobTeams, jobLocations } from '../../data/sample-jobs'

export default function Careers() {
  const [team, setTeam] = useState('All')
  const [location, setLocation] = useState('All')

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (team !== 'All' && j.team !== team) return false
      if (location !== 'All' && j.location !== location && !j.location.includes(location)) return false
      return true
    })
  }, [team, location])

  return (
    <>
      <Seo title="Careers" description="Join the SustainAlign team and help transform CSR management in India." path="/careers" />
      <Hero
        title="Build the future of CSR"
        subtitle="Join a mission-driven team building technology that creates real social impact."
        primaryCta={{ label: 'View Open Roles', href: '#open-roles' }}
        secondaryCta={null}
      />
      <Section bg="white" id="open-roles">
        <Container>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select value={team} onChange={(e) => setTeam(e.target.value)} className="sm:w-48">
              {jobTeams.map((t) => <option key={t} value={t}>{t === 'All' ? 'All Teams' : t}</option>)}
            </Select>
            <Select value={location} onChange={(e) => setLocation(e.target.value)} className="sm:w-48">
              {jobLocations.map((l) => <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>)}
            </Select>
          </div>
          <div className="space-y-4">
            {filtered.length === 0 && (
              <p className="text-slate-500 text-center py-8">No open roles match your filters.</p>
            )}
            {filtered.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{job.description}</p>
                    <div className="flex gap-2 mt-3">
                      <Badge>{job.team}</Badge>
                      <Badge variant="default">{job.location}</Badge>
                      <Badge variant="default">{job.type}</Badge>
                    </div>
                  </div>
                  <a
                    href={`mailto:careers@sustainalign.com?subject=Application: ${job.title}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 shrink-0"
                  >
                    Apply
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </>
  )
}
