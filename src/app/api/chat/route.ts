import { NextRequest } from 'next/server';

// 定义从前端接收的消息和选项的类型 (无修改)
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

// Tavily API 搜索函数 (无修改)
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

// [最终修复] 手动实现流式响应解析，不再依赖 'ai' 库的辅助函数
function createDeepSeekStream(apiResponse: Response): ReadableStream {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
        async start(controller) {
            const reader = apiResponse.body!.getReader();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    controller.close();
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(line.substring(6));
                            if (json.choices && json.choices[0].delta.content) {
                                const content = json.choices[0].delta.content;
                                controller.enqueue(encoder.encode(content));
                            }
                        } catch (e) {
                            console.error('Error parsing stream JSON', e);
                        }
                    }
                }
            }
        },
    });
}


// 主 API 路由处理函数
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, options }: { messages: Message[], options: RequestOptions } = body;

        const { model, enableWebSearch, enableDeepSearch, enableMarkdownOutput, fileContent } = options;

        const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            return new Response('DeepSeek API key not configured', { status: 500 });
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
            max_tokens: 8192,
            stream: true, 
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
            const errorText = await response.text();
            return new Response(errorText, { status: response.status });
        }
        
        // [最终修复] 使用我们自己创建的解析器来处理流
        const stream = createDeepSeekStream(response);
        
        // 直接返回一个标准的、可流式读取的 Response
        return new Response(stream, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('API Route Error:', errorMessage);
        return new Response(errorMessage, { status: 500 });
    }
}