// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import fs from 'node:fs/promises';
import { auditPack } from '../../../../scripts/audiovisual-pack.mjs';
import { GuildArtwork, GuildHall } from './components/guild-artwork';
import { GuildRewardDetails } from './components/guild-reward-summary';
afterEach(cleanup);
test('responsive hall restores CSS and preserves HTML when the chosen image fails', () => {
  const { container } = render(
    <GuildHall>
      <button>Ver missões</button>
    </GuildHall>,
  );
  expect(container.querySelector('source')).toHaveAttribute(
    'srcset',
    '/assets/world/guild/guild_hall_mobile.webp',
  );
  const image = container.querySelector('img')!;
  expect(image).toHaveAttribute('alt', '');
  fireEvent.error(image);
  expect(container.querySelector('section')).toHaveAttribute(
    'data-guild-scene',
    'fallback',
  );
  expect(container.querySelector('picture')).toBeNull();
  expect(screen.getByRole('button', { name: 'Ver missões' })).toBeVisible();
});
test('decoration failures remove only the image, and ordinary reward cards do not show chest artwork', () => {
  const { container, rerender } = render(
    <GuildArtwork slot="guildBanner" className="banner" />,
  );
  fireEvent.error(container.querySelector('img')!);
  expect(container.querySelector('img')).toBeNull();
  rerender(<GuildRewardDetails tier="normal" />);
  expect(container.querySelector('img')).toBeNull();
  expect(screen.getByLabelText('Recompensa')).toHaveTextContent('+80 XP');
  rerender(<GuildRewardDetails tier="normal" showChest />);
  expect(new URL(container.querySelector('img')!.src).pathname).toBe(
    '/assets/world/guild/guild_reward_chest.png',
  );
});
test('real Guild visuals pass the original audit gates, and a revoked receipt cannot enter the catalog', async () => {
  const manifest = JSON.parse(
    await fs.readFile('docs/architecture/audiovisual-pack-v1.json', 'utf8'),
  );
  const approvals = JSON.parse(
    await fs.readFile(
      'docs/architecture/audiovisual-pack-approvals.json',
      'utf8',
    ),
  );
  const guild = {
    ...manifest,
    items: manifest.items.filter((item: { key: string }) =>
      [
        'guildHall',
        'guildBanner',
        'guildMissionParchment',
        'guildLeaderTable',
        'guildRewardChest',
      ].includes(item.key),
    ),
  };
  const result = await auditPack(process.cwd(), guild, approvals);
  expect(result.pass).toBe(true);
  expect(
    result.results.filter((item) => item.status === 'VALIDATED'),
  ).toHaveLength(6);
  const revoked = structuredClone(approvals);
  revoked.files['world/guild/guild_banner_neutral.png'].presentationApproved =
    false;
  const rejection = await auditPack(process.cwd(), guild, revoked);
  expect(rejection.pass).toBe(false);
  expect(rejection.visual.guildBanner).toBeUndefined();
});
