"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { languages, languageNames, type Language } from "@/lib/i18n";

export default function LanguageSwitcher({ currentLang }: { currentLang: Language }) {
  const pathname = usePathname();

  const getLocalizedPath = (newLang: Language) => {
    // Replace the current language segment with the new language
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && languages.includes(segments[0] as Language)) {
      segments[0] = newLang;
      return '/' + segments.join('/');
    }
    return `/${newLang}`;
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <Link
          key={lang}
          href={getLocalizedPath(lang)}
          className={`px-3 py-1 rounded transition ${
            lang === currentLang
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-current={lang === currentLang ? 'page' : undefined}
        >
          {languageNames[lang]}
        </Link>
      ))}
    </div>
  );
}
