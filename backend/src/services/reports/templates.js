export const TYPE_TITLES = {
  executive: 'Executive CSR Summary',
  impact_stories: 'CSR Impact Stories',
  quarterly: 'Quarterly CSR Report',
  board: 'Board CSR Presentation',
  sdg: 'SDG Impact Summary',
  impact: 'Impact Report',
  mca_csr2: 'MCA CSR-2 Preview',
}

export const SECTION_ORDER = {
  executive: ['executive_summary', 'impact_highlights', 'budget_snapshot', 'sdg_overview'],
  impact_stories: ['impact_stories', 'project_vignettes', 'ngo_stories'],
  quarterly: ['executive_summary', 'impact_summary', 'compliance', 'sdg_mapping', 'kpi_table', 'updates_timeline', 'ngo_performance', 'projects'],
  board: ['executive_summary', 'key_metrics', 'ngo_performance', 'compliance', 'projects'],
  sdg: ['impact_summary', 'sdg_mapping', 'projects'],
  impact: ['impact_summary', 'projects'],
  mca_csr2: ['impact_summary', 'compliance', 'schedule_vii', 'spend_breakdown', 'projects'],
}

export const FORMAT_MIME = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export const FORMAT_EXT = {
  pdf: 'pdf',
  docx: 'docx',
  pptx: 'pptx',
}
