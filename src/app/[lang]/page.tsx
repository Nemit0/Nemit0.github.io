import { type Language, languages, getTranslations } from "@/lib/i18n";
import { getAllPosts } from '@/lib/posts';
import BlogPostList from '@/components/BlogPostList';

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
  const t = getTranslations(langTyped);
  const posts = getAllPosts(langTyped);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {t.posts}
        </h1>
        <p className="mt-3 text-stone-500 dark:text-stone-400 text-base leading-relaxed max-w-lg">
          {langTyped === 'ko' ? '최신 글' : 'Latest posts.'}
        </p>
        <div className="mt-4 h-px bg-gradient-to-r from-stone-200 via-stone-200 to-transparent dark:from-stone-800 dark:via-stone-800" />
      </header>
      <BlogPostList posts={posts} lang={langTyped} />
    </div>
  );
}
