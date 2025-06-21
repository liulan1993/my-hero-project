"use client"; // 必须添加此指令，因为页面包含客户端交互（useState, onClick等）

import React, { useState, useRef } from 'react'; // 增加了 useRef
import { motion } from 'framer-motion';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// --- 新增的3D动画库导入 ---
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// -- 工具函数 (来自 utils.ts) --
// 功能: 合并 Tailwind CSS 类名，处理样式冲突
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -- Button 组件 (来自 button.tsx) --
// 功能: 定义可复用的按钮样式和变体
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-600/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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
  asChild?: boolean;
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


// --- 新的背景动画组件 (来自 zhiyoudonghua.tsx) ---
const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    // 创建一个带圆角的矩形形状
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;

    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);

    // 定义拉伸设置
    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    };

    // 基于形状和设置创建几何体
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // 将几何体居中

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            {/* 定义物理材质，使其具有金属感和反射效果 */}
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

// 动态盒子组件，包含一组旋转的Box
const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);

    // useFrame钩子在每一帧都会调用，用于更新动画
    useFrame((state, delta) => {
        if (groupRef.current) {
            // 使整组盒子缓慢旋转
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    // 创建一组盒子用于渲染
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

// 3D场景组件
const BackgroundScene = () => {
    return (
        <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
            <ambientLight intensity={15} />
            <directionalLight position={[10, 10, 5]} intensity={15} />
            <AnimatedBoxes />
        </Canvas>
    );
};
// --- 新背景动画组件结束 ---


// **修复**: 为问卷题目和表单数据定义清晰的 TypeScript 类型
interface Question {
  id: string;
  text: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'radio_with_text';
  options?: string[];
  description?: string;
  note?: string;
  textPrompt?: string;
  dependsOn?: {
    qId: string;
    value: string;
  };
}

type FormData = {
  [key: string]: string | string[];
};


// -- 问卷题目数据 --
const surveyQuestions: Question[] = [
    { id: 'q1', text: '您的年龄段是？', type: 'radio', options: ['A. 18-25岁', 'B. 26-35岁', 'C. 36-45岁', 'D. 46-55岁', 'E. 55岁以上'] },
    { id: 'q2', text: '您目前的职业或身份是？', type: 'radio', options: ['A. 在校学生', 'B. 企业主/合伙人', 'C. 公司高管', 'D. 企业普通职员', 'E. 自由职业者', 'F. 其他 (请注明)'] },
    { id: 'q3', text: '您目前常住的国家/地区是？', type: 'text', description: '了解客户的地域来源，有助于分析跨国业务需求。' },
    { id: 'q4', text: '您是通过哪种渠道了解到我们或本次调查的？', type: 'checkbox', options: ['A. 搜索引擎(如谷歌、百度)', 'B. 社交媒体(如微信、微博、LinkedIn)', 'C. 朋友/同事推荐', 'D. 线下活动/讲座', 'E. 广告', 'F. 其他'] },
    { id: 'q5', text: '在未来1-2年内，您是否有以下方面的计划？（可多选）', type: 'checkbox', options: ['A. 个人/子女海外留学', 'B. 寻求海外医疗或健康管理', 'C. 在海外注册公司或拓展业务', 'D. 办理海外移民或长期签证', 'E. 暂无明确计划'] },
    { id: 'q6', text: '您计划申请的留学国家/地区主要是？', type: 'text', description: '开放式问题以获取最真实的目标地。' },
    { id: 'q7', text: '您期望在留学申请的哪个环节获得帮助？', type: 'checkbox', options: ['A. 学校与专业选择', 'B. 申请文书准备', 'C. 语言考试培训', 'D. 签证办理', 'E. 背景提升规划', 'F. 全程托管服务'] },
    { id: 'q8', text: '您为留学规划的总预算大约是多少（人民币/年）？', type: 'radio', options: ['A. 20万以下', 'B. 20-40万', 'C. 40-60万', 'D. 60万以上'] },
    { id: 'q9', text: '您对哪类海外医疗健康服务感兴趣？', type: 'checkbox', options: ['A. 精密体检', 'B. 重大疾病治疗（如癌症）', 'C. 生育辅助/抗衰老', 'D. 疫苗接种（如HPV）', 'E. 医疗第二意见咨询'] },
    { id: 'q10', text: '在选择海外医疗服务时，您最看重的因素是什么？', type: 'checkbox', options: ['A. 医院/医生的知名度', 'B. 技术的先进性', 'C. 服务的私密性与舒适度', 'D. 整体费用', 'E. 服务流程的便捷性'], note: '建议限选3项' },
    { id: 'q11', text: '您计划在哪个国家或地区拓展业务或注册公司？', type: 'text', description: '例如：新加坡、香港、美国等。' },
    { id: 'q12', text: '除了公司注册，您还可能需要哪些后续服务？', type: 'checkbox', options: ['A. 银行开户', 'B. 会计与做账', 'C. 年度审计', 'D. 税务规划', 'E. 公司秘书', 'F. 法律咨询'] },
    { id: 'q13', text: '您需要审计服务的主要目的是什么？', type: 'radio', options: ['A. 满足法定要求', 'B. 公司内部管理需求', 'C. 融资或上市', 'D. 投资并购', 'E. 尚不确定'] },
    { id: 'q14', text: '您公司的所属行业是？', type: 'text', description: '了解客户行业，有助于提供更精准的行业解决方案。' },
    { id: 'q15', text: '您意向的移民国家是？', type: 'text' },
    { id: 'q16', text: '您主要考虑的移民方式是？', type: 'radio', options: ['A. 技术/人才移民', 'B. 投资移民', 'C. 创业移民', 'D. 亲属团聚', 'E. 留学转移民', 'F. 尚在了解阶段'] },
    { id: 'q17', text: '在移民过程中，您最担心或最需要解决的问题是什么？', type: 'checkbox', options: ['A. 申请成功率', 'B. 资金安全', 'C. 办理周期', 'D. 申请流程复杂', 'E. 后续安家服务（如子女教育、置业）'], note: '建议限选3项' },
    { id: 'q18', text: '在选择一家咨询公司时，您最看重以下哪些因素？', type: 'checkbox', options: ['A. 品牌知名度和信誉', 'B. 顾问的专业能力和经验', 'C. 成功案例数量', 'D. 服务价格', 'E. 服务响应速度和态度', 'F. 提供一站式综合服务的能力'], note: '建议限选3项' },
    { id: 'q19', text: '您期望的服务价格透明度如何？', type: 'radio', options: ['A. 一口价全包', 'B. 按服务阶段分步收费', 'C. 按服务项目明细收费', 'D. 对价格不敏感，更看重结果'] },
    { id: 'q20', text: '您偏好通过哪种方式与我们的顾问进行初步沟通？', type: 'radio', options: ['A. 电话沟通', 'B. 线上会议（Zoom, Teams等）', 'C. 微信/即时通讯', 'D. 邮件沟通', 'E. 线下约见'] },
    { id: 'q21', text: '您认为一个“专业”的顾问应该具备的最重要特质是什么？', type: 'text', description: '开放式问题，探寻客户对“专业”的深层定义。' },
    { id: 'q22', text: '您是否曾使用过类似的咨询服务？体验如何？', type: 'radio_with_text', options: ['A. 使用过，体验很好', 'B. 使用过，体验一般/不满意', 'C. 从未使用过'], textPrompt: '可否简要描述您满意或不满意的地方？' },
    { id: 'q23', text: '您希望从我们这里获得哪类资讯或信息？', type: 'checkbox', options: ['A. 最新政策解读（移民/留学/税法等）', 'B. 成功案例分享', 'C. 行业分析报告', 'D. 各国生活/教育/营商环境介绍', 'E. 线下/线上活动通知'] },
    { id: 'q24', text: '对于我们目前提供的服务范围，您认为还有哪些可以补充或改进的地方？', type: 'textarea' },
    { id: 'q25', text: '在您面临个人或企业发展的十字路口时，最困扰您的问题是什么？', type: 'textarea', description: '这是一个深挖痛点的问题，可能发现新的服务机会。' },
    { id: 'q26', text: '您对本次问卷有任何建议吗？', type: 'textarea' },
    { id: 'q27', text: '您是否愿意接受我们资深顾问提供的一次免费初步评估服务？', type: 'radio', options: ['A. 是，我愿意', 'B. 否，暂时不需要'] },
    { id: 'q28', text: '如果愿意，请留下您的称呼。', type: 'text', dependsOn: { qId: 'q27', value: 'A. 是，我愿意' } },
    { id: 'q29', text: '请留下您的联系方式（电话或邮箱），以便我们为您安排咨询。', type: 'text', dependsOn: { qId: 'q27', value: 'A. 是，我愿意' } },
    { id: 'q30', text: '您方便我们与您联系的时间是？', type: 'radio', options: ['A. 工作日上班时间', 'B. 工作日下班后', 'C. 周末', 'D. 任何时间都可以'], dependsOn: { qId: 'q27', value: 'A. 是，我愿意' } },
];


// -- 问卷表单组件 --
// 功能: 渲染整个问卷，并处理用户输入和提交逻辑
function SurveyForm() {
    const [formData, setFormData] = useState<FormData>({});
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    // **最终修复**: 允许 handleChange 接收字符串或字符串数组，以处理所有类型的输入
    const handleChange = (qId: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [qId]: value }));
    };

    const handleCheckboxChange = (qId: string, option: string, isChecked: boolean) => {
        const currentOptions = (formData[qId] as string[]) || [];
        const newOptions = isChecked 
            ? [...currentOptions, option]
            : currentOptions.filter((o: string) => o !== option);
        // **最终修复**: 直接调用更新后的 handleChange，不再需要 `as any`
        handleChange(qId, newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');

        const submissionData = {
            id: crypto.randomUUID(),
            submittedAt: new Date().toISOString(),
            answers: formData,
        };

        try {
            const response = await fetch('/api/submit-survey', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            });

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error("提交失败:", error);
            setStatus('error');
        }
    };
    
    const renderQuestion = (q: Question) => {
      if (q.dependsOn && formData[q.dependsOn.qId] !== q.dependsOn.value) {
          return null;
      }
      
      const questionCard = "bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-md mb-6 border border-slate-200/50 text-left";
      const questionText = "text-md sm:text-lg font-semibold text-slate-800 mb-4";
      const descriptionText = "text-sm text-slate-600 mb-4";
      const noteText = "text-xs text-slate-500 ml-2";

      return (
        <div key={q.id} className={questionCard}>
          <p className={questionText}>{q.text} {q.note && <span className={noteText}>({q.note})</span>}</p>
          {q.description && <p className={descriptionText}>{q.description}</p>}
          
          { (q.type === 'radio' || q.type === 'radio_with_text') && q.options?.map((option: string) => (
            <label key={option} className="flex items-center text-slate-700 mb-2 cursor-pointer p-1">
              <input type="radio" name={q.id} value={option} onChange={(e) => handleChange(q.id, e.target.value)} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
              {option}
            </label>
          ))}

          { q.type === 'radio_with_text' && (formData[q.id] === 'A. 使用过，体验很好' || formData[q.id] === 'B. 使用过，体验一般/不满意') && (
            <textarea
              placeholder={q.textPrompt}
              onChange={(e) => handleChange(`${q.id}_details`, e.target.value)}
              className="mt-2 w-full p-2 border border-slate-300 rounded-md bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}

          { q.type === 'checkbox' && q.options?.map((option: string) => (
            <label key={option} className="flex items-center text-slate-700 mb-2 cursor-pointer p-1">
              <input type="checkbox" onChange={(e) => handleCheckboxChange(q.id, option, e.target.checked)} className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"/>
              {option}
            </label>
          ))}
          
          { q.type === 'text' && (
            <input
              type="text"
              onChange={(e) => handleChange(q.id, e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}

          { q.type === 'textarea' && (
            <textarea
              rows={4}
              onChange={(e) => handleChange(q.id, e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md bg-white/50 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          )}
        </div>
      );
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mt-8 sm:mt-12 px-2 sm:px-4">
            {surveyQuestions.map(renderQuestion)}
            <div className="text-center mt-8 pb-16"> {/* 增加底部外边距 */}
              <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={status === 'submitting'}>
                {status === 'submitting' ? '提交中...' : '提交问卷'}
              </Button>
              {status === 'success' && <p className="text-green-500 mt-4">感谢您的参与，问卷已成功提交！</p>}
              {status === 'error' && <p className="text-red-500 mt-4">抱歉，提交失败，请稍后重试。</p>}
            </div>
        </form>
    );
}


// -- 主组件, 已更新为 Apex 问卷调查 --
function ApexSurveyComponent({
    title = "Apex 问卷调查",
}: {
    title?: string;
}) {
    const words = title.split(" ");

    return (
        <div className="relative w-full min-h-screen">
            {/* 背景层：已替换为新的3D动画 */}
            <div className="fixed inset-0 -z-10 bg-white">
                <BackgroundScene />
            </div>

            {/* 内容层：可滚动 */}
            <div className="relative z-0 w-full h-screen overflow-y-auto flex flex-col items-center pt-12 sm:pt-16 md:pt-24">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 2 }}
                        className="max-w-5xl mx-auto"
                    >
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tighter">
                            {words.map((word, wordIndex) => (
                                <span key={wordIndex} className="inline-block mr-2 sm:mr-4 last:mr-0">
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
                                            className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-700/80"
                                        >
                                            {letter}
                                        </motion.span>
                                    ))}
                                </span>
                            ))}
                        </h1>
                    </motion.div>
                    
                    <SurveyForm />
                </div>
            </div>
        </div>
    );
}

// -- 主应用组件 (默认导出) --
// 功能: 作为页面的根组件，Next.js 会渲染这个组件
export default function HomePage() {
  return <ApexSurveyComponent title="Apex 问卷调查" />;
}