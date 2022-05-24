/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['ipfs.infura.io']
  },
  rules: {
    ignoreAtRules: ['tailwind']
  }
}

