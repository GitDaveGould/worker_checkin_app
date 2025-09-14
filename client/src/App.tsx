import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { CheckInPage } from './pages/CheckInPage'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { AdminLayout } from './components/admin/AdminLayout'

// LAZY LOAD ALL ADMIN COMPONENTS FOR MAXIMUM PERFORMANCE!!! 🚀
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const WorkersPage = lazy(() => import('./pages/admin/WorkersPage').then(m => ({ default: m.WorkersPage })))
const CheckInsPage = lazy(() => import('./pages/admin/CheckInsPage').then(m => ({ default: m.CheckInsPage })))
const EventsPage = lazy(() => import('./pages/admin/EventsPage').then(m => ({ default: m.EventsPage })))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage').then(m => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then(m => ({ default: m.SettingsPage })))

// LOADING COMPONENT FOR SAVAGE PERFORMANCE!!! ⚡
const AdminLoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
    <span className="text-gray-600">Loading admin interface...</span>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<CheckInPage />} />
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Suspense fallback={<AdminLoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/workers" element={<WorkersPage />} />
                    <Route path="/checkins" element={<CheckInsPage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App