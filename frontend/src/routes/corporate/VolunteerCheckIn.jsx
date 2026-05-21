import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { PageHeader } from '../../components/corporate/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { CORPORATE_ROUTES } from '../../lib/routes'
import { checkInWithToken } from '../../lib/volunteers'

export default function VolunteerCheckIn() {
  const { token } = useParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let active = true
    checkInWithToken(token)
      .then((data) => { if (active) { setResult(data); setError(null) } })
      .catch((err) => { if (active) setError(err.message || 'Check-in failed') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  return (
    <>
      <PageHeader
        title="Volunteer Check-in"
        description="Confirm your attendance for today's volunteer event."
      />

      <Card className="max-w-md mx-auto text-center py-8">
        {loading && <p className="text-slate-500">Checking you in…</p>}
        {error && <Alert variant="error">{error}</Alert>}
        {result && (
          <>
            <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {result.alreadyCheckedIn ? 'Already checked in' : 'Check-in successful'}
            </h2>
            <p className="text-slate-600 mb-4">{result.eventTitle}</p>
            {result.checkInAt && (
              <p className="text-sm text-slate-500">Time: {new Date(result.checkInAt).toLocaleString()}</p>
            )}
          </>
        )}
        <Button as={Link} to={CORPORATE_ROUTES.volunteers} variant="secondary" className="mt-6">
          Back to Volunteers
        </Button>
      </Card>
    </>
  )
}
