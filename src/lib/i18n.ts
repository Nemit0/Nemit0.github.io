export const languages = ['en', 'ko'] as const;
export type Language = typeof languages[number];

export const defaultLanguage: Language = 'en';

export function isValidLanguage(lang: string): lang is Language {
  return languages.includes(lang as Language);
}

export const languageNames: Record<Language, string> = {
  en: 'English',
  ko: '한국어',
};

export const translations = {
  en: {
    home: 'Home',
    posts: 'Posts',
    about: 'About',
    categories: 'Categories',
    featuredPosts: 'Featured Posts',
    recentPosts: 'Recent Posts',
    readMore: 'Read More',
    publishedOn: 'Published on',
    author: 'Author',
    tags: 'Tags',
  },
  ko: {
    home: '홈',
    posts: '포스트',
    about: '소개',
    categories: '카테고리',
    featuredPosts: '주요 포스트',
    recentPosts: '최근 포스트',
    readMore: '더 읽기',
    publishedOn: '게시일',
    author: '작성자',
    tags: '태그',
  },
};

export function getTranslations(lang: Language) {
  return translations[lang];
}
