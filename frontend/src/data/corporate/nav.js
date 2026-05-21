import {
  LayoutDashboard,
  Search,
  FolderKanban,
  ShieldCheck,
  BarChart3,
  Bot,
  Wallet,
  Users,
  FileText,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { PERMISSIONS } from '../../lib/permissions'

export const corporateNavSections = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: CORPORATE_ROUTES.home,
        icon: LayoutDashboard,
        roles: ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance', 'volunteer', 'board'],
      },
    ],
  },
  {
    label: 'NGOs & Projects',
    items: [
      {
        label: 'NGO Discovery',
        href: CORPORATE_ROUTES.discovery,
        icon: Search,
        roles: ['super_admin', 'csr_head', 'esg_head'],
      },
      {
        label: 'CSR Projects',
        href: CORPORATE_ROUTES.projects,
        icon: FolderKanban,
        roles: ['super_admin', 'csr_head', 'esg_head', 'finance'],
      },
    ],
  },
  {
    label: 'Compliance & Finance',
    items: [
      {
        label: 'Compliance',
        href: CORPORATE_ROUTES.compliance,
        icon: ShieldCheck,
        roles: ['super_admin', 'csr_head', 'finance', 'compliance', 'board'],
        permissions: [PERMISSIONS.COMPLIANCE_READ],
      },
      {
        label: 'Reporting',
        href: CORPORATE_ROUTES.reporting,
        icon: BarChart3,
        roles: ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance', 'board'],
      },
      {
        label: 'Fund Allocation',
        href: CORPORATE_ROUTES.funds,
        icon: Wallet,
        roles: ['super_admin', 'csr_head', 'finance'],
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'AI Copilot',
        href: CORPORATE_ROUTES.copilot,
        icon: Bot,
        roles: ['super_admin', 'csr_head', 'esg_head'],
      },
      {
        label: 'Volunteers',
        href: CORPORATE_ROUTES.volunteers,
        icon: Users,
        roles: ['super_admin', 'csr_head', 'volunteer'],
      },
      {
        label: 'Documents',
        href: CORPORATE_ROUTES.documents,
        icon: FileText,
        roles: ['super_admin', 'csr_head', 'finance', 'compliance'],
      },
      {
        label: 'Communications',
        href: CORPORATE_ROUTES.communications,
        icon: MessageSquare,
        roles: ['super_admin', 'csr_head', 'esg_head', 'finance', 'compliance'],
      },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        label: 'Settings',
        href: CORPORATE_ROUTES.settings,
        icon: Settings,
        roles: ['super_admin', 'csr_head'],
      },
    ],
  },
]
