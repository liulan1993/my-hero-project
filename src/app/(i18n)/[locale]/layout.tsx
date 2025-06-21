// 导入国际化和字体所需的所有模块
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // 保留您原来的字体导入
import "./globals.css";

// 保留您原来的字体配置
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 保留您原来的元数据（Metadata）
export const metadata: Metadata = {
  title: "Apex",
  description: "Apex",
};

// 定义 props 类型，增加 locale 参数
interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

// 将函数转换为 async 以便使用 await getMessages()
export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  // 从服务器获取对应语言的翻译消息
  const messages = await getMessages();

  return (
    // 将 'lang' 属性动态设置为当前语言
    <html lang={locale}>
      {/* 保留您原来的 body className，以确保字体变量和样式被正确应用
      */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 使用 NextIntlClientProvider 包裹 children，
          并将获取到的 messages 和 locale 传递下去，
          这样所有客户端组件都能获取到翻译。
        */}
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
