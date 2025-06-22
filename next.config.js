/** @type {import('next').NextConfig} */
const nextConfig = {
  // 如果您有其他 Next.js 配置，可以写在这里
  
  images: {
    remotePatterns: [
      // 占位图和教程网站 (当前已使用)
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'www.w3schools.com',
      },
      
      // 主流免费图库
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },

      // 社交媒体和内容平台
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

      // 开发者常用
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      
      // 其他常用服务
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google 用户内容
      },
      // 如果您未来还需要其他域名，可以按照下面的格式继续添加
      // {
      //   protocol: 'https',
      //   hostname: 'some-other-domain.com',
      // },
    ],
  },
};

module.exports = nextConfig;
