import 'server-only';
import QRCode from 'qrcode';
import {
  INVITE_TOKEN,
  INVITE_UUID,
  inviteBaseURL,
} from '../guild-invites/contracts';
import { LEADERSHIP_PATH } from './contracts';

export const LEADERSHIP_SUBJECT =
  'Você foi convidado para liderar no RPG Jovem Cristão!';
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
export async function renderLeadershipEmail(
  origin: string,
  invitation: { url: string; expiresAt: string },
) {
  const base = inviteBaseURL(origin, true),
    u = new URL(invitation.url);
  if (
    u.origin !== base ||
    u.pathname !== LEADERSHIP_PATH ||
    u.search ||
    !INVITE_TOKEN.test(u.hash.slice(1)) ||
    u.username ||
    u.password ||
    !Number.isFinite(Date.parse(invitation.expiresAt))
  )
    throw Error('Invalid invitation');
  const expires = new Date(invitation.expiresAt).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  });
  const url = u.href;
  const png = await QRCode.toBuffer(url, {
    type: 'png',
    width: 256,
    margin: 2,
  });
  const text = `Você foi convidado para liderar uma comunidade no RPG Jovem Cristão.\n\nApós o aceite autenticado, poderá criar e organizar Guildas, convidar participantes e acompanhar atividades conforme suas autorizações. O convite não autentica sua conta e não concede liderança antes do aceite.\n\nEntre ou cadastre-se com o endereço destinatário e confirme sua conta. O aceite é uma ação explícita; apenas abrir o link não consome o convite.\n\nVálido até ${expires} (horário de Brasília). Uso individual e único. Não encaminhe a outras pessoas.\n\n${url}`;
  const html = `<html lang="pt-BR"><body style="margin:0;padding:24px;background:#faf5e7;color:#173c2d;font-family:Georgia,serif"><main style="max-width:560px;margin:auto;border:1px solid #b99b54;padding:24px;border-radius:12px"><h1 style="color:#173c2d">RPG Jovem Cristão</h1><h2>Um convite para liderar</h2><p>Após o aceite autenticado, você poderá criar e organizar Guildas, convidar participantes e acompanhar atividades conforme suas autorizações.</p><p>Entre ou cadastre-se com o endereço destinatário e confirme sua conta. A liderança só será concedida após o aceite explícito.</p><p><a href="${escape(url)}" style="display:inline-block;background:#173c2d;color:#fff8e7;padding:14px;border-radius:8px">Conhecer e aceitar o convite</a></p><img src="cid:leadership-qr" width="256" height="256" alt="QR Code do mesmo convite individual" /><p>Válido até ${escape(expires)} (horário de Brasília). Uso individual e único. Não encaminhe.</p><p>Apenas abrir o link ou o QR Code não aceita o convite.</p></main></body></html>`;
  return {
    subject: LEADERSHIP_SUBJECT,
    text,
    html,
    attachments: [
      {
        filename: 'convite-lideranca.png',
        content: png.toString('base64'),
        content_type: 'image/png',
        content_id: 'leadership-qr',
      },
    ],
  };
}

/** Prepared adapter only. No route or UI calls it. Activation requires a durable protected outbox and real TEST/PROD gates. */
export async function deliverPreparedLeadershipEmail(
  config:
    | {
        apiKey: string;
        from: string;
        senderVerified: boolean;
        trackingDisabled: boolean;
      }
    | undefined,
  job: {
    deliveryId: string;
    firstAttemptAt: number;
    recipient: string;
    message: Awaited<ReturnType<typeof renderLeadershipEmail>>;
  },
  transport: typeof fetch = fetch,
): Promise<{
  state: 'not_configured' | 'sent' | 'failed' | 'unknown' | 'expired_retry';
  providerId?: string;
}> {
  if (
    !config?.apiKey ||
    !config.senderVerified ||
    !config.trackingDisabled ||
    !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(config.from)
  )
    return { state: 'not_configured' };
  if (
    !INVITE_UUID.test(job.deliveryId) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.recipient)
  )
    return { state: 'failed' };
  // Provider deduplication lasts24h; uncertainty after that window must be resolved by the future outbox, never retried blindly.
  const age = Date.now() - job.firstAttemptAt;
  if (!Number.isFinite(age) || age < 0 || age >= 23 * 3600000)
    return { state: 'expired_retry' };
  try {
    const r = await transport('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `leadership/${job.deliveryId}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [job.recipient],
        ...job.message,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (r.status >= 500 || r.status === 429) return { state: 'unknown' };
    if (!r.ok) return { state: 'failed' };
    const body: unknown = await r.json();
    if (
      !body ||
      typeof body !== 'object' ||
      !('id' in body) ||
      typeof body.id !== 'string' ||
      !/^[A-Za-z0-9_-]{8,128}$/.test(body.id)
    )
      return { state: 'unknown' };
    return { state: 'sent', providerId: body.id };
  } catch {
    return { state: 'unknown' };
  }
}
