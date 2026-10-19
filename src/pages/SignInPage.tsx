import React, { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authService, MfaMethodSelectionRequiredError, MfaRequiredError } from '../services/authService'
import type { MfaChallenge, MfaMethod } from '../services/authService'
import { LocaleSwitcher } from '../i18n/LocaleSwitcher'

export const SignInPage: React.FC = () => {
  const { signIn, signInWithMfa, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const { error, success } = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errMessage, setErrMessage] = useState('')
  const [challenge, setChallenge] = useState<MfaChallenge | null>(null)
  const [mfaSelection, setMfaSelection] = useState<{ token: string; methods: MfaMethod[] } | null>(null)
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
      } else if (mfaSelection) {
        return
      } else {
        await signIn({ username: username.trim(), password })
      }
      success('Welcome to X Platform Back-Office!')
      navigate('/')
    } catch (err: any) {
      if (err instanceof MfaRequiredError) {
        setChallenge({ token: err.challengeToken, expiresAt: err.expiresAt, method: err.method, destination: err.destination })
        setMfaSelection(null)
        setMfaCode('')
        setPassword('')
        setErrMessage('')
        return
      }
      if (err instanceof MfaMethodSelectionRequiredError) {
        setMfaSelection({ token: err.selectionToken, methods: err.methods })
        setChallenge(null)
        setMfaCode('')
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

  const handleChooseMfaMethod = async (method: MfaMethod) => {
    if (!mfaSelection) return
    setErrMessage('')
    setSubmitting(true)
    try {
      const nextChallenge = await authService.sendMfaCode({
        username: username.trim(),
        selectionToken: mfaSelection.token,
        method,
      })
      setChallenge(nextChallenge)
      setMfaCode('')
      success(method === 'EMAIL' ? 'Verification code sent to your email.' : 'Verification code sent to Telegram.')
    } catch (err: any) {
      const msg = err.message || 'The verification code could not be sent.'
      setErrMessage(msg)
      error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const returnToPassword = () => {
    setChallenge(null)
    setMfaSelection(null)
    setMfaCode('')
    setErrMessage('')
  }

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden overflow-hidden bg-[#1b2138] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#8b84e8]/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-lg font-extrabold shadow-lg shadow-brand/40">X</div>
            <div>
              <div className="text-lg font-extrabold leading-none">X Platform</div>
              <div className="mt-1 text-sm text-white/60">Backoffice</div>
            </div>
          </div>
          <h1 className="mt-16 max-w-md text-4xl font-extrabold leading-tight tracking-tight">Your marketplace command center</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/75">
            Approve merchants, watch orders, and keep the catalog consistent across Cambodia.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-semibold text-white/85">
            <li className="flex items-center gap-3"><i className="ri-verified-badge-fill text-lg text-[#c4bfff]" /> Merchant review</li>
            <li className="flex items-center gap-3"><i className="ri-store-2-fill text-lg text-[#c4bfff]" /> Store directory</li>
            <li className="flex items-center gap-3"><i className="ri-folders-fill text-lg text-[#c4bfff]" /> Catalog control</li>
            <li className="flex items-center gap-3"><i className="ri-translate-2 text-lg text-[#c4bfff]" /> Khmer and English</li>
          </ul>
        </div>
        <p className="relative text-sm text-white/55">Cambodia · GMT+7</p>
      </aside>

      <div className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-extrabold text-white">X</div>
              <span className="font-extrabold text-ink">Backoffice</span>
            </div>
            <div className="hidden text-sm font-bold text-muted lg:block">Backoffice Console</div>
            <LocaleSwitcher />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">
            Sign in to manage merchants, marketplace categories, and platform directory.
          </p>
        <div className="mt-6 rounded-2xl border border-line bg-white px-6 py-8 shadow-[0_12px_40px_rgba(88,99,148,0.08)] sm:px-8">
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
              <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8} autoFocus required value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="00000000" className="w-full rounded-xl border border-line bg-[#f8f9fc] px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:bg-white" />
              {challenge.expiresAt ? <p className="mt-2 text-xs text-zinc-500">Code expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.</p> : null}
            </div> : mfaSelection ? <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Choose a verification method</label>
              <p className="mb-3 text-xs text-zinc-500">Your password was accepted. Choose where to receive your one-time sign-in code.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mfaSelection.methods.includes('TELEGRAM') ? <button type="button" disabled={submitting} onClick={() => handleChooseMfaMethod('TELEGRAM')} className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"><i className="ri-telegram-line text-lg text-sky-600" />Telegram</button> : null}
                {mfaSelection.methods.includes('EMAIL') ? <button type="button" disabled={submitting} onClick={() => handleChooseMfaMethod('EMAIL')} className="flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"><i className="ri-mail-line text-lg" />Email</button> : null}
              </div>
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
                className="w-full rounded-xl border border-line bg-[#f8f9fc] px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:bg-white"
              />
            </div>}

            {!challenge && !mfaSelection ? <div>
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
                className="w-full rounded-xl border border-line bg-[#f8f9fc] px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:bg-white"
              />
            </div> : null}

            {(!mfaSelection || challenge) ? <div className="pt-1">
              <button
                type="submit"
                disabled={submitting || Boolean(challenge && mfaCode.length !== 8)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 hover:bg-brand-dark disabled:opacity-50"
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
            </div> : null}
          </form>
          {challenge && mfaSelection ? <button type="button" className="mt-3 w-full text-xs font-semibold text-zinc-700 underline" onClick={() => { setChallenge(null); setMfaCode(''); setErrMessage('') }}>Choose another method</button> : null}
          {challenge || mfaSelection ? <button type="button" className="mt-3 w-full text-xs font-semibold text-zinc-700 underline" onClick={returnToPassword}>Back to password</button> : null}

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Production Environment</span>
            <span className="font-mono text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
              x-platform
            </span>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
