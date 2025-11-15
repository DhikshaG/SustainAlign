/**
 * API client for project comparisons
 * Handles CRUD operations for comparisons and comparison items
 */

// Hardcoded backend URL for Render deployment
const API_BASE = 'https://sustainalign-backend.onrender.com/api/comparisons'

/**
 * Get all comparisons for the current user
 */
export async function getComparisons() {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching comparisons:', error)
    throw error
  }
}

/**
 * Get a specific comparison by ID
 */
export async function getComparison(comparisonId) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/${comparisonId}`, {
      headers
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching comparison:', error)
    throw error
  }
}

/**
 * Create a new comparison
 */
export async function createComparison(comparisonData) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(comparisonData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error creating comparison:', error)
    throw error
  }
}

/**
 * Update an existing comparison
 */
export async function updateComparison(comparisonId, updateData) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/${comparisonId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error updating comparison:', error)
    throw error
  }
}

/**
 * Delete a comparison
 */
export async function deleteComparison(comparisonId) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/${comparisonId}`, {
      method: 'DELETE',
      headers
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    return true
  } catch (error) {
    console.error('Error deleting comparison:', error)
    throw error
  }
}

/**
 * Add a project to a comparison
 */
export async function addProjectToComparison(comparisonId, projectId, notes = '', priority = 0) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/${comparisonId}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        project_id: projectId,
        notes,
        priority
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error adding project to comparison:', error)
    throw error
  }
}

/**
 * Remove a project from a comparison
 */
export async function removeProjectFromComparison(comparisonId, projectId) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/${comparisonId}/projects/${projectId}`, {
      method: 'DELETE',
      headers
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    return true
  } catch (error) {
    console.error('Error removing project from comparison:', error)
    throw error
  }
}

/**
 * Update project notes or priority in comparison
 */
export async function updateProjectInComparison(comparisonId, projectId, updateData) {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE}/${comparisonId}/projects/${projectId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error updating project in comparison:', error)
    throw error
  }
}

/**
 * Quick comparison creation with projects
 * This is a convenience function that creates a comparison and adds projects in one call
 */
export async function createQuickComparison(name, projectIds, description = '') {
  try {
    const comparison = await createComparison({
      name,
      description,
      project_ids: projectIds
    })
    return comparison
  } catch (error) {
    console.error('Error creating quick comparison:', error)
    throw error
  }
}

/**
 * Get or create a default comparison for the user
 * This ensures there's always a comparison available
 */
export async function getOrCreateDefaultComparison() {
  try {
    const comparisons = await getComparisons()
    
    // If no comparisons exist, create a default one
    if (comparisons.length === 0) {
      const defaultComparison = await createComparison({
        name: 'My Project Comparison',
        description: 'Default comparison for evaluating projects'
      })
      return defaultComparison
    }
    
    // Return the first comparison (or you could implement logic to find the most recent)
    return comparisons[0]
  } catch (error) {
    console.error('Error getting or creating default comparison:', error)
    throw error
  }
}
