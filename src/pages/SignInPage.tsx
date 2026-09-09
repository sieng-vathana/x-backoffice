import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export const SignInPage: React.FC = () => {
  const { signIn, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { error, success } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errMessage, setErrMessage] = useState('')

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrMessage('')
    setSubmitting(true)
    try {
      await signIn({ username: username.trim(), password })
      success('Welcome to X Platform Back-Office!')
      navigate('/')
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please check your credentials.'
      setErrMessage(msg)
      error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30">
            <i className="ri-shield-keyhole-line text-3xl" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black text-white tracking-tight">
          X Platform Back-Office
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">
          Marketplace Administration & Merchant Moderation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-700/60">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <i className="ri-error-warning-line text-base text-rose-400 shrink-0" />
                <span>{errMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="ri-user-3-line text-sm" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="ri-lock-2-line text-sm" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Control Center</span>
                    <i className="ri-arrow-right-line text-sm" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick info note */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <i className="ri-shield-check-line text-indigo-400" />
              Role-Based Access
            </div>
            <p className="text-slate-400 leading-relaxed">
              Restricted to users with <code className="text-indigo-300 font-mono bg-slate-900 px-1 py-0.5 rounded">platform:admin</code> or <code className="text-indigo-300 font-mono bg-slate-900 px-1 py-0.5 rounded">x-store:manage</code> platform privileges.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
