import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['physics.kapy.ca'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
