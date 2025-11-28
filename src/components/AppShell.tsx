'use client';

import { useState } from 'react';
import type { Language } from '@/lib/i18n';
import type { CategoryNode } from '@/types/post';
import HomeLink from '@/components/HomeLink';
import LanguageToggle from '@/components/LanguageToggle';
import CategorySidebar from '@/components/CategorySidebar';

interface AppShellProps {
  lang: Language;
  categories: CategoryNode[];
  children: React.ReactNode;
}

export default function AppShell({ lang, categories, children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 overflow-x-hidden">
      <header
        className="
          sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800
          bg-white/90 dark:bg-gray-950/90 backdrop-blur supports-[backdrop-filter]:bg-white/75
          px-3 md:px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-3
        "
      >
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HomeLink lang={lang} floating={false} className="shadow-md" />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="
                md:hidden inline-flex items-center justify-center h-10 w-10 rounded-md
                bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow
                hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500
              "
              aria-label={isMobileMenuOpen ? 'Close categories' : 'Open categories'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <LanguageToggle currentLang={lang} floating={false} className="ml-auto" />
        </div>
      </header>

      <div className="w-full flex flex-col md:flex-row md:items-stretch items-start">
        <CategorySidebar
          lang={lang}
          categories={categories}
          className="flex-shrink-0"
          mobileOpen={isMobileMenuOpen}
          onMobileOpenChange={setIsMobileMenuOpen}
          showInternalMobileTrigger={false}
        />
        <main className="flex-1 px-4 lg:px-10 py-10">
          <div className="w-full max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
