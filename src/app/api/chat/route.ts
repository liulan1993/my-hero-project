import { NextRequest, NextResponse } from 'next/server';

// 定义从前端接收的消息和选项的类型
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface RequestOptions {
    model: string;
    enableWebSearch: boolean;
    enableDeepSearch: boolean;
    enableMarkdownOutput: boolean;
    fileContent: string;
}

// Tavily API 搜索函数
// 已修正：现在失败时会抛出错误，而不是返回字符串
async function tavilySearch(query: string): Promise<string> {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    if (!TAVILY_API_KEY) {
        throw new Error('Tavily API key is not configured on the server.');
    }
    
    const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: query,
            search_depth: 'advanced',
            max_results: 5,
            include_answer: false,
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavily API responded with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return data.results.map((r: { content: string }) => r.content).join('\n\n');
}

// 主 API 路由处理函数
export async function POST(req: NextRequest) {
    // 已修正：将整个逻辑包裹在try/catch中，确保任何错误都能被捕获并以JSON格式返回
    try {
        const body = await req.json();
        const { messages, options }: { messages: Message[], options: RequestOptions } = body;

        const { model, enableWebSearch, enableDeepSearch, enableMarkdownOutput, fileContent } = options;

        const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            return NextResponse.json({ error: 'DeepSeek API key not configured' }, { status: 500 });
        }

        const latestUserMessage = messages[messages.length - 1];
        let userQuery = latestUserMessage.content;

        if (fileContent) {
            userQuery = `基于以下文件内容:\n"""\n${fileContent}\n"""\n\n请回答这个问题: ${userQuery}`;
        }
        
        messages[messages.length - 1].content = userQuery;

        const currentDate = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        let systemContent = `你是一个强大的人工智能助手。当前日期和时间是: ${currentDate}。`;

        if (enableWebSearch) {
            const searchResults = await tavilySearch(latestUserMessage.content);
            systemContent = `你是一个非常强大的人工智能助手，能够访问实时互联网。当前准确日期和时间是: ${currentDate}。
            这是关于用户问题的实时网络搜索结果摘要:
            ---
            ${searchResults}
            ---
            请你务必基于以上提供的实时网络信息，而不是你的内部知识，来全面、准确地回答用户的问题。`;
        }
        
        const systemMessage: Message = { role: 'system', content: systemContent };
        
        const messagesToSend: Message[] = [systemMessage, ...messages];
        
        if (enableMarkdownOutput) {
            messagesToSend[messagesToSend.length - 1].content += "\n\n(请用Markdown语法格式化输出，并将最终结果放入一个代码块中)";
        }
        
        const payload = {
            model: model,
            messages: messagesToSend,
            temperature: 1.0,
            max_tokens: 8192, // 已修正: 将 max_tokens 的值调整为 API 允许的最大值
            search: enableWebSearch, 
        };

        if (enableDeepSearch) {
            // 在此添加深度搜索相关的任何特定API参数
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'DeepSeek API request failed');
        }
        
        const data = await response.json();
        const assistantReply = data.choices[0].message;

        const cleanAssistantMessage: Message = {
            role: 'assistant',
            content: assistantReply.content
        };

        return NextResponse.json(cleanAssistantMessage);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('API Route Error:', errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
