"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Link from 'next/link';

// --- 图标组件 ---
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
);
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
     <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);
const FileTextIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);
const FileImageIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <circle cx="10" cy="14" r="2" />
        <path d="m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22" />
    </svg>
);


// --- 3D 场景组件 ---
const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    // 创建一个带圆角的矩形形状
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;

    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);

    // 定义拉伸设置
    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    };

    // 基于形状和设置创建几何体
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // 将几何体居中

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
        <div className="absolute inset-0 w-full h-full z-[-1]">
            <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
                <ambientLight intensity={15} />
                <directionalLight position={[10, 10, 5]} intensity={15} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};


// --- Markdown 预览组件 ---
function MarkdownPreview({ content, imagePreviewUrl }: { content: string, imagePreviewUrl: string | null }) {
    const [html, setHtml] = useState('');

    useEffect(() => {
        const scriptId = 'marked-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
            script.async = true;
            script.onload = () => {
                // @ts-expect-error: 'marked' is loaded dynamically
                if (window.marked) { setHtml(window.marked.parse(content)); }
            };
            document.body.appendChild(script);
        } else {
            // @ts-expect-error: 'marked' is loaded dynamically
            if (window.marked) { setHtml(window.marked.parse(content)); }
        }
    }, [content]);
    
    return (
        <div className="p-4 h-full text-left text-slate-200">
            <div className="prose prose-lg prose-invert max-w-none">
                 {imagePreviewUrl && (
                    <img src={imagePreviewUrl} alt="图片预览" className="max-w-full rounded-lg mb-4 shadow-md" />
                )}
                <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        </div>
    );
}


// --- 投稿表单组件 ---
function SubmissionForm() {
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const charLimit = 2000;
    const singleFileLimit = 10 * 1024 * 1024; // 10MB

    useEffect(() => {
        let currentUserId = localStorage.getItem('apex_user_id');
        if (!currentUserId) {
            currentUserId = crypto.randomUUID();
            localStorage.setItem('apex_user_id', currentUserId);
        }
        setUserId(currentUserId);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > singleFileLimit) {
                setMessage('单个文件大小不能超过 10MB。');
                setStatus('error');
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
            setMessage('');
            setStatus('idle');
            setFile(selectedFile);
            
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setImagePreviewUrl(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!content.trim() && !file) {
            setMessage('内容和文件不能都为空！');
            setStatus('error');
            return;
        }
        if (content.length > charLimit) {
            setMessage(`内容不能超过 ${charLimit} 字。`);
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('准备上传...');

        let fileUrl = null;

        try {
            if (file) {
                setMessage('正在上传文件...');
                const uploadResponse = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                    method: 'POST',
                    body: file,
                });

                if (!uploadResponse.ok) {
                    const errorResult = await uploadResponse.json();
                    throw new Error(errorResult.error || '文件上传失败');
                }

                const newBlob = await uploadResponse.json();
                fileUrl = newBlob.url;
                setMessage('文件上传成功，正在提交内容...');
            } else {
                 setMessage('正在提交内容...');
            }

            const submissionResponse = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, fileUrl, userId }),
            });

            if (!submissionResponse.ok) {
                const errorResult = await submissionResponse.json();
                throw new Error(errorResult.message || '内容提交失败');
            }

            const result = await submissionResponse.json();
            setStatus('success');
            setMessage(result.message || '提交成功！感谢您的稿件。');
            setContent('');
            handleRemoveFile();

        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : '发生未知错误');
        }
    };
    
    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <FileImageIcon className="w-5 h-5 text-blue-400" />;
        return <FileTextIcon className="w-5 h-5 text-gray-400" />;
    };

    const allowedFileTypes = "image/*,.txt,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
    const charCountColor = content.length > charLimit ? 'text-red-500' : 'text-slate-400';

    return (
        <motion.div
            className="mt-12 w-full max-w-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
        >
            <div className="text-center mb-6">
                 <h2 className="text-2xl font-semibold text-slate-100">致信Apex</h2>
                 <p className="text-md text-slate-400">分享您的见解、建议或稿件</p>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 min-h-[500px]">
                    {/* 编辑区 */}
                    <div className="flex flex-col p-4">
                        <div className="flex items-center justify-between gap-2 mb-2 text-slate-300">
                           <div className="flex items-center gap-2">
                                <EditIcon className="w-5 h-5" />
                                <span className="font-semibold">编辑区</span>
                           </div>
                           <div className={`text-sm font-medium ${charCountColor}`}>
                               {content.length} / {charLimit}
                           </div>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            maxLength={charLimit}
                            placeholder="请在此输入内容，支持Markdown语法..."
                            className="w-full flex-grow p-3 bg-gray-900/30 border-gray-700 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-100 placeholder:text-slate-500"
                        />
                        {file ? (
                             <div className="mt-3 flex items-center justify-between gap-2 w-full bg-gray-800/50 text-slate-300 font-semibold py-2 px-4 rounded-lg">
                                {getFileIcon(file.type)}
                                <span className="truncate flex-1 text-left ml-2">{file.name}</span>
                                <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-3 flex items-center justify-center gap-2 w-full bg-gray-800/50 hover:bg-gray-700/50 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                                <UploadIcon className="w-5 h-5"/>
                                上传文件 (最大10MB)
                            </button>
                        )}
                         <input
                            ref={fileInputRef}
                            type="file"
                            accept={allowedFileTypes}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    {/* 预览区 */}
                    <div className="bg-black/10 border-l border-gray-700/50">
                         <div className="flex items-center gap-2 p-4 border-b border-gray-700/50 text-slate-300">
                           <EyeIcon className="w-5 h-5" />
                           <span className="font-semibold">实时预览</span>
                        </div>
                        <MarkdownPreview content={content} imagePreviewUrl={imagePreviewUrl} />
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                     {status !== 'idle' && (
                        <p className={`text-sm ${
                            status === 'success' ? 'text-green-500' : 
                            status === 'error' ? 'text-red-500' : 'text-slate-300'
                        }`}>
                            {message || (status === 'loading' && '正在提交...')}
                        </p>
                    )}
                    <div className="flex-grow"></div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link
                            href="/"
                            className="w-full sm:w-auto text-center border border-slate-700 text-slate-300 font-semibold py-2 px-6 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                            返回主页
                        </Link>
                        <button 
                            onClick={handleSubmit}
                            disabled={status === 'loading'}
                            className="w-full sm:w-auto bg-slate-100 text-slate-900 font-bold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors disabled:bg-slate-600 disabled:text-slate-400"
                        >
                            {status === 'loading' ? '提交中...' : '提交'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


// --- Apex主页组件 ---
function ApexHero({ title = "Apex" }: { title?: string }) {
    const words = title.split(" ");

    return (
        <div 
            className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden py-8 sm:py-12"
            style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}
        >
            <Scene />
            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-6xl mx-auto flex flex-col items-center"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay: wordIndex * 0.1 + letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-500/80"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>
                    <SubmissionForm />
                </motion.div>
            </div>
        </div>
    );
}

// --- 页面主入口 ---
export default function Page() {
    return <ApexHero title="Apex" />;
}