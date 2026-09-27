import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import {
  Scale,
  Gavel,
  Users,
  Loader2,
  ArrowLeft,
  Clock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Check,
} from 'lucide-react'
import { supabase, type Case } from '../lib/supabase'
import CategoryBadge from '../components/CategoryBadge'

function getVoterId(): string {
  let id = localStorage.getItem('ai-judgement-voter-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('ai-judgement-voter-id', id)
  }
  return id
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [userVote, setUserVote] = useState<string | null>(null)
  const [verdictLoading, setVerdictLoading] = useState(false)

  const loadCase = useCallback(async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', id!)
      .maybeSingle()

    if (error || !data) {
      setLoading(false)
      return
    }

    setCaseData(data as Case)

    // Check existing vote
    const voterId = getVoterId()
    const { data: voteData } = await supabase
      .from('votes')
      .select('side')
      .eq('case_id', id!)
      .eq('voter_id', voterId)
      .maybeSingle()

    if (voteData) {
      setUserVote((voteData as { side: string }).side)
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    loadCase()
  }, [loadCase])

  // Poll for verdict if pending
  useEffect(() => {
    if (!caseData || caseData.status === 'judged') return
    setVerdictLoading(true)
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('cases')
        .select('*')
        .eq('id', id!)
        .maybeSingle()
      if (data && (data as Case).status === 'judged') {
        setCaseData(data as Case)
        setVerdictLoading(false)
        clearInterval(interval)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      setVerdictLoading(false)
    }
  }, [caseData, id])

  const handleVote = async (side: 'plaintiff' | 'defendant') => {
    if (!caseData || userVote) return
    setVoting(true)

    const voterId = getVoterId()

    const { error } = await supabase.from('votes').insert({
      case_id: caseData.id,
      side,
      voter_id: voterId,
    })

    if (error) {
      setVoting(false)
      return
    }

    // Update local state
    const updated = {
      ...caseData,
      plaintiff_votes:
        side === 'plaintiff'
          ? caseData.plaintiff_votes + 1
          : caseData.plaintiff_votes,
      defendant_votes:
        side === 'defendant'
          ? caseData.defendant_votes + 1
          : caseData.defendant_votes,
    }
    setCaseData(updated)
    setUserVote(side)
    setVoting(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin mx-auto mb-4" />
        <p className="text-neutral-400">Loading case...</p>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Scale className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
        <p className="text-neutral-400 mb-4">Case not found.</p>
        <Link to="/browse" className="btn-primary">
          Browse Cases
        </Link>
      </div>
    )
  }

  const totalVotes = caseData.plaintiff_votes + caseData.defendant_votes
  const plaintiffPct = totalVotes > 0 ? (caseData.plaintiff_votes / totalVotes) * 100 : 50
  const defendantPct = 100 - plaintiffPct

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CategoryBadge category={caseData.category} />
          {caseData.status === 'judged' ? (
            <span className="badge bg-success-500/10 text-success-400 border border-success-500/20">
              <Scale className="w-3 h-3" />
              Verdict Delivered
            </span>
          ) : (
            <span className="badge bg-warning-500/10 text-warning-400 border border-warning-500/20">
              <Clock className="w-3 h-3" />
              Awaiting Verdict
            </span>
          )}
        </div>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white mb-2">
          {caseData.title}
        </h1>
        <p className="text-sm text-neutral-500">
          Filed {new Date(caseData.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* VS Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Plaintiff */}
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <span className="text-primary-400 font-bold text-sm">A</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-white">
              {caseData.plaintiff}
            </h3>
            <span className="text-xs text-neutral-500 ml-auto">Plaintiff</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
            {caseData.plaintiff_argument}
          </p>
        </div>

        {/* Defendant */}
        <div className="card p-6 border-l-4 border-l-accent-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
              <span className="text-accent-400 font-bold text-sm">B</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-white">
              {caseData.defendant}
            </h3>
            <span className="text-xs text-neutral-500 ml-auto">Defendant</span>
          </div>
          <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
            {caseData.defendant_argument}
          </p>
        </div>
      </div>

      {/* Verdict */}
      {caseData.status === 'judged' && caseData.verdict ? (
        <div className="card p-6 sm:p-8 mb-6 bg-gradient-to-b from-neutral-900 to-neutral-900/50 animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-white">
                The Verdict
              </h2>
              <p className="text-sm text-neutral-500">Delivered by AI Judge</p>
            </div>
          </div>

          <div className="mb-4">
            <span className="text-sm text-neutral-500">Ruling in favor of</span>
            <div className="mt-1">
              <span
                className={`text-2xl font-serif font-bold ${
                  caseData.verdict_winner === 'plaintiff'
                    ? 'text-primary-400'
                    : caseData.verdict_winner === 'defendant'
                    ? 'text-accent-400'
                    : 'text-neutral-300'
                }`}
              >
                {caseData.verdict_winner === 'plaintiff'
                  ? caseData.plaintiff
                  : caseData.verdict_winner === 'defendant'
                  ? caseData.defendant
                  : 'Split Decision'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-1">
                Verdict
              </h4>
              <p className="text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {caseData.verdict}
              </p>
            </div>
            {caseData.verdict_reasoning && (
              <div>
                <h4 className="text-sm font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                  Reasoning
                </h4>
                <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {caseData.verdict_reasoning}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card p-8 mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-warning-500/10 border border-warning-500/20 mb-4">
            {verdictLoading ? (
              <Loader2 className="w-7 h-7 text-warning-400 animate-spin" />
            ) : (
              <Clock className="w-7 h-7 text-warning-400" />
            )}
          </div>
          <h3 className="font-serif text-lg font-semibold text-white mb-1">
            {verdictLoading ? 'AI Judge is deliberating...' : 'Awaiting Verdict'}
          </h3>
          <p className="text-sm text-neutral-500">
            The AI judge is reviewing both sides of the case. Check back shortly.
          </p>
        </div>
      )}

      {/* Community Vote */}
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary-400" />
          <h2 className="font-serif text-xl font-bold text-white">
            Community Vote
          </h2>
        </div>

        {userVote ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success-500/10 border border-success-500/20 text-success-400 text-sm font-medium mb-4">
              <Check className="w-4 h-4" />
              You voted for{' '}
              {userVote === 'plaintiff'
                ? caseData.plaintiff
                : caseData.defendant}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => handleVote('plaintiff')}
              disabled={voting}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-500/5 border border-primary-500/20 hover:bg-primary-500/10 hover:border-primary-500/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <ThumbsUp className="w-6 h-6 text-primary-400" />
              <span className="font-medium text-white text-sm">
                {caseData.plaintiff}
              </span>
              <span className="text-xs text-neutral-500">Vote for A</span>
            </button>
            <button
              onClick={() => handleVote('defendant')}
              disabled={voting}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-accent-500/5 border border-accent-500/20 hover:bg-accent-500/10 hover:border-accent-500/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <ThumbsDown className="w-6 h-6 text-accent-400" />
              <span className="font-medium text-white text-sm">
                {caseData.defendant}
              </span>
              <span className="text-xs text-neutral-500">Vote for B</span>
            </button>
          </div>
        )}

        {/* Vote Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary-400 font-medium">
              {caseData.plaintiff}: {caseData.plaintiff_votes}
            </span>
            <span className="text-neutral-500">{totalVotes} total votes</span>
            <span className="text-accent-400 font-medium">
              {caseData.defendant}: {caseData.defendant_votes}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-neutral-800 flex">
            <div
              className="bg-primary-500 transition-all duration-500"
              style={{ width: `${plaintiffPct}%` }}
            />
            <div
              className="bg-accent-500 transition-all duration-500"
              style={{ width: `${defendantPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{plaintiffPct.toFixed(0)}%</span>
            <span>{defendantPct.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
