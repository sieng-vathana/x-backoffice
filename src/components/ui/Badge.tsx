import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'zinc' | 'indigo' | 'blue'
  dot?: boolean
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  dot = false,
  className = '',
}) => {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    zinc: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    indigo: 'bg-zinc-100 text-zinc-800 border-zinc-300 font-medium',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80',
  }

  const dotStyles = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-zinc-400',
    zinc: 'bg-zinc-400',
    indigo: 'bg-zinc-600',
    blue: 'bg-sky-500',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${styles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  )
}
