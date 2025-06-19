// For Next.js App Router, this component uses hooks and event listeners,
// so it must be declared as a Client Component.
'use client';

import React, { 
    useRef, 
    useEffect, 
    useState, 
    createContext, 
    useContext, 
    Children, 
    cloneElement,
    useMemo
} from 'react';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  type MotionValue,
  type SpringOptions,
} from "framer-motion";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// 1. CORE UTILITIES
// Adhering to the principle of having a centralized utility for class name merging.
// ============================================================================

/**
 * Merges Tailwind CSS classes safely.
 * @param inputs - A list of class names.
 * @returns A string of merged class names.
 */
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 2. ATOMIC UI COMPONENTS & ICONS
// Small, reusable, and pure components. Icons are inlined as SVG components
// for portability and performance, wrapped in React.memo for optimization.
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

const MemoizedHomeIcon = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
));
MemoizedHomeIcon.displayName = 'HomeIcon';

const MemoizedPackage = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0" /><path d="M12 14.8V22" /><path d="M12 2v7.8" /><path d="M12 22a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M12 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /></svg>
));
MemoizedPackage.displayName = 'PackageIcon';

const MemoizedComponent = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20.94c1.5 0 2.85-.83 3.54-2.06.69-1.23.69-2.77 0-4l-3.54-6.32-3.54 6.32c-.69 1.23-.69 2.77 0 4 .69 1.23 2.04 2.06 3.54 2.06Z" /><path d="m3.8 15.3 4-6.94" /><path d="m20.2 15.3-4-6.94" /><path d="M12 22v-1.06" /><path d="M12 8.84V2" /><path d="M4.93 4.93 7.76 7.76" /><path d="M19.07 4.93 16.24 7.76" /></svg>
));
MemoizedComponent.displayName = 'ComponentIcon';

const MemoizedActivity = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
));
MemoizedActivity.displayName = 'ActivityIcon';

const MemoizedScrollText = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4Z" /><path d="M16 6h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M8 18H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2" /><path d="M16 12h-8" /></svg>
));
MemoizedScrollText.displayName = 'ScrollTextIcon';

const MemoizedMail = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
));
MemoizedMail.displayName = 'MailIcon';

const MemoizedSunMoon = React.memo((props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M12 3v1" /><path d="M12 20v1" /><path d="M3 12h1" /><path d="M20 12h1" /><path d="m18.36 5.64-.7-.7" /><path d="m6.34 17.66-.7-.7" /><path d="m18.36 18.36-.7-.7" /><path d="m6.34 6.34-.7-.7" /></svg>
));
MemoizedSunMoon.displayName = 'SunMoonIcon';


// ============================================================================
// 3. DOCK COMPONENT SUITE
// This section contains the logic for the floating dock navigation.
// It's broken down into a provider and several child components.
// ============================================================================

const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;

type DockContextType = {
  mouseX: MotionValue<number>;
  magnification: number;
  distance: number;
};
const DockContext = createContext<DockContextType | null>(null);

const useDockContext = () => {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("useDockContext must be used within a DockProvider");
  }
  return context;
};

const DockProvider = ({
  children,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
}: {
  children: React.ReactNode;
  magnification?: number;
  distance?: number;
}) => {
  const mouseX = useMotionValue(Infinity);
  const value = useMemo(() => ({ mouseX, magnification, distance }), [mouseX, magnification, distance]);
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
};
DockProvider.displayName = "DockProvider";

const Dock = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    const { mouseX } = useDockContext();
    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn("mx-auto flex h-16 items-end gap-4 rounded-2xl bg-neutral-900/10 px-4 pb-3 backdrop-blur-md", className)}
      >
        {children}
      </motion.div>
    );
  }
);
Dock.displayName = "Dock";

const DockItem = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { mouseX, magnification, distance } = useDockContext();
  const isHovered = useMotionValue(false);

  const width = useSpring(
    useTransform(
      useTransform(mouseX, (val) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
      }),
      [-distance, 0, distance],
      [40, magnification, 40]
    ),
    { mass: 0.1, stiffness: 150, damping: 12 }
  );

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onHoverStart={() => isHovered.set(true)}
      onHoverEnd={() => isHovered.set(false)}
      className={cn("relative flex items-center justify-center", className)}
    >
      {Children.map(children, (child) => cloneElement(child as React.ReactElement, { isHovered }))}
    </motion.div>
  );
};
DockItem.displayName = "DockItem";

const DockLabel = ({ children }: { children: React.ReactNode }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 0 }}
      animate={{ opacity: 1, y: -10 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-white"
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
DockLabel.displayName = "DockLabel";

const DockIcon = ({ children, isHovered, title }: { children: React.ReactNode; isHovered?: MotionValue<boolean>; title: string }) => {
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
        if (isHovered) {
            const unsubscribe = isHovered.on("change", (latest) => {
                setShowLabel(latest);
            });
            return () => unsubscribe();
        }
    }, [isHovered]);

    return (
        <div className="flex h-full w-full items-center justify-center">
            {children}
            <AnimatePresence>
                {showLabel && <DockLabel>{title}</DockLabel>}
            </AnimatePresence>
        </div>
    );
};
DockIcon.displayName = "DockIcon";

const dockItems = [
    { title: "首页", icon: <MemoizedHomeIcon className='h-full w-full text-neutral-300' /> },
    { title: "产品", icon: <MemoizedPackage className='h-full w-full text-neutral-300' /> },
    { title: "组件", icon: <MemoizedComponent className='h-full w-full text-neutral-300' /> },
    { title: "动态", icon: <MemoizedActivity className='h-full w-full text-neutral-300' /> },
    { title: "日志", icon: <MemoizedScrollText className='h-full w-full text-neutral-300' /> },
    { title: "邮件", icon: <MemoizedMail className='h-full w-full text-neutral-300' /> },
    { title: "主题", icon: <MemoizedSunMoon className='h-full w-full text-neutral-300' /> },
];

const FloatingDock = () => (
    <div className='fixed top-4 left-1/2 z-50 w-full max-w-fit -translate-x-1/2'>
        <DockProvider>
            <Dock>
                {dockItems.map((item) => (
                    <DockItem key={item.title}>
                        <DockIcon title={item.title}>{item.icon}</DockIcon>
                    </DockItem>
                ))}
            </Dock>
        </DockProvider>
    </div>
);
FloatingDock.displayName = "FloatingDock";


// ============================================================================
// 4. PAGE SECTIONS & LAYOUT COMPONENTS
// Larger components that compose the page.
// ============================================================================

const Box = ({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number]; }) => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.absarc(2, 2, 1, 0, Math.PI * 2, false);
        return s;
    }, []);
    const extrudeSettings = useMemo(() => ({ depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 20, curveSegments: 20 }), []);
    const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, extrudeSettings), [shape, extrudeSettings]);
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
    <div className="fixed top-0 left-0 w-full h-full -z-10">
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
          <div key={index} className="flex justify-start pt-10 md:pt-40 md:gap-10">
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


// ============================================================================
// 5. PAGE-LEVEL STATIC DATA
// Defining static data outside the component to prevent re-creation on re-renders.
// ============================================================================

const features = [
  { icon: MemoizedCpu, title: "性能卓越", description: "在任何情况下都能实现超快速的数据处理。" },
  { icon: MemoizedShieldCheck, title: "安全可靠", description: "先进的保护措施，让您高枕无忧。" },
  { icon: MemoizedLayers, title: "模块化设计", description: "轻松与现有架构集成。" },
  { icon: MemoizedZap, title: "闪电响应", description: "对每个命令都能做出即时响应。" },
];

const timelineData = [
    {
      title: "2024",
      content: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">从零开始构建并发布了 Aceternity UI 和 Aceternity UI Pro。</p>
          <div className="grid grid-cols-2 gap-4">
            <Image src="https://assets.aceternity.com/templates/startup-1.webp" alt="启动模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
            <Image src="https://assets.aceternity.com/templates/startup-2.webp" alt="启动模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
            <Image src="https://assets.aceternity.com/templates/startup-3.webp" alt="启动模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
            <Image src="https://assets.aceternity.com/templates/startup-4.webp" alt="启动模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
          </div>
        </div>
      ),
    },
    {
      title: "2023年初",
      content: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-8">我通常会用完文案，但当我看到这么大的内容时，我尝试整合一些占位文字。</p>
          <div className="grid grid-cols-2 gap-4">
            <Image src="https://assets.aceternity.com/pro/hero-sections.png" alt="英雄区模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
            <Image src="https://assets.aceternity.com/features-section.png" alt="功能区模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
            <Image src="https://assets.aceternity.com/pro/bento-grids.png" alt="Bento网格模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
            <Image src="https://assets.aceternity.com/cards.png" alt="卡片模板" width={500} height={500} className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset]" />
          </div>
        </div>
      ),
    },
    {
      title: "变更日志",
      content: (
        <div>
          <p className="text-neutral-200 text-xs md:text-sm font-normal mb-4">今天在 Aceternity 上部署了5个新组件。</p>
          <div className="mb-8">
            <div className="flex gap-2 items-center text-neutral-300 text-xs md:text-sm">✅ 卡片网格组件</div>
            <div className="flex gap-2 items-center text-neutral-300 text-xs md:text-sm">✅ 启动模板 Aceternity</div>
            <div className="flex gap-2 items-center text-neutral-300 text-xs md:text-sm">✅ 随机文件上传 哈哈</div>
          </div>
        </div>
      ),
    },
];


// ============================================================================
// 6. MAIN PAGE COMPONENT
// The final page, composed of the sections and components defined above.
// ============================================================================

export default function HomePage() {
  return (
    <div className="bg-black text-white">
      {/* 全局背景元素 */}
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_right,#1A2428,#000_70%)]"></div>
      <Scene />
      <FloatingDock />

      {/* 页面内容 */}
      <main className="relative z-10">
        <div className="min-h-screen w-full flex flex-col items-center justify-center">
            <div className="w-full max-w-6xl px-8 space-y-12 flex flex-col items-center justify-center">
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="space-y-6 flex items-center justify-center flex-col pt-16">
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
        
        {/* 时间轴部分 */}
        <Timeline data={timelineData} />
      </main>
    </div>
  );
};
