import { Scale, Heart, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-stone-200/60 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-stone-500 text-sm">
            <Scale className="w-4 h-4" />
            <span>AI Judgement — Digital Courtroom</span>
          </div>
          <div className="flex items-center gap-1 text-stone-500 text-sm">
            <span>Justice, served with code</span>
            <Heart className="w-4 h-4 text-error-500 mx-1" />
            <Github className="w-4 h-4" />
          </div>
        </div>
      </div>
    </footer>
  )
}
