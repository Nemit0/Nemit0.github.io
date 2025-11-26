import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';

export interface MarkdownData {
  content: string;
  data: {
    title?: string;
    description?: string;
    date?: string;
    category?: string;
    tags?: string[];
    author?: string;
    featured?: boolean;
    image?: string;
    [key: string]: any;
  };
}

/**
 * Parse markdown file content and extract frontmatter
 * @param fileContent - Raw markdown file content with frontmatter
 * @returns Parsed frontmatter data and content
 */
export function parseMarkdown(fileContent: string): MarkdownData {
  const { data, content } = matter(fileContent);

  return {
    content,
    data,
  };
}

/**
 * Convert markdown content to HTML string
 * Supports:
 * - GitHub Flavored Markdown (tables, task lists, strikethrough)
 * - Math equations (LaTeX with KaTeX)
 * - Code syntax highlighting
 *
 * @param markdown - Markdown content (without frontmatter)
 * @returns HTML string
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse) // Parse markdown to AST
    .use(remarkGfm) // Support GitHub Flavored Markdown
    .use(remarkMath) // Parse LaTeX math notation
    .use(remarkRehype) // Convert markdown AST to HTML AST
    .use(rehypeKatex) // Render math equations with KaTeX
    .use(rehypeHighlight, {
      // Configure syntax highlighting
      ignoreMissing: true,
      subset: ['javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css', 'jsx', 'tsx']
    })
    .use(rehypeStringify) // Convert HTML AST to string
    .process(markdown);

  return String(result);
}

/**
 * Process a complete markdown file (with frontmatter) to HTML
 * @param fileContent - Complete markdown file content
 * @returns Frontmatter data and HTML content
 */
export async function processMarkdownFile(fileContent: string): Promise<{
  html: string;
  data: MarkdownData['data'];
}> {
  const { content, data } = parseMarkdown(fileContent);
  const html = await markdownToHtml(content);

  return {
    html,
    data,
  };
}
