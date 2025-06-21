import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// --- “去重”部分: 合并了所有需要的 import 和初始化 ---

// 使用一个自定义的字符集来生成随机ID (来自 route.ts)
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10 // ID 长度
);

// 统一的 runtime 配置
export const runtime = 'edge';

// --- “求和”部分: 将两个 POST 函数的逻辑合并到一个统一的、更健壮的函数中 ---
export async function POST(request: Request): Promise<NextResponse> {
  // 1. 使用 route.ts 中更健壮的环境变量检查
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "配置错误：缺少 BLOB_READ_WRITE_TOKEN 环境变量。" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // 2. 统一的输入验证，结合了两个文件的检查
  if (!filename) {
    return NextResponse.json(
      { error: '必须在 URL 中提供 filename 参数。' },
      { status: 400 }
    );
  }
  
  if (!request.body) {
    return NextResponse.json({ message: '没有要上传的文件。' }, { status: 400 });
  }

  // 3. 逻辑分支：通过一个新的查询参数 `overwrite=true` 来决定行为
  //    - 如果 `overwrite=true`，则使用原文件名 (route1.ts 的行为)
  //    - 否则，默认使用带随机前缀的文件名 (route.ts 的行为)
  const allowOverwrite = searchParams.get('overwrite') === 'true';
  const finalFilename = allowOverwrite ? filename : `${nanoid()}-${filename}`;

  try {
    // 4. 统一的上传调用，应用了 route.ts 的最佳实践 (如显式传递 token)
    const blob = await put(finalFilename, request.body, {
      access: 'public', // 设置为公开访问
      token: process.env.BLOB_READ_WRITE_TOKEN, // 显式传递 token 以增强安全性
    });

    return NextResponse.json(blob);

  } catch (error) {
    // 5. 统一的错误处理 (来自 route.ts)
    console.error("文件上传到 Blob 时出错:", error);
    const errorMessage = error instanceof Error ? error.message : "未知的上传错误。";
    return NextResponse.json(
      { error: `文件上传失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}