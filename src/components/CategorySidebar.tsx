'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Language } from '@/lib/i18n';
import { type CategoryNode } from '@/types/post';

interface CategorySidebarProps {
  lang: Language;
  categories: CategoryNode[];
  currentCategory?: string;
  className?: string;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  showInternalMobileTrigger?: boolean;
}

interface CategoryItemProps {
  node: CategoryNode;
  lang: Language;
  currentCategory?: string;
  level: number;
  expandedCategories: Set<string>;
  toggleExpand: (slug: string) => void;
}

function CategoryItem({
  node,
  lang,
  currentCategory,
  level,
  expandedCategories,
  toggleExpand,
}: CategoryItemProps) {
  const isExpanded = expandedCategories.has(node.slug);
  const hasChildren = node.children.length > 0;
  const isActive = currentCategory === node.slug;
  const paddingLeft = 0.5 + level * 1.25;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        style={{ paddingLeft: `${paddingLeft}rem` }}
      >
        {hasChildren && (
          <button
            onClick={() => toggleExpand(node.slug)}
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name} category`}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {isExpanded ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <span className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}

        <Link
          href={`/${lang}/category/${node.slug
            .split('/')
            .map(encodeURIComponent)
            .join('/')}`}
          className={`
            flex-1 text-sm
            ${
              isActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }
          `}
        >
          {node.name} ({node.count})
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div role="group" aria-label={`${node.name} subcategories`}>
          {node.children.map((child) => (
            <CategoryItem
              key={child.slug}
              node={child}
              lang={lang}
              currentCategory={currentCategory}
              level={level + 1}
              expandedCategories={expandedCategories}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategorySidebar({
  lang,
  categories,
  currentCategory,
  className = '',
  mobileOpen,
  onMobileOpenChange,
  showInternalMobileTrigger = true,
}: CategorySidebarProps) {
  // Default: expand all root-level categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.slug))
  );
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const isMobileOpen = mobileOpen ?? internalMobileOpen;
  const setIsMobileOpen = (open: boolean) => {
    onMobileOpenChange?.(open);
    if (mobileOpen === undefined) {
      setInternalMobileOpen(open);
    }
  };

  const toggleExpand = (slug: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const sidebarContent = (
    <nav aria-label="Category navigation" className="h-full">
      <div className="h-10" aria-hidden="true" />
      <h2 className="text-lg font-bold mb-4 px-2 text-gray-900 dark:text-white">Categories</h2>
      <div className="space-y-1">
        {categories.map((category) => (
          <CategoryItem
            key={category.slug}
            node={category}
            lang={lang}
            currentCategory={currentCategory}
            level={0}
            expandedCategories={expandedCategories}
            toggleExpand={toggleExpand}
          />
        ))}
      </div>
    </nav>
  );

  const mobilePanelClasses = `
    fixed top-0 left-0 z-50 w-64 h-full bg-white dark:bg-gray-900 p-4 overflow-y-auto md:hidden
    transform transition-transform duration-300 ease-in-out
    ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
  `;

  return (
    <>
      {/* Mobile hamburger button */}
      {showInternalMobileTrigger && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="
            md:hidden self-start ml-4 mt-3 mb-2 inline-flex items-center justify-center
            p-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          aria-label="Toggle category menu"
          aria-expanded={isMobileOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isMobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:block w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          self-stretch md:min-h-screen
          ${className}
        `}
      >
        <div className="sticky top-[4.5rem] max-h-[calc(100vh-4.5rem)] overflow-y-auto p-4">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-200"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        </>
      )}
      <aside
        className={mobilePanelClasses}
        role="dialog"
        aria-label="Category menu"
        aria-modal="true"
        aria-hidden={!isMobileOpen}
        tabIndex={isMobileOpen ? 0 : -1}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-3 right-3 p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close category menu"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
