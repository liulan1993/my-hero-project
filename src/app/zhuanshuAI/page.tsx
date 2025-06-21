"use client"; // 声明为客户端组件，因为我们使用了 hooks

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';


// --- 图标组件 (无修改) ---
const PaperclipIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.59a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);


// --- 背景动画组件 (无修改) ---
const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;

    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);

    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            <meshPhysicalMaterial 
                color="#232323"
                metalness={1}
                roughness={0.3}
                reflectivity={0.5}
                ior={1.5}
                emissive="#000000"
                emissiveIntensity={0}
                transparent={false}
                opacity={1.0}
                transmission={0.0}
                thickness={0.5}
                clearcoat={0.0}
                clearcoatRoughness={0.0}
                sheen={0}
                sheenRoughness={1.0}
                sheenColor="#ffffff"
                specularIntensity={1.0}
                specularColor="#ffffff"
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
                flatShading={false}
            />
        </mesh>
    );
};

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    const boxes = Array.from({ length: 50 }, (_, index) => ({
        position: [(index - 25) * 0.75, 0, 0] as [number, number, number],
        rotation: [ (index - 10) * 0.1, Math.PI / 2, 0 ] as [number, number, number],
        id: index
    }));

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box
                    key={box.id}
                    position={box.position}
                    rotation={box.rotation}
                />
            ))}
        </group>
    );
};

const Scene = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
                <ambientLight intensity={15} />
                <directionalLight position={[10, 10, 5]} intensity={15} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};


// --- 聊天窗口组件 (已修改) ---
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-snippet.${match ? match[1] : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return !inline && match ? (
        <div className="relative my-4 rounded-lg bg-gray-800 text-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-700 rounded-t-lg">
                <span className="text-gray-300 text-xs">{match[1]}</span>
                <div className="flex items-center gap-x-2">
                    <button onClick={handleCopy} className="p-1 text-gray-300 hover:text-white transition-colors">
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                    </button>
                    <button onClick={handleDownload} className="p-1 text-gray-300 hover:text-white transition-colors">
                       <DownloadIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className="bg-gray-200 text-red-600 px-1 rounded-sm" {...props}>
            {children}
        </code>
    );
};

function ChatWindow() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [enableDeepSearch, setEnableDeepSearch] = useState(false);
    const [enableWebSearch, setEnableWebSearch] = useState(false);
    const [enableMarkdownOutput, setEnableMarkdownOutput] = useState(false);
    const [selectedModel, setSelectedModel] = useState('deepseek-chat');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleSendMessage = async () => {
        if ((!input.trim() && !selectedFile) || isLoading) return;
        setIsLoading(true);

        const newUserMessage: Message = { role: 'user', content: input };
        const currentMessages = [...messages, newUserMessage];
        setMessages(currentMessages);

        let fileContent = '';
        if (selectedFile) {
            try {
                fileContent = await selectedFile.text();
            } catch (error) {
                console.error("Error reading file:", error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setMessages(prev => [...prev, { role: 'assistant', content: `抱歉，读取文件失败: ${errorMessage}` }]);
                setIsLoading(false);
                return;
            }
        }
        
        setInput('');
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = '';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentMessages, // 使用包含当前用户输入的消息列表
                    options: {
                        model: selectedModel,
                        enableWebSearch,
                        enableDeepSearch,
                        enableMarkdownOutput,
                        fileContent,
                    },
                }),
            });

            if (!response.ok) {
                // 尝试解析错误信息的JSON体
                const errorData = await response.json().catch(() => ({
                    // 如果解析失败，提供一个备用错误信息
                    error: `后端API请求失败，状态码: ${response.status}`
                }));
                throw new Error(errorData.error || '后端API请求失败');
            }
            
            const assistantMessage = await response.json();
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Error calling backend API:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setMessages(prev => [...prev, { role: 'assistant', content: `抱歉，出错了: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col w-[90vw] max-w-3xl h-[75vh] max-h-[700px] bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 overflow-hidden"
        >
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex my-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`rounded-lg px-4 py-2 max-w-lg whitespace-pre-wrap shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-800'}`}>
                                {msg.role === 'assistant' && enableMarkdownOutput ? (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                code: ({node, inline, className, children, ...props}) => <CodeBlock inline={inline} className={className} {...props}>{children}</CodeBlock>
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    msg.content
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start my-3">
                            <div className="rounded-lg px-4 py-2 max-w-lg bg-gray-50 text-gray-800 shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 bg-transparent border-t border-black/10">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-2">
                        <div className="flex items-center space-x-2">
                            {/* [修复] 根据图片要求，将标签文字颜色改为 text-black */}
                            <label htmlFor="model-select" className="text-sm font-medium text-black">模型:</label>
                            <select id="model-select" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white/80">
                                <option value="deepseek-chat">DeepSeek-V3</option>
                                <option value="deepseek-reasoner">DeepSeek-R1</option>
                            </select>
                        </div>
                        <label htmlFor="deep-search-toggle" className="flex items-center cursor-pointer">
                             {/* [修复] 根据图片要求，将标签文字颜色改为 text-black */}
                            <span className="mr-2 text-sm font-medium text-black">深度搜索:</span>
                            <div className="relative">
                                <input id="deep-search-toggle" type="checkbox" className="sr-only peer" checked={enableDeepSearch} onChange={() => setEnableDeepSearch(!enableDeepSearch)} />
                                <div className="block bg-gray-200/80 w-10 h-6 rounded-full peer-checked:bg-blue-500 transition"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4`}></div>
                            </div>
                        </label>
                        <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer">
                             {/* [修复] 根据图片要求，将标签文字颜色改为 text-black */}
                            <span className="mr-2 text-sm font-medium text-black">联网搜索:</span>
                            <div className="relative">
                                <input id="web-search-toggle" type="checkbox" className="sr-only peer" checked={enableWebSearch} onChange={() => setEnableWebSearch(!enableWebSearch)} />
                                <div className="block bg-gray-200/80 w-10 h-6 rounded-full peer-checked:bg-blue-500 transition"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4`}></div>
                            </div>
                        </label>
                        <label htmlFor="markdown-toggle" className="flex items-center cursor-pointer">
                             {/* [修复] 根据图片要求，将标签文字颜色改为 text-black */}
                            <span className="mr-2 text-sm font-medium text-black">Markdown输出:</span>
                            <div className="relative">
                                <input id="markdown-toggle" type="checkbox" className="sr-only peer" checked={enableMarkdownOutput} onChange={() => setEnableMarkdownOutput(!enableMarkdownOutput)} />
                                <div className="block bg-gray-200/80 w-10 h-6 rounded-full peer-checked:bg-blue-500 transition"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4`}></div>
                            </div>
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-white/50 focus:outline-none">
                            <PaperclipIcon className="w-5 h-5"/>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="在此输入您的问题..." rows={1} className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white/80" disabled={isLoading}/>
                        <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !selectedFile)} className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-blue-300 disabled:cursor-not-allowed">
                            {isLoading ? '发送中...' : '发送'}
                        </button>
                    </div>
                    {selectedFile && (
                        <div className="mt-2 text-sm text-gray-600 flex items-center">
                            <span>已选择: {selectedFile.name}</span>
                            <button onClick={() => {setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = '';}} className="ml-2 text-red-500 hover:text-red-700"><XIcon className="w-4 h-4"/></button>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}


// --- 主页面组件 (无修改) ---
export default function Home() {
    const title = "Apex—DeepSeek";
    const words = title.split(" ");
  
    return (
        <main 
            className="relative w-screen h-screen overflow-hidden bg-[#000] text-white"
            style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}
        >
            <Scene />

            <div className="relative w-full h-full flex flex-col items-center justify-center z-10 p-4 overflow-y-auto">
                <div className="text-center flex-shrink-0">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} className="max-w-4xl mx-auto">
                        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-4 tracking-tighter">
                            {words.map((word, wordIndex) => (
                                <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                                    {word.split("").map((letter, letterIndex) => (
                                        <motion.span
                                            key={`${wordIndex}-${letterIndex}`}
                                            initial={{ y: 100, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: wordIndex * 0.1 + letterIndex * 0.03, type: "spring", stiffness: 150, damping: 25 }}
                                            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-400"
                                        >
                                            {letter}
                                        </motion.span>
                                    ))}
                                </span>
                            ))}
                        </h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.8, duration: 1.2 }} 
                            className="text-lg md:text-xl text-neutral-400 mt-4 max-w-2xl mx-auto"
                        >
                            Apex专属满血版DeepSeek，独立运营，不卡顿。
                        </motion.p>
                    </motion.div>
                </div>
                <div className="mt-8">
                    <ChatWindow />
                </div>
            </div>
        </main>
    );
}