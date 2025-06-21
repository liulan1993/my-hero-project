import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// 定义支持的语言列表
const locales = ['en', 'zh', 'ja', 'ko', 'ru', 'fr'];

export default getRequestConfig(async ({locale}) => {
  // 验证传入的 locale 是否有效
  if (!locales.includes(locale as any)) {
      notFound();
  }

  return {
    // 因为 i18n.ts 现在在 src 目录中，所以需要向上返回一级 (../) 才能找到 messages 文件夹
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
