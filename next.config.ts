import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow images from API sources if needed later
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
    ],
  },
}

export default nextConfig
