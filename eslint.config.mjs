import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/compat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // 这是您原有的 Next.js 基础配置
    ...compat.extends("next/core-web-vitals", "next/typescript"),

    // --- 在这里添加您的自定义规则 ---
    // 我们在配置数组的末尾添加一个新对象来覆盖或添加规则。
    // 数组中靠后的配置会覆盖靠前的配置。
    {
        rules: {
            // "off" 表示完全禁用该规则，从而允许在代码中使用 'any' 类型。
            "@typescript-eslint/no-explicit-any": "off",

            // --- 备选方案 ---
            // 如果您不想完全禁用，而是希望在开发时看到警告（不影响项目构建），
            // 可以使用 "warn" 代替 "off"。
            // "@typescript-eslint/no-explicit-any": "warn",
        }
    }
];

export default eslintConfig;