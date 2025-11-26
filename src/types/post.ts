import { type Language } from '@/lib/i18n';

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  author: string;
  featured?: boolean;
  pinned?: boolean;
  image?: string;
}

export interface Post {
  slug: string;
  lang: Language;
  frontmatter: PostFrontmatter;
  content: string;
}

export interface PostWithHtml extends Post {
  html: string;
}

export interface Category {
  name: string;
  slug: string;
  postCount: number;
}

export interface CategoryNode {
  name: string;
  slug: string;
  count: number;
  children: CategoryNode[];
}
