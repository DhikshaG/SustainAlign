// Hardcoded backend URL for Render deployment
const API_BASE_URL = 'https://sustainalign-backend.onrender.com/api'

/**
 * Create a new project
 * @param {Object} projectData - Project data matching backend model structure
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Created project data
 */
export const createProject = async (projectData, token) => {
  try {
    console.log('🚀 Creating project (no auth required)')
    console.log('📤 Project data:', projectData)
    
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    })

    console.log('📥 Response status:', response.status)
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        console.log('📥 Error response data:', errorData)
      } catch (e) {
        // If response is not JSON, use status text
        console.log('Non-JSON error response:', response.statusText)
      }
      
      // Handle specific status codes
      if (response.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.'
      } else if (response.status === 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log('✅ Project created successfully:', result)
    return result
  } catch (error) {
    console.error('❌ Error creating project:', error)
    throw error
  }
}

/**
 * Get all projects with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Projects list and total count
 */
export const getProjects = async (filters = {}, token) => {
  try {
    const queryParams = new URLSearchParams()
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching projects:', error)
    throw error
  }
}

/**
 * Get a specific project by ID
 * @param {number} projectId - Project ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Project data
 */
export const getProject = async (projectId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching project:', error)
    throw error
  }
}

/**
 * Update an existing project
 * @param {number} projectId - Project ID
 * @param {Object} projectData - Updated project data
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Updated project data
 */
export const updateProject = async (projectId, projectData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(projectData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating project:', error)
    throw error
  }
}

/**
 * Delete a project
 * @param {number} projectId - Project ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Success message
 */
export const deleteProject = async (projectId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

/**
 * Get project milestones
 * @param {number} projectId - Project ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Milestones list
 */
export const getProjectMilestones = async (projectId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching project milestones:', error)
    throw error
  }
}

/**
 * Create a project milestone
 * @param {number} projectId - Project ID
 * @param {Object} milestoneData - Milestone data
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} Created milestone data
 */
export const createProjectMilestone = async (projectId, milestoneData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/milestones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(milestoneData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating project milestone:', error)
    throw error
  }
}

/**
 * Get all NGOs with optional filtering
 * @param {Object} filters - Filter parameters
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} NGOs list and total count
 */
export const getNGOs = async (filters = {}, token) => {
  try {
    const queryParams = new URLSearchParams()
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/ngos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching NGOs:', error)
    throw error
  }
}

/**
 * Get a specific NGO by ID
 * @param {number} ngoId - NGO ID
 * @param {string} token - JWT authentication token
 * @returns {Promise<Object>} NGO data
 */
export const getNGO = async (ngoId, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ngos/${ngoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching NGO:', error)
    throw error
  }
}

// Approvals API
export const getApprovals = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/approvals`, { method: 'GET' })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching approvals:', error)
    throw error
  }
}

export const getApproval = async (approvalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/approvals/${approvalId}`, { method: 'GET' })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching approval:', error)
    throw error
  }
}

export const updateApprovalStepStatus = async (approvalId, stepId, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/approvals/${approvalId}/steps/${stepId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error updating approval step:', error)
    throw error
  }
}

export const createApproval = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error creating approval:', error)
    throw error
  }
}

// AI Matching API
export const getAiMatches = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/ai-matches${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching AI matches:', error)
    throw error
  }
}

export const createAiMatch = async (matchData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(matchData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating AI match:', error)
    throw error
  }
}

// Impact Dashboard API
export const getImpactSnapshot = async (companyId = null) => {
  try {
    const queryParams = new URLSearchParams()
    if (companyId) queryParams.append('company_id', companyId)
    
    const url = `${API_BASE_URL}/impact/overview${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.cards || []
  } catch (error) {
    console.error('Error fetching impact snapshot:', error)
    throw error
  }
}

export const getImpactTimeSeries = async (metricName, filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    queryParams.append('metric', metricName)
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/impact/trends${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.series || []
  } catch (error) {
    console.error('Error fetching impact time series:', error)
    throw error
  }
}

export const getImpactRegionStats = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/impact/regions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.rows || []
  } catch (error) {
    console.error('Error fetching impact region stats:', error)
    throw error
  }
}

export const getImpactGoals = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/impact/goals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.goals || []
  } catch (error) {
    console.error('Error fetching impact goals:', error)
    throw error
  }
}

// Rationale API
export const getRationales = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/rationales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching rationales:', error)
    throw error
  }
}

export const getRationale = async (rationaleId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/${rationaleId}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching rationale:', error)
    throw error
  }
}

export const createRationale = async (rationaleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rationaleData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating rationale:', error)
    throw error
  }
}

export const updateRationale = async (rationaleId, rationaleData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/${rationaleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rationaleData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating rationale:', error)
    throw error
  }
}

export const addRationaleNote = async (rationaleId, noteData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rationales/${rationaleId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error adding rationale note:', error)
    throw error
  }
}

// Audit API
export const getAuditEvents = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })

    const response = await fetch(`${API_BASE_URL}/audit/events?${params.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching audit events:', error)
    throw error
  }
}

export const getAuditEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/audit/events/${eventId}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching audit event:', error)
    throw error
  }
}

export const createAuditEvent = async (eventData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/audit/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating audit event:', error)
    throw error
  }
}

export const getAuditSummary = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/audit/summary`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching audit summary:', error)
    throw error
  }
}

// Tracker API
export const getTrackerProjects = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })

    const response = await fetch(`${API_BASE_URL}/tracker/projects?${params.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tracker projects:', error)
    throw error
  }
}

export const getTrackerProject = async (projectId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tracker/projects/${projectId}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tracker project:', error)
    throw error
  }
}

export const createTrackerProject = async (projectData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tracker/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating tracker project:', error)
    throw error
  }
}

export const updateTrackerProject = async (projectId, projectData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tracker/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error updating tracker project:', error)
    throw error
  }
}

export const getTrackerTimeline = async (filters = {}) => {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value)
      }
    })

    const response = await fetch(`${API_BASE_URL}/tracker/timeline?${params.toString()}`)
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tracker timeline:', error)
    throw error
  }
}

export const createTimelineEntry = async (entryData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tracker/timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(entryData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating timeline entry:', error)
    throw error
  }
}

/**
 * Create a new report generation job
 * @param {Object} reportData - Report job data
 * @returns {Promise<Object>} Created report job
 */
export const createReportJob = async (reportData) => {
  try {
    console.log('🚀 Creating report job:', reportData)
    
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ Report job created successfully:', result)
    return result
  } catch (error) {
    console.error('❌ Error creating report job:', error)
    throw error
  }
}

/**
 * Get all report jobs with optional filtering
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Report jobs list
 */
export const getReportJobs = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams()
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const url = `${API_BASE_URL}/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching report jobs:', error)
    throw error
  }
}

/**
 * Get a specific report job by ID
 * @param {number} jobId - Report job ID
 * @returns {Promise<Object>} Report job data
 */
export const getReportJob = async (jobId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${jobId}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching report job:', error)
    throw error
  }
}

/**
 * Clear invalid project IDs from localStorage
 * This helps when there are stale project IDs that no longer exist in the database
 */
export function clearInvalidProjectIds() {
  try {
    const comparisonSelected = localStorage.getItem('comparisonSelected')
    if (!comparisonSelected) return
    
    const projects = JSON.parse(comparisonSelected)
    if (!Array.isArray(projects)) {
      localStorage.removeItem('comparisonSelected')
      return
    }
    
    // Keep only projects with valid IDs (1-100 for now, adjust based on your database)
    const validProjects = projects.filter(p => p && p.id && p.id >= 1 && p.id <= 100)
    
    if (validProjects.length !== projects.length) {
      console.log(`Cleared ${projects.length - validProjects.length} invalid project IDs from localStorage`)
      localStorage.setItem('comparisonSelected', JSON.stringify(validProjects))
    }
  } catch (error) {
    console.error('Error clearing invalid project IDs:', error)
    localStorage.removeItem('comparisonSelected')
  }
}
