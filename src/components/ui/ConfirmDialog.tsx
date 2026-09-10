import React from 'react'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'warning'
  isLoading?: boolean
  children?: React.ReactNode
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
  children,
}) => {
  const btnColor = {
    danger: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500 text-white',
    primary: 'bg-zinc-900 hover:bg-zinc-800 focus:ring-zinc-900 text-white',
    warning: 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500 text-white',
  }[variant]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-zinc-600 leading-relaxed">{message}</p>
        {children}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition shadow-2xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg shadow-2xs transition flex items-center gap-1.5 ${btnColor} ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading && <i className="ri-loader-4-line animate-spin text-xs" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
