import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { getAllPosts, getPostBySlug, getAlternateLanguage } from '@/lib/posts';
import { type Language, getTranslations, languageNames } from '@/lib/i18n';
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
  for (const lang of ['en', 'ko'] as const) {
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
  const post = await getPostBySlug(slug, lang as Language);

  if (!post) {
    notFound();
  }

  const t = getTranslations(lang as Language);
  const alternateLang = getAlternateLanguage(slug, lang as Language);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <header className="mb-8">
        {/* Category */}
        <div className="mb-4">
          <Link
            href={`/${lang}/category/${post.frontmatter.category
              .split('/')
              .map(encodeURIComponent)
              .join('/')}`}
            className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition"
          >
            {post.frontmatter.category}
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {post.frontmatter.title}
        </h1>

        {/* Description */}
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          {post.frontmatter.description}
        </p>

        {/* Meta information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {/* Date */}
          <div className="flex items-center gap-2">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <time dateTime={post.frontmatter.date}>
              {format(new Date(post.frontmatter.date), 'MMMM d, yyyy')}
            </time>
          </div>

          {/* Author */}
          {post.frontmatter.author && (
            <div className="flex items-center gap-2">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{post.frontmatter.author}</span>
            </div>
          )}

          {/* Language switcher for alternate version */}
          {alternateLang && (
            <div className="ml-auto">
              <Link
                href={`/${alternateLang}/posts/${slug}`}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
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
                <span>{languageNames[alternateLang]}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Featured Image */}
      {post.frontmatter.image && (
        <div className="mb-8">
          <img
            src={post.frontmatter.image}
            alt={post.frontmatter.title}
            className="w-full rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <MarkdownContent html={post.html} />

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <Link
            href={`/${lang}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
          >
            ← {t.home}
          </Link>

          {alternateLang && (
            <Link
              href={`/${alternateLang}/posts/${slug}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
            >
              {lang === 'en' ? '한국어로 읽기 →' : 'Read in English →'}
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
