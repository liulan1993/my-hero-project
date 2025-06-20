/*
 * 文件: src/app/actions.ts
 */
'use server';

// 1. 取消下面这行的注释
import { kv } from '@vercel/kv';

interface ContactFormData {
  name: string;
  serviceArea: string;
  email: string;
  countryKey: string;
  phone: string;
  state: string;
}

export async function saveContactToRedis(formData: ContactFormData) {
  try {
    const key = formData.name; 
    if (!key) {
      throw new Error("姓名不能为空，无法作为主键保存。");
    }
    
    // 2. 取消下面这行的注释
    await kv.set(key, JSON.stringify(formData));
    
    console.log(`数据已成功写入 Redis，Key 为: ${key}`);
    return { success: true };
  } catch (error) {
    console.error("写入 Redis 时出错:", error);
    return { success: false, error: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}