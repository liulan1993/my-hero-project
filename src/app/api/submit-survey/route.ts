// 文件路径: app/api/submit-survey/route.ts
// [备用方案] 这个版本适用于 Vercel KV 数据库。

import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log("KV API路由被调用 /api/submit-survey");

  try {
    console.log("正在解析请求中的JSON数据...");
    const data = await request.json();
    const { id, submittedAt, answers } = data;
    console.log("成功解析数据, ID:", id);

    // 验证数据是否存在
    if (!id || !submittedAt || !answers) {
      console.error('验证失败: 缺少必要的数据字段。');
      return NextResponse.json(
        { message: '缺少 ID, submittedAt, 或 answers 数据' },
        { status: 400 }
      );
    }

    // 将整个提交对象作为值，以UUID作为键，存入KV存储
    // Vercel KV 会自动处理对象的序列化
    console.log(`正在向KV数据库写入数据, Key: survey_${id}`);
    await kv.set(`survey_${id}`, data);
    console.log("KV数据写入成功！");

    // 返回成功响应
    console.log("操作成功, 返回200状态码。");
    return NextResponse.json({ message: '问卷提交成功' }, { status: 200 });

  } catch (error) {
    console.error('KV API路由执行过程中发生错误:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { message: '服务器内部错误', error: errorMessage },
      { status: 500 }
    );
  }
}
