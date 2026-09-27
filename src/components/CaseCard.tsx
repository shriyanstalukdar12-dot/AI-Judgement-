import { Link } from 'react-router-dom'
import { Scale, Users, MessageSquare, ChevronRight } from 'lucide-react'
import type { Case } from '../lib/supabase'
import CategoryBadge from './CategoryBadge'

const categoryColors: Record<string, string> = {
  Relationship: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Workplace: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Money: 'bg-green-500/10 text-green-400 border-green-500/20',
  Family: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Neighbor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Property: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Friendship: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Other: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
}

export default function CaseCard({ caseData }: { caseData: Case }) {
  const totalVotes = caseData.plaintiff_votes + caseData.defendant_votes

  return (
    <Link
      to={`/case/${caseData.id}`}
      className="card p-5 hover:border-neutral-700 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group block"
    >
      <div className="flex items-center justify-between mb-3">
        <CategoryBadge category={caseData.category} />
        {caseData.status === 'judged' ? (
          <span className="badge bg-success-500/10 text-success-400 border border-success-500/20">
            <Scale className="w-3 h-3" />
            Judged
          </span>
        ) : (
          <span className="badge bg-warning-500/10 text-warning-400 border border-warning-500/20">
            Pending
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
        {caseData.title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
        <span className="font-medium text-neutral-300">{caseData.plaintiff}</span>
        <span className="text-neutral-600">vs.</span>
        <span className="font-medium text-neutral-300">{caseData.defendant}</span>
      </div>

      <p className="text-sm text-neutral-500 line-clamp-2 mb-4">
        {caseData.plaintiff_argument}
      </p>

      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {totalVotes} votes
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {caseData.category}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  )
}
