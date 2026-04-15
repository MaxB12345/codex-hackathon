import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiBase = process.env.API_INTERNAL_BASE ?? 'http://127.0.0.1:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${apiBase}/health`,
      },
      {
        source: '/bootstrap',
        destination: `${apiBase}/bootstrap`,
      },
    ];
  },
};

export default nextConfig;
