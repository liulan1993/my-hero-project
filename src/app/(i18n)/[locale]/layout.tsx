import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // 恢复您原来的字体导入
import "./globals.css";

// 恢复您原来的字体配置
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

// 使用一个独立的 interface 来定义 Props，这是最稳健的方式
interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function RootLayout({
  children,
  params: { locale } // 在这里解构出 locale
}: RootLayoutProps) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      {/* 恢复您原来的 body className */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
