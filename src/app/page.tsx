// For Next.js App Router, this component uses hooks and event listeners,
// so it must be declared as a Client Component.
'use client';

import React, { 
    useRef, 
    useEffect, 
    useState, 
    useMemo,
    useCallback,
    memo
} from 'react';
import Image from 'next/image';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  type Variants,
  type HTMLMotionProps,
} from "framer-motion";

// 修复：导入真实的 Server Actions
import { saveContactToRedis, saveFooterEmailToRedis } from './actions';

import { Menu, MoveRight, X, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from 'class-variance-authority';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';


// ============================================================================
// 0. 工具函数 (来自 shadcn/ui)
// ============================================================================
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 为联系人表单数据定义类型接口
interface ContactFormData {
  name: string;
  serviceArea: string;
  email: string;
  countryKey: string;
  phone: string;
  state: string;
}

// 这是一个标准的 Link 组件，保持不变
interface CustomLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  legacyBehavior?: boolean;
  passHref?: boolean;
}

const Link = ({ href, children, legacyBehavior, ...props }: CustomLinkProps) => {
    if (legacyBehavior) {
        const child = React.Children.only(children) as React.ReactElement;
        const newProps = { ...props, href };
        return React.cloneElement(child, newProps);
    }
    return <a href={href} {...props}>{children}</a>;
};
Link.displayName = "Link";

// ============================================================================
// 新增：星场/粒子穿梭动画组件
// ============================================================================
const Starfield = ({
  speed = 2,
  particleCount = 1500,
  warpSpeedActive = false,
  accelerationDuration = 2, // 加速持续时间（秒）
  maxSpeed = 50, // 最大速度
}) => {
  const ref = useRef<THREE.Points>(null);
  const warpStartTime = useRef(0);

  const [positions] = useState(() => {
    const particles = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 10;
      particles[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particles[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return particles;
  });

  // [优化] 当 warpSpeedActive 变化时，记录开始时间
  useEffect(() => {
    if (warpSpeedActive) {
      warpStartTime.current = Date.now();
    }
  }, [warpSpeedActive]);

  useFrame((state, delta) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      
      let currentSpeed;
      if (warpSpeedActive) {
        const elapsedTime = (Date.now() - warpStartTime.current) / 1000;
        const accelerationProgress = Math.min(elapsedTime / accelerationDuration, 1);
        // [优化] 使用缓动函数 (easeOut) 来计算速度，实现非线性加速
        const easedProgress = 1 - Math.pow(1 - accelerationProgress, 3);
        currentSpeed = speed + (maxSpeed - speed) * easedProgress;
      } else {
        currentSpeed = speed;
      }

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] += delta * currentSpeed;

        // 当粒子超出视野时重置位置
        if (positions[i * 3 + 2] > 5) {
          positions[i * 3] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 2] = -5;
        }
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#ffffff"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
Starfield.displayName = "Starfield";


// ============================================================================
// “开场动画/门” - SVG 自动扫描光效文字组件 (已修改为实体样式)
// ============================================================================
const TextShineEffect = ({
  text,
  subtitle,
  scanDuration = 4,
  onClick
}: {
  text: string;
  subtitle?: string;
  scanDuration?: number;
  onClick?: () => void;
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 200"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none cursor-pointer"
      onClick={onClick}
    >
      <defs>
        {/* 这部分是定义颜色和光效，保持不变 */}
        <linearGradient id="textGradient">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="25%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="75%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="25%"
          animate={{ cx: ["-25%", "125%"] }}
          transition={{
            duration: scanDuration,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      {/* 主标题 (例如 "Apex") */}
      {/* 第一层: 白色实体字作为底色 */}
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        className="font-[Helvetica] text-6xl sm:text-7xl md:text-8xl font-bold"
      >
        {text}
      </text>
      {/* 第二层: 带闪光效果的彩色字，叠在上面 */}
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="url(#textGradient)"
        mask="url(#textMask)"
        className="font-[Helvetica] text-6xl sm:text-7xl md:text-8xl font-bold"
      >
        {text}
      </text>

      {/* 副标题 (例如 "轻触，开启非凡。") */}
      {subtitle && (
        <>
          {/* 第一层: 白色实体字作为底色 */}
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            className="font-[Helvetica] text-xl sm:text-2xl md:text-3xl font-semibold"
          >
            {subtitle}
          </text>
          {/* 第二层: 带闪光效果的彩色字，叠在上面 */}
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="url(#textGradient)"
            mask="url(#textMask)"
            className="font-[Helvetica] text-xl sm:text-2xl md:text-3xl font-semibold"
          >
            {subtitle}
          </text>
        </>
      )}
    </svg>
  );
};
TextShineEffect.displayName = "TextShineEffect";


// ============================================================================
// 1. 新的导航栏组件 (合并自用户提供的文件)
// ============================================================================

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/90",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
        outline: "border border-slate-700 bg-transparent hover:bg-slate-800",
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

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-50',
          "text-base md:text-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Label = React.forwardRef<
  React.ElementRef<'label'>,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
));
Label.displayName = 'Label';


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
NavigationMenuItem.displayName = "NavigationMenuItem";

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-800 focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-slate-800/50 data-[state=open]:bg-slate-800/50"
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", "text-base md:text-lg", className)}
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

const NavigationMenuLink = React.forwardRef<
    React.ElementRef<'a'>,
    React.ComponentPropsWithoutRef<'a'> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';
    return <Comp ref={ref} className={cn("focus:shadow-md", className)} {...props} />;
});
NavigationMenuLink.displayName = 'NavigationMenuLink';

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

// 导航栏组件
const AppNavigationBar = ({ onLoginClick, onProtectedLinkClick }: { onLoginClick: () => void; onProtectedLinkClick: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => void; }) => {
    const navigationItems = [
        { title: "主页", href: "/", description: "" },
        {
            title: "客户支持", description: "拥抱数字化转型，提升客户体验。",
            items: [
                { title: "问卷调查", href: "https://www.apex-elite-service.com/wenjuandiaocha" },
                { title: "资料上传", href: "https://zl.apex-elite-service.com/" },
                { title: "客户反馈", href: "https://www.apex-elite-service.com/kehufankui" },
                { title: "活动报名", href: "https://www.apex-elite-service.com/huodongbaoming" },
            ],
        },
        {
            title: "AI赋能", description: "AI驱动的智能，提升业务效率。",
            items: [
                { title: "实时汇率", href: "https://www.apex-elite-service.com/shishihuilv" },
                { title: "个税计算器", href: "https://www.apex-elite-service.com/geshuijisuanqi" },
                { title: "专属AI", href: "https://www.apex-elite-service.com/zhuanshuAI" },
                { title: "敬请期待", href: "#" },
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
                                        <NavigationMenuLink asChild>
                                            <Link href={item.href}>
                                                <Button variant="ghost" className="text-base md:text-lg">{item.title}</Button>
                                            </Link>
                                        </NavigationMenuLink>
                                    ) : (
                                        <>
                                            <NavigationMenuTrigger className="text-base md:text-lg">
                                                {item.title}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="!w-[450px] p-4">
                                                <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="font-semibold text-base md:text-lg">{item.title}</p>
                                                            <p className="text-neutral-400 text-base md:text-lg">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        <Link href="#">
                                                            <Button size="sm" className="mt-10 text-base md:text-lg" variant="outline">
                                                                商业洞察
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                    <div className="flex flex-col text-base md:text-lg h-full justify-end">
                                                        {item.items?.map((subItem) => (
                                                            <NavigationMenuLink asChild key={subItem.title}>
                                                                <a
                                                                    href={subItem.href}
                                                                    onClick={(e) => onProtectedLinkClick(e, subItem.href)}
                                                                    className="flex flex-row justify-between items-center hover:bg-slate-800 py-2 px-4 rounded"
                                                                >
                                                                    <span>{subItem.title}</span>
                                                                    <MoveRight className="w-4 h-4 text-neutral-400" />
                                                                </a>
                                                            </NavigationMenuLink>
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
                    <Link href="/" className="text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                      Apex
                    </Link>
                </div>
                <div className="flex justify-end w-full gap-2 md:gap-4">
                    <Button variant="ghost" className="hidden md:inline text-base md:text-lg">
                        欢迎您！
                    </Button>
                    <div className="border-r border-slate-700 hidden md:inline"></div>
                    <Button variant="outline" onClick={onLoginClick} className="text-base md:text-lg">提交</Button>
                    <Link href="#">
                        <Button variant="default" className="text-base md:text-lg">商业洞察</Button>
                    </Link>
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
                                            <a
                                                href={item.href}
                                                className="flex justify-between items-center"
                                                onClick={() => setOpen(false)}
                                            >
                                                <span className="text-base md:text-lg">{item.title}</span>
                                                <MoveRight className="w-4 h-4 stroke-1 text-neutral-400" />
                                            </a>
                                        ) : (
                                            <p className="font-semibold text-base md:text-lg">{item.title}</p>
                                        )}
                                        {item.items &&
                                            item.items.map((subItem) => (
                                                <a
                                                    key={subItem.title}
                                                    href={subItem.href}
                                                    onClick={(e) => {
                                                      onProtectedLinkClick(e, subItem.href);
                                                      setOpen(false);
                                                    }}
                                                    className="flex justify-between items-center pl-2"
                                                >
                                                    <span className="text-neutral-300 text-base md:text-lg">
                                                        {subItem.title}
                                                    </span>
                                                    <MoveRight className="w-4 h-4 stroke-1" />
                                                </a>
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
// 1.5 新增: 联系资料提交卡片组件及相关数据
// ============================================================================
const countryData = {
    'CN': { name: '中国', code: '+86', phoneRegex: /^1[3-9]\d{9}$/, states: ['北京', '上海', '天津', '重庆', '河北', '山西', '辽宁', '吉林', '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', '甘肃', '青海', '台湾', '内蒙古', '广西', '西藏', '宁夏', '新疆', '香港', '澳门'] },
    'US': { name: '美国', code: '+1', phoneRegex: /^\d{10}$/, states: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'] },
    'CA': { name: '加拿大', code: '+1', phoneRegex: /^\d{10}$/, states: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'] },
    'GB': { name: '英国', code: '+44', phoneRegex: /^7\d{9}$/, states: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
    'AU': { name: '澳大利亚', code: '+61', phoneRegex: /^4\d{8}$/, states: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'] },
    'DE': { name: '德国', code: '+49', phoneRegex: /^1[5-7]\d{9,10}$/, states: ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'] },
    'FR': { name: '法国', code: '+33', phoneRegex: /^[67]\d{8}$/, states: ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Normandy', 'Nouvelle-Aquitaine', 'Occitanie', 'Pays de la Loire', "Provence-Alpes-Côte d'Azur"] },
    'IT': { name: '意大利', code: '+39', phoneRegex: /^3\d{8,9}$/, states: ['Abruzzo', 'Aosta Valley', 'Apulia', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna', 'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardy', 'Marche', 'Molise', 'Piedmont', 'Sardinia', 'Sicily', 'Trentino-South Tyrol', 'Tuscany', 'Umbria', 'Veneto'] },
    'ES': { name: '西班牙', code: '+34', phoneRegex: /^[67]\d{8}$/, states: ['Andalusia', 'Aragon', 'Asturias', 'Balearic Islands', 'Basque Country', 'Canary Islands', 'Cantabria', 'Castile and León', 'Castilla-La Mancha', 'Catalonia', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarre', 'Valencian Community'] },
    'UA': { name: '乌克兰', code: '+380', phoneRegex: /^\d{9}$/, states: ['Cherkasy', 'Chernihiv', 'Chernivtsi', 'Dnipropetrovsk', 'Donetsk', 'Ivano-Frankivsk', 'Kharkiv', 'Kherson', 'Khmelnytskyi', 'Kyiv', 'Kirovohrad', 'Luhansk', 'Lviv', 'Mykolaiv', 'Odessa', 'Poltava', 'Rivne', 'Sumy', 'Ternopil', 'Vinnytsia', 'Volyn', 'Zakarpattia', 'Zaporizhzhia', 'Zhytomyr'] },
    'PL': { name: '波兰', code: '+48', phoneRegex: /^\d{9}$/, states: ['Greater Poland', 'Kuyavian-Pomeranian', 'Lesser Poland', 'Łódź', 'Lower Silesian', 'Lublin', 'Lubusz', 'Masovian', 'Opole', 'Podlaskie', 'Pomeranian', 'Silesian', 'Subcarpathian', 'Świętokrzyskie', 'Warmian-Masurian', 'West Pomeranian'] },
    'NL': { name: '荷兰', code: '+31', phoneRegex: /^6\d{8}$/, states: ['Drenthe', 'Flevoland', 'Friesland', 'Gelderland', 'Groningen', 'Limburg', 'North Brabant', 'North Holland', 'Overijssel', 'Utrecht', 'Zeeland', 'South Holland'] },
    'BE': { name: '比利时', code: '+32', phoneRegex: /^4\d{8}$/, states: ['Antwerp', 'East Flanders', 'Flemish Brabant', 'Hainaut', 'Liège', 'Limburg', 'Luxembourg', 'Namur', 'Walloon Brabant', 'West Flanders'] },
    'SE': { name: '瑞典', code: '+46', phoneRegex: /^7[02369]\d{7}$/, states: ['Blekinge', 'Dalarna', 'Gävleborg', 'Gotland', 'Halland', 'Jämtland', 'Jönköping', 'Kalmar', 'Kronoberg', 'Norrbotten', 'Örebro', 'Östergötland', 'Skåne', 'Södermanland', 'Stockholm', 'Uppsala', 'Värmland', 'Västerbotten', 'Västernorrland', 'Västmanland'] },
    'CH': { name: '瑞士', code: '+41', phoneRegex: /^7[6-9]\d{7}$/, states: ['Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft', 'Basel-Stadt', 'Bern', 'Fribourg', 'Geneva', 'Glarus', 'Grisons', 'Jura', 'Lucerne', 'Neuchâtel', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz', 'Solothurn', 'St. Gallen', 'Thurgau', 'Ticino', 'Uri', 'Valais', 'Vaud', 'Zug', 'Zürich'] },
    'AT': { name: '奥地利', code: '+43', phoneRegex: /^6\d{8,12}$/, states: ['Burgenland', 'Carinthia', 'Lower Austria', 'Salzburg', 'Styria', 'Tyrol', 'Upper Austria', 'Vienna', 'Vorarlberg'] },
    'IE': { name: '爱尔兰', code: '+353', phoneRegex: /^8[35-9]\d{7}$/, states: ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'] },
    'PT': { name: '葡萄牙', code: '+351', phoneRegex: /^9[1-36]\d{7}$/, states: ['Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisbon', 'Portalegre', 'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Azores', 'Madeira'] },
    'RU': { name: '俄罗斯', code: '+7', phoneRegex: /^9\d{9}$/, states: ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Kazan', 'Nizhny Novgorod', 'Chelyabinsk', 'Samara', 'Omsk', 'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh', 'Volgograd'] },
    'JP': { name: '日本', code: '+81', phoneRegex: /^[789]0\d{8}$/, states: ['Hokkaido', 'Aomori', 'Iwate', 'Miyagi', 'Akita', 'Yamagata', 'Fukushima', 'Ibaraki', 'Tochigi', 'Gunma', 'Saitama', 'Chiba', 'Tokyo', 'Kanagawa', 'Niigata', 'Toyama', 'Ishikawa', 'Fukui', 'Yamanashi', 'Nagano', 'Gifu', 'Shizuoka', 'Aichi', 'Mie', 'Shiga', 'Kyoto', 'Osaka', 'Hyogo', 'Nara', 'Wakayama', 'Tottori', 'Shimane', 'Okayama', 'Hiroshima', 'Yamaguchi', 'Tokushima', 'Kagawa', 'Ehime', 'Kochi', 'Fukuoka', 'Saga', 'Nagasaki', 'Kumamoto', 'Oita', 'Miyazaki', 'Kagoshima', 'Okinawa'] },
    'KR': { name: '韩国', code: '+82', phoneRegex: /^10\d{8}$/, states: ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Gwangju', 'Daejeon', 'Ulsan', 'Gyeonggi', 'Gangwon', 'Chungcheongbuk', 'Chungcheongnam', 'Jeollabuk', 'Jeollanam', 'Gyeongsangbuk', 'Gyeongsangnam', 'Jeju'] },
    'SG': { name: '新加坡', code: '+65', phoneRegex: /^[89]\d{7}$/, states: ['Central Singapore', 'North East', 'North West', 'South East', 'South West'] },
    'MY': { name: '马来西亚', code: '+60', phoneRegex: /^1\d{8,9}$/, states: ['Johor', 'Kedah', 'Kelantan', 'Malacca', 'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya'] },
    'TH': { name: '泰国', code: '+66', phoneRegex: /^[689]\d{8}$/, states: ['Bangkok', 'Chiang Mai', 'Phuket', 'Chon Buri', 'Nakhon Ratchasima', 'Udon Thani', 'Songkhla', 'Khon Kaen', 'Surat Thani', 'Nonthaburi'] },
    'VN': { name: '越南', code: '+84', phoneRegex: /^[35789]\d{8}$/, states: ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho', 'An Giang', 'Ba Ria-Vung Tau', 'Bac Giang', 'Bac Kan', 'Bac Lieu', 'Bac Ninh'] },
    'PH': { name: '菲律宾', code: '+63', phoneRegex: /^9\d{9}$/, states: ['Metro Manila', 'Cebu', 'Davao del Sur', 'Rizal', 'Cavite', 'Laguna', 'Bulacan', 'Pampanga', 'Batangas', 'Pangasinan'] },
    'ID': { name: '印度尼西亚', code: '+62', phoneRegex: /^8\d{9,11}$/, states: ['Jakarta', 'West Java', 'East Java', 'Central Java', 'Banten', 'North Sumatra', 'South Sulawesi', 'Bali', 'Riau', 'Lampung'] },
};
const serviceAreas = ['企业落地', '准证申请', '子女教育', '溯源体检', '健康管理'];
const countryOptions = (Object.keys(countryData) as Array<keyof typeof countryData>).map(key => ({ value: key, label: `${countryData[key].name} (${countryData[key].code})` }));
const emailRegex = /^[a-zA-Z0-9._%+-]+@(?:gmail|outlook|hotmail|qq|163|yahoo)\.com$/i;

const SubmissionCard = ({ onSuccess }: { onSuccess: () => void }) => {
    const [formData, setFormData] = useState<ContactFormData>({ name: '', serviceArea: '', email: '', countryKey: '', phone: '', state: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateField = useCallback((name: string, value: string, currentCountryKey: string): boolean => {
        let errorMsg = '';
        if (typeof value === 'string' && !value.trim()) {
            errorMsg = '此字段不能为空';
        } else {
            switch (name) {
                case 'email': 
                    if (!emailRegex.test(value)) errorMsg = '请输入有效的邮箱地址 (Google, Outlook, QQ, 163, Yahoo)'; 
                    break;
                case 'phone':
                    if (currentCountryKey && countryData[currentCountryKey as keyof typeof countryData]) {
                        const regex = countryData[currentCountryKey as keyof typeof countryData].phoneRegex;
                        if (!regex.test(value)) errorMsg = `请输入有效的${countryData[currentCountryKey as keyof typeof countryData].name}手机号`;
                    } else if (value.trim()) {
                        errorMsg = '请先选择国家/地区';
                    }
                    break;
                default: 
                    break;
            }
        }
        setErrors(prev => ({ ...prev, [name]: errorMsg }));
        return !errorMsg;
    }, []);

    useEffect(() => {
        if (formData.countryKey) {
            setAvailableStates(countryData[formData.countryKey as keyof typeof countryData].states);
            setFormData(f => ({ ...f, state: '' }));
            validateField('phone', formData.phone, formData.countryKey);
        } else {
            setAvailableStates([]);
        }
    }, [formData.countryKey, formData.phone, validateField]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);
        validateField(name, value, newFormData.countryKey);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const isValid = Object.keys(formData).every(key => validateField(key, formData[key as keyof typeof formData], formData.countryKey));

        if (isValid) {
            // 创建一个包含时间戳的新对象
            const dataWithTimestamp = {
                ...formData,
                // 修改后的代码 (生成北京时间)
                submissionTime: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }),
            };
            const result = await saveContactToRedis(dataWithTimestamp);
            if (result.success) {
                alert('资料提交成功！');
                onSuccess();
            } else {
                alert(`提交失败: ${result.error || '未知错误'}`);
            }
        } else {
            console.log("表单存在错误");
        }
        setIsSubmitting(false);
    };
    
    return (
        <div className="bg-black text-white p-2 sm:p-0">
          <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">请留下您的联系资料</h1>
              <p className="text-neutral-400 mt-2">提交后即可访问内容</p>
          </div>
          <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-y-4">
                  <div>
                      <Label htmlFor="name">姓名</Label>
                      <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className={cn("mt-2", errors.name && 'border-red-500')} />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                      <Label htmlFor="serviceArea">选择服务领域</Label>
                      <select id="serviceArea" name="serviceArea" value={formData.serviceArea} onChange={handleChange} className={cn("form-input mt-2 w-full bg-black border-slate-700", errors.serviceArea && 'border-red-500')}>
                          <option value="" disabled>请选择...</option>
                          {serviceAreas.map(area => <option key={area} value={area}>{area}</option>)}
                      </select>
                      {errors.serviceArea && <p className="text-red-500 text-xs mt-1">{errors.serviceArea}</p>}
                  </div>
                  <div>
                      <Label htmlFor="email">输入邮箱</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={cn("mt-2", errors.email && 'border-red-500')} />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                      <Label htmlFor="phone">输入手机号</Label>
                      <div className="flex gap-2 mt-2">
                          <select id="countryKey" name="countryKey" value={formData.countryKey} onChange={handleChange} className={cn("form-input w-1/3 bg-black border-slate-700", errors.countryKey && 'border-red-500')}>
                              <option value="" disabled>国家</option>
                              {countryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className={cn("w-2/3", errors.phone && 'border-red-500')} placeholder="手机号码"/>
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                      <Label htmlFor="state">州/省</Label>
                      <select id="state" name="state" value={formData.state} onChange={handleChange} disabled={!formData.countryKey} className={cn("form-input mt-2 w-full bg-black border-slate-700", errors.state && 'border-red-500')}>
                          <option value="" disabled>请先选择国家</option>
                          {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>
              </div>
              <Button type="submit" className="w-full mt-6 bg-rose-500 hover:bg-rose-500/80 text-white" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : '提交并访问'}
              </Button>
          </form>
        </div>
    );
};
SubmissionCard.displayName = "SubmissionCard";

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
    <div className="w-full bg-transparent font-[Helvetica] md:px-10" ref={containerRef}>
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="mb-4 text-white max-w-4xl text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">企业服务<br />Corporate Services</h2>
        <p className="text-neutral-300 max-w-sm text-base md:text-lg">我们深知，在新加坡设立公司，是您全球战略的关键一步，而非一次简单的流程代办。Apex提供的，是从顶层视角出发，为您的商业大厦搭建最稳固、合规且具前瞻性的战略基石，并为后续的持续运营保驾护航。</p>
      </div>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-24 md:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-neutral-800 border border-neutral-700 p-2" />
              </div>
              {/* 修改：调整标题字号 */}
              <h3 className="hidden md:block md:pl-20 font-semibold text-white text-2xl md:text-3xl">{item.title}</h3>
            </div>
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              {/* 修改：调整标题字号 */}
              <h3 className="md:hidden block mb-4 text-left font-semibold text-white text-2xl md:text-3xl">{item.title}</h3>
              {item.content}
            </div>
          </div>
        ))}
        <motion.div style={{ height: heightTransform, opacity: opacityTransform }} className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full" />
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
    <a href={href} {...commonProps} rel="noopener noreferrer">{ButtonContent}</a>
  ) : (
    <button type="button" {...commonProps}>{ButtonContent}</button>
  );
  return fixedWidth ? <div style={containerStyle}>{ButtonElement}</div> : ButtonElement;
};
HalomotButton.displayName = "HalomotButton";

type Testimonial = {
  name: string; buttonLabel: string; quote: string; designation: string; src: string; link?: string;
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

const ProjectShowcase = ({ testimonials, onProtectedLinkClick }: { testimonials: Testimonial[], onProtectedLinkClick: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => void; }) => {
  const [active, setActive] = useState(0);
  
  // 修改：移除 handleNext 和 handlePrev，因为现在直接点击按钮切换

  return (
    <div className="w-full mx-auto font-[Helvetica] py-20 text-white">
      <div className="mb-12 text-right">
        <h2 className="mb-4 text-white text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
          留学教育
          <br />
          Study Abroad Education
        </h2>
        <p className="text-neutral-300 ml-auto max-w-lg text-base md:text-lg">
          我们为客户提供卓越的服务，以实现教育目标并取得成功。
        </p>
      </div>
      
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
            {/* 修改：调整标题字号 */}
            <h3 className="text-white text-2xl md:text-3xl font-semibold">
              {testimonials[active].name}
            </h3>
            
            <motion.p className="text-neutral-200 leading-relaxed text-base md:text-lg">
              {testimonials[active].quote}
            </motion.p>
          </motion.div>
          {/* 修改：按钮组布局和样式, 允许换行以适配移动端 */}
          <div className="flex flex-wrap items-center gap-3 pt-12 w-full">
            {testimonials.map((testimonial, index) => (
              <HalomotButton
                key={testimonial.name}
                inscription={testimonial.buttonLabel} // <-- 修改这里
                onClick={() => setActive(index)}
                padding="0.6rem 1.2rem" // 调整内边距使按钮变小
                backgroundColor={active === index ? '#4a148c' : '#161616'} // 高亮当前选中的项目
                hoverTextColor='#fff'
                gradient='linear-gradient(to right, #603dec, #a123f4)'
                fixedWidth="120px" // <-- 添加这一行
              />
            ))}
            <HalomotButton 
              inscription="了解更多" 
              onClick={(e) => onProtectedLinkClick(e, testimonials[active].link || 'https://www.apex-elite-service.com/')} 
              href={testimonials[active].link || '#'}
              padding="0.6rem 1.2rem" // 调整内边距使按钮变小
              backgroundColor='#161616' 
              hoverTextColor='#fff' 
              gradient='linear-gradient(to right, #603dec, #a123f4)'
              fixedWidth="120px" // <-- 添加这一行
            />
          </div>
        </div>
      </div>
    </div>
  );
};
ProjectShowcase.displayName = "ProjectShowcase";

// ============================================================================
// 3. 带模型图的信息卡片区域组件
// ============================================================================
interface InfoSectionProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    primaryImageSrc: string;
    secondaryImageSrc: string;
    reverseLayout?: boolean;
    className?: string; // 新增: 允许传入自定义样式
}

const InfoSectionWithMockup: React.FC<InfoSectionProps> = ({
    title,
    description,
    primaryImageSrc,
    secondaryImageSrc,
    reverseLayout = false,
    className, // 新增: 获取自定义样式
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
        // 修改: 使用 cn 函数合并默认样式和传入的自定义样式
        <section className={cn("relative py-24 md:py-32 bg-transparent overflow-hidden", className)}>
            <div className="container max-w-[1220px] w-full px-6 md:px-10 relative z-10 mx-auto">
                <motion.div
                     className={`grid grid-cols-1 gap-16 md:gap-8 w-full items-center ${layoutClasses}`}
                     variants={containerVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.div
                        className={cn(
                            "flex flex-col justify-center gap-4 mt-10 md:mt-0",
                            textOrderClass,
                            "items-center text-center",
                            reverseLayout ? "md:items-end md:text-right" : "md:items-start md:text-left"
                        )}
                        variants={itemVariants}
                    >
                         <div className="space-y-2 md:space-y-1">
                            <h2 className="text-white text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                                {title}
                            </h2>
                        </div>

                        <p className="text-[#868f97] leading-6 text-base md:text-lg">
                            {description}
                        </p>
                    </motion.div>

                    <motion.div
                        className={cn(
                            "relative mt-10 md:mt-0 mx-auto w-full max-w-[300px] md:max-w-[471px]",
                            imageOrderClass,
                            reverseLayout ? "md:justify-self-end" : "md:justify-self-start"
                         )}
                        variants={itemVariants}
                    >
                        <motion.div
                             className={`absolute w-[300px] h-[317px] md:w-[472px] md:h-[500px] bg-[#090909] rounded-[32px] z-0`}
                             style={{
                                top: reverseLayout ? 'auto' : '10%',
                                bottom: reverseLayout ? '10%' : 'auto',
                                left: reverseLayout ? 'auto' : '-5%',
                                right: reverseLayout ? '-5%' : 'auto',
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
        </section>
    );
};
InfoSectionWithMockup.displayName = "InfoSectionWithMockup";

// ============================================================================
// 4. 带图库的行动号召(CTA)区域组件
// ============================================================================

const CtaWithGallerySection = () => {
    // 修复: 将状态管理和对话框逻辑合并到此组件
    const [step, setStep] = useState(0);

    const steps = [
      {
        title: "我们从深度对话开始",
        description: "在Apex，任何伟大的合作都始于一次不设时限的深度对话。我们坚持先聆听您的故事与蓝图，而非直接提供方案。因为我们坚信，真正的解决方案，源自对您独特需求的深刻理解。",
      },
      {
        title: "您的专属战略路径图",
        description: "我们不提供标准化的“产品套餐”。无论是您的商业架构、子女的教育路径，还是家庭的健康规划，我们都将为您量身定制一套清晰、可行、且完全符合您长远目标的战略路径图。",
      },
      {
        title: "从0到1，从1到无限",
        description: "我们不仅陪伴您完成从0到1的落地，更致力于在您从1走向无限的征途中，持续提供战略支持。我们的服务体系具有高度的延展性，能伴随您事业与家族的成长，不断演进。",
      },
      {
        title: "欢迎加入一个值得信赖的生态圈",
        description: "选择Apex，意味着您不仅选择了一家服务机构，更是加入了一个由顶尖企业家、行业专家和稀缺资源构成的生态网络。欢迎与我们联系，开启您在新加坡的全新可能。",
      },
    ];
  
    const next = () => {
      if (step < steps.length - 1) setStep(step + 1);
    };

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    return (
        <section className="py-24 md:py-32 bg-transparent">
            <div className="container mx-auto px-4 md:px-8">
                <motion.div
                    className="text-center"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <motion.h2 variants={itemVariants} className="text-white mb-4 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                        开启您在新加坡的全新篇章
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-neutral-300 max-w-2xl mx-auto mb-8 text-base md:text-lg">
                        一切伟大的事业，都始于一次深度的战略对话。欢迎预约与我们进行一对一沟通，共同擘画您在新加坡的商业与家族蓝图。
                    </motion.p>
                    <motion.div variants={itemVariants} className="flex justify-center">
                      {/* 修复: 添加 onOpenChange 以便在关闭时重置步骤 */}
                      <Dialog onOpenChange={(open) => !open && setStep(0)}>
                        <DialogTrigger asChild>
                           <HalomotButton 
                             inscription="远见之上，从容有道" 
                             onClick={() => {}} 
                             backgroundColor='#161616' 
                             hoverTextColor='#fff' 
                             gradient='linear-gradient(to right, #603dec, #a123f4)'
                           />
                        </DialogTrigger>
                        {/* BUG修复: 对话框UI优化 */}
                        <DialogContent
                            className={cn(
                                "w-[95vw] sm:w-full max-w-3xl", // 在小屏幕上设置宽度为95vw，避免占满全屏
                                "max-h-[90vh]", // 限制最大高度为视口的90%
                                "p-0 overflow-hidden rounded-xl border-neutral-800 shadow-2xl",
                                "bg-black text-white",
                                "flex flex-col", // 使用flex布局来安放可滚动内容和固定的页脚
                                "data-[state=open]:animate-none data-[state=closed]:animate-none"
                            )}
                        >
                            {/* 可滚动的主要内容区域 */}
                            <div className="flex-grow overflow-y-auto">
                                <div className="flex flex-col md:flex-row w-full">
                                    {/* 左侧面板 */}
                                    <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-neutral-800">
                                        <div className="flex flex-col gap-3">
                                            <Image
                                                src="https://zh.apex-elite-service.com/wenjian/logo-1.png"
                                                alt="Logo"
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-full border-4 border-neutral-800"
                                                unoptimized
                                            />
                                            <h2 className="text-lg font-medium">我们如何与您同行</h2>
                                            <p className="text-sm text-neutral-400">
                                                我们提供的，是一种超越传统服务的、专为顶尖人士设计的全新解决方案。
                                            </p>
                                            <div className="flex flex-col gap-3 mt-6">
                                                {steps.map((s, index) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                    "flex items-center gap-2 text-sm transition-opacity",
                                                    index === step
                                                        ? "font-semibold text-white"
                                                        : "opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    {index < step ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                                                    )}
                                                    <span className="font-normal">{s.title}</span>
                                                </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 右侧面板 (仅内容部分) */}
                                    <div className="w-full md:w-2/3 p-8">
                                        <div className="space-y-4">
                                            <DialogHeader>
                                                <AnimatePresence mode="wait">
                                                <motion.h2
                                                    key={steps[step].title}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="text-2xl font-medium"
                                                >
                                                    {steps[step].title}
                                                </motion.h2>
                                                </AnimatePresence>

                                                <div className="min-h-[60px]">
                                                    <AnimatePresence mode="wait">
                                                        <motion.p
                                                        key={steps[step].description}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="text-neutral-400 text-base"
                                                        >
                                                        {steps[step].description}
                                                        </motion.p>
                                                    </AnimatePresence>
                                                </div>
                                            </DialogHeader>

                                            <div className="w-full h-60 bg-neutral-900 rounded-lg flex items-center justify-center overflow-hidden">
                                                <Image
                                                src="https://zh.apex-elite-service.com/wenjian/12-1.jpg"
                                                alt="Step Visual"
                                                width={200}
                                                height={200}
                                                className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 不可滚动的页脚，放置操作按钮 */}
                            <div className="flex-shrink-0 p-6 border-t border-neutral-800 bg-black">
                                <div className="flex justify-between items-center">
                                    <DialogClose asChild>
                                        <Button variant="outline">返回</Button>
                                    </DialogClose>

                                    {step < steps.length - 1 ? (
                                        <Button variant="outline" onClick={next}>
                                        继续
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <DialogClose asChild>
                                        <Button variant="outline">主页</Button>
                                        </DialogClose>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                      </Dialog>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
CtaWithGallerySection.displayName = "CtaWithGallerySection";


// ============================================================================
// 5. 动画容器组件
// ============================================================================
const SPRING_TRANSITION_CONFIG = {
  type: "spring" as const, 
  stiffness: 100,
  damping: 16,
  mass: 0.75,
  restDelta: 0.005,
};
const filterVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
  },
};

const ContainerStagger = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView={"visible"}
      viewport={{ once: true }}
      transition={{
        staggerChildren: 0.2,
        delayChildren: 0.2,
      }}
      {...props}
    />
  );
});
ContainerStagger.displayName = "ContainerStagger";

const ContainerAnimated = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<"div">
>(({ ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      variants={filterVariants}
      transition={SPRING_TRANSITION_CONFIG}
      {...props}
    />
  );
});
ContainerAnimated.displayName = "ContainerAnimated";

// ============================================================================
// 6. 对话框/拓展卡片组件
// ============================================================================
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-800 bg-black p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-white">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-neutral-400", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// ============================================================================
// 新增: 产品定价 (chanpin.tsx) 相关组件
// ============================================================================

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const PricingSection = () => {
    const plans = [
      {
        name: "健康数据纵向分析",
        description: "为您解读历年体检报告中隐藏的“趋势密码”，将孤立的数据点整合成清晰的动态趋势图，赋能您与医生进行更高质量的沟通。",
        features: [
          "历年体检报告数据整合",
          "关键健康指标趋势分析",
          "深度洞察报告解读",
        ],
      },
      {
        name: "溯源式体检规划",
        description: "我们不仅是定制，更是溯源。通过追溯您健康趋势、家族史与生活方式的源头，我们为您设计真正针对“根本问题”的年度体检方案，让筛查更具前瞻性与目的性。",
        features: [
          "溯源式年度方案设计",
          "高风险项深度筛查建议",
          "顶尖体检机构预约协助",
        ],
      },
    ];

    return (
        <div className="w-full py-0 font-sans">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center gap-6 text-center mt-10">
                    <div className="flex flex-col gap-2">
                        {/* 需求 2: 字体大小和格式与“学校申请支持”一致 */}
                        <h3 className="text-2xl md:text-3xl font-semibold text-white">
                            核心服务详情
                            <br />
                            Core Service Details
                        </h3>
                        {/* 需求 4: 字体大小和格式与“我们深知...”一致 */}
                        <p className="max-w-2xl text-base md:text-lg text-neutral-300">
                            您可以清晰地看到我们提供的不同服务计划，帮助您选择最适合您的需求的方案。
                        </p>
                    </div>
                </div>

                <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-2">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className="flex h-full flex-col bg-transparent border-neutral-700"
                        >
                            <CardHeader className="p-6 pb-4 text-center">
                                {/* 需求 3: 字体大小和格式与“有时候，眼见为实。”一致 */}
                                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                                {/* 需求 4: 字体大小和格式与“我们深知...”一致 */}
                                <CardDescription className="text-base md:text-lg text-neutral-300 mt-2">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col justify-between gap-6 p-6 pt-0">
                                <div className="flex-grow">
                                    <div className="flex flex-col gap-4 mt-4 items-center">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex flex-row items-start gap-3">
                                                <Check className="h-5 w-5 flex-shrink-0 text-green-500 mt-1" />
                                                {/* 需求 4: 字体大小和格式与“我们深知...”一致 */}
                                                <p className="text-base md:text-lg text-neutral-300">{feature}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
PricingSection.displayName = "PricingSection";


// ============================================================================
// 7. 页面级别的静态数据
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

// 修改：调整 features 数组中的 description 内容和字体大小
const features = [
  { icon: MemoizedCpu, title: "企业服务", description: "公司注册、准证、财税及人力资源的运营方案" },
  { icon: MemoizedShieldCheck, title: "留学教育", description: "作为您家庭的教育合伙人，规划最优成长路径" },
  { icon: MemoizedLayers, title: "健康管理", description: "溯源生命数据，中新医疗资源，为您守护健康" }, // 修改文本内容
  { icon: MemoizedZap, title: "战略发展", description: "链接本地资源，为您事业发展提供战略支持" },
];

const timelineData = [
    {
      title: "公司注册",
      content: (
        <div>
          <p className="text-neutral-200 font-normal mb-8 text-base md:text-lg">提供一站式的公司注册“创始包”，涵盖战略架构、银行开户与主动式秘书服务，为您稳固事业的第一步。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/1-1.jpg" 
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
      title: "准证申请",
      content: (
        <div>
          <p className="text-neutral-200 font-normal mb-8 text-base md:text-lg">为创始人、高管及家人量身定制整体准证方案（EP、DP等），通过深度评估与战略规划，极大化成功率，提供核心身份保障。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/2-1.jpg" 
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
      title: "财务税务合规",
      content: (
        <div>
          <p className="text-neutral-200 font-normal mb-8 text-base md:text-lg">提供专业的年度财税申报、财税合规与规划服务，我们不仅确保您的企业稳健合规，更助力您充分享受新加坡的政策优势。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/3.jpg" 
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
      title: "人力资源支持",
      content: (
        <div>
          <p className="text-neutral-200 mb-4 text-base md:text-lg">提供从核心人才招聘、名义雇主（EOR）到跨境薪酬合规的一站式人力资源解决方案，助您在新加坡高效、合规地组建并管理顶尖团队。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/4.jpg" 
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
    name: "教育路径规划",
    buttonLabel: "教育蓝图", // <-- 新增：按钮上显示的文字
    quote: '我们提供超越择校咨询的长期教育路径规划。通过深度评估家庭理念与孩子特质，为您量身定制从当前到世界名校的清晰成长路线图。',
    designation: "Next.js 项目",
    src: "https://zh.apex-elite-service.com/wenjian/5-1.jpg",
    link: "https://plum-cave.netlify.app/",
  },
  {
    name: "学校申请支持",
    buttonLabel: "名校起航", // <-- 新增：按钮上显示的文字
    quote: "精准、高效的全流程申请支持，关注的不仅是文书与面试技巧，更是如何将您孩子最独特的闪光点呈现给招生官，赢得理想的录取通知。",
    designation: "Next.js 项目",
    src: "https://zh.apex-elite-service.com/wenjian/6-1.jpg",
    link: "https://namer-ui.netlify.app/",
  },
  {
    name: "长期成长陪伴",
    buttonLabel: "全程护航", // <-- 新增：按钮上显示的文字
    quote: "作为您与学校间的沟通桥梁，我们协助处理从家长会到升学指导的各项事务，确保孩子无缝融入并持续进步。",
    designation: "Vue 项目",
    src: "https://zh.apex-elite-service.com/wenjian/7.jpg",
    link: "https://namer-ui-for-vue.netlify.app/",
  },
];

const infoSectionData1 = {
    title: (
        <>
            健康管理
            <br />
            Health Management
        </>
    ),
    description: (
        <>
            我相信，健康是承载事业版图与人生品质的终极资产，Apex传承于生命管理的独特基因，我们不提供诊疗，而是您最值得信赖的健康战略家与医疗资源导航员，致力于助您主动掌控健康，预见未来。
        </>
    ),
    primaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/8-1.png',
    secondaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/9.jpg',
};

const infoSectionData2 = {
    title: (
        <>
            溯源式体检
            <br />
            In-Depth Health
        </>
    ),
    description: (
        <>
            每年的体检报告，不应只是一份被存档的文件，唯将历年数据串联，发现健康趋势的真正秘密，Apex独特有溯源体检服务，为您解读生命数据，将未来的不确定性，转化为尽在掌握的主动权。
        </>
    ),
    primaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/10-1.jpg',
    secondaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/11.jpg',
};

// 新增: FAQ 数据
const faqData = [
    {
        question: "中新跨境就医服务",
        answer: "无论是您希望从新加坡回到中国寻求顶级诊疗，还是从中国来到新加坡链接全球领先的医疗资源，我们都能为您提供无缝的跨境支持，打破地域与信息壁垒。",
    },
    {
        question: "一站式行程与陪诊",
        answer: "我们为您处理从机票酒店预订、地面交通到专业双语陪诊的全程细节，让您可以完全专注于康复与治疗，心无旁骛。",
    },
    {
        question: "顶尖专家预约",
        answer: "凭借我们深耕两地的稀缺名医资源网络，我们将协助您预约到通常需要漫长等待的顶尖专家，为您赢得最宝贵的健康时机。",
    },
    {
        question: "全程住院与理赔支持",
        answer: "我们的服务将延伸至您诊疗结束之后，提供包括住院流程协助、多学科会诊推进以及关键的保险理赔流程支持等全面的后续保障。",
    },
];

// ============================================================================
// 8. 分屏滚动动画区域组件
// ============================================================================

const scrollAnimationPages = [
  {
    leftBgImage: 'https://zh.apex-elite-service.com/wenjian/13.jpg',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: '首席伙伴',
      description: '我们凭借在中新两地的实体团队，真正实现了服务的无缝衔接。无论您身在国内还是已在新加坡，都能随时与我们的本地成员当面沟通，确保服务“不掉线”。作为您长期的首席合伙人，为您节省巨大的时间与沟通成本。',
    },
  },
  {
    leftBgImage: null,
    rightBgImage: 'https://zh.apex-elite-service.com/wenjian/14-1.jpg',
    leftContent: {
      heading: '安心保障',
      description: '我们郑重承诺：24小时内回复，紧急事务2小时内响应。所有价格透明，无隐形消费。您将拥有一位专属项目合伙人，全程为您负责。',
    },
    rightContent: null,
  },
  {
    leftBgImage: 'https://zh.apex-elite-service.com/wenjian/15-1.jpg',
    rightBgImage: null,
    leftContent: null,
    rightContent: {
      heading: '服务流程',
      description: '我们的合作始于深度保密的咨询，以全面理解您的需求。随后，专家团队将为您量身定制方案，在执行中协调所有细节，并随时汇报进展。',
    },
  },
  {
    leftBgImage: null,
    rightBgImage: 'https://zh.apex-elite-service.com/wenjian/16.jpg',
    leftContent: {
      heading: '即刻启程',
      description: '纸上得来终觉浅，绝知此事要躬行。立即联系我们，开启一次专属的战略性探讨，让我们为您在新加坡的成功保驾护航。',
    },
    rightContent: null,
  },
];

function ScrollAdventure() {
  const [currentPage, setCurrentPage] = useState(1);
  const numOfPages = scrollAnimationPages.length;
  const animTime = 1000;
  const scrolling = useRef(false);
  const touchStartY = useRef(0);
  const componentRef = useRef<HTMLDivElement>(null);

  const navigateUp = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const navigateDown = useCallback(() => {
    if (currentPage < numOfPages) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, numOfPages]);

  const handleScroll = useCallback((deltaY: number) => {
      if (scrolling.current) return;
      scrolling.current = true;
      if (deltaY > 0) {
        navigateDown();
      } else {
        navigateUp();
      }
      setTimeout(() => {
        scrolling.current = false;
      }, animTime);
  }, [navigateDown, navigateUp]);

  useEffect(() => {
    const scrollComponent = componentRef.current;
    if (!scrollComponent) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(e.deltaY);
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY.current;
        // 阈值判断，防止过于灵敏
        if(Math.abs(deltaY) > 50) {
            handleScroll(-deltaY); // 注意方向与滚轮相反
            touchStartY.current = touchEndY; // 重置起始点
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const rect = scrollComponent.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

        if (isVisible && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            handleScroll(e.key === 'ArrowDown' ? 1 : -1);
        }
    };
    
    scrollComponent.addEventListener('wheel', handleWheel, { passive: false });
    scrollComponent.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollComponent.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      scrollComponent.removeEventListener('wheel', handleWheel);
      scrollComponent.removeEventListener('touchstart', handleTouchStart);
      scrollComponent.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll]);

  return (
    // [要求 2 已修改] 
    // 边框和阴影已被移除: `border border-neutral-700 shadow-2xl` -> `border-none`
    // 背景已设为透明: `bg-black` -> `bg-transparent`
    <div 
      ref={componentRef} 
      className="relative overflow-hidden w-full max-w-6xl mx-auto bg-transparent font-[Helvetica] rounded-2xl border-none aspect-[1/2] lg:aspect-[2/1]"
    >
      {scrollAnimationPages.map((page, i) => {
        const idx = i + 1;
        const isActive = currentPage === idx;
        
        return (
          <div key={idx} className="absolute inset-0 flex flex-col lg:flex-row">
            {/* Left Panel */}
            <div
              className={cn(
                "w-full h-1/2 lg:w-1/2 lg:h-full", // 关键尺寸定义，确保在不同布局下占据正确空间形成正方形
                "transition-transform duration-[1000ms] ease-in-out",
                isActive ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: page.leftBgImage ? `url(${page.leftBgImage})` : 'none', 
                  backgroundColor: 'transparent' 
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white p-4 md:p-8">
                  {page.leftContent && (
                    <div className="text-center">
                      <h2 className="mb-4 tracking-widest text-2xl md:text-3xl font-semibold">
                        {page.leftContent.heading}
                      </h2>
                      <p className="text-base md:text-lg">
                        {page.leftContent.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div
              className={cn(
                "w-full h-1/2 lg:w-1/2 lg:h-full", // 关键尺寸定义
                "transition-transform duration-[1000ms] ease-in-out",
                isActive ? 'translate-x-0' : 'translate-x-full'
              )}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: page.rightBgImage ? `url(${page.rightBgImage})` : 'none', 
                  backgroundColor: 'transparent' 
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white p-4 md:p-8">
                  {page.rightContent && (
                     <div className="text-center">
                      <h2 className="mb-4 tracking-widest text-2xl md:text-3xl font-semibold">
                        {page.rightContent.heading}
                      </h2>
                       <div className="text-base md:text-lg">
                          {page.rightContent.description}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
ScrollAdventure.displayName = "ScrollAdventure";

// ============================================================================
// 9. 文本揭示卡片组件 (新)
// ============================================================================

// Stars 子组件，用于背景的星星动画
const Stars = () => {
  const randomMove = () => Math.random() * 4 - 2;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(80)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 10 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            backgroundColor: "white",
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block"
        ></motion.span>
      ))}
    </div>
  );
};
const MemoizedStars = memo(Stars);
MemoizedStars.displayName = "MemoizedStars";

// TextRevealCardTitle 子组件
const TextRevealCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2 className={cn("text-white text-lg mb-2", className)}>
      {children}
    </h2>
  );
};
TextRevealCardTitle.displayName = "TextRevealCardTitle";

// TextRevealCardDescription 子组件
const TextRevealCardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={cn("text-[#a9a9a9] text-sm", className)}>{children}</p>
  );
};
TextRevealCardDescription.displayName = "TextRevealCardDescription";

// TextRevealCard 核心组件
const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}: {
  text: string;
  revealText: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [widthPercentage, setWidthPercentage] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      const { left, width } = cardRef.current.getBoundingClientRect();
      setLeft(left);
      setLocalWidth(width);
    }
    const handleResize = () => {
        if (cardRef.current) {
            const { left, width } = cardRef.current.getBoundingClientRect();
            setLeft(left);
            setLocalWidth(width);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
    }
  }, []);

  const mouseMoveHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (cardRef.current) {
      const relativeX = event.clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  };

  const touchMoveHandler = (event: React.TouchEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const relativeX = event.touches[0].clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  };

  const mouseLeaveHandler = () => {
    setIsMouseOver(false);
    setWidthPercentage(0);
  };

  const mouseEnterHandler = () => {
    setIsMouseOver(true);
  };

  const rotateDeg = (widthPercentage - 50) * 0.1;

  return (
    <div
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
      onMouseMove={mouseMoveHandler}
      onTouchStart={mouseEnterHandler}
      onTouchEnd={mouseLeaveHandler}
      onTouchMove={touchMoveHandler}
      ref={cardRef}
      className={cn(
        // 更新：移除了背景色和边框，使卡片透明
        "bg-transparent w-full rounded-lg p-8 relative overflow-hidden",
        className
      )}
    >
      {children}

      <div className="h-40 relative flex items-center overflow-hidden">
        <motion.div
          style={{ width: "100%" }}
          animate={
            isMouseOver
              ? {
                  opacity: widthPercentage > 0 ? 1 : 0,
                  clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
                }
              : {
                  clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
                }
          }
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          // 更新：移除了此处的背景色
          className="absolute bg-transparent z-20 will-change-transform"
        >
          <p
            style={{ textShadow: "4px 4px 15px rgba(0,0,0,0.5)" }}
            className="py-10 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px] text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300"
          >
            {revealText}
          </p>
        </motion.div>
        <motion.div
          animate={{
            left: `${widthPercentage}%`,
            rotate: `${rotateDeg}deg`,
            opacity: widthPercentage > 0 ? 1 : 0,
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="h-40 w-[8px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent absolute z-50 will-change-transform"
        ></motion.div>

        {/* 更新：为底层文本添加 motion.div 以动画化 clipPath */}
        <motion.div
          animate={{
            clipPath: `inset(0 0 0 ${widthPercentage}%)`
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)] w-full"
        >
          <p className="py-10 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px] bg-clip-text text-transparent bg-[#323238]">
            {text}
          </p>
          <MemoizedStars />
        </motion.div>
      </div>
    </div>
  );
};
TextRevealCard.displayName = "TextRevealCard";

// ============================================================================
// 10. 页脚组件
// ============================================================================

const XiaohongshuIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.273 18.818H18.18v-3.09h-2.181v3.09h-3.09v2.182h3.09v3.091h2.182v-3.09h3.09v-2.182zM4.364 3.818h4.363V2.727H4.364v1.091zm4.363 9.818H4.364v1.091h4.363v-1.09zM15.455 6h-2.182v1.09h2.182V6zm-5.455 6H5.455v1.09h4.545V6zm-1.09 9.818H4.364v1.09h4.545v-1.09zm5.454-3.272H4.364v1.09h9.818v-1.09zM4.364 9.273h9.818v1.09H4.364v-1.09z"/>
  </svg>
);
XiaohongshuIcon.displayName = "XiaohongshuIcon";

const ZhihuIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.57,19.38L21.57,19.38l-4.48,0c-0.34,0-0.62-0.28-0.62-0.62v-4.44h-2.5v4.44c0,0.34-0.28,0.62-0.62,0.62H8.85c-0.34,0-0.62-0.28-0.62-0.62v-4.44H5.73v4.44c0,0.34-0.28,0.62-0.62,0.62H2.43c-0.34,0-0.62-0.28-0.62-0.62V5.24c0-0.34,0.28-0.62,0.62-0.62h11.23l0,0l0,0l4.5,0c0.34,0,0.62,0.28,0.62,0.62v13.52C22.19,19.1,21.91,19.38,21.57,19.38z M9.47,12.11H5.73V7.1h3.74V12.11z M15.47,12.11h-3.74V7.1h3.74V12.11z"/>
  </svg>
);
ZhihuIcon.displayName = "ZhihuIcon";

const DouyinIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.6 5.82s.51.5 1.63.5c1.43 0 2.5-.9 2.5-2.55s-1.06-2.46-2.5-2.46C16.6.31 15.14 2.1 15.14 4.16v7.35c0 2.9-2.23 4.88-5.22 4.88-2.51 0-4.62-1.74-4.62-4.52s2.11-4.52 4.62-4.52c.2 0 .4.02.59.05v2.1c-.2-.03-.39-.05-.59-.05-1.34 0-2.5.95-2.5 2.42s1.16 2.42 2.5 2.42c1.73 0 3.03-1.2 3.03-3.2V5.82z"/>
  </svg>
);
DouyinIcon.displayName = "DouyinIcon";

const BilibiliIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 14.5v-9l6 4.5-6 4.5z"/>
  </svg>
);
BilibiliIcon.displayName = "BilibiliIcon";


const CustomFooter = () => {
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const socialIcons = [
      { name: '小红书', icon: <XiaohongshuIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/xiaohongshu.png', url: 'https://www.xiaohongshu.com/user/profile/6624755f00000000030303c2' },
      { name: '知乎', icon: <ZhihuIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/sara.png', url: 'https://www.zhihu.com/org/apex-elite-service' },
      { name: '抖音', icon: <DouyinIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/wenjing.png', url: 'https://www.douyin.com' },
      { name: '哔哩哔哩', icon: <BilibiliIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/mengchen.png', url: 'https://www.bilibili.com' },
    ];

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
            alert("请输入一个有效的邮箱地址。");
            return;
        }
        setIsSubmitting(true);
        const result = await saveFooterEmailToRedis({ email });
        if(result.success) {
            alert("感谢您的订阅！");
            setEmail('');
        } else {
            alert(`订阅失败：${result.error || '未知错误'}`);
        }
        setIsSubmitting(false);
    };

    return (
      <footer className="bg-transparent text-white py-12 mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold tracking-tight mb-4">官方公众号</h2>
            <div className="mb-8 w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-gray-800/20 border border-slate-700 rounded-lg flex items-center justify-center p-2">
              <Image
                src="https://zh.apex-elite-service.com/wenjian/weixingongzhonghao.png"
                alt="官方公众号二维码"
                width={280}
                height={280}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <nav className="mb-8 flex flex-wrap justify-center gap-6 text-neutral-300 text-base md:text-lg">
              <Link href="#" className="hover:text-white">Apex</Link>
              {/* 点击“留学”跳转到留学教育板块 */}
              <Link href="#study-abroad" className="hover:text-white">留学</Link>
               {/* 点击“医疗”跳转到健康管理板块 */}
              <Link href="#health-management" className="hover:text-white">医疗</Link>
              {/* 点击“企业服务”跳转到企业服务板块 */}
              <Link href="#corporate-services" className="hover:text-white">企业服务</Link>
              <Link href="#" className="hover:text-white">敬请期待</Link>
            </nav>
            <div className="mb-8 flex space-x-4">
              {socialIcons.map((social) => (
                 <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "relative",
                      hoveredIcon === social.name ? "z-50" : "z-0"
                    )}
                    onMouseEnter={() => setHoveredIcon(social.name)}
                    onMouseLeave={() => setHoveredIcon(null)}
                  >
                    <Button variant="outline" size="icon" className="rounded-full">
                      {social.icon}
                      <span className="sr-only">{social.name}</span>
                    </Button>
                    {hoveredIcon === social.name && (
                      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-36 h-36 bg-white border rounded-md shadow-lg p-1 flex items-center justify-center">
                        <Image src={social.qrcode} alt={`${social.name} QR Code`} width={136} height={136} className="w-full h-full object-cover" />
                      </div>
                    )}
                 </a>
              ))}
            </div>
            <div className="mb-8 w-full max-w-md">
              <form className="flex space-x-2" onSubmit={handleEmailSubmit}>
                <div className="flex-grow">
                  <Label htmlFor="email-footer" className="sr-only">Email</Label>
                  <Input 
                    id="email-footer" 
                    placeholder="输入您的邮箱" 
                    type="email" 
                    className="rounded-full" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" variant="default" className="rounded-full text-base md:text-lg" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : '提交'}
                </Button>
              </form>
            </div>
            <div className="text-center">
              <p className="text-sm text-neutral-400">
                © 2024 Your Company. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
}
CustomFooter.displayName = "CustomFooter";

// ============================================================================
// 11. 常见问题 (FAQ) 组件 (新增)
// ============================================================================
const FaqItem = React.forwardRef<
  HTMLDivElement,
  {
    question: string;
    answer: string;
    index: number;
  }
>(({ question, answer, index }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      className={cn(
        "group rounded-lg",
        "transition-all duration-200 ease-in-out",
        "border border-white/10" // 使用页面已有的边框颜色
      )}
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 h-auto justify-between hover:bg-transparent"
      >
        <h3
          className={cn(
            "text-base md:text-lg font-medium transition-colors duration-200 text-left",
            "text-white", // <-- 修改这里
            isOpen && "text-white"
          )}
        >
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "p-0.5 rounded-full flex-shrink-0",
            "transition-colors duration-200",
            isOpen ? "text-white" : "text-neutral-400"
          )}
        >
          {/* 复用已导入的图标 */}
          <ChevronDownIcon className="h-4 w-4" /> 
        </motion.div>
      </Button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { duration: 0.2, ease: "easeOut" },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: "easeIn" },
            }}
          >
            <div className="px-6 pb-4 pt-2">
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                // 需求 5: 字体大小和格式与“我们深知...”一致
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
FaqItem.displayName = "FaqItem";

interface FaqSectionProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    question: string;
    answer: string;
  }[];
}

const FaqSection = React.forwardRef<HTMLElement, FaqSectionProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {items.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
);
FaqSection.displayName = "FaqSection";

// ============================================================================
// 12. 主页面组件
// ============================================================================

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // [动画状态修改]
  const [animationState, setAnimationState] = useState('initial'); // 'initial', 'textFading', 'warping', 'finished'
  const [mainContentVisible, setMainContentVisible] = useState(false);


  useEffect(() => {
    const submittedFlag = localStorage.getItem('hasSubmittedForm');
    if (submittedFlag === 'true') {
      setHasSubmitted(true);
    }

    const hasVisited = sessionStorage.getItem('hasVisitedHomePage');
    if (hasVisited) {
      setAnimationState('finished');
      setMainContentVisible(true);
    }
    
    setIsLoading(false);
  }, []);

  const handleSuccess = () => {
    localStorage.setItem('hasSubmittedForm', 'true');
    setHasSubmitted(true);
    setIsModalOpen(false);
  };
  
  const handleProtectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
    if (href === '#') {
        e.preventDefault();
        alert("此功能正在开发中，敬请期待！");
        return;
    }

    if (!hasSubmitted) {
        e.preventDefault();
        setIsModalOpen(true);
    }
  };

  const handleEnter = () => {
      if (animationState === 'initial') {
          sessionStorage.setItem('hasVisitedHomePage', 'true');
          setAnimationState('textFading'); // 1. 开始文本消失
          
          setTimeout(() => {
              setAnimationState('warping'); // 2. 开始穿梭
              setMainContentVisible(true);  // 3. 主内容开始渐显
          }, 1500); // 文本消失动画时长
          
          setTimeout(() => {
              setAnimationState('finished'); // 4. 穿梭结束，动画完成
          }, 1500 + 1000); // 穿梭动画总时长 (1.5s + 5s)
      }
  };

  if (isLoading) {
      return <div className="fixed inset-0 bg-black z-[200]" />;
  }

  return (
    <div className="relative isolate bg-black text-white">
      
      <AnimatePresence>
        {animationState !== 'finished' && (
          <motion.div
            key="animation-wrapper"
            className="fixed inset-0 z-[100] bg-black"
            exit={{ opacity: 0, transition: { duration: 1.0, delay: 0.5 } }}
          >
            {/* 初始文本 */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center z-10"
                animate={{
                    opacity: animationState === 'initial' || animationState === 'textFading' ? 1 : 0,
                    scale: animationState === 'textFading' ? 0.8 : 1,
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
               <div className="w-full max-w-2xl px-4">
                  <TextShineEffect 
                    text="Apex" 
                    subtitle="轻触，开启非凡"
                    scanDuration={4} 
                    onClick={handleEnter} 
                  />
                </div>
            </motion.div>
            
            {/* 粒子/星空效果 */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: animationState === 'warping' || animationState === 'textFading' ? 1 : 0,
                }}
                transition={{ duration: 2.0, ease: "easeIn" }}
            >
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <Starfield warpSpeedActive={animationState === 'warping'} />
                </Canvas>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        key="main-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: mainContentVisible ? 1 : 0 }}
        transition={{ duration: 5, ease: "easeOut" }}
        className={cn(animationState !== 'finished' && "pointer-events-none")}
      >
        <AppNavigationBar 
            onLoginClick={() => setIsModalOpen(true)}
            onProtectedLinkClick={handleProtectedLinkClick}
        />
        <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_right,#1A2428,#000_70%)]"></div>
        <Scene />

        <main className="relative z-10 pt-20">
            <div className="min-h-screen w-full flex flex-col items-center justify-center py-24">
                <div className="w-full max-w-6xl px-8 space-y-16 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center text-center space-y-8">
                    <div className="space-y-6 flex items-center justify-center flex-col">
                    <h1 className="text-3xl md:text-6xl font-semibold tracking-tight max-w-3xl text-white">
                        为您而来，不止于此
                    </h1>
                    <p className="text-neutral-300 max-w-2xl text-base md:text-lg">
                        Apex是一家总部位于新加坡的综合性专业服务机构。我们深刻理解全球高净值人士与出海企业所面临的机遇与挑战，矢志成为您在新加坡的首席合作伙伴，提供从商业顶层设计、子女教育规划到主动式健康管理的无缝衔接解决方案。
                    </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
                    {features.map((feature, idx) => (
                    <div
                        key={idx}
                        className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 h-40 md:h-48 flex flex-col justify-center items-center space-y-2 md:space-y-3"
                    >
                        <feature.icon size={18} className="text-white/80 md:w-5 md:h-5" />
                        <h3 className="text-base font-bold text-white">{feature.title}</h3>
                        {/* 修改：调整字体大小 */}
                        <p className="text-neutral-400 text-base md:text-lg">{feature.description}</p>
                    </div>
                    ))}
                </div>
                </div>
            </div>
            
            <div id="corporate-services">
              <Timeline data={timelineData} />
            </div>

            <div id="study-abroad" className="max-w-7xl mx-auto px-8">
                <ProjectShowcase 
                testimonials={projectShowcaseData} 
                onProtectedLinkClick={handleProtectedLinkClick}
                />
            </div>
            
            <div id="health-management">
              <InfoSectionWithMockup {...infoSectionData1} />
            </div>
            
            <div className="py-16 px-8 flex flex-col justify-center items-center">
                <FaqSection items={faqData} className="w-full max-w-4xl"/>
            </div>

            <div id="integration-section">
                <InfoSectionWithMockup
                    {...infoSectionData2}
                    reverseLayout={true}
                    className="pt-24 md:pt-32 pb-0" // 保留顶部padding，移除底部padding
                />
            </div>

            {/* 需求 1: 插入定价方案板块 */}
            <div className="pt-0 px-8 flex flex-col items-center">
              <PricingSection />
            </div>

            <CtaWithGallerySection />
            
            <div className="py-24 px-8 flex flex-col justify-center items-center">
                <div className="text-center mb-12">
                    <h2 className="text-white mb-4 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                        我们的承诺与流程
                    </h2>
                    <p className="text-neutral-300 max-w-2xl mx-auto text-base md:text-lg">
                        探索我们如何通过透明、高效的流程，为您在新加坡的旅程保驾护航。
                    </p>
                </div>
                <ScrollAdventure />
            </div>

            <div className="py-12 md:py-20 flex items-center justify-center">
                <TextRevealCard
                    text="真正的价值，蕴藏于深度对话之中。"
                    revealText="与我们同行，让您的卓越在新加坡从容绽放。"
                    className="w-full max-w-4xl"
                >
                    <TextRevealCardTitle className="text-2xl font-bold">
                    洞见未来，共谱新章
                    </TextRevealCardTitle>
                    <TextRevealCardDescription className="text-base md:text-lg">
                    我们深知，每一个伟大的决策，都需要前瞻性的洞察与值得信赖的伙伴。Apex将两者融为一体，陪伴您开启未来。
                    </TextRevealCardDescription>
                </TextRevealCard>
            </div>

            <CustomFooter />
        </main>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent>
                <SubmissionCard onSuccess={handleSuccess} />
            </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
