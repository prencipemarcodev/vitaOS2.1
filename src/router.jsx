import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Skeleton from '@/components/ui/Skeleton'

// Lazy load all pages for code splitting
const Overview     = lazy(() => import('@/pages/Overview'))
const Calendario   = lazy(() => import('@/pages/Calendario'))
const Firme        = lazy(() => import('@/pages/Firme'))
const Finanze      = lazy(() => import('@/pages/Finanze'))
const Risparmi     = lazy(() => import('@/pages/Risparmi'))
const Salute       = lazy(() => import('@/pages/Salute'))
const Note         = lazy(() => import('@/pages/Note'))
const Impostazioni = lazy(() => import('@/pages/Impostazioni'))

function PageFallback() {
  return (
    <div className="flex-1 p-4 space-y-3">
      <Skeleton height="2rem" width="40%" />
      <Skeleton height="8rem" />
      <Skeleton height="12rem" />
    </div>
  )
}

function AppRouter() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/"             element={<Overview />} />
        <Route path="/calendario"   element={<Calendario />} />
        <Route path="/firme"        element={<Firme />} />
        <Route path="/finanze"      element={<Finanze />} />
        <Route path="/risparmi"     element={<Risparmi />} />
        <Route path="/salute/*"     element={<Salute />} />
        <Route path="/note"         element={<Note />} />
        <Route path="/impostazioni" element={<Impostazioni />} />
        <Route path="*"             element={<Overview />} />
      </Routes>
    </Suspense>
  )
}

export default AppRouter
