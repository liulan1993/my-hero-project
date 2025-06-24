"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- 辅助工具函数 ---
// 用于安全地合并 Tailwind CSS 类名
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


// --- 税务计算逻辑 ---

/**
 * 根据中国个人所得税税率表计算税款 (2019年及以后综合所得)
 * @param {number} income - 全年应纳税所得额 (CNY)
 * @returns {number} 应纳税额
 */
function calculateChinaTax(income: number): number {
  if (income <= 0) return 0;
  
  const brackets = [
    { threshold: 960000, rate: 0.45, deduction: 181920 },
    { threshold: 660000, rate: 0.35, deduction: 85920 },
    { threshold: 420000, rate: 0.30, deduction: 52920 },
    { threshold: 300000, rate: 0.25, deduction: 31920 },
    { threshold: 144000, rate: 0.20, deduction: 16920 },
    { threshold: 36000, rate: 0.10, deduction: 2520 },
    { threshold: 0, rate: 0.03, deduction: 0 },
  ];

  for (const bracket of brackets) {
    if (income > bracket.threshold) {
      return income * bracket.rate - bracket.deduction;
    }
  }
  return 0;
}

/**
 * 根据新加坡个人所得税税率表计算税款 (YA2024 for Residents)
 * @param {number} income - Chargeable Income (SGD)
 * @returns {number} 应纳税额
 */
function calculateSingaporeTax(income: number): number {
    if (income <= 20000) return 0;

    let tax = 0;
    
    const brackets = [
        { cap: 20000, rate: 0, base: 0 },
        { cap: 30000, rate: 0.02, base: 0 },
        { cap: 40000, rate: 0.035, base: 200 },
        { cap: 80000, rate: 0.07, base: 550 },
        { cap: 120000, rate: 0.115, base: 3350 },
        { cap: 160000, rate: 0.15, base: 7950 },
        { cap: 200000, rate: 0.18, base: 13950 },
        { cap: 240000, rate: 0.19, base: 21150 },
        { cap: 280000, rate: 0.195, base: 28750 },
        { cap: 320000, rate: 0.20, base: 36550 },
        { cap: 500000, rate: 0.22, base: 44550 },
        { cap: 1000000, rate: 0.23, base: 84150 },
        { cap: Infinity, rate: 0.24, base: 199150 },
    ];
    
    for (let i = 1; i < brackets.length; i++) {
        const prevCap = brackets[i - 1].cap;
        const currentCap = brackets[i].cap;

        if (income <= currentCap) {
            tax = brackets[i-1].base + (income - prevCap) * brackets[i].rate;
            return tax;
        }
    }
    return tax;
}


// --- 个人税务计算器组件 ---
function TaxCalculator() {
  const [country, setCountry] = useState<'china' | 'singapore'>('china');
  const [income, setIncome] = useState<string>('');
  const [tax, setTax] = useState<number>(0);
  
  useEffect(() => {
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue < 0) {
        setTax(0);
        return;
    }

    let calculatedTax = 0;
    if (country === 'china') {
      calculatedTax = calculateChinaTax(incomeValue);
    } else {
      calculatedTax = calculateSingaporeTax(incomeValue);
    }
    setTax(calculatedTax);
  }, [income, country]);

  const currency = country === 'china' ? 'CNY' : 'SGD';

  return (
    // 为税务计算器添加外层容器以包含新按钮
    <div className="flex flex-col items-center">
        <div className="w-full max-w-lg mx-auto p-4 sm:p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">个人所得税计算器</h2>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <button 
                onClick={() => setCountry('china')}
                className={cn(
                    'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                    country === 'china' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
                >
                中国 (China)
                </button>
                <button 
                onClick={() => setCountry('singapore')}
                className={cn(
                    'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300',
                    country === 'singapore' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
                >
                新加坡 (Singapore)
                </button>
            </div>

            <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                {country === 'china' ? '年度应纳税所得额' : 'Chargeable Annual Income'}
                </label>
                <div className="relative">
                <input 
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    placeholder="在此输入年收入"
                    // 修改placeholder颜色
                    className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all placeholder-gray-500"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 font-semibold">{currency}</span>
                </div>
            </div>

            <div className="text-center bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">应纳税额 (Tax Payable)</p>
                <p className="text-3xl font-bold text-gray-800">
                {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-lg ml-2">{currency}</span>
                </p>
            </div>
        </div>
        {/* 新增返回主页按钮，并移除target="_blank"以在当前页面跳转 */}
        <a 
            href="https://www.apex-elite-service.com/" 
            className="mt-6 px-8 py-2 rounded-full text-sm font-semibold text-white bg-black/30 hover:bg-black/50 transition-all duration-300 backdrop-blur-sm"
        >
            返回主页
        </a>
    </div>
  );
}


// --- 新的背景动画组件 (3D) ---
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

// --- Apex主页组件 ---
function ApexHero({ title = "Apex" }: { title?: string }) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden text-white p-4" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
            <Scene />

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center flex flex-col items-center justify-center h-full">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl w-full mx-auto"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-8 tracking-tighter">
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
                                        className="inline-block"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>
                </motion.div>
                
                <div className="w-full mt-4">
                    <TaxCalculator />
                </div>
            </div>
        </div>
    );
}

// --- 页面主入口 (符合 Next.js App Router 规范) ---
export default function Page() {
    return <ApexHero title="Apex" />;
}
