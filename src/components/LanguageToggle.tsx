'use client';

import { useRouter, usePathname } from 'next/navigation';
import { type Language, languages } from '@/lib/i18n';

interface LanguageToggleProps {
  currentLang: Language;
  className?: string;
}

export default function LanguageToggle({ currentLang, className = '' }: LanguageToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLang: Language) => {
    if (newLang === currentLang) return;

    // Extract path without language prefix
    // pathname is like "/en/posts/my-post" or "/ko"
    const pathParts = pathname.split('/').filter(Boolean);

    // Remove current language from path
    if (pathParts[0] === currentLang) {
      pathParts.shift();
    }

    // Construct new path with new language
    const newPath = `/${newLang}${pathParts.length > 0 ? '/' + pathParts.join('/') : ''}`;

    router.push(newPath);
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex rounded-full bg-gray-200 dark:bg-gray-700 p-1 ${className}`}
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
