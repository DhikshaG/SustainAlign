import {
  LayoutDashboard,
  UserCircle,
  FolderKanban,
  Wallet,
  Users,
} from 'lucide-react'
import { NGO_ROUTES } from '../../lib/routes'
import { PERMISSIONS } from '../../lib/permissions'

export const ngoNavSections = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: NGO_ROUTES.home,
        icon: LayoutDashboard,
        roles: ['ngo_admin'],
        permissions: [PERMISSIONS.PROJECTS_READ],
      },
    ],
  },
  {
    label: 'Projects',
    items: [
      {
        label: 'Project Management',
        href: NGO_ROUTES.projects,
        icon: FolderKanban,
        roles: ['ngo_admin', 'field_officer'],
        permissions: [PERMISSIONS.PROJECTS_READ],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Financial Reporting',
        href: NGO_ROUTES.finance,
        icon: Wallet,
        roles: ['ngo_admin'],
        permissions: [PERMISSIONS.FINANCE_READ],
      },
    ],
  },
  {
    label: 'Impact',
    items: [
      {
        label: 'Profile',
        href: NGO_ROUTES.profile,
        icon: UserCircle,
        roles: ['ngo_admin'],
        permissions: [PERMISSIONS.NGO_PROFILE_WRITE],
      },
      {
        label: 'Beneficiaries',
        href: NGO_ROUTES.beneficiaries,
        icon: Users,
        roles: ['ngo_admin', 'field_officer'],
        permissions: [PERMISSIONS.BENEFICIARIES_MANAGE],
      },
    ],
  },
]
