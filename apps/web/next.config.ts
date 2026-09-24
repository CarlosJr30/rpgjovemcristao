import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@rpg/shared', '@rpg/ui'],
};

export default nextConfig;
