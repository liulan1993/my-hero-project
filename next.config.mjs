/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加 images 配置
  images: {
    // 使用 remotePatterns 来定义允许的外部图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.apex-elite-service.com',
      },
      {
        protocol: 'https',
        hostname: 'www.fey.com',
      },
      {
        protocol: 'https',
        hostname: 'www.w3schools.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com', // Twitter / X
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com', // YouTube 缩略图
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google 用户内容
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // 这是一个备用图片的域名
      },
    ],
  },
};

export default nextConfig;
