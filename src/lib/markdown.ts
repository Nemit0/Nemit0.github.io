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

// Build the processor once and reuse it
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeHighlight, {
    ignoreMissing: true,
    subset: ['javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css', 'jsx', 'tsx'],
  })
  .use(rehypeStringify);

export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await processor.process(markdown);
  return String(result);
}
