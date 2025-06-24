"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from "framer-motion";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- 内部实现的 cn 工具函数 ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- 新增：动态进度条组件 ---
const ProgressBar = ({ startDateString, endDateString }: { startDateString: string; endDateString: string; }) => {
    const [progress, setProgress] = useState(0);
    const startDate = useMemo(() => new Date(startDateString), [startDateString]);
    const endDate = useMemo(() => new Date(endDateString), [endDateString]);

    // 错误修复: 动态计算扫光动画的速度
    const animationDuration = useMemo(() => {
        // 当进度接近100%时，速度加快
        const maxDuration = 1.5; // 开始时的速度 (秒)
        const minDuration = 0.3; // 结束时的最快速度 (秒)
        // 使用一个缓动函数来计算当前进度下的动画时间
        const duration = maxDuration - (maxDuration - minDuration) * (progress / 100);
        return Math.max(duration, minDuration); // 确保速度不会低于最快速度
    }, [progress]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsedTime = now.getTime() - startDate.getTime();
            const currentProgress = (elapsedTime / totalDuration) * 100;

            setProgress(Math.min(Math.max(currentProgress, 0), 100));
        }, 1000);

        return () => clearInterval(interval);
    }, [startDate, endDate]);

    return (
        <div className="w-full h-2 bg-gray-500/20 rounded-full overflow-hidden relative mt-auto">
            {progress < 100 ? (
                 <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-sky-400 rounded-full relative overflow-hidden"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                >
                    <motion.div
                        className="absolute top-0 left-0 h-full w-10 opacity-80"
                        style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)',
                            filter: 'blur(4px)',
                        }}
                        animate={{
                            x: ['-100%', '1000%']
                        }}
                        transition={{
                            duration: animationDuration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    />
                </motion.div>
            ) : (
                // 错误修复：当进度达到100%时，执行闪烁动画
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-sky-400 rounded-full"
                    style={{ width: '100%' }}
                    animate={{
                        opacity: [1, 0.6, 1]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            )}
        </div>
    );
};


// --- Markdown 渲染组件 ---
const SimpleMarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n').map(line => line.trim());
    return (
        <div className="text-gray-300 text-center">
            {lines.map((line, index) => {
                if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-3xl font-bold my-4 text-white">{line.substring(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-2xl font-bold my-3 text-white">{line.substring(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-xl font-bold my-2 text-white">{line.substring(4)}</h3>;
                }
                if (line === '') {
                    return <br key={index} />;
                }
                if(line.includes('报名截止')) {
                    return <p key={index} className="my-2 leading-relaxed font-semibold text-purple-300">{line}</p>;
                }
                return <p key={index} className="my-2 leading-relaxed">{line}</p>;
            })}
        </div>
    );
};


// --- 卡片展开后的文章模态窗口 ---
const ArticleModal = ({ product, onClose }: { product: Product | null; onClose: () => void }) => {
    if (!product) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-[#121624] rounded-2xl w-full max-w-3xl h-full max-h-[80vh] overflow-y-auto p-8 relative shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors w-8 h-8 bg-white/10 rounded-full flex items-center justify-center z-50"
                    aria-label="Close article"
                >
                    ✕
                </button>
                <SimpleMarkdownRenderer content={product.markdownContent} />
            </motion.div>
        </motion.div>
    );
};


// --- 新合并的卡片组件 ---
interface Product {
  id: number;
  title: string;
  description: string;
  markdownContent: string;
  startDate: string;
  endDate: string;
}

const ProductCard = ({ product, onExpand }: { product: Product; onExpand: (id: number) => void }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div onClick={() => onExpand(product.id)} className="cursor-pointer">
        <motion.div
            className="relative rounded-[32px] overflow-hidden flex flex-col w-full max-w-[360px] h-[450px] mx-auto"
            style={{
                backgroundColor: "#0e131f",
                boxShadow: "0 -10px 100px 10px rgba(78, 99, 255, 0.25), 0 0 10px 0 rgba(0, 0, 0, 0.5)",
            }}
            initial={{ y: 0 }}
            animate={{
                y: isHovered ? -8 : 0, 
            }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                className="absolute inset-0 z-30 pointer-events-none"
                style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.05) 100%)",
                    backdropFilter: "blur(2px)",
                }}
            />
            <motion.div
                className="absolute inset-0 opacity-30 mix-blend-overlay z-10"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
                style={{
                    background: `
                    radial-gradient(ellipse at bottom right, rgba(172, 92, 255, 0.7) -10%, rgba(79, 70, 229, 0) 70%),
                    radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.7) -10%, rgba(79, 70, 229, 0) 70%)
                    `,
                    filter: "blur(40px)",
                }}
                animate={{
                    opacity: isHovered ? 0.9 : 0.8,
                }}
            />
            <motion.div
                className="absolute bottom-0 left-0 right-0 h-2/3 z-20" 
                style={{
                    background: `
                    radial-gradient(circle at bottom center, rgba(161, 58, 229, 0.7) -20%, rgba(79, 70, 229, 0) 60%)
                    `,
                    filter: "blur(45px)",
                }}
                animate={{
                    opacity: isHovered ? 0.85 : 0.75,
                }}
            />
            <div className="relative flex flex-col h-full p-8 z-40">
                <motion.div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-6"
                    style={{
                    background: "linear-gradient(225deg, #171c2c 0%, #121624 100%)",
                    }}
                    animate={{
                    boxShadow: isHovered
                        ? "0 8px 16px -2px rgba(0, 0, 0, 0.3), 0 4px 8px -1px rgba(0, 0, 0, 0.2), inset 2px 2px 5px rgba(255, 255, 255, 0.15), inset -2px -2px 5px rgba(0, 0, 0, 0.7)"
                        : "0 6px 12px -2px rgba(0, 0, 0, 0.25), 0 3px 6px -1px rgba(0, 0, 0, 0.15), inset 1px 1px 3px rgba(255, 255, 255, 0.12), inset -2px -2px 4px rgba(0, 0, 0, 0.5)",
                    }}
                >
                    <div className="flex items-center justify-center w-full h-full relative z-10">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                        d="M8 0L9.4 5.4L14.8 5.4L10.6 8.8L12 14.2L8 10.8L4 14.2L5.4 8.8L1.2 5.4L6.6 5.4L8 0Z"
                        fill="white"
                        />
                    </svg>
                    </div>
                </motion.div>

                <div className="mb-auto text-center">
                    <h3 className="text-2xl font-medium text-white mb-3">
                        {product.title}
                    </h3>
                    <p className="text-sm mb-6 text-gray-300">
                        {product.description}
                    </p>
                </div>
                <ProgressBar startDateString={product.startDate} endDateString={product.endDate} />
            </div>
        </motion.div>
    </div>
  );
};


// --- 光束和碰撞组件 ---

const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index, initialX: 0, initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));
  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
      {spans.map((span) => ( <motion.span key={span.id} initial={{ x: span.initialX, y: span.initialY, opacity: 1 }} animate={{ x: span.directionX, y: span.directionY, opacity: 0 }} transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }} className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" /> ))}
    </div>
  );
};

const CollisionMechanism = ({ parentRef, containerRef, beamOptions = {} }: { containerRef: React.RefObject<HTMLDivElement | null>; parentRef: React.RefObject<HTMLDivElement | null>; beamOptions?: { initialX?: number; translateX?: number; initialY?: number; translateY?: number; rotate?: number; className?: string; duration?: number; delay?: number; repeatDelay?: number; }; }) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{ detected: boolean; coordinates: { x: number; y: number } | null; }>({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);
  useEffect(() => {
    const checkCollision = () => {
      if (beamRef.current && containerRef.current && parentRef.current && !cycleCollisionDetected) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const parentRect = parentRef.current.getBoundingClientRect();
        if (beamRect.bottom >= containerRect.top) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;
          setCollision({ detected: true, coordinates: { x: relativeX, y: relativeY } });
          setCycleCollisionDetected(true);
        }
      }
    };
    const animationInterval = setInterval(checkCollision, 50);
    return () => clearInterval(animationInterval);
  }, [cycleCollisionDetected, containerRef, parentRef]);
  useEffect(() => {
    if (collision.detected && collision.coordinates) {
      setTimeout(() => { setCollision({ detected: false, coordinates: null }); setCycleCollisionDetected(false); }, 2000);
      setTimeout(() => { setBeamKey((prevKey) => prevKey + 1); }, 2000);
    }
  }, [collision]);
  return (
    <>
      <motion.div key={beamKey} ref={beamRef} animate="animate" initial={{ y: beamOptions.initialY || -200, x: beamOptions.initialX || 0, rotate: beamOptions.rotate || 0 }} variants={{ animate: { y: beamOptions.translateY || 1800, x: beamOptions.translateX || 0, rotate: beamOptions.rotate || 0 } }} transition={{ duration: beamOptions.duration || 8, repeat: Infinity, repeatType: "loop", ease: "linear", delay: beamOptions.delay || 0, repeatDelay: beamOptions.repeatDelay || 0 }} className={cn("absolute left-0 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent", beamOptions.className)} />
      <AnimatePresence>
        {collision.detected && collision.coordinates && ( <Explosion key={`${collision.coordinates.x}-${collision.coordinates.y}`} className="" style={{ left: `${collision.coordinates.x}px`, top: `${collision.coordinates.y}px`, transform: "translate(-50%, -50%)" }} /> )}
      </AnimatePresence>
    </>
  );
};

const BackgroundBeamsWithCollision = ({ className }: { className?: string; }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const beams = [
    { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 }, { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 }, { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" }, { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 }, { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" }, { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" }, { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
  ];
  return (
    <div ref={parentRef} className={cn("absolute inset-0 w-full h-full overflow-hidden", className)}>
      {beams.map((beam) => (<CollisionMechanism key={beam.initialX + "beam-idx"} beamOptions={beam} containerRef={containerRef} parentRef={parentRef} />))}
      <div ref={containerRef} className="absolute bottom-0 bg-neutral-100 w-full inset-x-0 pointer-events-none" style={{ boxShadow: "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset" }} />
    </div>
  );
};


// --- 您原有的 3D 场景代码 ---

const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;
    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);
    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 20, curveSegments: 20 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return (
        <mesh geometry={geometry} position={position} rotation={rotation}>
            <meshPhysicalMaterial color="#232323" metalness={1} roughness={0.3} reflectivity={0.5} ior={1.5} emissive="#000000" emissiveIntensity={0} transparent={false} opacity={1.0} transmission={0.0} thickness={0.5} clearcoat={0.0} clearcoatRoughness={0.0} sheen={0} sheenRoughness={1.0} sheenColor="#ffffff" specularIntensity={1.0} specularColor="#ffffff" iridescence={1} iridescenceIOR={1.3} iridescenceThicknessRange={[100, 400]} flatShading={false} />
        </mesh>
    );
};

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame((_, delta) => { if (groupRef.current) { groupRef.current.rotation.x += delta * 0.05; groupRef.current.rotation.y += delta * 0.05; } });
    const boxes = Array.from({ length: 50 }, (_, index) => ({ position: [(index - 25) * 0.75, 0, 0] as [number, number, number], rotation: [ (index - 10) * 0.1, Math.PI / 2, 0 ] as [number, number, number], id: index }));
    return (<group ref={groupRef}>{boxes.map((box) => (<Box key={box.id} position={box.position} rotation={box.rotation} />))}</group>);
};

const Scene = () => {
    return (
        <div className="fixed inset-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
                <ambientLight intensity={15} />
                <directionalLight position={[10, 10, 5]} intensity={15} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};


// --- 最终的、合并后的页面组件 ---
export default function Page() {
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  const products: Product[] = [
    {
      id: 1,
      title: "智能收件箱整理",
      description: "OpenMail通过AI驱动的分类彻底改变了电子邮件管理，提高了生产力和可访问性。",
      startDate: "2025-06-01T00:00:00",
      endDate: "2025-07-01T23:59:59",
      markdownContent: `# 智能收件箱整理\n\n### 工作原理\n我们的AI模型能够实时分析收到的每一封邮件，并根据其内容、发件人、重要性等多个维度进行智能分类。无论是工作邮件、订阅信息、社交通知还是垃圾邮件，都能被精准地放入对应的文件夹。\n\n### 主要特性\n- **自动归档**: 将不重要的邮件自动归档，保持收件箱清爽。\n- **智能提醒**: 对于重要邮件，系统会通过智能提醒功能，确保您不会错过任何关键信息。\n- **自定义规则**: 用户可以根据自己的需求，创建个性化的分类规则，AI将学习并自动执行。\n\n报名截止：2025-07-01`
    },
    {
      id: 2,
      title: "跨平台任务同步",
      description: "在所有设备上无缝同步您的任务和项目，确保您随时随地都能掌握最新进展。",
      startDate: "2025-06-15T00:00:00",
      endDate: "2025-08-15T23:59:59",
      markdownContent: `# 跨平台任务同步\n\n### 无缝体验\n无论您使用的是手机、平板还是桌面电脑，我们的应用都能确保您的任务列表实时同步。您在一个设备上做出的任何更改，都会立即反映在所有其他设备上。\n\n### 主要特性\n- **离线访问**: 即使没有网络连接，您也可以查看和编辑任务，一旦联网将自动同步。\n- **团队协作**: 与团队成员共享任务列表，分配任务，并跟踪项目进度。\n- **日历集成**: 将您的任务与日历应用集成，更好地规划您的时间和日程。\n\n报名截止：2025-08-15`
    }
  ];

  const handleExpand = (id: number) => {
    setExpandedCardId(id);
  };

  const handleClose = () => {
    setExpandedCardId(null);
  };

  const expandedProduct = products.find(p => p.id === expandedCardId) || null;

  return (
    <div className="relative w-full min-h-screen bg-[#000] text-white" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
      {/* 1. 3D盒子背景 (z-0) */}
      <Scene />

      {/* 2. 可滚动的内容区域 (z-10) */}
      <main className="relative z-10 flex flex-col items-center w-full px-4 py-16 sm:py-24">
        <div className="flex flex-col items-center justify-center gap-12 sm:gap-16 w-full">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center text-white font-sans tracking-tight">
                <div>What&apos;s cooler than Beams?</div>
                <div className="relative mx-auto w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                    <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                        <span>Exploding beams.</span>
                    </div>
                    <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
                        <span>Exploding beams.</span>
                    </div>
                </div>
            </h2>

            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-8 md:gap-12 w-full">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} onExpand={handleExpand} />
                ))}
            </div>
        </div>
      </main>

      {/* 3. 雨滴效果，位于顶层 (z-20) 且不拦截鼠标事件 */}
      <div className="fixed inset-0 z-20 pointer-events-none">
        <BackgroundBeamsWithCollision />
      </div>

      {/* 4. 模态窗口，位于最顶层 (z-50) */}
      <AnimatePresence>
        {expandedProduct && <ArticleModal product={expandedProduct} onClose={handleClose} />}
      </AnimatePresence>
    </div>
  );
};
