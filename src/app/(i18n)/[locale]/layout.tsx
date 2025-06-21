import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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

// --- 这是本次的修改 ---
// 1. 我们不再显式定义整个props的类型，而是让TypeScript自动推断。
// 2. 我们在函数内部直接解构和使用 props，保证类型安全。
// 3. 修正了NextIntlClientProvider缺少 locale prop的错误。
export default async function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { children, params } = props;
  const messages = await getMessages();

  return (
    <html lang={params.locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
