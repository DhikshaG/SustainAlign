import {
  LayoutDashboard,
  UserCircle,
  FolderKanban,
  Wallet,
  Users,
} from 'lucide-react'
import { NGO_ROUTES } from '../../lib/routes'

export const ngoNavSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: NGO_ROUTES.home, icon: LayoutDashboard, roles: ['ngo_admin'] },
    ],
  },
  {
    label: 'Projects',
    items: [
      { label: 'Project Management', href: NGO_ROUTES.projects, icon: FolderKanban, roles: ['ngo_admin'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Financial Reporting', href: NGO_ROUTES.finance, icon: Wallet, roles: ['ngo_admin'] },
    ],
  },
  {
    label: 'Impact',
    items: [
      { label: 'Profile', href: NGO_ROUTES.profile, icon: UserCircle, roles: ['ngo_admin'] },
      { label: 'Beneficiaries', href: NGO_ROUTES.beneficiaries, icon: Users, roles: ['ngo_admin'] },
    ],
  },
]
