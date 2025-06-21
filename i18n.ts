import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// 定义支持的语言列表
const locales = ['en', 'zh', 'ja', 'ko', 'ru', 'fr'];

export default getRequestConfig(async ({locale}) => {
  // 验证传入的 locale 是否有效
  if (!locales.includes(locale as any)) {
      notFound();
  }

  let messages;
  try {
    // 动态导入对应语言的翻译文件
    messages = (await import(`./messages/${locale}.json`)).default;
  } catch (error) {
    // 如果加载失败，在Vercel的日志中打印详细错误
    console.error(`无法加载语言文件: ${locale}.json`, error);
    // 提供一个空对象作为后备，防止整个应用崩溃
    messages = {}; 
  }

  // --- 这是最终的修复 ---
  // 我们使用类型断言 (as string) 来明确告诉 TypeScript，
  // 经过我们的验证逻辑后，locale 变量肯定是一个字符串。
  // 这将解决顽固的类型不兼容问题。
  return {
    locale: locale as string,
    messages
  };
});
