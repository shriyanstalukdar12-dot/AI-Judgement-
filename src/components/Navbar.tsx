import { Link, useLocation } from 'react-router-dom'
import { Scale, Menu, X, Gavel } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/browse', label: 'Browse Cases' },
    { to: '/submit', label: 'Submit Case' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-800 safe-top">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center transition-transform group-hover:scale-105">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold text-white">AI Judgement</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-white bg-neutral-800'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/submit" className="btn-primary ml-2">
            <Gavel className="w-4 h-4" />
            New Case
          </Link>
        </div>

        <button
          className="md:hidden p-2 rounded-lg text-neutral-300 hover:bg-neutral-800"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-950 px-4 py-3 space-y-1 animate-slide-up">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-white bg-neutral-800'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
