'use server';

import { kv } from '@vercel/kv';

// 定义表单数据的类型接口
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
    // 使用姓名作为 Redis 的 Key。
    // 在实际应用中，您可能需要考虑使用更唯一的标识符，比如用户ID或邮箱。
    const key = formData.name; 
    if (!key) {
      throw new Error("姓名不能为空，无法作为主键保存。");
    }
    
    // 将数据存入 Vercel KV
    await kv.set(key, JSON.stringify(formData));
    
    console.log(`数据已成功写入 Redis，Key 为: ${key}`);
    return { success: true };
  } catch (error) {
    console.error("写入 Redis 时出错:", error);
    // 返回一个包含错误信息的对象，以便在客户端处理
    return { success: false, error: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}