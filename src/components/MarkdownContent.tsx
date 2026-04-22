'use client';

import { useEffect, useRef } from 'react';

interface MarkdownContentProps {
  html: string;
}

export default function MarkdownContent({ html }: MarkdownContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const codeBlocks = ref.current.querySelectorAll('pre code.language-mermaid');
    if (codeBlocks.length === 0) return;

    import('mermaid').then((mod) => {
      const mermaid = mod.default;
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'base',
        themeVariables: isDark ? {
          primaryColor: '#2d2d2d',
          primaryTextColor: '#e5e5e5',
          primaryBorderColor: '#555',
          lineColor: '#aaa',
          secondaryColor: '#3a3a3a',
          tertiaryColor: '#333',
          background: '#1c1917',
          mainBkg: '#2d2d2d',
          nodeBorder: '#555',
          clusterBkg: '#2d2d2d',
          titleColor: '#e5e5e5',
          edgeLabelBackground: '#2d2d2d',
          attributeBackgroundColorEven: '#2d2d2d',
          attributeBackgroundColorOdd: '#333',
        } : {
          primaryColor: '#f1f5f9',
          primaryTextColor: '#1e293b',
          primaryBorderColor: '#94a3b8',
          lineColor: '#64748b',
          secondaryColor: '#e2e8f0',
          tertiaryColor: '#f8fafc',
          background: '#ffffff',
          mainBkg: '#f1f5f9',
          nodeBorder: '#94a3b8',
          edgeLabelBackground: '#ffffff',
        },
      });

      codeBlocks.forEach(async (block, index) => {
        const pre = block.parentElement;
        if (!pre) return;

        const definition = block.textContent || '';
        const id = `mermaid-diagram-${Date.now()}-${index}`;

        try {
          const { svg } = await mermaid.render(id, definition);
          const container = document.createElement('div');
          container.className = 'mermaid-diagram';
          container.innerHTML = svg;
          pre.replaceWith(container);
        } catch (e) {
          console.error('Mermaid render error:', e);
        }
      });
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
