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

export default function CategoryBadge({ category }: { category: string }) {
  const colorClass = categoryColors[category] || categoryColors.Other
  return (
    <span className={`badge border ${colorClass}`}>
      {category}
    </span>
  )
}
