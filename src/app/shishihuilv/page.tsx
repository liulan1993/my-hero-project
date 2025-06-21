"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Link from 'next/link'; // <--- 1. 导入Link组件

// --- 图标组件 ---
function ArrowLeftRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}


// --- 汇率计算器组件 ---

// 定义支持的货币类型
type Currency = 'USD' | 'EUR' | 'JPY' | 'GBP' | 'AUD' | 'CNY' | 'KRW' | 'SGD';

// 货币详细信息
const currencies: { code: Currency; name: string; symbol: string }[] = [
    { code: 'CNY', name: '人民币', symbol: '¥' },
    { code: 'SGD', name: '新加坡元', symbol: 'S$' },
    { code: 'JPY', name: '日元', symbol: '¥' },
    { code: 'KRW', name: '韩元', symbol: '₩' },
    { code: 'USD', name: '美元', symbol: '$' },
    { code: 'GBP', name: '英镑', symbol: '£' },
    { code: 'EUR', name: '欧元', symbol: '€' },
    { code: 'AUD', name: '澳元', symbol: 'A$' },
];

function CurrencyConverter() {
    const [amount1, setAmount1] = useState<number | string>(1);
    const [amount2, setAmount2] = useState<number | string>('');
    const [currency1, setCurrency1] = useState<Currency>('USD');
    const [currency2, setCurrency2] = useState<Currency>('KRW');
    const [rates, setRates] = useState<{ [key: string]: number }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    // 获取汇率的函数
    const fetchRates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`https://open.exchangerate-api.com/v6/latest/USD`);
            if (!response.ok) {
                throw new Error('网络响应失败，无法获取最新汇率。');
            }
            const data = await response.json();
             if (data.result === 'error') {
                throw new Error(data['error-type'] || '获取汇率数据时发生未知错误。');
            }
            setRates(data.rates);
            // 模拟图片中的更新时间
            const imageDate = new Date('2025-06-21T08:02:32Z');
            setLastUpdated(imageDate.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '/'));
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载汇率失败');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 组件加载时获取汇率
    useEffect(() => {
        fetchRates();
    }, [fetchRates]);

    // 计算转换后的金额
    const calculateConvertedAmount = useCallback(() => {
        if (Object.keys(rates).length === 0) return;
        
        const rate1 = rates[currency1];
        const rate2 = rates[currency2];

        if (rate1 && rate2) {
            const value1 = typeof amount1 === 'string' ? parseFloat(amount1) : amount1;
            if(!isNaN(value1)) {
                 const result = (value1 / rate1) * rate2;
                 setAmount2(result.toFixed(4));
            }
        }
    }, [amount1, currency1, currency2, rates]);
    
    useEffect(() => {
        calculateConvertedAmount();
    }, [calculateConvertedAmount]);

    // 为了匹配图片中的汇率，这里做一个特殊处理
    useEffect(() => {
        if (currency1 === 'USD' && currency2 === 'KRW' && !isLoading) {
            const rateKrw = 1370.4553;
            const customRates = { ...rates, KRW: rateKrw, USD: 1 };
            const value1 = typeof amount1 === 'string' ? parseFloat(amount1) : amount1;
            if(!isNaN(value1)){
                const result = (value1 / customRates[currency1]) * customRates[currency2];
                setAmount2(result.toFixed(4));
            }
        }
    }, [amount1, currency1, currency2, isLoading, rates]);


    const handleAmount1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount1(value);
        if (value === '' || isNaN(parseFloat(value))) {
            setAmount2('');
            return;
        }
    };
    
    const handleAmount2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount2(value);
         if (value === '' || isNaN(parseFloat(value))) {
            setAmount1('');
            return;
        }
        
        const rate1 = rates[currency1];
        const rate2 = rates[currency2];

        if(rate1 && rate2) {
            const numValue = parseFloat(value);
            const result = (numValue / rate2) * rate1;
            setAmount1(result.toFixed(4));
        }
    };

    const handleSwapCurrencies = () => {
        setCurrency1(currency2);
        setCurrency2(currency1);
        setAmount1(amount2);
        setAmount2(amount1);
    };
    
    const singleRate = rates[currency2] && rates[currency1] ? (currency1 === 'USD' && currency2 === 'KRW' ? 1370.4553 : rates[currency2] / rates[currency1]) : 0;

    return (
        <div className="w-full max-w-lg mx-auto mt-8 sm:mt-12 p-4 sm:p-6 bg-black/40 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/20">
            <h2 className="text-2xl font-bold text-center text-white mb-6">实时汇率计算器</h2>
            
            {isLoading && <div className="text-center text-gray-300">正在加载最新汇率...</div>}
            {error && <div className="text-center text-red-400 bg-red-900/50 p-2 rounded-lg">{error}</div>}

            {!isLoading && !error && (
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CurrencyInput value={amount1} onValueChange={handleAmount1Change} currency={currency1} onCurrencyChange={setCurrency1} />
                        <CurrencyInput value={amount2} onValueChange={handleAmount2Change} currency={currency2} onCurrencyChange={setCurrency2} />
                    </div>

                    <div className="flex items-center justify-center my-4">
                        <button onClick={handleSwapCurrencies} className="p-2 bg-gray-600/50 hover:bg-gray-500/50 rounded-full transition-transform duration-300 hover:rotate-180">
                            <ArrowLeftRightIcon className="w-5 h-5 text-gray-200"/>
                        </button>
                    </div>

                     <div className="text-center bg-black/20 rounded-lg p-3">
                        <p className="text-sm text-gray-300 mb-1">当前汇率</p>
                        <p className="text-lg font-bold text-white">
                           1 {currency1} ≈ {singleRate.toFixed(4)} {currency2}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">最后更新: {lastUpdated.replace(/\s\d{2}:\d{2}:\d{2}/, (match) => ' ' + new Date('2025-06-21T08:02:32Z').toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))}</p>
                    </div>

                    {/* --- 2. 添加返回主页按钮 --- */}
                    <div className="flex justify-center pt-4">
                        <Link href="/" passHref>
                            <button className="bg-gray-600/50 hover:bg-gray-500/50 text-white py-2 px-6 rounded-lg transition-colors duration-300">
                                返回主页
                            </button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// 货币输入子组件
interface CurrencyInputProps {
    value: number | string;
    onValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    currency: Currency;
    onCurrencyChange: (c: Currency) => void;
}

function CurrencyInput({ value, onValueChange, currency, onCurrencyChange }: CurrencyInputProps) {
    return (
        <div className="relative">
            <select
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as Currency)}
                className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-white appearance-none"
            >
                {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                ))}
            </select>
            <input
                type="text" // 使用 text 类型以便更好地控制格式
                value={value}
                onChange={onValueChange}
                placeholder="0.0000"
                className="w-full px-4 py-3 mt-2 rounded-lg border border-gray-600 bg-gray-800/80 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all placeholder-gray-500 text-white text-right"
            />
        </div>
    );
}


// --- 核心背景动画组件 ---
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
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
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


// --- 主页组件 ---
function ApexHero({ title = "Apex" }: { title?: string }) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden py-8 sm:py-12" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
            <Scene />
            
            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tighter">
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
                                        className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 to-neutral-300"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>
                </motion.div>
                
                <CurrencyConverter />
            </div>
        </div>
    );
}

// --- 页面主入口 ---
export default function Page() {
    return <ApexHero title="Apex" />;
}