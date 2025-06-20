// 确保这是一个客户端组件，以便将来添加交互功能
'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// 您可以复用主页面中的组件，例如 Button 和 Input
// 为了简单起见，这里我们先用基本的 HTML 元素
const Button = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-rose-500 text-white hover:bg-rose-500/90 h-10 px-4 py-2 ${className}`} {...props}>
        {children}
    </button>
);

const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className={`flex h-10 w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-sm text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Label = ({ children, ...props }: React.LabelHTMLAttributes<HTMLDivElement>) => (
    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" {...props}>
        {children}
    </label>
);


export default function TaxCalculatorPage() {
  const [income, setIncome] = useState('');
  const [tax, setTax] = useState<number | null>(null);

  const handleCalculate = () => {
    // 在这里实现您的个税计算逻辑
    // 这是一个非常简化的示例
    const incomeNum = parseFloat(income);
    if (!isNaN(incomeNum)) {
      setTax(incomeNum * 0.15); // 假设税率是 15%
    } else {
      setTax(null);
    }
  };

  return (
    <div className="relative isolate bg-black text-white min-h-screen">
      <div className="fixed inset-0 -z-20 bg-[radial-gradient(circle_at_top_right,#1A2428,#000_70%)]"></div>
      
      <header className="absolute top-0 left-0 w-full p-4">
        <nav>
            <Link href="/" className="text-lg font-semibold hover:text-neutral-300 transition-colors">
              &larr; 返回主页
            </Link>
        </nav>
      </header>
      
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md mx-auto bg-black/50 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">个人所得税计算器</h1>
            <p className="text-neutral-400 mt-2">输入您的收入信息以计算税额。</p>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="income">税前收入</Label>
              <Input 
                id="income" 
                type="number" 
                placeholder="例如: 50000"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>
            
            <Button onClick={handleCalculate} className="w-full">
              计算
            </Button>
            
            {tax !== null && (
              <div className="text-center bg-slate-900 p-4 rounded-lg">
                <p className="text-neutral-300">预计应缴税额:</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {tax.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
