/**
 * API client for risk analysis and monitoring
 * Handles corporate collaboration risk assessment and daily analysis
 */

// Hardcoded backend URL for Render deployment
const API_BASE = 'https://sustainalign-backend.onrender.com/api/projects'

/**
 * Get comprehensive risk analysis for corporate collaboration projects
 */
export async function getCorporateRiskAnalysis() {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/corporate-risk-analysis`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching corporate risk analysis:', error)
    throw error
  }
}

/**
 * Get NGO risk assessments
 */
export async function getNGORiskAssessments(filters = {}) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Build query parameters
    const params = new URLSearchParams()
    if (filters.query) params.append('q', filters.query)
    if (filters.risk) params.append('risk', filters.risk)
    
    const response = await fetch(`${API_BASE}/ngo-risk?${params.toString()}`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching NGO risk assessments:', error)
    throw error
  }
}

/**
 * Get detailed risk assessment for a specific NGO
 */
export async function getNGORiskDetail(ngoId) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/ngo-risk/${ngoId}`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching NGO risk detail:', error)
    throw error
  }
}

/**
 * Get risk alerts and notifications
 */
export async function getRiskAlerts() {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/risk-alerts`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching risk alerts:', error)
    throw error
  }
}

/**
 * Export risk analysis report
 */
export async function exportRiskReport(format = 'pdf') {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/risk-export?format=${format}`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `risk-analysis-report-${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    return true
  } catch (error) {
    console.error('Error exporting risk report:', error)
    throw error
  }
}
