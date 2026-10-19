import React from 'react'
import { useLocale } from './LocaleContext'

export function LocaleSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLocale()

  const toggle = () => {
    setLanguage(language === 'km' ? 'en' : 'km')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={language === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
      data-locale-ignore
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors shadow-2xs ${className ?? ''}`}
    >
      <i className="ri-global-line text-zinc-400" />
      <span className="font-bold text-zinc-800">{language === 'km' ? 'ខ្មែរ' : 'EN'}</span>
      <span className="text-[10px] text-zinc-400 font-normal">| {language === 'km' ? 'EN' : 'ខ្មែរ'}</span>
    </button>
  )
}
