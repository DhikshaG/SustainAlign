// Base URL for backend API
// In production, set VITE_API_BASE_URL to something like
//   https://sustainalign-backend.onrender.com/api
// In development, you can use http://localhost:5000/api or rely on the Vite proxy.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api') + '/ai-matching'

/**
 * AI Matching API Client
 * Handles all AI-powered project matching and rationale generation
 */

// Generate AI-powered project matching rationale
export const generateRationale = async (companyId, filters = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-rationale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        filters: filters
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate rationale')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error generating rationale:', error)
    throw error
  }
}

// Get all rationales for a company
export const getCompanyRationales = async (companyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/${companyId}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch rationales')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching company rationales:', error)
    throw error
  }
}

// Get detailed rationale by ID
export const getRationaleDetail = async (rationaleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/detail/${rationaleId}`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch rationale detail')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching rationale detail:', error)
    throw error
  }
}

// Update rationale
export const updateRationale = async (rationaleId, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/${rationaleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update rationale')
    }

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Error updating rationale:', error)
    throw error
  }
}

// Add note to rationale
export const addRationaleNote = async (rationaleId, author, content) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/${rationaleId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: author,
        content: content
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to add note')
    }

    const data = await response.json()
    return data.success
  } catch (error) {
    console.error('Error adding rationale note:', error)
    throw error
  }
}

// Get company data for AI analysis
export const getCompanyData = async (companyId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/company/${companyId}/data`)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch company data')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching company data:', error)
    throw error
  }
}

// Get available projects for matching
export const getAvailableProjects = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    if (filters.sdg_goals) queryParams.append('sdg_goals', filters.sdg_goals)
    if (filters.max_budget) queryParams.append('max_budget', filters.max_budget)
    if (filters.location_country) queryParams.append('location_country', filters.location_country)
    if (filters.ngo_rating_min) queryParams.append('ngo_rating_min', filters.ngo_rating_min)
    
    const url = `${API_BASE_URL}/available-projects${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch available projects')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching available projects:', error)
    throw error
  }
}

// Health check for AI matching service
export const checkAIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    
    if (!response.ok) {
      throw new Error('AI matching service is not healthy')
    }

    const data = await response.json()
    return data.status === 'healthy'
  } catch (error) {
    console.error('Error checking AI health:', error)
    return false
  }
}

// Mock data for development/testing
export const getMockRationale = () => {
  return {
    selectedProjectId: 1,
    confidenceScore: 0.85,
    title: "AI-Generated Project Matching Analysis",
    context: {
      companyProfile: "TechCorp is a leading technology company with strong focus on environmental sustainability and community development.",
      matchingCriteria: "Budget alignment, SDG focus, geographic proximity, NGO credibility",
      strategicAlignment: "High alignment with company's ESG goals and CSR strategy"
    },
    criteria: {
      impact: 0.9,
      cost: 0.8,
      risk: 0.7,
      alignment: 0.95,
      feasibility: 0.85
    },
    options: [
      {
        key: "1",
        label: "Renewable Energy for Rural Schools",
        data: {
          projectId: 1,
          score: 0.85,
          strengths: ["Strong SDG alignment", "Proven NGO track record", "Measurable impact"],
          concerns: ["Longer timeline", "Higher initial cost"]
        }
      },
      {
        key: "2",
        label: "Digital Literacy Program",
        data: {
          projectId: 2,
          score: 0.75,
          strengths: ["Quick implementation", "Technology focus", "Scalable"],
          concerns: ["Limited environmental impact", "Requires ongoing support"]
        }
      }
    ],
    selectedOption: "1",
    pros: [
      "Excellent alignment with company's sustainability goals",
      "Strong NGO partner with proven track record",
      "Measurable environmental and social impact",
      "Fits within budget constraints"
    ],
    cons: [
      "Longer project timeline (18 months)",
      "Requires significant upfront investment",
      "Geographic challenges in remote areas"
    ],
    reasoningSteps: [
      "Analyzed company's ESG priorities and budget constraints",
      "Evaluated project alignment with SDG goals 7 and 13",
      "Assessed NGO credibility and past performance",
      "Calculated risk-adjusted return on investment",
      "Considered geographic and logistical feasibility"
    ],
    scoreBreakdown: {
      "1": {
        impact: 0.9,
        cost: 0.8,
        risk: 0.7,
        alignment: 0.95,
        feasibility: 0.85,
        total: 0.84
      },
      "2": {
        impact: 0.6,
        cost: 0.9,
        risk: 0.8,
        alignment: 0.7,
        feasibility: 0.9,
        total: 0.78
      }
    }
  }
}
