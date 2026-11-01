// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const route = vi.hoisted(() => ({ path: '/journey/guild/administration' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.path }));
vi.mock('../../lib/supabase/auth-context', () => ({
  useAuth: () => ({ status: 'signedIn' }),
}));
vi.mock('../journey/components/shell', () => ({
  Shell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
import { ReleaseShell } from '../release-ebd/shell';
afterEach(cleanup);
test('early-access notice preserves published administration and remains collapsed on community pages', () => {
  const view = render(
    <ReleaseShell>
      <h1>Painel preservado</h1>
    </ReleaseShell>,
  );
  expect(
    screen.getByRole('heading', { name: 'Painel preservado' }),
  ).toBeVisible();
  expect(
    screen.queryByText('RPG Jovem Cristão — Acesso Antecipado'),
  ).toBeNull();
  route.path = '/journey/guild';
  view.rerender(
    <ReleaseShell>
      <h1>Comunidade</h1>
    </ReleaseShell>,
  );
  expect(
    screen
      .getByText('RPG Jovem Cristão — Acesso Antecipado')
      .closest('details'),
  ).not.toHaveAttribute('open');
});
