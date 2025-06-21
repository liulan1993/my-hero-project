import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// 定义支持的语言列表
const locales = ['en', 'zh', 'ja', 'ko', 'ru', 'fr'];

export default getRequestConfig(async ({locale}) => {
  // 验证传入的 locale 是否有效
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locales.includes(locale as any)) {
      notFound();
  }

  // --- 这是本次的最终修复 ---
  // 1. 我们必须返回一个包含 locale 和 messages 的对象。
  // 2. 我们使用类型断言 (as string) 来确保 locale 的类型是 string，
  //    以解决之前遇到的 "string | undefined" 的类型冲突。
  return {
    locale: locale as string, 
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
