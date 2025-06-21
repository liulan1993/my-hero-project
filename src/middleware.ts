import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // 支持的所有语言列表
  locales: ['en', 'zh', 'ja', 'ko', 'ru', 'fr'],

  // 当没有匹配的语言时使用的默认语言
  defaultLocale: 'zh',

  // 始终显示语言前缀，例如 /zh 或 /en
  localePrefix: 'always'
});

export const config = {
  // 仅对国际化的路径名进行匹配
  // 跳过 /api/ 开头的路径，确保API功能不受影响
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};