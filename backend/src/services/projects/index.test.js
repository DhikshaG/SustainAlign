import { describe, it, expect } from 'vitest'
import { computeProjectProgress } from './index.js'

describe('computeProjectProgress', () => {
  it('returns 0 for empty milestones', () => {
    expect(computeProjectProgress([])).toBe(0)
    expect(computeProjectProgress(null)).toBe(0)
    expect(computeProjectProgress(undefined)).toBe(0)
  })

  it('computes average progress across milestones', () => {
    const m = [
      { status: 'in_progress', progress: 50 },
      { status: 'in_progress', progress: 75 },
    ]
    expect(computeProjectProgress(m)).toBe(63)
  })

  it('counts completed milestones as 100', () => {
    const m = [
      { status: 'completed', progress: 50 },
      { status: 'in_progress', progress: 50 },
    ]
    expect(computeProjectProgress(m)).toBe(75)
  })

  it('returns 100 when all milestones completed', () => {
    const m = [
      { status: 'completed', progress: 100 },
      { status: 'completed', progress: 100 },
    ]
    expect(computeProjectProgress(m)).toBe(100)
  })
})
