import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { MfaRequiredError } from '../services/authService'

export const SignInPage: React.FC = () => {
  const { signIn, signInWithMfa, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { error, success } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errMessage, setErrMessage] = useState('')
  const [challenge, setChallenge] = useState<{ token: string; expiresAt?: string; method: 'EMAIL' | 'TELEGRAM'; destination?: string } | null>(null)
  const [mfaCode, setMfaCode] = useState('')

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrMessage('')
    setSubmitting(true)
    try {
      if (challenge) {
        await signInWithMfa({ username: username.trim(), challengeToken: challenge.token, code: mfaCode, method: challenge.method })
      } else {
        await signIn({ username: username.trim(), password })
      }
      success('Welcome to X Platform Back-Office!')
      navigate('/')
    } catch (err: any) {
      if (err instanceof MfaRequiredError) {
        setChallenge({ token: err.challengeToken, expiresAt: err.expiresAt, method: err.method, destination: err.destination })
        setPassword('')
        setErrMessage('')
        return
      }
      const msg = err.message || 'Authentication failed. Please check your credentials.'
      setErrMessage(msg)
      error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
            X
          </div>
          <span className="font-semibold text-lg tracking-tight text-zinc-900">
            Backoffice Console
          </span>
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Sign in to manage merchants, marketplace categories, and platform directory.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xs rounded-xl border border-zinc-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <i className="ri-error-warning-line text-sm text-rose-600 shrink-0" />
                <span>{errMessage}</span>
              </div>
            )}

            {challenge ? <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">{challenge.method === 'EMAIL' ? 'Email' : 'Telegram'} verification code</label>
              <p className="mb-2 text-xs text-zinc-500">{challenge.method === 'EMAIL' ? `Enter the 8-digit code sent to ${challenge.destination || 'your verified email address'}.` : 'Enter the 8-digit code sent to your linked Telegram chat.'}</p>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} autoFocus required value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition shadow-2xs" />
              {challenge.expiresAt ? <p className="mt-2 text-xs text-zinc-500">Code expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.</p> : null}
            </div> : <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition shadow-2xs"
              />
            </div>}

            {!challenge ? <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition shadow-2xs"
              />
            </div> : null}

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting || Boolean(challenge && mfaCode.length !== 8)}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 transition shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>{challenge ? 'Verify and sign in' : 'Continue to Backoffice'}</span>
                )}
              </button>
            </div>
          </form>
          {challenge ? <button type="button" className="mt-3 w-full text-xs font-semibold text-zinc-700 underline" onClick={() => { setChallenge(null); setMfaCode(''); setErrMessage('') }}>Back to password</button> : null}

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Production Environment</span>
            <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
              x-platform
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
