import { type Language, languages } from "@/lib/i18n";
import { getPinnedPost } from '@/lib/posts';
import MarkdownContent from '@/components/MarkdownContent';

export async function generateStaticParams() {
  return languages.map(lang => ({ lang }));
}

export default async function LangHome({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const langTyped = lang as Language;

  // Fetch pinned post (or most recent if no pinned post)
  const pinnedPost = await getPinnedPost(langTyped);

  if (!pinnedPost) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          {langTyped === 'ko' ? '게시물이 없습니다.' : 'No posts available.'}
        </p>
      </div>
    );
  }

  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {pinnedPost.frontmatter.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <time dateTime={pinnedPost.frontmatter.date}>
            {new Date(pinnedPost.frontmatter.date).toLocaleDateString(
              langTyped === 'ko' ? 'ko-KR' : 'en-US',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </time>
          {pinnedPost.frontmatter.author && (
            <>
              <span>•</span>
              <span>{pinnedPost.frontmatter.author}</span>
            </>
          )}
          {pinnedPost.frontmatter.pinned && (
            <>
              <span>•</span>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium">
                📌 {langTyped === 'ko' ? '고정됨' : 'Pinned'}
              </span>
            </>
          )}
        </div>
      </header>

      <MarkdownContent html={pinnedPost.html} />

      {pinnedPost.frontmatter.tags && pinnedPost.frontmatter.tags.length > 0 && (
        <footer className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {pinnedPost.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
