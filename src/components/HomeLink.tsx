import Link from 'next/link';
import { FaHome } from 'react-icons/fa';
import { type Language } from '@/lib/i18n';

interface HomeLinkProps {
  lang: Language;
  floating?: boolean;
  className?: string;
}

export default function HomeLink({ lang, floating = true, className = '' }: HomeLinkProps) {
  const positioning = floating ? 'fixed top-4 left-4 z-50' : '';
  return (
    <Link
      href={`/${lang}`}
      aria-label="Go to home page"
      className={`
        inline-flex items-center justify-center h-10 w-10 rounded-md
        bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white shadow
        hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-500
        focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900
        ${positioning} ${className}
      `}
    >
      <FaHome />
    </Link>
  );
}
