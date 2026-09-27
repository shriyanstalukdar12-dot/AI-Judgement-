import { Routes, Route, Navigate } from 'react-router-dom'
import { Scale, Loader2 } from 'lucide-react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import SubmitCase from './pages/SubmitCase'
import CaseDetail from './pages/CaseDetail'
import Auth from './pages/Auth'
import Moderate from './pages/Moderate'
import { AuthProvider, useAuth } from './lib/auth'

function ProtectedApp() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 mb-4 shadow-lg shadow-primary-600/20">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center gap-2 text-stone-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading...
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col bg-stone-100">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/submit" element={<SubmitCase />} />
          <Route path="/case/:id" element={<CaseDetail />} />
          <Route path="/moderate" element={<Moderate />} />
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  )
}
