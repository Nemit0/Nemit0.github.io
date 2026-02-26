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
    <article className="group relative rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-white dark:bg-stone-900/50 p-5 transition-all duration-300 ease-out hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5">
      {/* Featured Image */}
      {post.frontmatter.image && (
        <Link href={`/${lang}/posts/${post.slug}`} className="block mb-4 cursor-pointer">
          <div className="aspect-[16/10] overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
            <img
              src={post.frontmatter.image}
              alt={post.frontmatter.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
          </div>
        </Link>
      )}

      {/* Meta line */}
      <div className="flex items-center gap-2 mb-2.5">
        <Link
          href={buildCategoryHref(lang, post.frontmatter.category)}
          className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
        >
          {post.frontmatter.category}
        </Link>
        <span className="text-stone-300 dark:text-stone-700">·</span>
        <time
          dateTime={post.frontmatter.date}
          className="text-xs text-stone-400 dark:text-stone-500 tabular-nums"
        >
          {format(new Date(post.frontmatter.date), 'MMM d, yyyy')}
        </time>
      </div>

      {/* Title */}
      <Link href={`/${lang}/posts/${post.slug}`} className="cursor-pointer">
        <h3 className="text-[1.075rem] font-semibold text-stone-900 dark:text-stone-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2 leading-snug tracking-tight">
          {post.frontmatter.title}
        </h3>
      </Link>

      {/* Description */}
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 line-clamp-2 leading-relaxed">
        {post.frontmatter.description}
      </p>

      {/* Tags */}
      {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {post.frontmatter.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
