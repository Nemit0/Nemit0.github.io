'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Language } from '@/lib/i18n';
import type { CategoryNode } from '@/types/post';
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
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl">
        <div className="w-full px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Left: hamburger + site name */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link
              href={`/${lang}`}
              className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Nemit's Blog
            </Link>
          </div>

          {/* Right: nav links + language toggle */}
          <div className="flex items-center gap-1">
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <Link
                href={`/${lang}`}
                className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                {lang === 'ko' ? '홈' : 'Home'}
              </Link>
              <Link
                href={`/${lang}/about`}
                className="px-3 py-1.5 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                {lang === 'ko' ? '소개' : 'About'}
              </Link>
            </nav>
            <LanguageToggle currentLang={lang} floating={false} />
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="w-full flex flex-col md:flex-row md:items-stretch items-start min-h-[calc(100vh-3.5rem)]">
        <CategorySidebar
          lang={lang}
          categories={categories}
          className="flex-shrink-0"
          mobileOpen={isMobileMenuOpen}
          onMobileOpenChange={setIsMobileMenuOpen}
          showInternalMobileTrigger={false}
        />
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
          <div className="w-full max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
