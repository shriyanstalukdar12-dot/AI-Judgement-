import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Gavel, Scale, Loader2, Check } from 'lucide-react'
import { supabase, CATEGORIES } from '../lib/supabase'

export default function SubmitCase() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    category: 'Relationship' as string,
    plaintiff: '',
    defendant: '',
    plaintiff_argument: '',
    defendant_argument: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.title.trim().length < 5) {
      setError('Title must be at least 5 characters.')
      return
    }
    if (form.plaintiff.trim().length < 2 || form.defendant.trim().length < 2) {
      setError('Please provide names for both parties.')
      return
    }
    if (form.plaintiff_argument.trim().length < 20) {
      setError('Please provide a more detailed argument (at least 20 characters).')
      return
    }

    setSubmitting(true)

    const { data, error: insertError } = await supabase
      .from('cases')
      .insert({
        title: form.title.trim(),
        category: form.category,
        plaintiff: form.plaintiff.trim(),
        defendant: form.defendant.trim(),
        plaintiff_argument: form.plaintiff_argument.trim(),
        defendant_argument: form.defendant_argument.trim() || 'Did not respond.',
        status: 'pending',
      })
      .select()
      .single()

    if (insertError || !data) {
      setError('Failed to submit your case. Please try again.')
      setSubmitting(false)
      return
    }

    // Trigger AI judgment
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/judge`
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ caseId: data.id }),
      })
    } catch {
      // The verdict will be pending; user can check back later
    }

    navigate(`/case/${data.id}`)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 mb-4 shadow-lg shadow-primary-600/20">
          <Gavel className="w-8 h-8 text-white animate-gavel-strike" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mb-2">
          File a New Case
        </h1>
        <p className="text-stone-500">
          Present both sides of the dispute fairly. The AI judge will review and
          deliver a verdict.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
        <div>
          <label className="label">Case Title</label>
          <input
            className="input"
            placeholder="e.g., Who should keep the dog after the breakup?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={120}
          />
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, category: cat })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  form.category === cat
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Party A (Plaintiff)</label>
            <input
              className="input"
              placeholder="e.g., Sarah"
              value={form.plaintiff}
              onChange={(e) => setForm({ ...form, plaintiff: e.target.value })}
              maxLength={50}
            />
          </div>
          <div>
            <label className="label">Party B (Defendant)</label>
            <input
              className="input"
              placeholder="e.g., Mike"
              value={form.defendant}
              onChange={(e) => setForm({ ...form, defendant: e.target.value })}
              maxLength={50}
            />
          </div>
        </div>

        <div>
          <label className="label">
            {form.plaintiff || 'Party A'}'s Argument
          </label>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Present the case from this person's perspective. What happened? What was the wrongdoing?"
            value={form.plaintiff_argument}
            onChange={(e) =>
              setForm({ ...form, plaintiff_argument: e.target.value })
            }
            maxLength={2000}
          />
          <p className="text-xs text-stone-400 mt-1">
            {form.plaintiff_argument.length}/2000
          </p>
        </div>

        <div>
          <label className="label">
            {form.defendant || 'Party B'}'s Argument
          </label>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Present the defense. If unknown, leave blank — it will be marked as 'Did not respond.'"
            value={form.defendant_argument}
            onChange={(e) =>
              setForm({ ...form, defendant_argument: e.target.value })
            }
            maxLength={2000}
          />
          <p className="text-xs text-stone-400 mt-1">
            {form.defendant_argument.length}/2000
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Scale className="w-4 h-4" />
            Both sides will be reviewed impartially
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Filing Case...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                File Case
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
