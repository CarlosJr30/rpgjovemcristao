// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const { action } = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock('../../lib/guild-invites/client', () => ({ guildInviteAction: action }));
vi.mock('next/image', () => ({ default: (props: Record<string, unknown>) => <span role="img" aria-label={String(props.alt)} /> }));
import { GuildInvitePanel } from './invite-panel';
afterEach(() => { cleanup(); vi.resetAllMocks(); });
test('leader can generate QR/link, share deliberately, and revoke the limited invite', async () => {
  const url = `https://jogo.exemplo.test/guilda/convite/${'a'.repeat(64)}`;
  let revoked = false;
  let created = false;
  action.mockImplementation(async input => {
    if (input.action === 'create') { created = true; return { id: 'invite-1', url, qr: 'data:image/svg+xml;base64,PHN2Zy8+', expires_at: '2026-10-26T00:00:00Z' }; }
    if (input.action === 'revoke') { revoked = true; return { data: null }; }
    return { data: created ? [{ id: 'invite-1', created_at: '2026-10-19T00:00:00Z', expires_at: '2026-10-26T00:00:00Z', revoked_at: revoked ? '2026-10-19T01:00:00Z' : null }] : [] };
  });
  render(<GuildInvitePanel travelerId="leader-fixture" />);
  fireEvent.click(screen.getByRole('button', { name: 'Convidar membros' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Gerar convite' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Gerar convite' }));
  expect(await screen.findByRole('img', { name: 'QR Code do convite da Guilda' })).toBeVisible();
  expect(screen.getByLabelText('Link do convite')).toHaveValue(url);
  const share = screen.getByRole('link', { name: 'Compartilhar pelo WhatsApp' });
  expect(share).toHaveAttribute('href', `https://wa.me/?text=${encodeURIComponent(url)}`);
  expect(share).toHaveAttribute('rel', 'noopener noreferrer');
  fireEvent.click(screen.getByRole('button', { name: 'Revogar convite' }));
  await waitFor(() => expect(screen.queryByLabelText('Link do convite')).toBeNull());
  expect(await screen.findByRole('status')).toHaveTextContent('Convite revogado');
});
