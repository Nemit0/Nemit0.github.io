import fs from 'fs';
import path from 'path';
import { parseMarkdown, markdownToHtml } from './markdown';
import { type Language, languages } from './i18n';
import { type Post, type PostWithHtml, type PostFrontmatter, type Category, type CategoryNode } from '@/types/post';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Intermediate type used during tree construction
interface CategoryNodeWithPosts {
  name: string;
  slug: string;
  count: number;
  posts: string[];
  children: CategoryNodeWithPosts[];
}

function findPostFiles(dir: string, lang: Language, isTopLevel = true): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('[page]')) {
        // Skip top-level [page] dirs (special pages like about, not regular posts)
        if (isTopLevel) continue;
        const files = fs.readdirSync(fullPath);
        for (const file of files) {
          if (file.endsWith(`-${lang}.md`)) {
            results.push(path.join(fullPath, file));
          }
        }
      } else {
        results.push(...findPostFiles(fullPath, lang, false));
      }
    }
  }

  return results;
}

function parsePostFromFile(filePath: string, lang: Language): Post | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseMarkdown(raw);

    const pageDirName = path.basename(path.dirname(filePath));
    const slug = pageDirName.replace(/^\[page\]/, '');

    const frontmatter: PostFrontmatter = {
      title: data.title ?? slug,
      description: data.description ?? '',
      date: data.date ?? '',
      category: data.category ?? '',
      tags: data.tags ?? [],
      author: data.author ?? '',
      featured: data.featured,
      pinned: data.pinned,
      image: data.image,
    };

    return { slug, lang, frontmatter, content };
  } catch {
    return null;
  }
}

export function getAllPosts(lang: Language): Post[] {
  const files = findPostFiles(CONTENT_DIR, lang);
  const posts: Post[] = [];

  for (const file of files) {
    const post = parsePostFromFile(file, lang);
    if (post) posts.push(post);
  }

  return posts.sort(
    (a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime(),
  );
}

export async function getPostBySlug(slug: string, lang: Language): Promise<PostWithHtml | null> {
  const files = findPostFiles(CONTENT_DIR, lang);

  for (const file of files) {
    const fileSlug = path.basename(path.dirname(file)).replace(/^\[page\]/, '');
    if (fileSlug === slug) {
      const post = parsePostFromFile(file, lang);
      if (post) {
        const html = await markdownToHtml(post.content);
        return { ...post, html };
      }
    }
  }

  return null;
}

export function getAlternateLanguage(slug: string, currentLang: Language): Language | null {
  const alternateLang = languages.find(l => l !== currentLang);
  if (!alternateLang) return null;

  const files = findPostFiles(CONTENT_DIR, alternateLang);
  for (const file of files) {
    const fileSlug = path.basename(path.dirname(file)).replace(/^\[page\]/, '');
    if (fileSlug === slug) return alternateLang;
  }

  return null;
}

export async function getPageContent(
  pageName: string,
  lang: Language,
): Promise<{ title: string; html: string } | null> {
  const pageDir = path.join(CONTENT_DIR, `[page]${pageName}`);
  const filePath = path.join(pageDir, `${pageName}-${lang}.md`);

  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = parseMarkdown(raw);
    const html = await markdownToHtml(content);
    return { title: data.title ?? pageName, html };
  } catch {
    return null;
  }
}

function buildRawTree(categories: string[]): CategoryNodeWithPosts[] {
  const root: CategoryNodeWithPosts[] = [];

  for (const category of categories) {
    const parts = category.split('/');
    let current = root;
    let currentSlug = '';

    for (const part of parts) {
      currentSlug = currentSlug ? `${currentSlug}/${part}` : part;
      let node = current.find(n => n.slug === currentSlug);
      if (!node) {
        node = { name: part, slug: currentSlug, count: 0, posts: [], children: [] };
        current.push(node);
      }
      current = node.children;
    }
  }

  return root;
}

function assignPostsToLeaves(tree: CategoryNodeWithPosts[], posts: Post[]): void {
  for (const post of posts) {
    const category = post.frontmatter.category;
    if (!category) continue;

    const parts = category.split('/');
    let current = tree;
    let currentSlug = '';

    for (let i = 0; i < parts.length; i++) {
      currentSlug = currentSlug ? `${currentSlug}/${parts[i]}` : parts[i];
      const node = current.find(n => n.slug === currentSlug);
      if (!node) break;
      if (i === parts.length - 1) {
        node.posts.push(post.slug);
      }
      current = node.children;
    }
  }
}

// Recursively compute each node's count as its own posts plus all descendant posts
function addPostCountsToTree(tree: CategoryNodeWithPosts[]): CategoryNodeWithPosts[] {
  return tree.map(node => {
    const children = addPostCountsToTree(node.children);
    const descendantCount = children.reduce((sum, child) => sum + child.count, 0);
    return { ...node, count: node.posts.length + descendantCount, children };
  });
}

function stripPosts(tree: CategoryNodeWithPosts[]): CategoryNode[] {
  return tree.map(({ name, slug, count, children }) => ({
    name,
    slug,
    count,
    children: stripPosts(children),
  }));
}

export function getCategoryTree(lang: Language): CategoryNode[] {
  const posts = getAllPosts(lang);

  const categorySet = new Set<string>();
  for (const post of posts) {
    const category = post.frontmatter.category;
    if (!category) continue;
    const parts = category.split('/');
    for (let i = 1; i <= parts.length; i++) {
      categorySet.add(parts.slice(0, i).join('/'));
    }
  }

  const rawTree = buildRawTree(Array.from(categorySet));
  assignPostsToLeaves(rawTree, posts);
  const treeWithCounts = addPostCountsToTree(rawTree);
  return stripPosts(treeWithCounts);
}

export function getCategories(): Category[] {
  const categoryMap = new Map<string, Category>();

  for (const lang of languages) {
    const posts = getAllPosts(lang);
    for (const post of posts) {
      const category = post.frontmatter.category;
      if (!category) continue;

      const parts = category.split('/');
      for (let i = 1; i <= parts.length; i++) {
        const slug = parts.slice(0, i).join('/');
        if (!categoryMap.has(slug)) {
          categoryMap.set(slug, { name: parts[i - 1], slug, postCount: 0 });
        }
      }

      const leaf = categoryMap.get(category);
      if (leaf) leaf.postCount++;
    }
  }

  return Array.from(categoryMap.values());
}

export function getPostsByCategory(categoryPath: string, lang: Language): Post[] {
  return getAllPosts(lang).filter(post => post.frontmatter.category === categoryPath);
}