import { kv } from '@vercel/kv';
import { NextResponse as SubmitNextResponse } from 'next/server';

export async function POST(request: Request): Promise<SubmitNextResponse> {
    try {
        // 修改：接收 fileUrls 数组而不是单个 fileUrl
        const { content, fileUrls, userId } = await request.json();

        if (!userId) {
            return SubmitNextResponse.json({ message: '用户ID是必需的' }, { status: 400 });
        }
        // 修改：检查文件数组是否为空
        if (!content && (!fileUrls || fileUrls.length === 0)) {
            return SubmitNextResponse.json({ message: '内容和文件不能都为空' }, { status: 400 });
        }
        
        const submissionId = `submission:${userId}:${Date.now()}`;
        
        const submissionData = {
            content,
            fileUrls, // 修改：存储文件URL数组
            userId,
            createdAt: new Date().toISOString(),
        };

        await kv.set(submissionId, JSON.stringify(submissionData));

        return SubmitNextResponse.json({ message: '稿件提交成功！' }, { status: 200 });

    } catch (error) {
        console.error('提交失败:', error);
        return SubmitNextResponse.json({ message: '服务器内部错误' }, { status: 500 });
    }
}
