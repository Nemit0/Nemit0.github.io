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
        flex rounded-full bg-gray-200 dark:bg-gray-700 p-1
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
            px-4 py-2 rounded-full text-sm font-medium transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${
              currentLang === lang
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }
          `}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
