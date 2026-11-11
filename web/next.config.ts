import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next denies hot reload to 127.0.0.1 otherwise.
  allowedDevOrigins: ['127.0.0.1'],
}

export default nextConfig
