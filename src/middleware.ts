import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'zh', 'ja', 'ko', 'ru', 'fr'],
  defaultLocale: 'zh'
});

export const config = {
  matcher: ['/', '/((?!api|_next|.*\\..*).*)']
};