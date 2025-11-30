"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { languages, languageNames, type Language } from "@/lib/i18n";
import { replaceLanguageInPath } from "@/lib/paths";

export default function LanguageSwitcher({ currentLang }: { currentLang: Language }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <Link
          key={lang}
          href={replaceLanguageInPath(pathname, lang)}
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
