import { describe, it, expect } from 'vitest'
import { formatNgoDto } from './index.js'

describe('formatNgoDto', () => {
  const baseTenant = { id: 't1', name: 'Test NGO', slug: 'test-ngo', type: 'ngo' }
  const baseProfile = {
    tagline: 'Helping communities', mission: 'Change the world',
    website: 'https://test.org', city: 'Delhi', country: 'IN',
    beneficiariesCount: 5000, volunteerCount: 200,
    socialLinks: null, verificationStatus: 'verified',
    impactAreas: ['education'],
    stateGeography: ['Delhi'], operationRadius: 'state',
  }
  const emptyChildren = {
    team: [], pastProjects: [], impactMetrics: [], impactStories: [],
    certifications: [], verificationDocs: [], mediaFiles: [],
  }

  it('formats a minimal NGO DTO for corporate audience', () => {
    const dto = formatNgoDto({
      tenant: baseTenant, profile: baseProfile,
      tagList: [{ slug: 'sdg-1' }, { slug: 'education' }],
      children: emptyChildren,
      audience: 'corporate',
    })
    expect(dto.tenantId).toBe('t1')
    expect(dto.name).toBe('Test NGO')
    expect(dto.slug).toBe('test-ngo')
    expect(dto.description).toBe('')
    expect(dto.beneficiaries).toBe('5,000+')
    expect(dto.sdgs).toEqual([1])
    expect(dto.tags).toEqual(['sdg-1', 'education'])
  })

  it('includes full profile details for ngo_admin audience', () => {
    const dto = formatNgoDto({
      tenant: baseTenant,
      profile: { ...baseProfile, socialLinks: JSON.stringify({ twitter: '@test' }) },
      tagList: [{ slug: 'education' }],
      children: {
        ...emptyChildren,
        team: [{ id: 'm1', name: 'Alice', role: 'Director' }],
        pastProjects: [{ id: 'p1', name: 'Project A', budgetLabel: '1Cr', outcome: 'Good', completedAt: '2024-01-01' }],
        impactMetrics: [{ metricKey: 'trees', value: '1000' }],
        impactStories: [{ id: 's1', title: 'Story 1', excerpt: 'Excerpt', publishedAt: '2024-01-01' }],
        certifications: [{ id: 'c1', name: 'ISO 9001', issuedAt: '2024-01-01', expiresAt: '2025-01-01', status: 'active' }],
      },
      audience: 'ngo_admin',
    })
    expect(dto.team).toHaveLength(1)
    expect(dto.team[0].name).toBe('Alice')
    expect(dto.pastProjects).toHaveLength(1)
    expect(dto.impactMetrics.trees).toBe('1000')
    expect(dto.impactStories).toHaveLength(1)
    expect(dto.certifications).toHaveLength(1)
    expect(dto.rating).toBeUndefined()
    expect(dto.financialTransparency).toBeUndefined()
    expect(dto.riskScore).toBeUndefined()
  })

  it('handles null beneficiaries', () => {
    const dto = formatNgoDto({
      tenant: baseTenant, profile: { ...baseProfile, beneficiariesCount: null },
      tagList: [], children: emptyChildren, audience: 'corporate',
    })
    expect(dto.beneficiaries).toBe('0')
  })
})
