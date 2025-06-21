"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D } from '@react-three/drei';
import * as THREE from 'three';

// --- ApexText (3D "Apex" 文字) 组件 ---
const ApexText = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    return (
        <group position={position} rotation={rotation}>
            <Text3D
                font="/fonts/helvetiker_regular.typeface.json" // 确保您在 public/fonts 目录下有这个字体文件
                size={1.5}      // 字体大小
                height={0.2}    // 文本厚度
                curveSegments={12} // 曲线分段数
                bevelEnabled    // 开启斜角
                bevelThickness={0.05}
                bevelSize={0.03}
                bevelOffset={0}
                bevelSegments={5}
            >
                Apex
                {/* 定义物理材质，使其具有金属感和红色调 */}
                <meshPhysicalMaterial 
                    color="#E53935" // 红色
                    metalness={0.9}
                    roughness={0.1}
                    reflectivity={1}
                    ior={1.5}
                    emissive="#400000"
                    emissiveIntensity={0.6}
                    flatShading={false}
                />
            </Text3D>
        </group>
    );
};

// 动态文字组件，包含一组旋转的 ApexText
const AnimatedTexts = () => {
    const groupRef = useRef<THREE.Group>(null!);

    // useFrame 钩子在每一帧都会调用，用于更新动画
    useFrame((state, delta) => {
        if (groupRef.current) {
            // 使整组文字缓慢旋转
            groupRef.current.rotation.y += delta * 0.1;
            groupRef.current.rotation.x += delta * 0.1;
        }
    });

    // 创建一组文字用于渲染
    const texts = Array.from({ length: 30 }, (_, index) => {
        // 在球体内随机分布
        const phi = Math.acos(-1 + (2 * index) / 30);
        const theta = Math.sqrt(30 * Math.PI) * phi;
        const radius = 8; // 增大了分布半径
        
        const position = new THREE.Vector3();
        position.setFromSphericalCoords(radius, phi, theta);

        return {
            position: [position.x, position.y, position.z] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
            id: index
        };
    });

    return (
        <group ref={groupRef}>
            {texts.map((text) => (
                <ApexText
                    key={text.id}
                    position={text.position}
                    rotation={text.rotation}
                />
            ))}
        </group>
    );
};

// 场景组件，用于设置 Canvas 和光照
const Scene = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
                <ambientLight intensity={5} />
                <pointLight position={[15, 15, 15]} intensity={200} color="#FF7F50" />
                <pointLight position={[-15, -15, -15]} intensity={150} color="#4682B4" />
                <AnimatedTexts />
            </Canvas>
        </div>
    );
};


// --- 主要的页面组件 ---
export default function Page() {
  return (
    // 主容器，设置背景渐变和全屏样式
    <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center justify-center p-8 overflow-hidden" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
      {/* 渲染背景动画场景 */}
      <Scene />
    </div>
  );
};
