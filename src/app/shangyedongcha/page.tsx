"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Scene (3D场景) 组件 ---
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

// 场景组件，用于设置Canvas和光照
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


// --- 主要的页面组件 ---
export default function Page() {
  return (
    // 主容器，设置背景渐变和全屏样式
    <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center justify-center p-8 overflow-hidden" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
      {/* 只渲染背景动画场景 */}
      <Scene />
    </div>
  );
};
