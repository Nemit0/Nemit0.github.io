import { type Language, languages } from './i18n';

export function buildCategoryHref(lang: Language, categorySlug: string): string {
  const encodedSlug = categorySlug
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `/${lang}/category/${encodedSlug}`;
}

export function replaceLanguageInPath(pathname: string, newLang: Language): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && languages.includes(segments[0] as Language)) {
    segments[0] = newLang;
    return `/${segments.join('/')}`;
  }

  const suffix = segments.length > 0 ? `/${segments.join('/')}` : '';
  return `/${newLang}${suffix}`;
}
