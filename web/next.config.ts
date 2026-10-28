import type { NextConfig } from 'next'
import { API_URL } from './src/lib/api-url'

// One origin for the browser; the tunnel does the same in a deployment.
const API_PATHS = ['/api/:path*']

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next denies hot reload to 127.0.0.1 otherwise.
  allowedDevOrigins: ['127.0.0.1'],
  async rewrites() {
    return API_PATHS.map((source) => ({ source, destination: `${API_URL}${source}` }))
  },
}

export default nextConfig
