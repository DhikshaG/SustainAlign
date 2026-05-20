import {
  Shield, BarChart3, Wallet, Bot, MessageSquare,
  FileCheck, Heart, Leaf, Settings, Search, FolderKanban,
} from 'lucide-react'

export const platformModules = [
  {
    id: 'auth',
    icon: Shield,
    title: 'Authentication & RBAC',
    description: 'Enterprise-grade login with role-based permissions for corporates, NGOs, and platform admins.',
  },
  {
    id: 'marketplace',
    icon: Search,
    title: 'NGO Marketplace',
    description: 'Discover and match with verified NGOs aligned to your CSR focus areas and budget.',
  },
  {
    id: 'projects',
    icon: FolderKanban,
    title: 'CSR Project Management',
    description: 'Manage the full project lifecycle from proposal to approval, execution, and closure.',
  },
  {
    id: 'compliance',
    icon: FileCheck,
    title: 'Compliance Engine',
    description: 'Automate Section 135 compliance tracking, reporting deadlines, and audit readiness.',
  },
  {
    id: 'reporting',
    icon: BarChart3,
    title: 'Reporting & Analytics',
    description: 'Real-time dashboards and exportable reports for board reviews and stakeholder communication.',
  },
  {
    id: 'funds',
    icon: Wallet,
    title: 'Fund Management',
    description: 'Track CSR budget allocation, disbursements, utilization, and fund-to-impact mapping.',
  },
  {
    id: 'ai',
    icon: Bot,
    title: 'AI Copilot',
    description: 'AI-powered matching, evaluation, decision support, and narrative report generation.',
  },
  {
    id: 'communication',
    icon: MessageSquare,
    title: 'Communication System',
    description: 'In-platform messaging, workflow notifications, and approval chains.',
  },
  {
    id: 'audit',
    icon: FileCheck,
    title: 'Audit & Documentation',
    description: 'Immutable evidence storage for compliance audits and impact verification.',
  },
  {
    id: 'volunteer',
    icon: Heart,
    title: 'Volunteer Management',
    description: 'Employee volunteering programs with registration, tracking, and hour logging.',
  },
  {
    id: 'esg',
    icon: Leaf,
    title: 'ESG Integration',
    description: 'Sustainability reporting aligned with GRI, BRSR, and other ESG frameworks.',
  },
  {
    id: 'admin',
    icon: Settings,
    title: 'Admin Panel',
    description: 'Platform operations for NGO verification, compliance review, and user support.',
  },
]

export const homeFeatures = platformModules.slice(0, 6)
