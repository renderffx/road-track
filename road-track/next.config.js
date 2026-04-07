/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  turbopack: { root: __dirname },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  logging: {
    browserToTerminal: true,
  },
}

module.exports = nextConfig
