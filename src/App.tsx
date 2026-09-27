import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Browse from './pages/Browse'
import SubmitCase from './pages/SubmitCase'
import CaseDetail from './pages/CaseDetail'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/submit" element={<SubmitCase />} />
          <Route path="/case/:id" element={<CaseDetail />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
