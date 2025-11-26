import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPageContent } from '@/lib/posts';
import { type Language, getTranslations, languageNames } from '@/lib/i18n';
import MarkdownContent from '@/components/MarkdownContent';

interface PageProps {
  params: Promise<{
    lang: string;
  }>;
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = await params;
  const pageData = await getPageContent('about', lang as Language);

  if (!pageData) {
    return {
      title: 'About',
    };
  }

  return {
    title: pageData.title,
    description: lang === 'ko'
      ? '저와 이 블로그에 대해 알아보세요'
      : 'Learn more about me and this blog',
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { lang } = await params;
  const pageData = await getPageContent('about', lang as Language);

  if (!pageData) {
    notFound();
  }

  const t = getTranslations(lang as Language);
  const alternateLang = lang === 'en' ? 'ko' : 'en';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
            {pageData.title}
          </h1>

          {/* Language switcher */}
          <Link
            href={`/${alternateLang}/about`}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
            <span>{languageNames[alternateLang as Language]}</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <article className="mb-12">
        <MarkdownContent html={pageData.html} />
      </article>

      {/* Footer */}
      <footer className="pt-8 border-t border-gray-200 dark:border-gray-800">
        <Link
          href={`/${lang}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
        >
          ← {t.home}
        </Link>
      </footer>
    </div>
  );
}
