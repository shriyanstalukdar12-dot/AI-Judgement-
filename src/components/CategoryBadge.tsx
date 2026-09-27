const categoryColors: Record<string, string> = {
  Relationship: 'bg-rose-50 text-rose-600 border-rose-200',
  Workplace: 'bg-blue-50 text-blue-600 border-blue-200',
  Money: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  Family: 'bg-amber-50 text-amber-600 border-amber-200',
  Neighbor: 'bg-violet-50 text-violet-600 border-violet-200',
  Property: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  Friendship: 'bg-orange-50 text-orange-600 border-orange-200',
  Other: 'bg-stone-100 text-stone-600 border-stone-200',
}

export default function CategoryBadge({ category }: { category: string }) {
  const colorClass = categoryColors[category] || categoryColors.Other
  return (
    <span className={`badge border ${colorClass}`}>
      {category}
    </span>
  )
}
