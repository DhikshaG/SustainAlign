import { Link, Outlet } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { Container } from '../ui/Container'
import { ROUTES } from '../../lib/routes'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
        <Link to={ROUTES.home} className="flex items-center gap-2 font-bold text-white text-xl">
          <Leaf className="h-7 w-7" />
          SustainAlign
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Drive measurable CSR impact
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Connect with verified NGOs, automate compliance, and report outcomes that matter.
          </p>
        </div>
        <p className="text-primary-200 text-sm">
          Trusted by leading corporates across India
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <Container size="narrow" className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <Link to={ROUTES.home} className="inline-flex items-center gap-2 font-bold text-slate-900 text-xl">
              <Leaf className="h-6 w-6 text-primary-600" />
              SustainAlign
            </Link>
          </div>
          <Outlet />
        </Container>
      </div>
    </div>
  )
}
