"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as THREE from 'three';

// --- 辅助工具函数 ---
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// --- 新的主题组件 ---

// --- 核心波浪背景组件 ---
function WavyBackground({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}: {
  children?: any;
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  [key: string]: any;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let waveColors = colors || ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"];
    const waveWidthValue = waveWidth || 50;
    const backgroundFillValue = backgroundFill || "black";
    const waveOpacityValue = waveOpacity || 0.5;
    
    let animationId: number;
    let frame = 0;
    const waveCount = 4;

    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawWaves();
    };

    const drawWaves = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = backgroundFillValue;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = waveOpacityValue;
        
        for (let i = 0; i < waveCount; i++) {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            ctx.strokeStyle = waveColors[i % waveColors.length];
            ctx.lineWidth = 2;
            for (let x = 0; x < canvas.width; x++) {
                const waveSpeed = speed === 'fast' ? 100 : 200;
                const angle = frame / (waveSpeed + i * 20) + x / (100 + i * 10);
                const y = canvas.height / 2 + Math.sin(angle) * (waveWidthValue + i * 5);
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    };
    
    const animate = () => {
        frame++;
        drawWaves();
        animationId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();
    window.addEventListener("resize", resizeCanvas);

    return () => {
        window.removeEventListener("resize", resizeCanvas);
        cancelAnimationFrame(animationId);
    };
  }, [colors, waveWidth, backgroundFill, waveOpacity, speed]);

  return (
    <div
      className={cn("h-screen flex flex-col items-center justify-center", containerClassName)}
    >
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        style={{ filter: `blur(${blur}px)` }}
      ></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
}

// --- 3D地球组件 ---
function GridGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.SphereGeometry(2, 64, 64);
    const material = new THREE.MeshBasicMaterial({ color: 0x22c55e, wireframe: true });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    camera.position.z = 5;
    
    let mouseX = 0;
    let mouseY = 0;
    let targetRadianX = 0;
    let targetRadianY = 0;

    function onMouseMove(event: MouseEvent) {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      targetRadianX = mouseY * 0.5;
      targetRadianY = mouseX * 0.5;
    }
    
    window.addEventListener('mousemove', onMouseMove);

    function animate() {
      requestAnimationFrame(animate);
      globe.rotation.y += (targetRadianY - globe.rotation.y) * 0.05;
      globe.rotation.x += (targetRadianX - globe.rotation.x) * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
    }

  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full" />;
}


// --- 税务计算逻辑 ---
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

function calculateSingaporeTax(income: number): number {
    if (income <= 20000) return 0;
    let tax = 0;
    const brackets = [
        { cap: 20000, rate: 0, base: 0 }, { cap: 30000, rate: 0.02, base: 0 },
        { cap: 40000, rate: 0.035, base: 200 }, { cap: 80000, rate: 0.07, base: 550 },
        { cap: 120000, rate: 0.115, base: 3350 }, { cap: 160000, rate: 0.15, base: 7950 },
        { cap: 200000, rate: 0.18, base: 13950 }, { cap: 240000, rate: 0.19, base: 21150 },
        { cap: 280000, rate: 0.195, base: 28750 }, { cap: 320000, rate: 0.20, base: 36550 },
        { cap: 500000, rate: 0.22, base: 44550 }, { cap: 1000000, rate: 0.23, base: 84150 },
        { cap: Infinity, rate: 0.24, base: 199150 },
    ];
    for (let i = 1; i < brackets.length; i++) {
        const prevCap = brackets[i - 1].cap;
        if (income <= brackets[i].cap) {
            tax = brackets[i-1].base + (income - prevCap) * brackets[i].rate;
            return tax;
        }
    }
    return tax;
}


// --- 个人税务计算器组件 ---
function TaxCalculator() {
  const [country, setCountry] = useState<'china' | 'singapore'>('singapore');
  const [income, setIncome] = useState<string>('');
  const [tax, setTax] = useState<number>(0);
  
  useEffect(() => {
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue < 0) {
        setTax(0);
        return;
    }
    let calculatedTax = country === 'china' ? calculateChinaTax(incomeValue) : calculateSingaporeTax(incomeValue);
    setTax(calculatedTax);
  }, [income, country]);

  const currency = country === 'china' ? 'CNY' : 'SGD';

  return (
    <div className="w-full max-w-lg mx-auto mt-8 sm:mt-12 p-4 sm:p-6 bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/20">
      <h2 className="text-2xl font-bold text-center text-white mb-6">个人所得税计算器</h2>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
        <button 
          onClick={() => setCountry('china')}
          className={cn(
            'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300',
            country === 'china' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white'
          )}
        >
          中国 (China)
        </button>
        <button 
          onClick={() => setCountry('singapore')}
          className={cn(
            'px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300',
            country === 'singapore' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/80 text-gray-800 hover:bg-white'
          )}
        >
          新加坡 (Singapore)
        </button>
      </div>

      <div className="relative mb-4">
        <label className="block text-sm font-medium text-gray-200 mb-2">
          {country === 'china' ? '年度应纳税所得额' : 'Chargeable Annual Income'}
        </label>
        <div className="relative">
          <input 
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="在此输入年收入"
            className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300/30 bg-gray-900/50 text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all placeholder-gray-400"
          />
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-300 font-semibold">{currency}</span>
        </div>
      </div>

      <div className="text-center bg-black/20 rounded-lg p-4">
        <p className="text-sm text-gray-300 mb-1">应纳税额 (Tax Payable)</p>
        <p className="text-3xl font-bold text-white">
          {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-lg ml-2">{currency}</span>
        </p>
      </div>
    </div>
  );
}

// --- 页面主入口 ---
export default function Page() {
    const title = "Tax Calculator";
    const words = title.split(" ");
    
    return (
        <WavyBackground className="max-w-4xl mx-auto pb-40">
            <GridGlobe />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-4xl md:text-6xl lg:text-7xl text-white font-bold text-center mb-8"
            >
               {words.map((word, wordIndex) => (
                    <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                        {word.split("").map((letter, letterIndex) => (
                            <motion.span
                                key={`${wordIndex}-${letterIndex}`}
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    delay: 0.5 + wordIndex * 0.1 + letterIndex * 0.05,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 20,
                                }}
                                className="inline-block"
                            >
                                {letter}
                            </motion.span>
                        ))}
                    </span>
                ))}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1, ease: "easeOut" }}
              className="text-base md:text-lg text-gray-200 text-center mt-4 mb-12"
            >
              一个用于快速计算中国和新加坡个人所得税的工具。
            </motion.p>
            <TaxCalculator />
        </WavyBackground>
    );
}
