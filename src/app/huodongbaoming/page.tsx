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

// --- 动态倒计时及百分比显示组件 ---
const CountdownDisplay = ({ startDateString, endDateString }: { startDateString: string; endDateString: string; }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [percentage, setPercentage] = useState(0);
    const startDate = useMemo(() => new Date(startDateString), [startDateString]);
    const endDate = useMemo(() => new Date(endDateString), [endDateString]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const totalDuration = endDate.getTime() - startDate.getTime();
            const remainingTimeMs = endDate.getTime() - now.getTime();

            if (remainingTimeMs > 0) {
                const days = Math.floor(remainingTimeMs / (1000 * 60 * 60 * 24));
                const hours = Math.floor((remainingTimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });

                const currentPercentage = (remainingTimeMs / totalDuration) * 100;
                setPercentage(currentPercentage);
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                setPercentage(0);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startDate, endDate]);

    return (
        <div className="text-center my-4">
            <p className="text-sm text-gray-400">报名截止还剩</p>
            <p className="text-xl font-semibold my-1">{`${timeLeft.days}天 ${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}</p>
            <div className="text-xs p-1 border border-gray-500/50 rounded-md inline-block bg-black/20">
                {percentage.toFixed(4)}%
            </div>
        </div>
    );
};


// --- 动态进度条组件 ---
const ProgressBar = ({ startDateString, endDateString }: { startDateString: string; endDateString: string; }) => {
    const [progress, setProgress] = useState(0);
    const startDate = useMemo(() => new Date(startDateString), [startDateString]);
    const endDate = useMemo(() => new Date(endDateString), [endDateString]);

    const animationDuration = useMemo(() => {
        const maxDuration = 1.5;
        const minDuration = 0.3;
        const duration = maxDuration - (maxDuration - minDuration) * (progress / 100);
        return Math.max(duration, minDuration);
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

// --- 活动已截止的提示弹窗 (已修复) ---
const ExpiredModal = ({ onClose }: { onClose: () => void }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                // 移除了 scale 动画来修复UI卡顿和变大问题
                className="bg-[#1a1f32] rounded-2xl p-8 text-center shadow-2xl border border-white/10 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-white text-lg">很遗憾没有等到您，期待下次相遇。</p>
                <button
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    关闭
                </button>
            </motion.div>
        </motion.div>
    );
};


// --- 卡片组件 ---
interface Product {
  id: number;
  title: string;
  description: string;
  markdownContent: string;
  startDate: string;
  endDate: string;
  qrCodeUrl: string;
}

const ProductCard = ({ product }: { product: Product; }) => {
    const [isHovered, setIsHovered] = useState(false);
    
    return (
      <motion.div
        className="relative rounded-[32px] overflow-hidden w-full max-w-[360px] h-[450px] mx-auto bg-[#0e131f] cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ y: 0 }}
        animate={{ y: isHovered ? -8 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="relative w-full h-full flex flex-col p-8 z-30">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-gradient-to-tr from-[#171c2c] to-[#121624]"
               style={{ boxShadow: "0 6px 12px -2px rgba(0, 0, 0, 0.25), 0 3px 6px -1px rgba(0, 0, 0, 0.15), inset 1px 1px 3px rgba(255, 255, 255, 0.12), inset -2px -2px 4px rgba(0, 0, 0, 0.5)"}}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0L9.4 5.4L14.8 5.4L10.6 8.8L12 14.2L8 10.8L4 14.2L5.4 8.8L1.2 5.4L6.6 5.4L8 0Z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-medium text-white mb-3">{product.title}</h3>
            <p className="text-sm mb-6 text-gray-300">{product.description}</p>
          </div>
          <div className="mt-auto">
            <CountdownDisplay startDateString={product.startDate} endDateString={product.endDate} />
            <ProgressBar startDateString={product.startDate} endDateString={product.endDate} />
          </div>
        </div>
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-2/3 z-20"
          style={{
            background: `radial-gradient(ellipse at bottom right, rgba(172, 92, 255, 0.7) -10%, rgba(79, 70, 229, 0) 70%), radial-gradient(ellipse at bottom left, rgba(56, 189, 248, 0.7) -10%, rgba(79, 70, 229, 0) 70%)`,
            filter: "blur(40px)",
          }}
          animate={{ opacity: isHovered ? 0.9 : 0.8 }}
        />
        <motion.div
          className="absolute inset-0 opacity-30 mix-blend-overlay z-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
        />
      </motion.div>
    );
};

// --- 展开后的卡片组件 ---
const ExpandedCard = ({ product, onCollapse }: { product: Product; onCollapse: () => void; }) => {
    return (
      <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onCollapse}
      >
        <motion.div
          className="relative rounded-[32px] overflow-hidden w-full max-w-3xl bg-[#0e131f] max-h-[85vh] flex flex-col"
          layoutId={`card-container-${product.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative flex-shrink-0 p-8 pb-0 z-20">
             <motion.button
                initial={{opacity: 0, scale: 0.5}}
                animate={{opacity: 1, scale: 1}}
                transition={{delay: 0.3}}
                onClick={onCollapse}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors w-8 h-8 bg-white/10 rounded-full flex items-center justify-center z-50"
                aria-label="Close article"
            >
                ✕
            </motion.button>
             <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 bg-gradient-to-tr from-[#171c2c] to-[#121624]"
                  style={{ boxShadow: "0 8px 16px -2px rgba(0, 0, 0, 0.3), 0 4px 8px -1px rgba(0, 0, 0, 0.2), inset 2px 2px 5px rgba(255, 255, 255, 0.15), inset -2px -2px 5px rgba(0, 0, 0, 0.7)"}}>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 0L9.4 5.4L14.8 5.4L10.6 8.8L12 14.2L8 10.8L4 14.2L5.4 8.8L1.2 5.4L6.6 5.4L8 0Z" />
                </svg>
            </div>
          </div>
          <div className="relative flex-grow p-8 pt-0 overflow-y-auto z-20">
            <SimpleMarkdownRenderer content={product.markdownContent} />
            <div className="mt-8 pt-8 border-t border-gray-500/30 flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-4">扫码报名或了解详情</p>
                <img src={product.qrCodeUrl} alt="二维码" className="w-[200px] h-[200px] rounded-lg bg-white p-2" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = "https://placehold.co/200x200/ffffff/000000?text=QR+Code"; }} />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
};


// --- 光束和碰撞组件 (已修复) ---
const Explosion = ({ ...props }: React.HTMLProps<HTMLDivElement>) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({ id: index, initialX: 0, initialY: 0, directionX: Math.floor(Math.random() * 80 - 40), directionY: Math.floor(Math.random() * -50 - 10) }));
  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: "easeOut" }} className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
      {spans.map((span) => ( <motion.span key={span.id} initial={{ x: span.initialX, y: span.initialY, opacity: 1 }} animate={{ x: span.directionX, y: span.directionY, opacity: 0 }} transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }} className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500" /> ))}
    </div>
  );
};

// 修复：通过 useEffect 在客户端安全地获取 window.innerHeight，避免了服务端渲染错误
const CollisionMechanism = ({ parentRef, beamOptions = {} }: { parentRef: React.RefObject<HTMLDivElement | null>; beamOptions?: { initialX?: number; translateX?: number; initialY?: number; translateY?: number; rotate?: number; className?: string; duration?: number; delay?: number; repeatDelay?: number; }; }) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = useState<{ detected: boolean; coordinates: { x: number; y: number } | null; }>({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = useState(0);
  const [targetY, setTargetY] = useState(0); // 为动画目标Y坐标创建 state

  // 该 effect 仅在客户端运行以获取窗口高度
  useEffect(() => {
    setTargetY(window.innerHeight + 200);
  }, []); // 空依赖数组确保该 effect 仅在挂载时运行一次（客户端）

  // 该 effect 处理碰撞检测逻辑
  useEffect(() => {
    if (targetY === 0) return; // 在设置窗口高度前不运行碰撞检测

    const checkCollision = () => {
      if (beamRef.current && parentRef.current) {
        const beamRect = beamRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight; 

        if (beamRect.bottom >= windowHeight && !collision.detected) {
          const parentRect = parentRef.current.getBoundingClientRect();
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = beamRect.bottom - parentRect.top;
          setCollision({ detected: true, coordinates: { x: relativeX, y: relativeY } });
          setTimeout(() => {
            setCollision({ detected: false, coordinates: null });
            setBeamKey(k => k + 1);
          }, 2000);
        }
      }
    };
    const animationInterval = setInterval(checkCollision, 50);
    return () => clearInterval(animationInterval);
  }, [collision.detected, parentRef, targetY]); // 将 targetY 添加到依赖项

  return (
    <>
      <motion.div 
        key={beamKey} 
        ref={beamRef} 
        animate="animate" 
        initial={{ y: beamOptions.initialY || -200, x: beamOptions.initialX || 0, rotate: beamOptions.rotate || 0 }} 
        variants={{ animate: { y: targetY, x: beamOptions.translateX || 0, rotate: beamOptions.rotate || 0 } }} // 使用 state 替代直接访问 window
        transition={{ duration: beamOptions.duration || 8, repeat: Infinity, repeatType: "loop", ease: "linear", delay: beamOptions.delay || 0, repeatDelay: beamOptions.repeatDelay || 0 }} 
        className={cn("absolute left-0 top-20 m-auto h-14 w-px rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-transparent", beamOptions.className)} 
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates && ( <Explosion key={`${collision.coordinates.x}-${collision.coordinates.y}`} style={{ left: `${collision.coordinates.x}px`, top: `${collision.coordinates.y}px`, transform: "translate(-50%, -50%)" }} /> )}
      </AnimatePresence>
    </>
  );
};

const BackgroundBeamsWithCollision = ({ className }: { className?: string; }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const beams = [ { initialX: 10, translateX: 10, duration: 7, repeatDelay: 3, delay: 2 }, { initialX: 600, translateX: 600, duration: 3, repeatDelay: 3, delay: 4 }, { initialX: 100, translateX: 100, duration: 7, repeatDelay: 7, className: "h-6" }, { initialX: 400, translateX: 400, duration: 5, repeatDelay: 14, delay: 4 }, { initialX: 800, translateX: 800, duration: 11, repeatDelay: 2, className: "h-20" }, { initialX: 1000, translateX: 1000, duration: 4, repeatDelay: 2, className: "h-12" }, { initialX: 1200, translateX: 1200, duration: 6, repeatDelay: 4, delay: 2, className: "h-6" }, ];
  
  return (
    <div ref={parentRef} className={cn("absolute inset-0 w-full h-full overflow-hidden", className)}>
        {beams.map((beam, index) => (<CollisionMechanism key={beam.initialX + `beam-idx-${index}`} beamOptions={beam} parentRef={parentRef} />))}
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
    useFrame((_, delta) => { 
        if (!groupRef.current) return;
        groupRef.current.rotation.x += delta * 0.05; 
        groupRef.current.rotation.y += delta * 0.05; 
    });
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
  const [showExpiredModal, setShowExpiredModal] = useState(false); 

  useEffect(() => {
    // 修复：添加客户端检查，以安全地操作 document 对象
    if (typeof window !== 'undefined' && document.body) {
        if (expandedCardId !== null || showExpiredModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { // 组件卸载时恢复滚动
            document.body.style.overflow = 'auto';
        }
    }
  }, [expandedCardId, showExpiredModal]);

  const products: Product[] = [
    {
      id: 1,
      title: "音乐节的号角吹响啦！",
      description: "One Love Asia Festival 新加坡 2025 正式开票啦！加入这场超燃音乐盛事！ 9月，我们等你来躁！",
      startDate: "2025-03-01T00:00:00",
      endDate: "2025-06-24T23:59:59",
      qrCodeUrl: "https://zh.apex-elite-service.com/wenjian/sara.png",
      markdownContent: `# 音乐节的征集令正式响起！\n\n### 立即购票\n2025 年新加坡 One Love Asia 音乐节门票正式开售！\n\n赶紧抢票，开启一段史诗般的音乐之旅！九月，我们等你来！\n\n1日通票：198 新加坡元；\n\n2日日通票：338 新加坡元。\n\n2025年9月13日至14日|⏰下午3点开门|📍海湾活动空间\n\n报名截止：2025-06-24T23:59:59`
    },
    {
      id: 2,
      title: "2025黄龄「莫名其妙」巡演",
      description: "非洲行结束后，Yellow Zero坠入了一场奇幻的梦境，在梦里一切稀奇古怪的事情皆在发生…",
      startDate: "2025-03-01T00:00:00",
      endDate: "2025-07-18T23:59:59",
      qrCodeUrl: "https://zh.apex-elite-service.com/wenjian/sara.png",
      markdownContent: `# 一场关于莫名其妙的巡演即将开启\n\n### 一起进入黄龄的Live异世界！\n一月一城，跟随「莫名其妙」度过有趣的2025！\n\n### 【北京站】\n演出时间：7月19日（周六）20:00\n演出地点：东三 LIVE\n- 票价 -\n\n预售票 360 | 正价票 420 | VIP票 560\n\n- VIP权益 -\n\n提前30min入场+精美礼包+演出后小组合影（10人/组）\n\n报名截止：2025-07-18T23:59:59`
    }
  ];

  const handleExpand = (id: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const now = new Date();
    const endDate = new Date(product.endDate);
    if (now > endDate) {
        setShowExpiredModal(true);
    } else {
        setExpandedCardId(id);
    }
  };
  
  const handleCollapse = () => {
      setExpandedCardId(null);
  }

  return (
    <div className="relative w-full min-h-screen bg-[#000] text-white" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
      <Scene />
      <div className="fixed inset-0 z-20 pointer-events-none">
        <BackgroundBeamsWithCollision />
      </div>

      <main className="relative z-10 flex flex-col items-center w-full min-h-screen px-4 py-16 sm:py-24">
        <div className="flex flex-col items-center justify-center gap-12 sm:gap-16 w-full">
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-center text-white font-sans tracking-tight">
                <div>很期待您的加入！</div>
                <div className="relative mx-auto w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
                    <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                        <span>与Apex一起</span>
                    </div>
                    <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4">
                        <span>与Apex一起</span>
                    </div>
                </div>
            </h2>

            <div className="flex flex-col md:flex-row flex-wrap items-start justify-center gap-8 md:gap-12 w-full">
                {products.map(product => (
                    <motion.div key={product.id} layoutId={`card-container-${product.id}`} onClick={() => handleExpand(product.id)}>
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        </div>
      </main>

      <AnimatePresence>
          {/* 修复：移除了灰色背景遮罩，现在直接在页面上展开 */}
          {expandedCardId && (
              <ExpandedCard product={products.find(p => p.id === expandedCardId)!} onCollapse={handleCollapse} />
          )}
      </AnimatePresence>

      <AnimatePresence>
        {showExpiredModal && <ExpiredModal onClose={() => setShowExpiredModal(false)} />}
      </AnimatePresence>
    </div>
  );
};
