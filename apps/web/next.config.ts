import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Dedicated loopback HD review lab uses the same application, separate cache.
  ...(process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_AVATAR_HD_LAB === '1'
    ? { distDir: '.next/task-0048-pilot-lab' }
    : {}),
  // Isolate the local audio E2E dev server from an already running user server.
  ...(process.env.NODE_ENV === 'development' &&
  process.env.RPG_ARENA_AUDIO_E2E === '1'
    ? { distDir: '.next/task-0042-prototype' }
    : {}),
  poweredByHeader: false,
  transpilePackages: ['@rpg/shared', '@rpg/ui'],
};

export default nextConfig;
