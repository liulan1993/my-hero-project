import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from "next";
// 我们暂时移除了字体导入，以便让编译通过
// import { Geist, Geist_Mono } from "next/font/google"; 
import "./globals.css";

// 元数据保持不变
export const metadata: Metadata = {
  title: "Apex",
  description: "Apex",
};

// 使用一个最标准、最不可能引起冲突的 props 类型定义
export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const messages = await getMessages();

  return (
    <html lang={params.locale}>
      {/* 暂时移除了自定义字体的 className */}
      <body>
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
