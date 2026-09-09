import React, { createContext, useContext, useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => {
        removeToast(id)
      }, 4000)
    },
    [removeToast]
  )

  const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast])
  const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast])
  const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, info, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-2 ${
              t.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700 backdrop-blur-md'
                : t.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700 backdrop-blur-md'
                : t.type === 'warning'
                ? 'bg-amber-900/90 text-white border-amber-700 backdrop-blur-md'
                : 'bg-slate-900/90 text-white border-slate-700 backdrop-blur-md'
            }`}
          >
            <i
              className={`text-lg shrink-0 ${
                t.type === 'success'
                  ? 'ri-checkbox-circle-fill text-emerald-400'
                  : t.type === 'error'
                  ? 'ri-error-warning-fill text-rose-400'
                  : t.type === 'warning'
                  ? 'ri-alert-fill text-amber-400'
                  : 'ri-information-fill text-sky-400'
              }`}
            />
            <div className="flex-1 text-xs leading-relaxed">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
