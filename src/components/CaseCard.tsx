import { Link } from 'react-router-dom'
import { Scale, Users, MessageSquare, ChevronRight } from 'lucide-react'
import type { Case } from '../lib/supabase'
import CategoryBadge from './CategoryBadge'

export default function CaseCard({ caseData }: { caseData: Case }) {
  const totalVotes = caseData.plaintiff_votes + caseData.defendant_votes

  return (
    <Link
      to={`/case/${caseData.id}`}
      className="card p-5 hover:border-stone-300 hover:shadow-md hover:shadow-stone-200/60 transition-all duration-200 group block"
    >
      <div className="flex items-center justify-between mb-3">
        <CategoryBadge category={caseData.category} />
        {caseData.status === 'judged' ? (
          <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200">
            <Scale className="w-3 h-3" />
            Judged
          </span>
        ) : (
          <span className="badge bg-amber-50 text-amber-600 border border-amber-200">
            Pending
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
        {caseData.title}
      </h3>

      <div className="flex items-center gap-2 text-sm text-stone-500 mb-3">
        <span className="font-medium text-stone-700">{caseData.plaintiff}</span>
        <span className="text-stone-400">vs.</span>
        <span className="font-medium text-stone-700">{caseData.defendant}</span>
      </div>

      <p className="text-sm text-stone-500 line-clamp-2 mb-4">
        {caseData.plaintiff_argument}
      </p>

      <div className="flex items-center justify-between text-xs text-stone-400">
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
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-stone-400" />
      </div>
    </Link>
  )
}
