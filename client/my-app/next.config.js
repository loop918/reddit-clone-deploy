/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["www.gravatar.com", "localhost"] // 이미지 허용
  }
}

module.exports = nextConfig
