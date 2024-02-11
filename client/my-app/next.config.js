/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
              "www.gravatar.com"
            , "localhost"
            , "ec2-16-170-204-98.eu-north-1.compute.amazonaws.com"
    ] // 이미지 허용 URL
  }
}

module.exports = nextConfig
