import Link from 'next/link';
import { format } from 'date-fns';
import type { Post } from '@/types/post';
import type { Language } from '@/lib/i18n';

interface BlogPostCardProps {
  post: Post;
  lang: Language;
}

export default function BlogPostCard({ post, lang }: BlogPostCardProps) {
  return (
    <article className="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Featured Image */}
      {post.frontmatter.image && (
        <Link href={`/${lang}/posts/${post.slug}`}>
          <div className="aspect-video overflow-hidden">
            <img
              src={post.frontmatter.image}
              alt={post.frontmatter.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}

      <div className="p-6">
        {/* Category & Date */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/${lang}/category/${post.frontmatter.category
              .split('/')
              .map(encodeURIComponent)
              .join('/')}`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-wide"
          >
            {post.frontmatter.category}
          </Link>
          <time
            dateTime={post.frontmatter.date}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {format(new Date(post.frontmatter.date), 'MMM d, yyyy')}
          </time>
        </div>

        {/* Title */}
        <Link href={`/${lang}/posts/${post.slug}`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {post.frontmatter.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {post.frontmatter.description}
        </p>

        {/* Tags */}
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.frontmatter.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author & Read More */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          {post.frontmatter.author && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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

          <Link
            href={`/${lang}/posts/${post.slug}`}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {lang === 'en' ? 'Read more →' : '더 읽기 →'}
          </Link>
        </div>
      </div>
    </article>
  );
}
