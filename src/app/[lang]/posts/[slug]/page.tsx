import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { getAllPosts, getPostBySlug, getAlternateLanguage } from '@/lib/posts';
import { type Language, getTranslations, languageNames, languages } from '@/lib/i18n';
import { buildCategoryHref } from '@/lib/paths';
import MarkdownContent from '@/components/MarkdownContent';

interface PageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = [];

  // Generate params for both languages
  for (const lang of languages) {
    const posts = getAllPosts(lang);
    for (const post of posts) {
      params.push({
        lang,
        slug: post.slug,
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPostBySlug(slug, lang as Language);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      type: 'article',
      publishedTime: post.frontmatter.date,
      authors: post.frontmatter.author ? [post.frontmatter.author] : undefined,
      tags: post.frontmatter.tags,
      images: post.frontmatter.image ? [post.frontmatter.image] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const langTyped = lang as Language;
  const post = await getPostBySlug(slug, langTyped);

  if (!post) {
    notFound();
  }

  const t = getTranslations(langTyped);
  const alternateLang = getAlternateLanguage(slug, langTyped);

  return (
    <article className="max-w-3xl mx-auto py-8 sm:py-12">
      {/* Header */}
      <header className="mb-10">
        {/* Category */}
        <div className="mb-4">
          <Link
            href={buildCategoryHref(langTyped, post.frontmatter.category)}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
            {post.frontmatter.category}
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-stone-900 dark:text-stone-100 tracking-tight leading-[1.15] text-balance">
          {post.frontmatter.title}
        </h1>

        {/* Description */}
        {post.frontmatter.description && (
          <p className="text-lg text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
            {post.frontmatter.description}
          </p>
        )}

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
          {/* Date */}
          <time dateTime={post.frontmatter.date} className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(new Date(post.frontmatter.date), 'MMMM d, yyyy')}
          </time>

          {/* Author */}
          {post.frontmatter.author && (
            <>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {post.frontmatter.author}
              </span>
            </>
          )}

          {/* Language switcher for alternate version */}
          {alternateLang && (
            <>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <Link
                href={`/${alternateLang}/posts/${slug}`}
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {languageNames[alternateLang]}
              </Link>
            </>
          )}
        </div>

        {/* Tags */}
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {post.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-[11px] font-medium bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Separator */}
      <div className="h-px bg-gradient-to-r from-stone-200 via-stone-200 to-transparent dark:from-stone-800 dark:via-stone-800 mb-10" />

      {/* Featured Image */}
      {post.frontmatter.image && (
        <div className="mb-10">
          <img
            src={post.frontmatter.image}
            alt={post.frontmatter.title}
            className="w-full rounded-xl border border-stone-200 dark:border-stone-800"
          />
        </div>
      )}

      {/* Content */}
      <MarkdownContent html={post.html} />

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-stone-200 dark:border-stone-800">
        <div className="flex justify-between items-center">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors group/back cursor-pointer"
          >
            <svg className="w-4 h-4 transition-transform group-hover/back:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t.home}
          </Link>

          {alternateLang && (
            <Link
              href={`/${alternateLang}/posts/${slug}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group/lang cursor-pointer"
            >
              {lang === 'en' ? '한국어로 읽기' : 'Read in English'}
              <svg className="w-4 h-4 transition-transform group-hover/lang:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
