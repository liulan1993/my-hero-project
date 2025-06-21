import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 统一的 Vercel KV 客户端创建
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('缺少必需的 Vercel KV REST API 环境变量。');
}
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// 将两个 POST 函数的逻辑合并到同一个函数中
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // 逻辑“求和”：通过判断 body 的内容来区分不同的提交类型

        // 如果 body 包含 id 和 services，则认为是第一种提交
        if (body.id && Array.isArray(body.services) && body.formData) {
            const submissionKey = `submission:${body.id}`;
            const dataToStore = {
                services: body.services,
                formData: body.formData,
                submittedAt: new Date().toISOString(),
            };

            await kv.set(submissionKey, JSON.stringify(dataToStore));
            return NextResponse.json({ message: "Success", submissionId: body.id });
        }
        
        // 如果 body 包含 userId，则认为是第二种提交
        else if (body.userId) {
            if (!body.content && !body.fileUrl) {
                return NextResponse.json({ message: '内容和文件不能都为空' }, { status: 400 });
            }
            
            const submissionId = `submission:${body.userId}:${Date.now()}`;
            const submissionData = {
                content: body.content,
                fileUrl: body.fileUrl,
                userId: body.userId,
                createdAt: new Date().toISOString(),
            };

            await kv.set(submissionId, JSON.stringify(submissionData));
            return NextResponse.json({ message: '稿件提交成功！' }, { status: 200 });
        }
        
        // 如果两种都不是，返回错误
        else {
            return NextResponse.json({ error: '无法识别的请求格式' }, { status: 400 });
        }

    } catch (error: unknown) {
        // 统一的错误处理
        console.error("Redis 提交错误:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}