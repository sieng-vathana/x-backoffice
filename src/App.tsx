import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { StoresPage } from './pages/StoresPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { BrandsPage } from './pages/BrandsPage'
import { SignInPage } from './pages/SignInPage'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-slate-400">
          <i className="ri-loader-4-line text-4xl animate-spin text-indigo-500 inline-block mb-3" />
          <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            Checking Administrator Access...
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />
  }

  return <>{children}</>
}

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
export default App
