import { Container } from '../../components/ui/Container'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login/corporate')
  }

  return (
    <Container className="py-16">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back{user?.fullName ? `, ${user.fullName}` : ''}</h1>
      <p className="text-slate-600 mb-6">
        Signed in as <strong>{user?.email}</strong> · {user?.role} · {user?.tenantName}
      </p>
      <p className="text-sm text-slate-500 mb-8">
        App modules (Discovery, Alignment, Reporting) will be built in the next phase. You are authenticated.
      </p>
      <Button variant="secondary" onClick={handleLogout}>Log out</Button>
    </Container>
  )
}
