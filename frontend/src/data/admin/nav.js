import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  AlertTriangle,
  BarChart3,
  Headphones,
  FileCheck,
  Bot,
  Flag,
} from 'lucide-react'
import { ADMIN_ROUTES } from '../../lib/routes'

export const adminNavSections = [
  {
    label: 'Platform',
    items: [
      { label: 'Overview', href: ADMIN_ROUTES.home, icon: LayoutDashboard, roles: ['platform_super_admin'] },
      { label: 'Analytics', href: ADMIN_ROUTES.analytics, icon: BarChart3, roles: ['platform_super_admin'] },
    ],
  },
  {
    label: 'Users & Trust',
    items: [
      { label: 'User Management', href: ADMIN_ROUTES.users, icon: Users, roles: ['platform_super_admin'] },
      { label: 'NGO Verification', href: ADMIN_ROUTES.ngoVerification, icon: ShieldCheck, roles: ['platform_super_admin'] },
      { label: 'Fraud Monitoring', href: ADMIN_ROUTES.fraud, icon: AlertTriangle, roles: ['platform_super_admin'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Support Tickets', href: ADMIN_ROUTES.support, icon: Headphones, roles: ['platform_super_admin'] },
      { label: 'Compliance', href: ADMIN_ROUTES.compliance, icon: FileCheck, roles: ['platform_super_admin'] },
      { label: 'AI Monitoring', href: ADMIN_ROUTES.aiMonitoring, icon: Bot, roles: ['platform_super_admin'] },
      { label: 'Content Moderation', href: ADMIN_ROUTES.content, icon: Flag, roles: ['platform_super_admin'] },
    ],
  },
]
