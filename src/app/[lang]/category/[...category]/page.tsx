import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getPostsByCategory, getCategories } from '@/lib/posts';
import { type Language, getTranslations, languages } from '@/lib/i18n';
import BlogPostList from '@/components/BlogPostList';

interface PageProps {
  params: Promise<{
    lang: string;
    category: string[];
  }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: { lang: string; category: string[] }[] = [];
  const categories = getCategories();

  // Generate params for both languages and all categories
  for (const lang of languages) {
    for (const category of categories) {
      params.push({
        lang,
        category: category.slug.split('/'),
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, category } = await params;
  const categoryPath = category.map(decodeURIComponent).join('/');
  const categories = getCategories();
  const categoryData = categories.find(c => c.slug === categoryPath);

  if (!categoryData) {
    return {
      title: 'Category Not Found',
    };
  }

  const title = `${categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1)} Posts`;
  const description = lang === 'ko'
    ? `${categoryData.name} 카테고리의 모든 포스트를 확인하세요`
    : `Browse all posts in the ${categoryData.name} category`;

  return {
    title,
    description,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { lang, category } = await params;
  const categoryPath = category.map(decodeURIComponent).join('/');
  const t = getTranslations(lang as Language);

  // Get all categories to verify this one exists
  const categories = getCategories();
  const categoryData = categories.find(c => c.slug === categoryPath);

  if (!categoryData) {
    notFound();
  }

  // Get posts in this category
  const posts = getPostsByCategory(categoryPath, lang as Language);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link
              href={`/${lang}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {t.home}
            </Link>
          </li>
          <li>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li>
            <Link
              href={`/${lang}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              {t.categories}
            </Link>
          </li>
          <li>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </li>
          <li className="text-gray-900 dark:text-gray-100 font-medium capitalize">
            {categoryData.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-gray-100 capitalize">
          {categoryData.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {lang === 'ko'
            ? `${categoryData.postCount}개의 포스트`
            : `${categoryData.postCount} ${categoryData.postCount === 1 ? 'post' : 'posts'}`}
        </p>
      </header>

      {/* Posts */}
      <BlogPostList
        posts={posts}
        lang={lang as Language}
        emptyMessage={
          lang === 'ko'
            ? '이 카테고리에 포스트가 없습니다.'
            : 'No posts in this category yet.'
        }
      />

      {/* Back to all posts */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {t.backToAllPosts}
        </Link>
      </div>
    </div>
  );
}
