import fs from 'fs';
import path from 'path';
import { type Language, languages } from '@/lib/i18n';
import { parseMarkdown, markdownToHtml } from '@/lib/markdown';
import type { Post, PostWithHtml, Category, CategoryNode } from '@/types/post';

const contentDirectory = path.join(process.cwd(), 'content');

/**
 * Directory naming convention helpers
 * - Directories starting with [page] represent individual pages
 *   - At root: standalone pages (e.g., about)
 *   - Inside a category: a single post container
 */
function isPageDirectory(dirName: string): boolean {
  return dirName.startsWith('[page]');
}

function stripPagePrefix(dirName: string): string {
  return dirName.replace(/^\[page\]/, '');
}

/**
 * Extract slug and language from filename
 * Format: {slug}-{lang}.md
 * Example: my-post-en.md -> { slug: 'my-post', lang: 'en' }
 */
function parseFilename(filename: string): { slug: string; lang: Language } | null {
  const match = filename.match(/^(.+)-(en|ko)\.md$/);
  if (!match) return null;

  const [, slug, lang] = match;
  return { slug, lang: lang as Language };
}

/**
 * Collect markdown files that represent blog posts.
 * Rules:
 * - Top-level [page]* directories are standalone pages and are ignored for posts
 * - Inside a category directory, [page]<slug> is a post directory containing {slug}-{lang}.md files
 * - Non-[page] directories represent nested categories
 */
interface PostFileRef {
  filePath: string;
  category: string;
  slug: string;
  lang: Language;
}

function collectPostFiles(dir: string, categoryPath = '', isRoot = true): PostFileRef[] {
  const files: PostFileRef[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (isPageDirectory(entry.name)) {
        // At root: standalone pages (e.g., [page]about) — skip for posts
        if (isRoot) {
          continue;
        }

        // Inside a category: treat as a post directory
        const slug = stripPagePrefix(entry.name);
        const category = categoryPath || 'uncategorized';
        const postEntries = fs.readdirSync(fullPath, { withFileTypes: true });

        for (const postFile of postEntries) {
          if (postFile.isFile() && postFile.name.endsWith('.md')) {
            const parsed = parseFilename(postFile.name);
            if (parsed && parsed.slug === slug) {
              files.push({
                filePath: path.join(fullPath, postFile.name),
                category,
                slug,
                lang: parsed.lang,
              });
            }
          }
        }
      } else {
        // Nested category
        const nextCategory = categoryPath ? `${categoryPath}/${entry.name}` : entry.name;
        files.push(...collectPostFiles(fullPath, nextCategory, false));
      }
    }
  } catch (error) {
    // Directory doesn't exist yet
    return [];
  }

  return files;
}

/**
 * Read and parse a markdown file
 */
function readPostFile(
  filePath: string,
  category: string,
  parsedFromPath?: { slug: string; lang: Language }
): Post | null {
  const filename = path.basename(filePath);
  const parsed = parsedFromPath || parseFilename(filename);

  if (!parsed) return null;

  const { slug, lang } = parsed;
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = parseMarkdown(fileContent);

  // Validate required frontmatter fields
  if (!data.title || !data.description || !data.date) {
    console.warn(`Missing required frontmatter in ${filePath}`);
    return null;
  }

  return {
    slug,
    lang,
    content,
    frontmatter: {
      title: data.title,
      description: data.description,
      date: data.date,
      category: data.category || category,
      tags: data.tags || [],
      author: data.author || '',
      featured: data.featured || false,
      pinned: data.pinned || false,
      image: data.image,
    },
  };
}

/**
 * Get all posts for a specific language
 * @param lang - Language code (en or ko)
 * @returns Array of posts sorted by date (newest first)
 */
export function getAllPosts(lang: Language): Post[] {
  const files = collectPostFiles(contentDirectory);
  const posts: Post[] = [];

  for (const file of files) {
    const post = readPostFile(file.filePath, file.category, {
      slug: file.slug,
      lang: file.lang,
    });

    if (post && post.lang === lang) {
      posts.push(post);
    }
  }

  // Sort by date (newest first)
  return posts.sort((a, b) => {
    return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime();
  });
}

/**
 * Get a single post by slug and language
 * @param slug - Post slug (without language suffix)
 * @param lang - Language code
 * @returns Post with HTML content or null if not found
 */
export async function getPostBySlug(slug: string, lang: Language): Promise<PostWithHtml | null> {
  const files = collectPostFiles(contentDirectory);

  for (const file of files) {
    if (file.slug === slug && file.lang === lang) {
      const post = readPostFile(file.filePath, file.category, {
        slug: file.slug,
        lang: file.lang,
      });
      if (!post) continue;
      const html = await markdownToHtml(post.content);
      return { ...post, html };
    }
  }

  return null;
}

/**
 * Get all posts in a specific category
 * @param category - Category slug
 * @param lang - Language code
 * @returns Array of posts in the category
 */
export function getPostsByCategory(category: string, lang: Language): Post[] {
  const allPosts = getAllPosts(lang);
  return allPosts.filter(post => post.frontmatter.category === category);
}

/**
 * Get all categories with post counts
 * @returns Array of categories
 */
export function getCategories(): Category[] {
  const files = collectPostFiles(contentDirectory);
  const categoryCounts = new Map<string, Set<string>>();

  for (const file of files) {
    if (!categoryCounts.has(file.category)) {
      categoryCounts.set(file.category, new Set<string>());
    }
    categoryCounts.get(file.category)!.add(file.slug);
  }

  return Array.from(categoryCounts.entries()).map(([category, slugs]) => ({
    name: category,
    slug: category,
    postCount: slugs.size,
  }));
}

/**
 * Get hierarchical category tree with post counts
 * @param lang - Language code
 * @returns Array of root-level category nodes
 */
export function getCategoryTree(lang: Language): CategoryNode[] {
  const allPosts = getAllPosts(lang);
  const categoryMap = new Map<string, CategoryNode>();

  // Build tree from category paths
  for (const post of allPosts) {
    const categoryPath = post.frontmatter.category;
    const parts = categoryPath.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!categoryMap.has(currentPath)) {
        const node: CategoryNode = {
          name: part,
          slug: currentPath,
          count: 0,
          children: [],
        };
        categoryMap.set(currentPath, node);

        // Link to parent
        if (parentPath) {
          const parent = categoryMap.get(parentPath);
          if (parent && !parent.children.find(c => c.slug === currentPath)) {
            parent.children.push(node);
          }
        }
      }
    }

    // Increment count for the full category path
    const leafCategory = categoryMap.get(categoryPath);
    if (leafCategory) {
      leafCategory.count++;
    }
  }

  // Propagate counts up the tree (parent counts include children)
  function propagateCounts(node: CategoryNode): number {
    let total = node.count;
    for (const child of node.children) {
      total += propagateCounts(child);
    }
    node.count = total;
    return total;
  }

  // Return root-level categories
  const roots = Array.from(categoryMap.values()).filter(
    node => !node.slug.includes('/')
  );

  // Propagate counts for each root
  roots.forEach(root => propagateCounts(root));

  return roots;
}

/**
 * Get the pinned post for a language
 * Returns the most recent pinned post, or the most recent post if none are pinned
 * @param lang - Language code
 * @returns Post with HTML content or null if no posts exist
 */
export async function getPinnedPost(lang: Language): Promise<PostWithHtml | null> {
  const allPosts = getAllPosts(lang);

  // Find pinned posts
  const pinnedPosts = allPosts.filter(post => post.frontmatter.pinned === true);

  if (pinnedPosts.length > 0) {
    // Return most recent pinned post (already sorted by date)
    return getPostBySlug(pinnedPosts[0].slug, lang);
  }

  // Fallback to most recent post
  if (allPosts.length > 0) {
    return getPostBySlug(allPosts[0].slug, lang);
  }

  return null;
}

/**
 * Get featured posts
 * @param lang - Language code
 * @param limit - Maximum number of posts to return
 * @returns Array of featured posts
 */
export function getFeaturedPosts(lang: Language, limit?: number): Post[] {
  const allPosts = getAllPosts(lang);
  const featured = allPosts.filter(post => post.frontmatter.featured);

  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get recent posts
 * @param lang - Language code
 * @param limit - Maximum number of posts to return
 * @returns Array of recent posts
 */
export function getRecentPosts(lang: Language, limit: number = 10): Post[] {
  const allPosts = getAllPosts(lang);
  return allPosts.slice(0, limit);
}

/**
 * Check if a post exists in a specific language
 * @param slug - Post slug
 * @param lang - Language code
 * @returns True if post exists
 */
export function postExists(slug: string, lang: Language): boolean {
  const files = collectPostFiles(contentDirectory);

  for (const file of files) {
    if (file.slug === slug && file.lang === lang) {
      return true;
    }
  }

  return false;
}

/**
 * Get the alternate language version of a post
 * @param slug - Post slug
 * @param currentLang - Current language
 * @returns The other language if post exists, null otherwise
 */
export function getAlternateLanguage(slug: string, currentLang: Language): Language | null {
  const otherLang = currentLang === 'en' ? 'ko' : 'en';
  return postExists(slug, otherLang) ? otherLang : null;
}

/**
 * Get intro/landing page content
 * @param lang - Language code
 * @returns HTML content for the intro section
 */
export async function getIntroContent(lang: Language): Promise<string> {
  const introPath = path.join(contentDirectory, `intro-${lang}.md`);

  try {
    const fileContent = fs.readFileSync(introPath, 'utf-8');
    const { content } = parseMarkdown(fileContent);
    const html = await markdownToHtml(content);
    return html;
  } catch (error) {
    // Return empty string if intro file doesn't exist
    return '';
  }
}

/**
 * Get standalone page content from [page] directories
 * @param pageName - Name of the page (e.g., 'about')
 * @param lang - Language code
 * @returns HTML content and title, or null if not found
 */
export async function getPageContent(
  pageName: string,
  lang: Language
): Promise<{ html: string; title: string } | null> {
  const pagePath = path.join(contentDirectory, `[page]${pageName}`, `${pageName}-${lang}.md`);

  try {
    const fileContent = fs.readFileSync(pagePath, 'utf-8');
    const { content, data } = parseMarkdown(fileContent);
    const html = await markdownToHtml(content);

    return {
      html,
      title: data.title || pageName,
    };
  } catch (error) {
    return null;
  }
}
