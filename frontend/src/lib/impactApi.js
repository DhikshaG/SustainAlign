// Hardcoded backend URL for Render deployment
const API_BASE_URL = 'https://sustainalign-backend.onrender.com/api'

// Impact Analytics API Client
export const impactApi = {
  // Core Impact Data
  async getImpactSnapshot() {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/snapshot`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching impact snapshot:', error)
      // Return mock data for development
      return [
        { label: 'CO₂ Reduced (tons)', value: 1250 },
        { label: 'Trees Planted', value: 8500 },
        { label: 'People Reached', value: 15000 },
        { label: 'Investment Leveraged', value: 2500000 },
        { label: 'Waste Reduced (tons)', value: 450 },
        { label: 'Energy Saved (kWh)', value: 35000 },
        { label: 'Jobs Created', value: 85 },
        { label: 'Communities Impacted', value: 25 }
      ]
    }
  },

  async getImpactTimeSeries(metric, filters = {}) {
    try {
      const params = new URLSearchParams({ metric, ...filters })
      const response = await fetch(`${API_BASE_URL}/impact/timeseries?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching time series for ${metric}:`, error)
      // Return mock time series data
      return this.generateMockTimeSeries(metric)
    }
  },

  async getImpactRegionStats(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/impact/regions?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching region stats:', error)
      // Return mock regional data
      return this.generateMockRegionData()
    }
  },

  async getImpactGoals(filters = {}) {
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`${API_BASE_URL}/impact/goals?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching impact goals:', error)
      // Return mock goals data
      return this.generateMockGoalsData()
    }
  },

  // Advanced Analytics Endpoints
  async getStatisticalAnalysis(metric) {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/statistics?metric=${metric}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching statistical analysis:', error)
      return null
    }
  },

  async getTrendAnalysis(metric) {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/trends?metric=${metric}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching trend analysis:', error)
      return null
    }
  },

  async getAnomalyDetection(metric) {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/anomalies?metric=${metric}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching anomaly detection:', error)
      return []
    }
  },

  async getPredictiveModeling(metric, periods = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/predictions?metric=${metric}&periods=${periods}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching predictive modeling:', error)
      return null
    }
  },

  async getRiskAssessment() {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/risk`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching risk assessment:', error)
      return null
    }
  },

  async getBenchmarkAnalysis() {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/benchmarks`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching benchmark analysis:', error)
      return null
    }
  },

  async getGeographicClustering() {
    try {
      const response = await fetch(`${API_BASE_URL}/impact/analytics/geographic`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error('Error fetching geographic clustering:', error)
      return null
    }
  },

  // Mock Data Generators for Development
  generateMockTimeSeries(metric) {
    const months = 12
    const baseValues = {
      'co2_reduced_tons': { base: 100, trend: 15, volatility: 0.2 },
      'trees_planted': { base: 800, trend: 50, volatility: 0.15 },
      'people_reached': { base: 1200, trend: 100, volatility: 0.25 },
      'investment_leveraged': { base: 200000, trend: 25000, volatility: 0.3 }
    }

    const config = baseValues[metric] || { base: 100, trend: 10, volatility: 0.2 }
    const data = []

    for (let i = 0; i < months; i++) {
      const trendComponent = config.base + (config.trend * i)
      const randomComponent = (Math.random() - 0.5) * config.volatility * trendComponent
      const value = Math.max(0, trendComponent + randomComponent)
      
      data.push({
        period: i + 1,
        value: Math.round(value),
        date: new Date(2024, i, 1).toISOString().split('T')[0]
      })
    }

    return data
  },

  generateMockRegionData() {
    const regions = [
      { name: 'North America', population: 580000000, projects: 45 },
      { name: 'Europe', population: 750000000, projects: 38 },
      { name: 'Asia Pacific', population: 4600000000, projects: 67 },
      { name: 'Latin America', population: 650000000, projects: 29 },
      { name: 'Africa', population: 1300000000, projects: 34 },
      { name: 'Middle East', population: 450000000, projects: 18 }
    ]

    return regions.map(region => ({
      ...region,
      impact_score: Math.floor(Math.random() * 1000) + 200,
      project_count: region.projects
    }))
  },

  generateMockGoalsData() {
    return [
      {
        id: 1,
        title: 'Carbon Neutrality',
        target: 2000,
        current: 1250,
        unit: 'tons CO₂',
        deadline: '2024-12-31',
        progress: 62.5
      },
      {
        id: 2,
        title: 'Tree Planting Initiative',
        target: 10000,
        current: 8500,
        unit: 'trees',
        deadline: '2024-12-31',
        progress: 85
      },
      {
        id: 3,
        title: 'Community Impact',
        target: 20000,
        current: 15000,
        unit: 'people',
        deadline: '2024-12-31',
        progress: 75
      },
      {
        id: 4,
        title: 'Investment Mobilization',
        target: 5000000,
        current: 2500000,
        unit: 'USD',
        deadline: '2024-12-31',
        progress: 50
      }
    ]
  }
}

// Export individual functions for backward compatibility
export const getImpactSnapshot = () => impactApi.getImpactSnapshot()
export const getImpactTimeSeries = (metric, filters) => impactApi.getImpactTimeSeries(metric, filters)
export const getImpactRegionStats = (filters) => impactApi.getImpactRegionStats(filters)
export const getImpactGoals = (filters) => impactApi.getImpactGoals(filters)

// Export advanced analytics functions
export const getStatisticalAnalysis = (metric) => impactApi.getStatisticalAnalysis(metric)
export const getTrendAnalysis = (metric) => impactApi.getTrendAnalysis(metric)
export const getAnomalyDetection = (metric) => impactApi.getAnomalyDetection(metric)
export const getPredictiveModeling = (metric, periods) => impactApi.getPredictiveModeling(metric, periods)
export const getRiskAssessment = () => impactApi.getRiskAssessment()
export const getBenchmarkAnalysis = () => impactApi.getBenchmarkAnalysis()
export const getGeographicClustering = () => impactApi.getGeographicClustering()
