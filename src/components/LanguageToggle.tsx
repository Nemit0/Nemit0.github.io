'use client';

import { useRouter, usePathname } from 'next/navigation';
import { type Language, languages } from '@/lib/i18n';
import { replaceLanguageInPath } from '@/lib/paths';

interface LanguageToggleProps {
  currentLang: Language;
  className?: string;
  floating?: boolean;
}

export default function LanguageToggle({
  currentLang,
  className = '',
  floating = true,
}: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLang: Language) => {
    if (newLang === currentLang) return;

    router.push(replaceLanguageInPath(pathname, newLang));
  };

  return (
    <div
      className={`
        flex rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5
        ${floating ? 'fixed top-4 right-4 z-50' : ''}
        ${className}
      `}
      role="group"
      aria-label="Language selection"
    >
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLanguage(lang)}
          aria-pressed={currentLang === lang}
          aria-label={`Switch to ${lang === 'en' ? 'English' : 'Korean'}`}
          className={`
            px-3 py-1 rounded-md text-xs font-medium tracking-wide transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500
            ${
              currentLang === lang
                ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }
          `}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
