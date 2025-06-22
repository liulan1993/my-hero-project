"use client";

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- 数据区 ---
// 在这里添加您的文章。只需复制粘贴下面的对象结构即可添加新卡片。
// 每篇文章都是一个对象，包含一个 id 和 markdownContent。
const articles = [
    {
        id: 1,
        markdownContent: `
# 我的第一篇文章
![占位图片](https://placehold.co/600x400/1A2428/FFFFFF?text=文章封面)

这是文章的第一段。在这里，您可以详细阐述您的想法和观点。我们支持完整的 **Markdown** 语法。

## 次级标题

您可以添加列表：
- 重点一
- 重点二
- 重点三
![演示视频](https://www.w3schools.com/html/mov_bbb.mp4)
或者代码块:
\`\`\`javascript
console.log("Hello, World!");
\`\`\`

甚至是表格：

| 表头1 | 表头2 | 表头3 |
|-------|-------|-------|
| 内容1 | 内容2 | 内容3 |
| 内容A | 内容B | 内容C |
![技术图片](https://placehold.co/600x400/2A3438/FFFFFF?text=技术创新)
感谢阅读！
        `
    },
    {
        id: 2,
        markdownContent: `
# 关于技术创新
![技术图片](https://placehold.co/600x400/2A3438/FFFFFF?text=技术创新)

技术创新是推动社会进步的关键动力。在这篇文章中，我们将探讨最新的技术趋势及其对未来的影响。
![演示视频](https://www.w3schools.com/html/mov_bbb.mp4)
## 人工智能
人工智能正在改变各个行业，从医疗保健到金融服务。

## 区块链
区块链技术以其去中心化和安全的特性，为数字交易提供了新的可能性。

> “求知若饥，虚心若愚。” - 史蒂夫·乔布斯

`
    },
    {
        id: 3,
        markdownContent: `
# 生活随笔
![生活图片](https://placehold.co/600x400/3A4448/FFFFFF?text=生活点滴)

记录生活中的美好瞬间。

- 清晨的阳光
- 一杯香浓的咖啡
![技术图片](https://placehold.co/600x400/2A3438/FFFFFF?text=技术创新)
- 一本好书
![演示视频](https://www.w3schools.com/html/mov_bbb.mp4)
生活的美好在于发现。
`
    },
    {
        id: 4,
        markdownContent: `
# 项目回顾
![项目图片](https://placehold.co/600x400/4A5458/FFFFFF?text=项目回顾)

这个项目始于一个简单的想法，经过团队的不懈努力，最终得以实现。
![演示视频](https://www.w3schools.com/html/mov_bbb.mp4)
### 主要挑战
1. **技术选型**: 我们在React和Vue之间进行了艰难的选择。
2. **时间管理**: 项目周期紧张，需要高效的协作。
![技术图片](https://placehold.co/600x400/2A3438/FFFFFF?text=技术创新)
### 最终成果
我们成功地交付了一个高性能、高可用的产品。
`
    },
    {
        id: 5,
        markdownContent: `
# 新功能：支持视频播放！
![视频封面](https://placehold.co/600x400/5A6468/FFFFFF?text=视频封面)

现在，您可以在文章中嵌入视频。我们通过检查链接的后缀（如 .mp4）来自动渲染视频播放器。只需使用标准的图片语法即可！

![演示视频](https://www.w3schools.com/html/mov_bbb.mp4)

视频播放器支持基本的控制，如播放、暂停和全屏。这是一个非常强大的功能，可以让您的文章内容更加生动。
    `
    },
    // --- 在这里复制粘贴以上结构以添加更多文章 ---
];

// --- 辅助函数：从Markdown中解析标题和图片 ---
const parseMarkdownPreview = (content: string) => {
    // 匹配第一个Markdown标题 (e.g., # Title)
    const titleMatch = content.match(/^#\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : '无标题';

    // 匹配所有 Markdown 图片/视频语法 (e.g., ![alt](src))
    const allMatches = [...content.matchAll(/!\[.*?\]\((.*?)\)/g)];
    
    // 寻找第一个非视频的链接作为封面图
    const firstImage = allMatches.find(match => {
        const url = match[1];
        // [修复] 检查url是否为字符串，避免类型错误
        return typeof url === 'string' && !url.endsWith('.mp4') && !url.endsWith('.webm') && !url.endsWith('.ogg');
    });

    const imageUrl = firstImage ? firstImage[1] : null;

    return { title, imageUrl };
};


// --- 3D背景组件 (来自您的原始代码, 无改动) ---
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
        <mesh geometry={geometry} position={position} rotation={rotation}>
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
                <Box key={box.id} position={box.position} rotation={box.rotation} />
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

// --- 文章卡片组件 ---
const ArticleCard = ({ article, onClick }: { article: { id: number; markdownContent: string }, onClick: () => void }) => {
    const { title, imageUrl } = useMemo(() => parseMarkdownPreview(article.markdownContent), [article.markdownContent]);

    return (
        <div 
            className="bg-gray-800/50 backdrop-blur-md rounded-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 border border-gray-700/50"
            onClick={onClick}
        >
            {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-48 object-cover" onError={(e) => (e.currentTarget.src = "https://placehold.co/600x400?text=Image+Not+Found")}/>
            ) : (
                <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-400">无封面图片</span>
                </div>
            )}
            <div className="p-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
        </div>
    );
};

// --- 文章模态框 (Modal) 组件 ---
const ArticleModal = ({ article, onClose }: { article: { id: number; markdownContent: string }, onClose: () => void }) => {
    // 按 Esc 键关闭模态框
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4"
            onClick={onClose} // 点击背景关闭
        >
            <div 
                className="bg-[#1C2529] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 border border-gray-700/80 relative animate-fade-in"
                onClick={(e) => e.stopPropagation()} // 防止点击内容区域关闭模态框
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl z-10"
                    aria-label="关闭文章"
                >
                    &times;
                </button>
                <article className="prose prose-invert prose-lg max-w-none prose-img:rounded-lg prose-headings:text-white">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            // 自定义渲染器，用于智能识别图片和视频
                            img: ({ node, ...props }) => {
                                // [修复] 检查props.src是否为字符串，避免类型错误
                                if (typeof props.src === 'string' && (props.src.endsWith('.mp4') || props.src.endsWith('.webm') || props.src.endsWith('.ogg'))) {
                                    return (
                                        <div className="w-full aspect-video my-6">
                                            <video
                                                src={props.src}
                                                controls
                                                preload="metadata"
                                                className="w-full h-full rounded-lg"
                                            >
                                                您的浏览器不支持播放该视频。
                                            </video>
                                        </div>
                                    );
                                }
                                // 否则，渲染为普通图片
                                return <img {...props} />;
                            },
                        }}
                    >
                        {article.markdownContent}
                    </ReactMarkdown>
                </article>
            </div>
        </div>
    );
};

// --- 主要的页面组件 ---
export default function Page() {
    const [selectedArticle, setSelectedArticle] = useState<typeof articles[0] | null>(null);
    
    // 当模态框打开时，禁止背景滚动
    useEffect(() => {
        if (selectedArticle) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { // 组件卸载时恢复滚动
            document.body.style.overflow = 'auto';
        };
    }, [selectedArticle]);

    return (
        <div className="relative min-h-screen w-full bg-[#000] text-white" style={{ background: 'linear-gradient(to bottom right, #000, #1A2428)' }}>
            <Scene />
            
            <main className="relative z-10 p-8 md:p-16">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">我的文章</h1>
                    <p className="text-gray-400 mt-2">点击卡片阅读全文</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {articles.map(article => (
                        <ArticleCard 
                            key={article.id} 
                            article={article} 
                            onClick={() => setSelectedArticle(article)} 
                        />
                    ))}
                </div>
            </main>

            {selectedArticle && (
                <ArticleModal 
                    article={selectedArticle} 
                    onClose={() => setSelectedArticle(null)} 
                />
            )}
            
            {/* 添加一些CSS动画样式 */}
            <style jsx global>{`
                .prose {
                    --tw-prose-body: #d1d5db;
                    --tw-prose-headings: #ffffff;
                    --tw-prose-lead: #a1a1aa;
                    --tw-prose-links: #93c5fd;
                    --tw-prose-bold: #ffffff;
                    --tw-prose-counters: #a1a1aa;
                    --tw-prose-bullets: #a1a1aa;
                    --tw-prose-hr: #4b5563;
                    --tw-prose-quotes: #e5e7eb;
                    --tw-prose-quote-borders: #4b5563;
                    --tw-prose-captions: #a1a1aa;
                    --tw-prose-code: #f3f4f6;
                    --tw-prose-pre-code: #e5e7eb;
                    --tw-prose-pre-bg: #1f2937;
                    --tw-prose-th-borders: #4b5563;
                    --tw-prose-td-borders: #4b5563;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
