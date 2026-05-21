import { Link } from 'react-router-dom'
import { Heart, GitCompare, Mail, MapPin } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ProgressBar } from './ProgressBar'
import { riskBand } from '../../lib/matching'
import { CORPORATE_ROUTES } from '../../lib/routes'

export function MatchResultCard({
  match,
  saved,
  inCompare,
  compareFull,
  onSave,
  onCompare,
  onContact,
}) {
  const risk = riskBand(match.riskScore)
  const breakdown = match.scoreBreakdown || {}

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <Link
            to={CORPORATE_ROUTES.ngoProfile(match.slug)}
            className="font-semibold text-slate-900 hover:text-primary-600"
          >
            {match.name}
          </Link>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {match.region}
            {match.verified && (
              <>
                <span className="mx-1">·</span>
                <Badge variant="verified">Verified</Badge>
              </>
            )}
            {match.previouslyPartnered && (
              <>
                <span className="mx-1">·</span>
                <Badge variant="primary">Past partner</Badge>
              </>
            )}
          </p>
        </div>
        <Badge variant="primary" className="shrink-0 text-sm px-2.5 py-1">
          {match.matchPercent}% match
        </Badge>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-3">{match.description}</p>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <ProgressBar value={match.matchPercent} label="Match score" />
        <ProgressBar value={match.credibilityScore} label="Credibility" />
      </div>

      <p className="text-xs text-slate-500 mb-2">
        Risk {match.riskScore}/100 ({risk.label})
      </p>

      <p className="text-xs text-slate-500 mb-3">
        Similarity {breakdown.similarity ?? '—'}
        {' · '}Geo {breakdown.geography ?? '—'}
        {' · '}Budget {breakdown.budget ?? '—'}
        {' · '}Impact {breakdown.pastImpact ?? '—'}
      </p>

      {match.reason && (
        <p className="text-sm text-slate-700 italic mb-4 border-l-2 border-primary-200 pl-3">
          {match.reason}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mb-4">
        {(match.focusAreas || []).slice(0, 3).map((a) => (
          <Badge key={a} variant="default">{a}</Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button as={Link} to={CORPORATE_ROUTES.ngoProfile(match.slug)} variant="secondary" size="sm">
          View profile
        </Button>
        <Button
          variant={saved ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onSave(match.slug)}
        >
          <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />
          {saved ? 'Saved' : 'Save'}
        </Button>
        <Button
          variant={inCompare ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => onCompare(match)}
          disabled={!inCompare && compareFull}
        >
          <GitCompare className="h-3.5 w-3.5" /> Compare
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onContact(match)}>
          <Mail className="h-3.5 w-3.5" /> Contact
        </Button>
      </div>
    </Card>
  )
}
