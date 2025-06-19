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
import Image from 'next/image';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  type Variants
} from "framer-motion";

// --- 从新组件中添加的依赖项 ---
import { Menu, MoveRight, X } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';


// ============================================================================
// 0. 工具函数 (来自 shadcn/ui)
// ============================================================================
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


// ============================================================================
// 1. 新的导航栏组件 (合并自用户提供的文件)
// ============================================================================

// --- 辅助组件: Button (来自 button.tsx) ---
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/90",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
        outline: "border border-slate-200 bg-transparent hover:bg-slate-100 hover:text-slate-900",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        ghost: "hover:bg-slate-800 hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";


// --- 辅助组件: NavigationMenu (来自 navigation-menu.tsx) ---
const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-slate-800/50 data-[state=open]:bg-slate-800/50"
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDownIcon
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
      className
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border border-slate-700 bg-black text-white shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;


// --- 主导航栏组件 (来自 header.tsx) ---
const AppNavigationBar = () => {
    const navigationItems = [
        { title: "Home", href: "/", description: "" },
        {
            title: "Product", description: "Managing a small business today is already tough.",
            items: [
                { title: "Reports", href: "#" },
                { title: "Statistics", href: "#" },
                { title: "Dashboards", href: "#" },
                { title: "Recordings", href: "#" },
            ],
        },
        {
            title: "Company", description: "Managing a small business today is already tough.",
            items: [
                { title: "About us", href: "#" },
                { title: "Fundraising", href: "#" },
                { title: "Investors", href: "#" },
                { title: "Contact us", href: "#" },
            ],
        },
    ];

    const [isOpen, setOpen] = useState(false);
    
    return (
        <header className="w-full z-50 fixed top-0 left-0 bg-black/50 backdrop-blur-sm">
            <div className="container relative mx-auto min-h-20 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center px-4 md:px-8">
                <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.title}>
                                    {item.href ? (
                                        <Link href={item.href} legacyBehavior passHref>
                                            <NavigationMenuLink asChild>
                                                <Button variant="ghost">{item.title}</Button>
                                            </NavigationMenuLink>
                                        </Link>
                                    ) : (
                                        <>
                                            <NavigationMenuTrigger className="font-medium text-sm">
                                                {item.title}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="!w-[450px] p-4">
                                                <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-base font-semibold">{item.title}</p>
                                                            <p className="text-neutral-400 text-sm">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        <Button size="sm" className="mt-10" variant="outline">
                                                            Book a call today
                                                        </Button>
                                                    </div>
                                                    <div className="flex flex-col text-sm h-full justify-end">
                                                        {item.items?.map((subItem) => (
                                                          <Link href={subItem.href} key={subItem.title} legacyBehavior passHref>
                                                            <NavigationMenuLink
                                                              className="flex flex-row justify-between items-center hover:bg-slate-800 py-2 px-4 rounded"
                                                            >
                                                                <span>{subItem.title}</span>
                                                                <MoveRight className="w-4 h-4 text-neutral-400" />
                                                            </NavigationMenuLink>
                                                          </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </NavigationMenuContent>
                                        </>
                                    )}
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="flex lg:justify-center">
                    <Link href="/" className="font-semibold text-xl">
                      MyPortfolio
                    </Link>
                </div>
                <div className="flex justify-end w-full gap-2 md:gap-4">
                    <Button variant="ghost" className="hidden md:inline">
                        Book a demo
                    </Button>
                    <div className="border-r border-slate-700 hidden md:inline"></div>
                    <Button variant="outline">Sign in</Button>
                    <Button variant='default'>Get started</Button>
                </div>
                <div className="flex w-12 shrink lg:hidden items-end justify-end">
                    <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    {isOpen && (
                        <div className="absolute top-20 border-t border-slate-800 flex flex-col w-full right-0 bg-black shadow-lg py-4 container gap-8">
                            {navigationItems.map((item) => (
                                <div key={item.title}>
                                    <div className="flex flex-col gap-2">
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                className="flex justify-between items-center"
                                                onClick={() => setOpen(false)}
                                            >
                                                <span className="text-lg">{item.title}</span>
                                                <MoveRight className="w-4 h-4 stroke-1 text-neutral-400" />
                                            </Link>
                                        ) : (
                                            <p className="text-lg font-semibold">{item.title}</p>
                                        )}
                                        {item.items &&
                                            item.items.map((subItem) => (
                                                <Link
                                                    key={subItem.title}
                                                    href={subItem.href}
                                                    className="flex justify-between items-center pl-2"
                                                    onClick={() => setOpen(false)}
                                                >
                                                    <span className="text-neutral-300">
                                                        {subItem.title}
                                                    </span>
                                                    <MoveRight className="w-4 h-4 stroke-1" />
                                                </Link>
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
AppNavigationBar.displayName = "AppNavigationBar";


// ============================================================================
// 2. 页面区域和布局组件 (现有代码)
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

const ImageContainer = ({ src, alt }: { src: string; alt: string; }) => (
  <div className="relative h-full w-full rounded-2xl overflow-hidden p-px bg-zinc-800">
    <Image 
      src={src} 
      alt={alt} 
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover object-center rounded-[15px]" 
      priority
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
// 3. 新增: 带模型图的信息卡片区域组件
// ============================================================================
interface InfoSectionProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    primaryImageSrc: string;
    secondaryImageSrc: string;
    reverseLayout?: boolean;
}

const InfoSectionWithMockup: React.FC<InfoSectionProps> = ({
    title,
    description,
    primaryImageSrc,
    secondaryImageSrc,
    reverseLayout = false,
}) => {
    const containerVariants: Variants = {
        hidden: {},
        visible: {
             transition: {
                staggerChildren: 0.2,
            }
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
    };

    const layoutClasses = reverseLayout
        ? "md:grid-cols-2 md:grid-flow-col-dense"
        : "md:grid-cols-2";

    const textOrderClass = reverseLayout ? "md:col-start-2" : "";
    const imageOrderClass = reverseLayout ? "md:col-start-1" : "";


    return (
        <section className="relative py-24 md:py-32 bg-transparent overflow-hidden">
            <div className="container max-w-[1220px] w-full px-6 md:px-10 relative z-10 mx-auto">
                <motion.div
                     className={`grid grid-cols-1 gap-16 md:gap-8 w-full items-center ${layoutClasses}`}
                     variants={containerVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true, amount: 0.2 }}
                >
                    {/* Text Content */}
                    <motion.div
                        className={cn(
                            "flex flex-col justify-center gap-4 mt-10 md:mt-0",
                            textOrderClass,
                            "items-center text-center",
                            reverseLayout ? "md:items-start md:text-left" : "md:items-end md:text-right"
                        )}
                        variants={itemVariants}
                    >
                         <div className="space-y-2 md:space-y-1">
                            <h2 className="text-white text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                                {title}
                            </h2>
                        </div>

                        <p className="text-[#868f97] text-sm md:text-[15px] leading-6">
                            {description}
                        </p>
                    </motion.div>

                    {/* App mockup/Image Content */}
                    <motion.div
                        className={cn(
                            "relative mt-10 md:mt-0 mx-auto w-full max-w-[300px] md:max-w-[471px]",
                            imageOrderClass,
                            reverseLayout ? "md:justify-self-end" : "md:justify-self-start"
                         )}
                        variants={itemVariants}
                    >
                        {/* Decorative Background Element */}
                        <motion.div
                             className={`absolute w-[300px] h-[317px] md:w-[472px] md:h-[500px] bg-[#090909] rounded-[32px] z-0`}
                             style={{
                                top: reverseLayout ? 'auto' : '10%',
                                bottom: reverseLayout ? '10%' : 'auto',
                                left: reverseLayout ? 'auto' : '-20%',
                                right: reverseLayout ? '-20%' : 'auto',
                                transform: reverseLayout ? 'translate(0, 0)' : 'translateY(10%)',
                                filter: 'blur(2px)'
                            }}
                            initial={{ y: reverseLayout ? 0 : 0 }}
                            whileInView={{ y: reverseLayout ? -20 : -30 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div
                                className="relative w-full h-full bg-cover bg-center rounded-[32px]"
                                style={{
                                    backgroundImage: `url(${secondaryImageSrc})`,
                                }}
                            />
                        </motion.div>

                        {/* Main Mockup Card */}
                        <motion.div
                            className="relative w-full h-[405px] md:h-[637px] bg-[#ffffff0a] rounded-[32px] backdrop-blur-[15px] backdrop-brightness-[100%] border-0 z-10 overflow-hidden"
                            initial={{ y: reverseLayout ? 0 : 0 }}
                            whileInView={{ y: reverseLayout ? 20 : 30 }}
                             transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                             viewport={{ once: true, amount: 0.5 }}
                        >
                             <Image
                                src={primaryImageSrc}
                                alt={typeof title === 'string' ? title : 'Info Section Image'}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Decorative bottom gradient */}
            <div
                className="absolute w-full h-px bottom-0 left-0 z-0"
                style={{
                    background:
                        "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0) 100%)",
                }}
            />
        </section>
    );
};
InfoSectionWithMockup.displayName = "InfoSectionWithMockup";


// ============================================================================
// 4. 页面级别的静态数据 (现有代码)
// ============================================================================

// --- 修复: 添加缺失的 IconProps 接口 ---
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

// --- 新增: 信息卡片区域的数据 ---
const infoSectionData1 = {
    title: (
        <>
            智慧洞察,
            <br />
            为您呈现
        </>
    ),
    description: (
        <>
            每周一早晨，您的虚拟个人分析师会将精心制作的简报
            <br />
            直接发送到您的收件箱，重点介绍未来一周
            <br />
            值得关注的重要事件和财报。
        </>
    ),
    primaryImageSrc: 'https://www.fey.com/marketing/_next/static/media/newsletter-desktop-2_4x.e594b737.png',
    secondaryImageSrc: 'https://www.fey.com/marketing/_next/static/media/newsletter-desktop-1_4x.9cc114e6.png',
};

const infoSectionData2 = {
    title: (
        <>
            无缝集成,
            <br />
            强大扩展
        </>
    ),
    description: (
        <>
            我们的平台设计灵活，可以轻松与您现有的
            <br />
            工作流程和工具集成。无论您的团队规模如何，
            <br />
            都能够无缝扩展，满足您的业务需求。
        </>
    ),
    primaryImageSrc: 'https://www.fey.com/marketing/_next/static/media/integrations-desktop-2_4x.0354ddce.png',
    secondaryImageSrc: 'https://www.fey.com/marketing/_next/static/media/integrations-desktop-1_4x.2d24492a.png',
};


// ============================================================================
// 5. 主页面组件 (已修改)
// ============================================================================

export default function HomePage() {
  return (
    <div className="relative isolate bg-black text-white">
      <AppNavigationBar />
      {/* 全局背景元素 */}
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_right,#1A2428,#000_70%)]"></div>
      <Scene />

      {/* 页面内容 */}
      <main className="relative z-10 pt-20">
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
        
        {/* --- 新增的组件实例 --- */}
        <InfoSectionWithMockup {...infoSectionData1} />
        <InfoSectionWithMockup {...infoSectionData2} reverseLayout={true} />

      </main>
    </div>
  );
}
