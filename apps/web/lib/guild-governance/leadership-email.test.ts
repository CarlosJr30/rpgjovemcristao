import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import QRCode from 'qrcode';
import {
  renderLeadershipEmail,
  deliverPreparedLeadershipEmail,
  LEADERSHIP_SUBJECT,
} from './leadership-email.server';
const url =
    'https://rpgjovemcristao-web-inky.vercel.app/guilda/lideranca/convite#' +
    'a'.repeat(64),
  expiresAt = '2030-01-01T00:00:00Z';
const config = {
  apiKey: 'isolated-server-only-fixture',
  from: 'convites@game.example',
  senderVerified: true,
  trackingDisabled: true,
};
test('email includes exact subject valid role expiry and same-link QR without private reason or Auth secrets', async () => {
  const m = await renderLeadershipEmail(
    'https://rpgjovemcristao-web-inky.vercel.app',
    { url, expiresAt },
  );
  expect(m.subject).toBe(LEADERSHIP_SUBJECT);
  expect(m.text).toContain(url);
  expect(m.html).toContain(`href="${url}"`);
  expect(m.html).toContain('cid:leadership-qr');
  expect(m.attachments[0].content).toBe(
    (
      await QRCode.toBuffer(url, { type: 'png', width: 256, margin: 2 })
    ).toString('base64'),
  );
  expect(m.text).toContain('antes do aceite');
  expect(m.html).not.toMatch(
    /password|access_token|refresh_token|motivo administrativo/,
  );
});
test('unsafe invitation origins paths queries and tokens are rejected before rendering', async () => {
  for (const u of [
    url.replace('rpgjovemcristao-web-inky.vercel.app', 'attacker.example'),
    url.replace('https:', 'http:'),
    url.replace('/guilda/lideranca/convite', '/auth'),
    url.replace('#', '?token='),
    url.replace(/a{64}/, 'bad'),
  ])
    await expect(
      renderLeadershipEmail('https://rpgjovemcristao-web-inky.vercel.app', {
        url: u,
        expiresAt,
      }),
    ).rejects.toThrow('Invalid invitation');
});
test('missing provider or unverified sender cannot send', async () => {
  const transport = vi.fn(),
    message = await renderLeadershipEmail(
      'https://rpgjovemcristao-web-inky.vercel.app',
      { url, expiresAt },
    ),
    job = {
      deliveryId: '00000000-0000-4000-8000-000000000001',
      firstAttemptAt: Date.now(),
      recipient: 'recipient@fixture.example',
      message,
    };
  expect(
    await deliverPreparedLeadershipEmail(undefined, job, transport),
  ).toEqual({ state: 'not_configured' });
  expect(
    await deliverPreparedLeadershipEmail(
      { ...config, senderVerified: false },
      job,
      transport,
    ),
  ).toEqual({ state: 'not_configured' });
  expect(transport).not.toHaveBeenCalled();
});
test('provider confirmation is required and retries reuse the same deduplication key and payload', async () => {
  const message = await renderLeadershipEmail(
      'https://rpgjovemcristao-web-inky.vercel.app',
      { url, expiresAt },
    ),
    job = {
      deliveryId: '00000000-0000-4000-8000-000000000001',
      firstAttemptAt: Date.now(),
      recipient: 'recipient@fixture.example',
      message,
    };
  const transport = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ id: 'message-confirmed' }), {
        status: 200,
      }),
    );
  expect(await deliverPreparedLeadershipEmail(config, job, transport)).toEqual({
    state: 'sent',
    providerId: 'message-confirmed',
  });
  transport.mockResolvedValue(
    new Response(JSON.stringify({ id: 'message-confirmed' }), { status: 200 }),
  );
  await deliverPreparedLeadershipEmail(config, job, transport);
  expect(transport.mock.calls[0][1].headers['Idempotency-Key']).toBe(
    transport.mock.calls[1][1].headers['Idempotency-Key'],
  );
  expect(transport.mock.calls[0][1].body).toBe(transport.mock.calls[1][1].body);
  transport.mockResolvedValue(
    new Response('provider request payload omitted', { status: 422 }),
  );
  expect(await deliverPreparedLeadershipEmail(config, job, transport)).toEqual({
    state: 'failed',
  });
  transport.mockRejectedValue(new Error(url));
  expect(await deliverPreparedLeadershipEmail(config, job, transport)).toEqual({
    state: 'unknown',
  });
  expect(
    await deliverPreparedLeadershipEmail(
      config,
      { ...job, firstAttemptAt: Date.now() - 24 * 3600000 },
      transport,
    ),
  ).toEqual({ state: 'expired_retry' });
});
