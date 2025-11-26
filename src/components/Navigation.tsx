import Link from "next/link";
import { type Language, getTranslations } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navigation({ lang }: { lang: Language }) {
  const t = getTranslations(lang);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href={`/${lang}`} className="text-xl font-bold">
              My Blog
            </Link>
            <div className="hidden md:flex gap-6">
              <Link
                href={`/${lang}`}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.home}
              </Link>
              <Link
                href={`/${lang}/posts`}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.posts}
              </Link>
              <Link
                href={`/${lang}/about`}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                {t.about}
              </Link>
            </div>
          </div>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </div>
    </nav>
  );
}
