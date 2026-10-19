import { useLocale } from './LocaleContext'

export function LocaleSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLocale()

  return (
    <div
      data-locale-ignore
      role="group"
      aria-label="Language"
      className={`inline-flex items-center rounded-full bg-[#f3f4f8] p-1 ${className ?? ''}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
          language === 'en' ? 'bg-white text-brand shadow-sm' : 'text-[#74788d] hover:text-ink'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('km')}
        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
          language === 'km' ? 'bg-white text-brand shadow-sm' : 'text-[#74788d] hover:text-ink'
        }`}
      >
        ខ្មែរ
      </button>
    </div>
  )
}
