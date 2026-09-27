import { useState, useEffect } from 'react'
import { Search, Filter, Loader2, Scale } from 'lucide-react'
import { supabase, CATEGORIES, type Case } from '../lib/supabase'
import CaseCard from '../components/CaseCard'

type SortOption = 'recent' | 'contested' | 'judged'

export default function Browse() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortOption>('recent')

  useEffect(() => {
    async function loadCases() {
      setLoading(true)
      let query = supabase.from('cases').select('*')

      if (category !== 'all') {
        query = query.eq('category', category)
      }

      if (sort === 'recent') {
        query = query.order('created_at', { ascending: false })
      } else if (sort === 'contested') {
        query = query.order('plaintiff_votes', { ascending: false })
      } else if (sort === 'judged') {
        query = query.eq('status', 'judged').order('created_at', { ascending: false })
      }

      const { data, error } = await query.limit(50)

      if (!error && data) {
        let filtered = data as Case[]

        if (search.trim()) {
          const q = search.toLowerCase()
          filtered = filtered.filter(
            (c) =>
              c.title.toLowerCase().includes(q) ||
              c.plaintiff.toLowerCase().includes(q) ||
              c.defendant.toLowerCase().includes(q) ||
              c.plaintiff_argument.toLowerCase().includes(q)
          )
        }

        setCases(filtered)
      }
      setLoading(false)
    }
    loadCases()
  }, [category, sort])

  useEffect(() => {
    if (!search.trim()) return
    const q = search.toLowerCase()
    setCases((prev) =>
      prev.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.plaintiff.toLowerCase().includes(q) ||
          c.defendant.toLowerCase().includes(q) ||
          c.plaintiff_argument.toLowerCase().includes(q)
      )
    )
  }, [search])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
          Browse Cases
        </h1>
        <p className="text-neutral-400">
          Explore disputes filed by the community. Read both sides, see the AI
          verdict, and cast your vote.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            className="input pl-12"
            placeholder="Search by title, parties, or arguments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-neutral-500 shrink-0" />
            <button
              onClick={() => setCategory('all')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                category === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm font-medium focus:outline-none focus:border-primary-500 cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="contested">Most Contested</option>
              <option value="judged">Judged Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="card p-5 h-48 animate-pulse bg-neutral-900/50"
            />
          ))}
        </div>
      ) : cases.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c) => (
            <CaseCard key={c.id} caseData={c} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Scale className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400">
            No cases found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  )
}
