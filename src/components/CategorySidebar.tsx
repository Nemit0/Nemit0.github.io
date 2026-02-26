'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Language } from '@/lib/i18n';
import { type CategoryNode } from '@/types/post';
import { buildCategoryHref } from '@/lib/paths';

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
  const paddingLeft = 0.75 + level * 1;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-blue-50 dark:bg-blue-950/40'
            : 'hover:bg-stone-100 dark:hover:bg-stone-800/60'
        }`}
        style={{ paddingLeft: `${paddingLeft}rem` }}
      >
        {hasChildren && (
          <button
            onClick={() => toggleExpand(node.slug)}
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name} category`}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded transition-colors cursor-pointer"
          >
            <svg className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {!hasChildren && <span className="w-4 h-4 flex-shrink-0" aria-hidden="true" />}

        <Link
          href={buildCategoryHref(lang, node.slug)}
          className={`
            flex-1 text-[13px] leading-snug cursor-pointer
            ${
              isActive
                ? 'font-semibold text-blue-600 dark:text-blue-400'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }
            transition-colors
          `}
        >
          {node.name}
          <span className={`ml-1 text-[11px] ${isActive ? 'text-blue-400 dark:text-blue-500' : 'text-stone-400 dark:text-stone-600'}`}>({node.count})</span>
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
      <div className="h-4" aria-hidden="true" />
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-3 text-stone-400 dark:text-stone-500">
        Categories
      </h2>
      <div className="space-y-0.5">
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
    fixed top-0 left-0 z-50 w-64 h-full bg-white dark:bg-neutral-900 p-4 overflow-y-auto md:hidden
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
            p-2 rounded-lg text-stone-600 dark:text-stone-400
            hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
          aria-label="Toggle category menu"
          aria-expanded={isMobileOpen}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
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
          hidden md:block w-56 lg:w-60 border-r border-stone-200 dark:border-stone-800
          self-stretch
          ${className}
        `}
      >
        <div className="sticky top-[3.5rem] max-h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200"
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
          className="absolute top-3 right-3 p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200 focus:outline-none transition-colors"
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
