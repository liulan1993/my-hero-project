import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';

// 定义支持的语言列表
const locales = ['en', 'zh', 'ja', 'ko', 'ru', 'fr'];

export default getRequestConfig(async ({locale}) => {
  // 验证传入的 locale 是否有效。
  // 我们保留此处的 any 类型断言和 eslint-disable 注释，
  // 以解决之前在 Vercel 构建环境中遇到的顽固编译错误。
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // --- 这是最终的修复 ---
  // 1. 我们必须返回一个同时包含 locale 和 messages 的对象。
  // 2. 我们使用类型断言 (as string) 来明确告诉 TypeScript，
  //    经过我们的验证逻辑后，locale 变量肯定是一个字符串，
  //    这能彻底解决之前反复出现的 "string | undefined" 类型冲突。
  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
