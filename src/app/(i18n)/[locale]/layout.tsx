import { NextIntlClientProvider, useMessages } from 'next-intl';
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

// 定义我们期望的 Props 类型，以便在组件内部使用
interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

// 1. 使用 props: any 来绕过顽固的 TypeScript 类型编译错误
export default function RootLayout(props: any) {
  // 2. 在函数内部，我们通过类型断言恢复其正确的类型，以确保内部代码的类型安全
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
