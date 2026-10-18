import type { NextConfig } from 'next';
import {
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from 'next/constants';
import { assertProductionPublic } from '../../scripts/prototype-audio-isolation.mjs';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Local mobile QA/build must not reuse the user's running dev-server cache.
  ...(process.env.RPG_MOBILE_E2E === '1'
    ? { distDir: '.next/task-0062-mobile' }
    : {}),
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
  // Private prototype sources must never enter server/function deploy traces.
  outputFileTracingExcludes: {
    '/*': ['../../assets-source/arena-audio-prototype/**/*'],
  },
  async rewrites() {
    const port = process.env.RPG_AUDIO_PROTOTYPE_PORT;
    if (
      process.env.NODE_ENV !== 'development' ||
      !port ||
      !/^\d{1,5}$/.test(port) ||
      Number(port) < 1 ||
      Number(port) > 65535
    )
      return [];
    return [
      {
        source: '/assets/audio/:path*',
        destination: `http://127.0.0.1:${port}/assets/audio/:path*`,
      },
    ];
  },
};

export default async function config(phase: string) {
  // Protect direct next build/start commands as well as npm scripts.
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER)
    await assertProductionPublic();
  return nextConfig;
}
