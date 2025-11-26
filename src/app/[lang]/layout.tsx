import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { isValidLanguage, type Language, languageNames } from "@/lib/i18n";
import { getCategoryTree } from "@/lib/posts";
import LanguageToggle from "@/components/LanguageToggle";
import CategorySidebar from "@/components/CategorySidebar";
import HomeLink from "@/components/HomeLink";

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: "My Blog",
    description: lang === 'ko'
      ? "한국어와 영어로 작성된 개인 블로그"
      : "Personal blog with Korean and English posts",
  };
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;

  if (!isValidLanguage(lang)) {
    notFound();
  }

  const langTyped = lang as Language;
  const categories = getCategoryTree(langTyped);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <HomeLink lang={langTyped} />
      <LanguageToggle currentLang={langTyped} />
      <div className="w-full flex items-start">
        <CategorySidebar
          lang={langTyped}
          categories={categories}
          className="flex-shrink-0"
        />
        <main className="flex-1 px-4 lg:px-10 py-10">
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
