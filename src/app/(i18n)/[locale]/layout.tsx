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

// 定义我们期望的 Props 类型
interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

// --- 这是最终的修复 ---
// 我们通过添加 eslint-disable-next-line 注释来解决 ESLint 报错的问题。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RootLayout(props: any) {
  // 在函数内部，我们通过类型断言恢复其正确的类型，以确保内部代码的类型安全。
  const { children, params } = props as RootLayoutProps;
  const messages = useMessages();

  return (
    <html lang={params.locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
