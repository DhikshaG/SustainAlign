import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ProgressBar } from '../corporate/ProgressBar'
import { CORPORATE_ROUTES } from '../../lib/routes'

export function NgoRecommendationCards({ recommendations = [] }) {
  if (!recommendations.length) return null

  return (
    <div className="mt-3 space-y-2 w-full max-w-md">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Recommended NGOs</p>
      {recommendations.slice(0, 4).map((ngo) => (
        <Card key={ngo.slug} className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                to={CORPORATE_ROUTES.ngoProfile(ngo.slug)}
                className="font-medium text-slate-900 hover:text-primary-600 text-sm"
              >
                {ngo.name}
              </Link>
              {ngo.region && (
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {ngo.region}
                </p>
              )}
            </div>
            {ngo.verified && <Badge variant="verified">Verified</Badge>}
          </div>
          {ngo.matchPercent != null && (
            <div className="mt-2">
              <ProgressBar value={ngo.matchPercent} label={`${ngo.matchPercent}% match`} />
            </div>
          )}
          {ngo.reasons?.[0] && (
            <p className="text-xs text-slate-600 mt-2 line-clamp-2">{ngo.reasons[0]}</p>
          )}
          <Button as={Link} to={CORPORATE_ROUTES.ngoProfile(ngo.slug)} variant="secondary" size="sm" className="mt-2 w-full">
            View profile
          </Button>
        </Card>
      ))}
    </div>
  )
}
