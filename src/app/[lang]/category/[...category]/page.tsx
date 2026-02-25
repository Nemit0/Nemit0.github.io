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
    <div className="py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-stone-400 dark:text-stone-500">
          <li>
            <Link
              href={`/${lang}`}
              className="hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              {t.home}
            </Link>
          </li>
          <li>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li className="text-stone-700 dark:text-stone-300 font-medium capitalize">
            {categoryData.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2 text-stone-900 dark:text-stone-100 tracking-tight capitalize">
          {categoryData.name}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
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
      <div className="mt-12 pt-8 border-t border-stone-200 dark:border-stone-800">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.backToAllPosts}
        </Link>
      </div>
    </div>
  );
}
