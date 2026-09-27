import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Gavel, Users, Sparkles, ArrowRight, TrendingUp, Clock } from 'lucide-react'
import { supabase, type Case } from '../lib/supabase'
import CaseCard from '../components/CaseCard'

export default function Home() {
  const [featuredCases, setFeaturedCases] = useState<Case[]>([])
  const [recentCases, setRecentCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, judged: 0, votes: 0 })

  useEffect(() => {
    async function loadData() {
      const [featured, recent, countRes, judgedRes, votesRes] = await Promise.all([
        supabase
          .from('cases')
          .select('*')
          .eq('status', 'judged')
          .order('plaintiff_votes', { ascending: false })
          .limit(3),
        supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('cases').select('*', { count: 'exact', head: true }),
        supabase.from('cases').select('*', { count: 'exact', head: true }).eq('status', 'judged'),
        supabase.from('votes').select('*', { count: 'exact', head: true }),
      ])

      setFeaturedCases((featured.data as Case[]) || [])
      setRecentCases((recent.data as Case[]) || [])
      setStats({
        total: countRes.count || 0,
        judged: judgedRes.count || 0,
        votes: votesRes.count || 0,
      })
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-sm font-medium mb-6 animate-slide-up">
              <Sparkles className="w-4 h-4" />
              AI-Powered Justice for Everyday Disputes
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-bold text-stone-900 mb-6 leading-tight animate-slide-up">
              Let the <span className="text-primary-600">AI Judge</span> settle
              your dispute
            </h1>

            <p className="text-lg text-stone-500 mb-8 max-w-2xl mx-auto animate-slide-up">
              Submit your case, hear from both sides, and get an impartial
              AI-generated verdict. Then let the community weigh in with their
              own votes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up">
              <Link to="/submit" className="btn-primary w-full sm:w-auto">
                <Gavel className="w-5 h-5" />
                Submit Your Case
              </Link>
              <Link to="/browse" className="btn-secondary w-full sm:w-auto">
                Browse Cases
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-16 max-w-2xl mx-auto">
            {[
              { icon: Scale, label: 'Cases Filed', value: stats.total },
              { icon: Gavel, label: 'Verdicts Delivered', value: stats.judged },
              { icon: Users, label: 'Community Votes', value: stats.votes },
            ].map((stat) => (
              <div key={stat.label} className="card p-4 sm:p-5 text-center">
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-stone-900">
                  {loading ? '—' : stat.value}
                </div>
                <div className="text-xs sm:text-sm text-stone-500 mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cases */}
      {featuredCases.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Most Contested Cases
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCases.map((c) => (
              <CaseCard key={c.id} caseData={c} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Cases */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" />
            <h2 className="font-serif text-2xl font-semibold text-stone-900">
              Recent Cases
            </h2>
          </div>
          <Link
            to="/browse"
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="card p-5 h-48 animate-pulse bg-stone-200/40"
              />
            ))}
          </div>
        ) : recentCases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCases.map((c) => (
              <CaseCard key={c.id} caseData={c} />
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Scale className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500 mb-4">No cases have been filed yet.</p>
            <Link to="/submit" className="btn-primary">
              <Gavel className="w-4 h-4" />
              Be the first to file a case
            </Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              num: '1',
              icon: Gavel,
              title: 'Submit Your Case',
              desc: 'Present both sides of the dispute. Who wronged whom, and what happened?',
            },
            {
              num: '2',
              icon: Scale,
              title: 'AI Delivers a Verdict',
              desc: 'Our AI judge reviews the arguments and delivers an impartial verdict with reasoning.',
            },
            {
              num: '3',
              icon: Users,
              title: 'Community Votes',
              desc: 'Read the case and cast your vote. See if the community agrees with the AI.',
            },
          ].map((step) => (
            <div key={step.num} className="card p-6 relative overflow-hidden">
              <div className="absolute -top-2 -right-2 text-6xl font-serif font-bold text-stone-100 select-none">
                {step.num}
              </div>
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-stone-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
