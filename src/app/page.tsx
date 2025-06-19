// For Next.js App Router, this component uses hooks and event listeners,
// so it must be declared as a Client Component.
'use client';

import React, { 
    useRef, 
    useEffect, 
    useState, 
    useMemo,
    useCallback
} from 'react';
import Image from 'next/image'; // 导入 Next.js Image 组件
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence
} from "framer-motion";

// ============================================================================
// 1. ATOMIC UI COMPONENTS & ICONS
// ============================================================================

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const MemoizedCpu = React.memo(({ size = 24, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M9 2v2" /><path d="M9 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 15v-1.5" /><path d="M15 9.5V8" />
  </svg>
));
MemoizedCpu.displayName = 'CpuIcon';

const MemoizedShieldCheck = React.memo(({ size = 24, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" />
  </svg>
));
MemoizedShieldCheck.displayName = 'ShieldCheckIcon';

const MemoizedLayers = React.memo(({ size = 24, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.84l8.57 3.91a2 2 0 0 0 1.66 0l8.57-3.91a1 1 0 0 0 0-1.84Z" /><path d="M2 12.12V16l8.57 3.91a2 2 0 0 0 1.66 0L21 16v-3.88" /><path d="M2 7.23V11l8.57 3.91a2 2 0 0 0 1.66 0L21 11V7.23" />
  </svg>
));
MemoizedLayers.displayName = 'LayersIcon';

const MemoizedZap = React.memo(({ size = 24, ...props }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
));
MemoizedZap.displayName = 'ZapIcon';


// ============================================================================
// 2. PAGE SECTIONS & LAYOUT COMPONENTS
// ============================================================================

const Box = ({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number]; }) => {
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        const angleStep = Math.PI * 0.5;
        const radius = 1;

        shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
        shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
        shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
        shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);

        const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 20, curveSegments: 20 };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        return geom;
    }, []);
    return (
        <mesh geometry={geometry} position={position} rotation={rotation}>
            <meshPhysicalMaterial color="#232323" metalness={1} roughness={0.3} reflectivity={0.5} ior={1.5} iridescence={1} iridescenceIOR={1.3} iridescenceThicknessRange={[100, 400]} />
        </mesh>
    );
};
Box.displayName = "Box";

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.02;
        }
    });
    const boxes = useMemo(() => Array.from({ length: 50 }, (_, index) => ({
        position: [(index - 25) * 0.75, 0, 0] as [number, number, number],
        rotation: [(index - 10) * 0.1, Math.PI / 2, 0] as [number, number, number],
        id: index
    })), []);
    return (
        <group ref={groupRef}>
            {boxes.map((box) => <Box key={box.id} {...box} />)}
        </group>
    );
};
AnimatedBoxes.displayName = "AnimatedBoxes";

const Scene = React.memo(() => (
    <div className="fixed top-0 left-0 w-full h-screen -z-10">
        <Canvas camera={{ position: [5, 5, 20], fov: 40 }}>
            <ambientLight intensity={15} />
            <directionalLight position={[10, 10, 5]} intensity={15} />
            <AnimatedBoxes />
        </Canvas>
    </div>
));
Scene.displayName = "Scene";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) setHeight(ref.current.getBoundingClientRect().height);
    });
    if (ref.current) resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start 10%", "end 50%"] });
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-transparent font-sans md:px-10" ref={containerRef}>
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-4xl mb-4 text-white max-w-4xl">我的开发历程变更日志</h2>
        <p className="text-neutral-300 text-sm md:text-base max-w-sm">在过去的两年里，我一直在努力构建 Aceternity。这是我的心路历程时间线。</p>
      </div>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-24 md:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-neutral-800 border border-neutral-700 p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500">{item.title}</h3>
            </div>
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-neutral-500">{item.title}</h3>
              {item.content}
            </div>
          </div>
        ))}
        <div style={{ height: `${height}px` }} className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]">
          <motion.div style={{ height: heightTransform, opacity: opacityTransform }} className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full" />
        </div>
      </div>
    </div>
  );
};
Timeline.displayName = "Timeline";

// --- Project Showcase Components ---
interface HalomotButtonProps {
  gradient?: string; inscription: string; onClick: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  fillWidth?: boolean; fixedWidth?: string; href?: string; backgroundColor?: string;
  icon?: React.ReactElement; borderWidth?: string; padding?: string;
  outerBorderRadius?: string; innerBorderRadius?: string; textColor?: string;
  hoverTextColor?: string;
}

const HalomotButton: React.FC<HalomotButtonProps> = ({
  gradient = "linear-gradient(135deg, #4776cb, #a19fe5, #6cc606)",
  inscription, onClick, fillWidth = false, fixedWidth, href,
  backgroundColor = "#000", icon, borderWidth = "1px", padding,
  outerBorderRadius = "6.34px", innerBorderRadius = "6px",
  textColor = "#fff", hoverTextColor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerStyle: React.CSSProperties = fixedWidth ? { width: fixedWidth, display: "inline-block" } : {};
  const buttonStyle: React.CSSProperties = { padding: borderWidth, background: gradient, borderRadius: outerBorderRadius, width: fillWidth || fixedWidth ? "100%" : "fit-content", border: "0", display: "flex", justifyContent: "center", alignItems: "center", textDecoration: "none", userSelect: "none", whiteSpace: "nowrap", transition: "all .3s", boxSizing: "border-box", };
  const spanStyle: React.CSSProperties = { background: isHovered ? "none" : backgroundColor, padding: padding ?? (fillWidth || fixedWidth ? "1rem 0" : "1rem 4rem"), borderRadius: innerBorderRadius, width: "100%", height: "100%", transition: "color 0.3s, background 300ms", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: isHovered && hoverTextColor ? hoverTextColor : textColor, whiteSpace: "nowrap", fontFamily: "inherit", fontSize: "1rem", gap: icon ? "0.5em" : "0", boxSizing: "border-box", cursor: "pointer", };
  const iconStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", height: "1em", width: "1em", fontSize: "1.1em", verticalAlign: "middle", flexShrink: 0, };
  const ButtonContent = <span style={spanStyle}>{icon && <span style={iconStyle}>{icon}</span>}{inscription}</span>;
  
  const commonProps = {
    style: buttonStyle,
    onClick: onClick,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  const ButtonElement = href ? (
    <a href={href} {...commonProps} target="_blank" rel="noopener noreferrer">{ButtonContent}</a>
  ) : (
    <button type="button" {...commonProps}>{ButtonContent}</button>
  );
  return fixedWidth ? <div style={containerStyle}>{ButtonElement}</div> : ButtonElement;
};
HalomotButton.displayName = "HalomotButton";

type Testimonial = {
  quote: string; name: string; designation: string; src: string; link?: string;
};

// 使用 Next/Image 替换原生 <img>
const ImageContainer = ({ src, alt }: { src: string; alt: string; }) => (
  <div className="relative h-full w-full rounded-2xl overflow-hidden p-px bg-zinc-800">
    <Image 
      src={src} 
      alt={alt} 
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover object-center rounded-[15px]" 
      priority // 如果是首屏图片，可以加上 priority
    />
  </div>
);
ImageContainer.displayName = 'ImageContainer';

const ProjectShowcase = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const [active, setActive] = useState(0);

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  return (
    <div className="w-full mx-auto font-sans py-20 text-white">
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="w-full relative aspect-[1.37/1]">
          <AnimatePresence mode="sync">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.src}
                initial={{ opacity: 0, scale: 0.9, z: -100, rotate: Math.floor(Math.random() * 21) - 10 }}
                animate={{
                  opacity: index === active ? 1 : 0.7,
                  scale: index === active ? 1 : 0.95,
                  z: index === active ? 0 : -100,
                  rotate: index === active ? 0 : Math.floor(Math.random() * 21) - 10,
                  zIndex: index === active ? 999 : testimonials.length - index,
                  y: index === active ? [0, -40, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, z: 100, rotate: Math.floor(Math.random() * 21) - 10 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 origin-bottom"
              >
                <ImageContainer src={testimonial.src} alt={testimonial.name} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex flex-col justify-between py-4 w-full h-full">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className='flex flex-col justify-center space-y-4'
          >
            <h3 className="font-bold text-2xl text-white">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-neutral-400">
              {testimonials[active].designation}
            </p>
            <motion.p className="text-lg text-neutral-200 leading-relaxed">
              {testimonials[active].quote}
            </motion.p>
          </motion.div>
          <div className="flex gap-4 pt-12 w-full">
            <HalomotButton inscription="Previous" onClick={handlePrev} fixedWidth="172px" backgroundColor='#161616' hoverTextColor='#fff' gradient='linear-gradient(to right, #603dec, #a123f4)' />
            <HalomotButton inscription="Next" onClick={handleNext} fixedWidth="172px" backgroundColor='#161616' hoverTextColor='#fff' gradient='linear-gradient(to right, #603dec, #a123f4)'/>
            <HalomotButton inscription="Open Web App" onClick={(e) => { e.preventDefault(); window.open(testimonials[active].link, "_blank")}} fillWidth href={testimonials[active].link} backgroundColor='#161616' hoverTextColor='#fff' gradient='linear-gradient(to right, #603dec, #a123f4)'/>
          </div>
        </div>
      </div>
    </div>
  );
};
ProjectShowcase.displayName = "ProjectShowcase";


// ============================================================================
// 4. PAGE-LEVEL STATIC DATA
// ============================================================================

const features = [
  { icon: MemoizedCpu, title: "性能卓越", description: "在任何情况下都能实现超快速的数据处理。" },
  { icon: MemoizedShieldCheck, title: "安全可靠", description: "先进的保护措施，让您高枕无忧。" },
  { icon: MemoizedLayers, title: "模块化设计", description: "轻松与现有架构集成。" },
  { icon: MemoizedZap, title: "闪电响应", description: "对每个命令都能做出即时响应。" },
];

// 使用 Next/Image 替换原生 <img>，并提供 width 和 height
const timelineData = [
    {
      title: "2024",
      content: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">从零开始构建并发布了 Aceternity UI 和 Aceternity UI Pro。</p>
          <div>
            <Image 
              src="https://assets.aceternity.com/templates/startup-1.webp" 
              alt="启动模板" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl" 
            />
          </div>
        </div>
      ),
    },
    {
      title: "2023年初",
      content: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">我通常会用完文案，但当我看到这么大的内容时，我尝试整合一些占位文字。</p>
          <div>
            <Image 
              src="https://assets.aceternity.com/pro/hero-sections.png" 
              alt="英雄区模板" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl" 
            />
          </div>
        </div>
      ),
    },
    {
      title: "变更日志",
      content: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-4">今天在 Aceternity 上部署了5个新组件。</p>
          <div>
            <Image 
              src="https://assets.aceternity.com/pro/bento-grids.png" 
              alt="新组件预览" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl"
            />
          </div>
        </div>
      ),
    },
];

const projectShowcaseData = [
  {
    name: "Plum Cave",
    quote: '一个云备份解决方案，它采用 "ChaCha20 + Serpent-256 CBC + HMAC-SHA3-512" 认证加密方案进行数据加密，并使用 ML-KEM-1024 进行抗量子密钥交换。',
    designation: "Next.js 项目",
    src: "https://raw.githubusercontent.com/Northstrix/my-portfolio/refs/heads/main/public/plum-cave.webp",
    link: "https://plum-cave.netlify.app/",
  },
  {
    name: "Namer UI",
    quote: "一个现代、美观且独特的可重用 TypeScript 组件的全面集合，专为 Next.js 打造。",
    designation: "Next.js 项目",
    src: "https://raw.githubusercontent.com/Northstrix/my-portfolio/refs/heads/main/public/namer-ui.webp",
    link: "https://namer-ui.netlify.app/",
  },
  {
    name: "Namer UI For Vue",
    quote: "一个为 Vue 3 打造的可定制、可重用的 TypeScript 和原生 CSS 组件集合。",
    designation: "Vue 项目",
    src: "https://raw.githubusercontent.com/Northstrix/my-portfolio/refs/heads/main/public/namer-ui-for-vue.webp",
    link: "https://namer-ui-for-vue.netlify.app/",
  },
];


// ============================================================================
// 5. MAIN PAGE COMPONENT
// ============================================================================

export default function HomePage() {
  return (
    <div className="relative isolate bg-black text-white">
      {/* 全局背景元素 */}
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_right,#1A2428,#000_70%)]"></div>
      <Scene />

      {/* 页面内容 */}
      <main className="relative z-10">
        <div className="min-h-screen w-full flex flex-col items-center justify-center py-24">
            <div className="w-full max-w-6xl px-8 space-y-16 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="space-y-6 flex items-center justify-center flex-col">
                  <h1 className="text-3xl md:text-6xl font-semibold tracking-tight max-w-3xl text-white">
                    发现极简主义与强大力量的融合
                  </h1>
                  <p className="text-lg text-neutral-300 max-w-2xl">
                    我们在设计时充分考虑了美学与性能。体验超快的处理速度、高级别的安全性以及直观的设计。
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
                {features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-start items-start space-y-2 md:space-y-3"
                  >
                    <feature.icon size={18} className="text-white/80 md:w-5 md:h-5" />
                    <h3 className="text-sm md:text-base font-medium text-white">{feature.title}</h3>
                    <p className="text-xs md:text-sm text-neutral-400">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
        </div>
        
        <Timeline data={timelineData} />

        <div className="max-w-7xl mx-auto px-8">
            <ProjectShowcase testimonials={projectShowcaseData} />
        </div>
      </main>
    </div>
  );
}
