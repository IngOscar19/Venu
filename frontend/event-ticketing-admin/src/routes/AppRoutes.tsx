import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Loader2 } from 'lucide-react'

// Lazy loaded page components
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const EventListPage = lazy(() => import('@/pages/EventListPage'))
const EventWizardPage = lazy(() => import('@/pages/EventWizardPage'))
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage'))
const AdminOrganizersPage = lazy(() => import('@/features/admin/pages/AdminOrganizersPage'))
const VerificationRequestPage = lazy(() => import('@/features/organizer/pages/VerificationRequestPage'))
const AdminVerificationsPage = lazy(() => import('@/features/admin/pages/AdminVerificationsPage'))

function PageLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#FB4F14]" />
        <p className="text-xs font-semibold text-slate-500">Cargando módulo...</p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/events/new" element={<EventWizardPage />} />
            <Route path="/events/:id/edit" element={<EventWizardPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/verification" element={<VerificationRequestPage />} />
            <Route path="/admin/organizers" element={<AdminOrganizersPage />} />
            <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
