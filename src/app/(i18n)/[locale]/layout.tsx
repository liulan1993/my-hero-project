import { NextIntlClientProvider, useMessages } from 'next-intl';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 字体配置保持不变
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 元数据保持不变
export const metadata: Metadata = {
  title: "Apex",
  description: "Apex",
};

// 使用一个最标准、最不可能引起冲突的 props 类型定义
interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

// 注意：这个组件现在不再需要是 async 的了
export default function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  // `useMessages` 是一个在服务端组件中更简洁地获取翻译内容的方式
  const messages = useMessages();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
