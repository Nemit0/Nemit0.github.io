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
    <div className="space-y-12">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
        {t.posts}
      </h1>
      <BlogPostList posts={posts} lang={langTyped} />
    </div>
  );
}
