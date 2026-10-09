// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { AvatarRuntime } from './components/avatar-runtime';
import { resolveAvatarIdentity } from './data/avatarRuntime';
import * as hdPack from './data/avatarHDPack';
import {
  AVATAR_HD_APPROVED,
  AVATAR_HD_PILOTS,
  selectAvatarHDAsset,
} from './data/avatarHDPack';
const make = () =>
  createTraveler('Piloto', DEFAULT_APPEARANCE, '48', '2026-10-06T12:00:00Z');
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('activates all 54 human-approved identities in production without changing saves', () => {
  vi.stubEnv('NODE_ENV', 'production');
  expect(AVATAR_HD_APPROVED).toHaveLength(54);
  expect(new Set(AVATAR_HD_APPROVED.map((a) => a.source)).size).toBe(54);
  for (const asset of AVATAR_HD_APPROVED) {
    const traveler = make();
    traveler.avatar.gender = asset.gender;
    const [, hair, outfit, skin] = asset.id.split('_');
    traveler.appearance = {
      hair: ({ short: 'curto', long: 'longo', curly: 'cacheado' } as const)[
        hair as 'short'
      ],
      outfit: ({ moss: 'musgo', ochre: 'ocre', blue: 'azul' } as const)[
        outfit as 'moss'
      ],
      skin: ({ light: 'claro', medium: 'medio', dark: 'escuro' } as const)[
        skin as 'light'
      ],
    };
    const before = JSON.stringify(traveler);
    expect(selectAvatarHDAsset(asset.legacy)).toEqual(asset);
    expect(resolveAvatarIdentity(traveler).source).toBe(asset.source);
    expect(resolveAvatarIdentity(traveler).quality).toBe('READY_HD');
    expect(JSON.stringify(traveler)).toBe(before);
  }
});
it.each(['PENDING_HD', 'HD_READY', 'REJECTED', 'LEGACY', 'VALIDATED'] as const)(
  'never activates %s in production without human approval',
  (status) => {
    vi.stubEnv('NODE_ENV', 'production');
    const asset = { ...AVATAR_HD_PILOTS[0], status };
    expect(selectAvatarHDAsset(asset.legacy, [asset], true)).toBeUndefined();
  },
);
it('rejects absent approval proof, missing entries and invalid paths/dimensions', () => {
  const asset = AVATAR_HD_PILOTS[0];
  expect(selectAvatarHDAsset(asset.legacy, [])).toBeUndefined();
  for (const invalid of [
    { ...asset, width: 512 },
    { ...asset, height: 768 },
    { ...asset, source: 'https://example.com/x.png' },
    { ...asset, source: '/assets/avatar/hd/../secret.png' },
    { ...asset, id: 'unknown' },
    { ...asset, gender: 'female' as const },
    { ...asset, sha256: undefined },
    { ...asset, reviewedBy: undefined },
    { ...asset, reviewedAt: 'invalid' },
  ])
    expect(selectAvatarHDAsset(asset.legacy, [invalid])).toBeUndefined();
});
it('DEV preview cannot bypass a rejected candidate', () => {
  vi.stubEnv('NODE_ENV', 'development');
  const asset = { ...AVATAR_HD_PILOTS[0], status: 'REJECTED' as const };
  expect(selectAvatarHDAsset(asset.legacy, [asset], true)).toBeUndefined();
});
it('missing approved catalog entry returns the original legacy identity', () => {
  vi.spyOn(hdPack, 'selectAvatarHDAsset').mockReturnValue(undefined);
  const before = JSON.stringify(make());
  const identity = resolveAvatarIdentity(make());
  expect(identity.source).toBe(identity.legacySource);
  expect(identity.sourceSize).toEqual({ width: 512, height: 768 });
  expect(identity.quality).toBe('USABLE_BUT_LOW_RES');
  expect(JSON.stringify(make())).toBe(before);
});
it('thumbnail mounts only its own image lazily and creates no preload links', () => {
  const { container } = render(
    <AvatarRuntime traveler={make()} mode="thumbnail" />,
  );
  expect(container.querySelectorAll('img')).toHaveLength(1);
  expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
  expect(container.querySelector('link[rel="preload"]')).toBeNull();
});
it.each(['male', 'female'] as const)(
  'head crop scales with HD and preserves legacy fallback for %s',
  (gender) => {
    const traveler = make();
    traveler.avatar.gender = gender;
    const hd = resolveAvatarIdentity(traveler);
    expect(hd.sourceSize).toEqual({ width: 1024, height: 1536 });
    expect(hd.portrait).toEqual({ x: 300, y: 0, width: 424, height: 410 });
    expect(hd.legacySourceSize).toEqual({ width: 512, height: 768 });
  },
);
it('broken HD recovers to legacy, then procedural; source change restores rendering', () => {
  vi.stubEnv('NODE_ENV', 'development');
  const traveler = make(),
    before = JSON.stringify(traveler);
  const { container, rerender } = render(
    <AvatarRuntime traveler={traveler} reviewPilot />,
  );
  const img = container.querySelector('img')!;
  expect(img.src).toContain('/hd/');
  fireEvent.error(img);
  expect(container.querySelector('img')!.src).toContain('/runtime/');
  expect(container.querySelector('svg')).toBeNull();
  expect(container.querySelector('[data-avatar-asset-status]')).toHaveAttribute(
    'data-avatar-asset-status',
    'LEGACY',
  );
  fireEvent.error(container.querySelector('img')!);
  expect(container.querySelector('[data-avatar-fallback]')).not.toBeNull();
  rerender(
    <AvatarRuntime
      traveler={{
        ...traveler,
        appearance: { ...traveler.appearance, hair: 'longo' },
      }}
      reviewPilot
    />,
  );
  expect(container.querySelector('img')!.src).toContain('_long_');
  expect(JSON.stringify(traveler)).toBe(before);
});
it('wrong physical HD dimensions trigger legacy, without collapsing canvas', () => {
  vi.stubEnv('NODE_ENV', 'development');
  const { container } = render(<AvatarRuntime traveler={make()} reviewPilot />);
  const img = container.querySelector('img')!;
  Object.defineProperty(img, 'naturalWidth', { value: 512 });
  Object.defineProperty(img, 'naturalHeight', { value: 768 });
  fireEvent.load(img);
  expect(container.querySelector('img')).toHaveAttribute(
    'src',
    AVATAR_HD_PILOTS[0].legacy,
  );
  expect(container.querySelector('img')).toHaveAttribute('width', '512');
  expect(container.querySelector('svg')).toBeNull();
});
