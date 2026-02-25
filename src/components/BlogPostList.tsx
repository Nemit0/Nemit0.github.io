import type { Post } from '@/types/post';
import type { Language } from '@/lib/i18n';
import BlogPostCard from './BlogPostCard';

interface BlogPostListProps {
  posts: Post[];
  lang: Language;
  title?: string;
  emptyMessage?: string;
}

export default function BlogPostList({
  posts,
  lang,
  title,
  emptyMessage,
}: BlogPostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 dark:text-stone-400">
          {emptyMessage ||
            (lang === 'en'
              ? 'No posts found. Check back soon!'
              : '아직 작성된 포스트가 없습니다. 곧 추가될 예정입니다!')}
        </p>
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2 className="text-2xl font-semibold mb-8 text-stone-900 dark:text-stone-100 tracking-tight">
          {title}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-10">
        {posts.map((post) => (
          <BlogPostCard key={`${post.slug}-${post.lang}`} post={post} lang={lang} />
        ))}
      </div>
    </section>
  );
}
