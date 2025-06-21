import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex",
  description: "Apex",
};

// 定义支持的语言列表
const locales = ['en', 'zh', 'ja', 'ko', 'ru', 'fr'];

interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  // 验证语言参数是否有效
  if (!locales.includes(locale)) {
    notFound();
  }
  
  let messages;
  try {
    // 我们在这里直接、手动地加载对应语言的JSON文件
    // 这是最核心的改动，彻底绕开了所有配置文件的问题
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error("无法加载翻译文件:", error);
    // 如果加载失败，提供一个空对象以防止应用崩溃
    messages = {};
  }

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
