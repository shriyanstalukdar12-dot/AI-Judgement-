import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Trash2, Loader2, Search, AlertTriangle } from 'lucide-react'
import { supabase, type Case } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import CategoryBadge from '../components/CategoryBadge'

export default function Moderate() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (loading && profile && !profile.is_supervisor) {
      navigate('/')
      return
    }
    loadCases()
  }, [profile])

  async function loadCases() {
    setLoading(true)
    const { data } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    setCases((data as Case[]) || [])
    setLoading(false)
  }

  async function handleDelete(caseId: string) {
    setDeletingId(caseId)
    const { error } = await supabase.from('cases').delete().eq('id', caseId)
    if (!error) {
      setCases((prev) => prev.filter((c) => c.id !== caseId))
    }
    setDeletingId(null)
  }

  if (!loading && profile && !profile.is_supervisor) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Shield className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500 mb-4">Supervisor access required.</p>
      </div>
    )
  }

  const filtered = search.trim()
    ? cases.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.plaintiff.toLowerCase().includes(search.toLowerCase()) ||
          c.defendant.toLowerCase().includes(search.toLowerCase())
      )
    : cases

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Moderation Panel
        </h1>
      </div>
      <p className="text-stone-500 mb-6 ml-13">
        Review and remove inappropriate cases. Signed in as {user?.email}
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input
          className="input pl-12"
          placeholder="Search cases by title or parties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500">No cases to moderate.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <CategoryBadge category={c.category} />
                  {c.status === 'judged' ? (
                    <span className="badge bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Judged
                    </span>
                  ) : (
                    <span className="badge bg-amber-50 text-amber-600 border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base font-semibold text-stone-900 mb-1 truncate">
                  {c.title}
                </h3>
                <p className="text-sm text-stone-500 line-clamp-1 mb-1">
                  {c.plaintiff} vs. {c.defendant}
                </p>
                <p className="text-xs text-stone-400">
                  {new Date(c.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {c.plaintiff_votes + c.defendant_votes} votes
                </p>
              </div>

              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="shrink-0 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-95 disabled:opacity-50"
                title="Delete case"
              >
                {deletingId === c.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Deleting a case is permanent — it removes the case and all associated
          votes. Use this to remove inappropriate or abusive posts.
        </p>
      </div>
    </div>
  )
}
