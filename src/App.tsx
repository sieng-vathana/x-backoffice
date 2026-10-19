import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { ApprovalsPage } from './pages/ApprovalsPage'
import { StoresPage } from './pages/StoresPage'
import { MerchantControlPage } from './pages/MerchantControlPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { BrandsPage } from './pages/BrandsPage'
import { AdminOperationsPage } from './pages/AdminOperationsPage'
import { SignInPage } from './pages/SignInPage'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center text-muted">
          <i className="ri-loader-4-line mb-2 inline-block animate-spin text-2xl text-brand" />
          <div className="text-xs font-medium text-zinc-500">
            Authenticating...
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
        <Route path="merchants" element={<MerchantControlPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="operations/:section" element={<AdminOperationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
export default App
