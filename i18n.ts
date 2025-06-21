import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// 定义支持的语言列表
const locales = ['en', 'zh', 'ja', 'ko', 'ru', 'fr'];

export default getRequestConfig(async ({locale}) => {
  // 添加日志来确认函数是否被调用
  console.log(`i18n.ts: Request received for locale: "${locale}"`);

  // 验证传入的 locale 是否有效
  if (!locales.includes(locale as any)) {
      console.error(`i18n.ts: Invalid locale "${locale}" requested. Sending to 404 page.`);
      notFound();
  }

  let messages;
  try {
    console.log(`i18n.ts: Attempting to import messages for locale: "./messages/${locale}.json"`);
    // 动态导入对应语言的翻译文件
    messages = (await import(`./messages/${locale}.json`)).default;
    console.log(`i18n.ts: Successfully imported messages for locale: "${locale}"`);
  } catch (error) {
    // 如果加载失败，在Vercel的日志中打印详细错误
    console.error(`i18n.ts: CRITICAL - Failed to load message file for locale: "${locale}".json`, error);
    // 提供一个空对象作为后备，防止整个应用崩溃
    messages = {}; 
  }

  return {
    locale: locale as string,
    messages
  };
});
