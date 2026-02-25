import Link from 'next/link';
import { format } from 'date-fns';
import type { Post } from '@/types/post';
import type { Language } from '@/lib/i18n';
import { buildCategoryHref } from '@/lib/paths';

interface BlogPostCardProps {
  post: Post;
  lang: Language;
}

export default function BlogPostCard({ post, lang }: BlogPostCardProps) {
  return (
    <article className="group relative">
      {/* Featured Image */}
      {post.frontmatter.image && (
        <Link href={`/${lang}/posts/${post.slug}`} className="block mb-4">
          <div className="aspect-[16/10] overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
            <img
              src={post.frontmatter.image}
              alt={post.frontmatter.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
            />
          </div>
        </Link>
      )}

      {/* Meta line */}
      <div className="flex items-center gap-2 mb-2">
        <Link
          href={buildCategoryHref(lang, post.frontmatter.category)}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          {post.frontmatter.category}
        </Link>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <time
          dateTime={post.frontmatter.date}
          className="text-xs text-stone-400 dark:text-stone-500"
        >
          {format(new Date(post.frontmatter.date), 'MMM d, yyyy')}
        </time>
      </div>

      {/* Title */}
      <Link href={`/${lang}/posts/${post.slug}`}>
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2 leading-snug tracking-tight">
          {post.frontmatter.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-3 line-clamp-2 leading-relaxed">
        {post.frontmatter.description}
      </p>

      {/* Tags */}
      {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.frontmatter.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
