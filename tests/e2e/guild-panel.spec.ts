import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
import type {
  Attempt,
  Mission,
  Progress,
} from '../../apps/web/features/guild-missions/contracts';
import type {
  GuildActivityRow,
  GuildJoinRequestSummary,
  GuildMemberSummary,
} from '../../apps/web/lib/supabase/database.types';
const leaderId = '10000000-0000-4000-8000-000000000001';
const memberId = '10000000-0000-4000-8000-000000000002';
const guildId = '20000000-0000-4000-8000-000000000001';
const date = '2026-10-19T12:00:00Z';
type FixtureAttempt = Attempt & { request_id: string };
function store() {
  return {
    missions: [] as Mission[],
    progress: [] as Progress[],
    attempts: [] as FixtureAttempt[],
    history: [] as GuildActivityRow[],
    writes: [] as string[],
    requests: [
      {
        request_id: randomUUID(),
        traveler_id: '10000000-0000-4000-8000-000000000003',
        traveler_name: 'Convidado',
        request_status: 'pending',
        created_at: date,
      },
    ] as GuildJoinRequestSummary[],
    members: [
      {
        traveler_id: leaderId,
        traveler_name: 'Lia',
        role: 'leader',
        member_status: 'active',
        joined_at: date,
      },
      {
        traveler_id: memberId,
        traveler_name: 'Rui',
        role: 'member',
        member_status: 'active',
        joined_at: date,
      },
    ] as GuildMemberSummary[],
  };
}
type Store = ReturnType<typeof store>;
async function mock(
  context: BrowserContext,
  state: Store,
  role: 'leader' | 'member',
  missing = false,
) {
  const actor = role === 'leader' ? leaderId : memberId;
  const name = role === 'leader' ? 'Lia' : 'Rui';
  const userId =
    role === 'leader'
      ? '00000000-0000-4000-8000-000000000001'
      : '00000000-0000-4000-8000-000000000002';
  const player = createTraveler(name, DEFAULT_APPEARANCE, actor, date);
  const hero = {
    id: actor,
    user_id: userId,
    name,
    body_type: 'male',
    skin_tone: 'medio',
    hair_style: 'curto',
    hair_color: null,
    avatar_variant: 'musgo',
    xp: 0,
    level: 1,
    is_active: true,
    journey_progress: player.progress,
    created_at: date,
    updated_at: date,
  };
  const user = {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    is_anonymous: false,
    email: `${role}@fixture.invalid`,
    user_metadata: { display_name: name },
    created_at: date,
  };
  const enc = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString('base64url');
  const session = {
    access_token: `${enc({ alg: 'HS256' })}.${enc({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.synthetic`,
    refresh_token: 'synthetic-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  };
  const guild = {
    id: guildId,
    name: 'Guilda de teste',
    description: 'Somente fixture',
    created_by_user_id: '00000000-0000-4000-8000-000000000001',
    leader_traveler_id: leaderId,
    status: 'active',
    created_at: date,
    updated_at: date,
  };
  await context.route('**/*', (route) =>
    ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  await context.route('**/auth/v1/**', (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith('/user')
        ? user
        : session,
    }),
  );
  await context.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const endpoint = new URL(req.url()).pathname.split('/').at(-1) ?? '';
    const input = req.method() === 'GET' ? {} : (req.postDataJSON() ?? {});
    if (req.method() !== 'GET') state.writes.push(endpoint);
    let body: unknown = null;
    if (endpoint === 'travelers')
      body = req.headers().accept?.includes('object') ? hero : [hero];
    if (endpoint === 'traveler_stats')
      body = {
        traveler_id: actor,
        base_life: 1,
        base_strength: 1,
        base_defense: 1,
        base_wisdom: 1,
      };
    if (endpoint === 'wallets') body = { traveler_id: actor, coins: 0 };
    if (
      [
        'inventory',
        'equipped_items',
        'traveler_chests',
        'guild_lessons',
        'guild_chat_messages',
      ].includes(endpoint)
    )
      body = [];
    if (endpoint === 'story_progress') body = [];
    if (endpoint === 'guild_members')
      body = {
        id: randomUUID(),
        guild_id: guildId,
        traveler_id: actor,
        role,
        status: 'active',
        joined_at: date,
      };
    if (endpoint === 'guilds') body = guild;
    if (endpoint === 'list_guild_members') body = state.members;
    if (endpoint === 'list_guild_join_requests')
      body = role === 'leader' ? state.requests : [];
    if (endpoint === 'list_guild_mission_progress') body = [];
    if (endpoint === 'guild_missions')
      body = state.missions.filter(
        (m) =>
          role === 'leader' ||
          m.status === 'published' ||
          state.progress.some(
            (p) => p.mission_id === m.id && p.traveler_id === actor,
          ),
      );
    if (endpoint === 'guild_mission_progress')
      body = state.progress.filter((p) => p.traveler_id === actor);
    if (endpoint === 'guild_chat_summary')
      body = [
        {
          unread_count: 0,
          last_read_sequence: 0,
          can_announce: role === 'leader',
          can_moderate: role === 'leader',
        },
      ];
    if (endpoint === 'guild_mission_workspace') {
      if (missing) {
        await route.fulfill({
          status: 404,
          json: { message: 'synthetic missing RPC' },
        });
        return;
      }
      body = {
        version: 1,
        guildId,
        missions: state.missions,
        progress: state.progress,
        attempts: state.attempts,
        history: state.history,
      };
    }
    if (endpoint === 'save_guild_mission_v2') {
      const d = input.p_data;
      const old = state.missions.find((m) => m.id === input.p_mission);
      const m = {
        id: input.p_mission,
        guild_id: guildId,
        created_by_traveler_id: leaderId,
        title: d.title,
        description: d.description,
        objective: d.objective,
        instructions: d.instructions,
        evidence_criterion: d.evidenceCriterion,
        bible_reference: d.bibleReference || null,
        bible_url: null,
        mission_type:
          d.kind === 'special' ? 'special_mission' : 'practical_activity',
        completion_mode: 'leader_approval',
        requires_leader_approval: true,
        reward_tier: d.rewardTier,
        status: 'draft',
        starts_at: d.startsAt || null,
        due_at: d.dueAt || null,
        metadata: null,
        published_at: null,
        closed_at: null,
        created_at: date,
        updated_at: date,
        audience: d.audience,
        target_traveler_ids: d.targetIds,
        workspace_revision: old ? old.workspace_revision + 1 : 1,
      } as Mission;
      if (old) Object.assign(old, m);
      else state.missions.unshift(m);
      body = m.id;
    }
    if (endpoint === 'transition_guild_mission_v2') {
      const m = state.missions.find((m) => m.id === input.p_mission)!;
      m.status = (
        {
          publish: 'published',
          close: 'closed',
          cancel: 'cancelled',
        } as Record<string, string>
      )[input.p_action];
      m.workspace_revision++;
    }
    if (endpoint === 'act_guild_mission_v2') {
      let p = state.progress.find(
        (p) => p.mission_id === input.p_mission && p.traveler_id === actor,
      );
      if (!p) {
        p = {
          id: randomUUID(),
          mission_id: input.p_mission,
          traveler_id: actor,
          status: 'available',
          started_at: null,
          submitted_at: null,
          completed_at: null,
          approved_at: null,
          approved_by_traveler_id: null,
          completion_note: null,
          review_note: null,
          reward_claimed_at: null,
          created_at: date,
          updated_at: date,
          submission_revision: 0,
        };
        state.progress.push(p);
      }
      if (input.p_action === 'start') {
        p.status = 'started';
        p.started_at = date;
      } else {
        if (!state.attempts.some((a) => a.request_id === input.p_request)) {
          p.submission_revision++;
          p.status = 'pending_approval';
          p.completion_note = input.p_note;
          p.submitted_at = date;
          p.review_note = null;
          state.attempts.push({
            id: randomUUID(),
            mission_id: p.mission_id,
            traveler_id: actor,
            traveler_name: name,
            revision: p.submission_revision,
            note: input.p_note,
            submitted_at: date,
            decision: null,
            reason: null,
            reviewer_traveler_id: null,
            decided_at: null,
            request_id: input.p_request,
          });
        }
      }
      body = p.status;
    }
    if (endpoint === 'review_guild_mission_v2') {
      const a = state.attempts.find((a) => a.id === input.p_attempt)!;
      a.decision = input.p_decision;
      a.reason = input.p_reason;
      a.reviewer_traveler_id = leaderId;
      a.decided_at = date;
      const p = state.progress.find(
        (p) => p.mission_id === a.mission_id && p.traveler_id === a.traveler_id,
      )!;
      p.status = input.p_decision;
      p.review_note = input.p_reason;
      p.approved_at = input.p_decision === 'approved' ? date : null;
      state.history.unshift({
        id: randomUUID(),
        guild_id: guildId,
        actor_traveler_id: leaderId,
        event_type: 'mission_decision',
        entity_type: 'mission',
        entity_id: a.mission_id,
        metadata: { decision: a.decision },
        created_at: date,
      });
      body = a.decision;
    }
    if (endpoint === 'review_guild_join_request') {
      const r = state.requests.find(
        (r) => r.request_id === input.p_request_id,
      )!;
      r.request_status = input.p_approve ? 'approved' : 'rejected';
    }
    await route.fulfill({ json: body });
  });
}
async function login(page: Page, role: 'leader' | 'member') {
  await page.goto('/auth');
  await page.getByLabel('E-mail').fill(`${role}@fixture.invalid`);
  await page.getByLabel('Senha').fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: `Bem-vindo à jornada, ${role === 'leader' ? 'Lia' : 'Rui'}.`,
    }),
  ).toBeVisible();
}
async function area(page: Page, name: string) {
  await expect(
    page.getByRole('heading', { name: 'Painel da Guilda', exact: true }),
  ).toBeVisible();
  const select = page.getByLabel('Área do painel');
  if (await select.isVisible()) await select.selectOption({ label: name });
  else await page.getByRole('button', { name, exact: true }).click();
}
async function memberMissions(page: Page) {
  await page.goto('/journey/guild');
  await expect(
    page.getByRole('heading', { name: 'Guilda de teste', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Missões', exact: true }).click();
}
async function fit(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test('leader draft → publish → member proof → correction → approval → pending reward', async ({
  page,
  context,
  browser,
}, info) => {
  const state = store();
  await mock(context, state, 'leader');
  await login(page, 'leader');
  await page.goto('/journey/guild/manage');
  await expect(
    page.getByRole('heading', { name: 'Painel da Guilda' }),
  ).toBeVisible();
  await fit(page);
  await page.screenshot({
    path: info.outputPath('panel-overview.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await area(page, 'Missões');
  await page.getByRole('button', { name: 'Criar missão', exact: true }).click();
  await page.getByLabel('Título', { exact: true }).fill('Atividade do grupo');
  await page
    .getByLabel('Descrição', { exact: true })
    .fill('Atividade sintética para teste');
  await page
    .getByLabel('Objetivo', { exact: true })
    .fill('Registrar participação objetiva');
  await page
    .getByLabel('Instruções para conclusão')
    .fill('Conclua e registre o resultado');
  await page
    .getByLabel('Critério de comprovação')
    .fill('Envie uma frase objetiva');
  await page.getByLabel('Público-alvo').selectOption('selected');
  await page.getByLabel('Rui', { exact: true }).check();
  await fit(page);
  await page.screenshot({
    path: info.outputPath('mission-editor.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade do grupo' }),
  ).toBeVisible();
  const memberContext = await browser.newContext({
    ...info.project.use,
    baseURL: 'http://127.0.0.1:3183',
  });
  try {
    await mock(memberContext, state, 'member');
    const member = await memberContext.newPage();
    await login(member, 'member');
    await memberMissions(member);
    await expect(
      member.getByRole('heading', { name: 'Atividade do grupo' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Publicar', exact: true }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'publicada' }),
    ).toBeVisible();
    await memberMissions(member);
    await expect(
      member.getByRole('heading', { name: 'Atividade do grupo' }),
    ).toBeVisible();
    await member.getByRole('button', { name: 'Iniciar Missão' }).click();
    await expect(member.getByLabel('Comprovação da conclusão')).toBeVisible();
    await member
      .getByLabel('Comprovação da conclusão')
      .fill('Atividade realizada');
    await member.getByRole('button', { name: 'Enviar conclusão' }).click();
    await expect(
      member.getByText('Aguardando aprovação', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await area(page, 'Aprovações pendentes (1)');
    await expect(
      page.getByText('Atividade realizada', { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel('Justificativa ou orientação')
      .fill('Inclua o resultado objetivo');
    await page.getByRole('button', { name: 'Solicitar correção' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Decisão registrada' }),
    ).toBeVisible();
    await memberMissions(member);
    await expect(member.getByText(/Inclua o resultado objetivo/)).toBeVisible();
    await member
      .getByRole('button', { name: 'Iniciar nova tentativa' })
      .click();
    await member
      .getByLabel('Comprovação da conclusão')
      .fill('Resultado objetivo registrado');
    await member.getByRole('button', { name: 'Enviar conclusão' }).click();
    await expect(
      member.getByText('Aguardando aprovação', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await area(page, 'Aprovações pendentes (1)');
    await page.getByRole('button', { name: 'Aprovar conclusão' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Recompensa pendente' }),
    ).toBeVisible();
    await area(page, 'Recompensas');
    await expect(
      page.getByText('Recompensa pendente de integração', { exact: true }),
    ).toBeVisible();
    await fit(page);
    await page.screenshot({
      path: info.outputPath('pending-reward.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await memberMissions(member);
    await expect(
      member.getByText(/Aprovação registrada. Recompensa pendente/),
    ).toBeVisible();
    await expect(
      member
        .getByText('AGUARDANDO APROVAÇÃO', { exact: true })
        .locator('..')
        .locator('dd'),
    ).toHaveText('0');
    await fit(member);
    await member.screenshot({
      path: info.outputPath('member-pending-reward.png'),
      fullPage: true,
      animations: 'disabled',
    });
    await area(page, 'Histórico de atividades');
    await expect(
      page.getByRole('heading', { name: 'Decisões de conclusões' }),
    ).toBeVisible();
    await fit(page);
    expect(state.attempts).toHaveLength(2);
    expect(state.progress[0].status).toBe('approved');
    expect(state.progress[0].reward_claimed_at).toBeNull();
    expect(
      state.writes.filter((w) =>
        [
          'apply_guild_mission_reward',
          'submit_guild_mission',
          'review_guild_mission',
          'claim_chest_reward',
          'add_coins',
        ].includes(w),
      ),
    ).toEqual([]);
  } finally {
    await memberContext.close();
  }
});
test('special challenge, membership requests and nonleader access stay scoped', async ({
  page,
  context,
  browser,
}) => {
  const state = store();
  await mock(context, state, 'leader');
  await login(page, 'leader');
  await page.goto('/journey/guild/manage');
  await area(page, 'Desafios especiais');
  await page.getByRole('button', { name: 'Criar desafio especial' }).click();
  for (const [label, value] of [
    ['Título', 'Desafio de teste'],
    ['Descrição', 'Atividade eventual'],
    ['Objetivo', 'Objetivo do teste'],
    ['Instruções para conclusão', 'Registre a atividade'],
    ['Critério de comprovação', 'Texto objetivo'],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(
    page.getByRole('heading', { name: 'Desafio de teste' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar atividade' }).click();
  await expect(page.getByText('Cancelada', { exact: true })).toBeVisible();
  await area(page, 'Pedidos de entrada');
  await page.getByRole('button', { name: 'Aprovar entrada' }).click();
  await expect(page.getByText('Nenhum pedido pendente.')).toBeVisible();
  const other = await browser.newContext({
    ...test.info().project.use,
    baseURL: 'http://127.0.0.1:3183',
  });
  try {
    await mock(other, state, 'member');
    const member = await other.newPage();
    await login(member, 'member');
    await member.goto('/journey/guild/manage');
    await expect(
      member.getByText(/disponível à liderança autorizada/),
    ).toBeVisible();
    await expect(
      member.getByRole('button', { name: 'Criar missão' }),
    ).toHaveCount(0);
    await fit(member);
  } finally {
    await other.close();
  }
});
test('missing migration produces visible error without demo data or economic claims', async ({
  page,
  context,
}) => {
  const state = store();
  await mock(context, state, 'leader', true);
  await login(page, 'leader');
  await page.goto('/journey/guild/manage');
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'atualização autorizada do banco' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Criar missão' })).toHaveCount(
    0,
  );
  await fit(page);
});
