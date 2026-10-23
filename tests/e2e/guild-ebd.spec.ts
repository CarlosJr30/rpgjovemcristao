import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
} from '../../apps/web/features/journey/domain/traveler';
import type {
  Activity,
  ActivityInput,
  Answer,
  Attendance,
  Lesson,
  LessonInput,
  Teacher,
  Workspace,
} from '../../apps/web/features/guild-ebd/contracts';
const leaderId = '10000000-0000-4000-8000-000000000001';
const teacherId = '10000000-0000-4000-8000-000000000002';
const studentId = '10000000-0000-4000-8000-000000000003';
const guildId = '20000000-0000-4000-8000-000000000001';
const date = '2026-10-19T12:00:00Z';
const names = { leader: 'Lia', teacher: 'Rui', student: 'Ana' };
type Role = keyof typeof names;
type Store = {
  lessons: Lesson[];
  activities: Activity[];
  answers: Answer[];
  attendance: Attendance[];
  teachers: Teacher[];
  rewards: Workspace['rewards'];
  writes: string[];
  conflict: boolean;
};
const store = (): Store => ({
  lessons: [],
  activities: [],
  answers: [],
  attendance: [],
  teachers: [],
  rewards: [],
  writes: [],
  conflict: false,
});
async function mock(
  context: BrowserContext,
  state: Store,
  role: Role,
  missing = false,
) {
  const actor =
    role === 'leader' ? leaderId : role === 'teacher' ? teacherId : studentId;
  const name = names[role];
  const userId = actor.replace(/^1/, '0');
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
    type Payload = LessonInput &
      ActivityInput & {
        state: string;
        active: boolean;
        publish: boolean;
        attend: boolean;
        activityId: string;
        response: string;
        choice: number | null;
        status: 'completed' | 'revise';
        feedback: string;
        travelerId: string;
        reason: string;
      };
    const input = (
      req.method() === 'GET' ? {} : (req.postDataJSON() ?? {})
    ) as {
      p_action: string;
      p_id: string;
      p_revision: number;
      p_data: Payload;
    };
    let body: unknown = null;
    if (req.method() !== 'GET')
      state.writes.push(
        endpoint === 'guild_ebd_command' ? `ebd:${input.p_action}` : endpoint,
      );
    const teacher = state.teachers.find(
      (t) => t.traveler_id === actor && t.active,
    );
    const manage = (l: Lesson) =>
      role === 'leader' || (!!teacher && l.teacher_id === actor);
    const members = [
      { id: leaderId, name: 'Lia', leader: true },
      { id: teacherId, name: 'Rui', leader: false },
      { id: studentId, name: 'Ana', leader: false },
    ];
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
        'guild_chat_messages',
        'story_progress',
        'guild_lessons',
        'guild_missions',
        'guild_mission_progress',
        'list_guild_mission_progress',
        'list_guild_join_requests',
      ].includes(endpoint)
    )
      body = [];
    if (endpoint === 'guild_members')
      body = {
        id: randomUUID(),
        guild_id: guildId,
        traveler_id: actor,
        role: role === 'leader' ? 'leader' : 'member',
        status: 'active',
        joined_at: date,
      };
    if (endpoint === 'guilds') body = guild;
    if (endpoint === 'list_guild_members')
      body = members.map((m) => ({
        traveler_id: m.id,
        traveler_name: m.name,
        role: m.leader ? 'leader' : 'member',
        member_status: 'active',
        joined_at: date,
      }));
    if (endpoint === 'guild_chat_summary')
      body = [
        {
          unread_count: 0,
          last_read_sequence: 0,
          can_announce: role === 'leader',
          can_moderate: role === 'leader',
        },
      ];
    if (endpoint === 'guild_ebd_workspace') {
      if (missing) {
        await route.fulfill({
          status: 404,
          json: { message: 'Missing local RPC' },
        });
        return;
      }
      const lessons = state.lessons
        .filter(
          (l) =>
            manage(l) ||
            (['published', 'closed', 'completed'].includes(l.status) &&
              (l.audience === 'all' || l.target_ids.includes(actor))),
        )
        .map((l) => ({
          ...l,
          canEdit: manage(l),
          canPublish:
            role === 'leader' || (manage(l) && !!teacher?.can_publish),
          canAttend: role === 'leader' || (manage(l) && !!teacher?.can_attend),
        }));
      const visible = (id: string) => lessons.some((l) => l.id === id);
      const can = (id: string) => lessons.some((l) => l.id === id && manage(l));
      const activities = state.activities
        .filter((a) => visible(a.lesson_id))
        .map((a) => {
          const safe = { ...a };
          delete safe.answer_key;
          return can(a.lesson_id) ||
            state.answers.some(
              (x) =>
                x.activity_id === a.id &&
                x.traveler_id === actor &&
                x.status === 'completed',
            )
            ? a
            : safe;
        });
      body = {
        version: 1,
        guildId,
        leader: role === 'leader',
        teacher: role === 'leader' || !!teacher,
        total: lessons.length,
        lessons,
        activities,
        answers: state.answers.filter((a) =>
          state.activities.some(
            (x) =>
              x.id === a.activity_id &&
              visible(x.lesson_id) &&
              (can(x.lesson_id) || a.traveler_id === actor),
          ),
        ),
        attendance: state.attendance.filter(
          (a) =>
            visible(a.lesson_id) &&
            (can(a.lesson_id) || a.traveler_id === actor),
        ),
        teachers: role === 'leader' || teacher ? state.teachers : [],
        members: role === 'leader' || teacher ? members : [],
        history: [],
        rewards: state.rewards.filter(
          (r) =>
            visible(r.lesson_id) &&
            (can(r.lesson_id) || r.traveler_id === actor),
        ),
      };
    }
    if (endpoint === 'guild_ebd_command') {
      const d = input.p_data;
      const id = input.p_id;
      if (state.conflict && input.p_action === 'lesson') {
        state.conflict = false;
        await route.fulfill({
          status: 409,
          json: { code: '40001', message: 'EBD conflict' },
        });
        return;
      }
      if (input.p_action === 'teacher') {
        const old = state.teachers.find((t) => t.traveler_id === id);
        const item = {
          traveler_id: id,
          active: d.active,
          can_publish: d.publish,
          can_attend: d.attend,
          revision: (old?.revision ?? 0) + 1,
        };
        if (old) Object.assign(old, item);
        else state.teachers.push(item);
      }
      if (input.p_action === 'lesson') {
        const old = state.lessons.find((l) => l.id === id);
        const lesson: Lesson = {
          id,
          guild_id: guildId,
          created_by_traveler_id: actor,
          teacher_id: d.teacherId,
          title: d.title,
          theme: d.theme,
          introduction: d.description,
          content: d.content,
          bible_reference: d.reference,
          bible_url: null,
          main_points: [],
          discussion_questions: [],
          activity_text: null,
          related_mission_id: null,
          status: 'draft',
          scheduled_at: d.scheduledAt || null,
          published_at: null,
          completed_at: null,
          created_at: date,
          updated_at: date,
          ebd_revision: (old?.ebd_revision ?? 0) + 1,
          audience: d.audience,
          target_ids: d.targetIds,
          materials: d.materials,
          objectives: d.objectives,
          reward_tier: d.rewardTier || null,
          canEdit: true,
          canPublish: true,
          canAttend: true,
        };
        if (old) Object.assign(old, lesson);
        else state.lessons.push(lesson);
      }
      if (input.p_action === 'state') {
        const l = state.lessons.find((l) => l.id === id)!;
        l.status = d.state;
        l.ebd_revision++;
      }
      if (input.p_action === 'activity') {
        const old = state.activities.find((a) => a.id === id);
        const item: Activity = {
          id,
          lesson_id: d.lessonId,
          title: d.title,
          kind: d.kind,
          prompt: d.prompt,
          options: d.options,
          answer_key: d.answerKey,
          deadline: d.deadline || null,
          attempt_limit: d.attemptLimit,
          criterion: d.criterion,
          revision: (old?.revision ?? 0) + 1,
        };
        if (old) Object.assign(old, item);
        else state.activities.push(item);
      }
      if (
        input.p_action === 'submit' &&
        !state.answers.some((a) => a.id === id)
      ) {
        const a = state.activities.find((a) => a.id === d.activityId)!;
        state.answers.push({
          id,
          activity_id: a.id,
          traveler_id: actor,
          traveler_name: name,
          attempt: input.p_revision + 1,
          response: d.response,
          choice: d.choice,
          status: a.kind === 'choice' ? 'completed' : 'pending',
          feedback: '',
          revision: 1,
          submitted_at: date,
          evaluated_at: a.kind === 'choice' ? date : null,
        });
      }
      if (input.p_action === 'grade') {
        const a = state.answers.find((a) => a.id === id)!;
        a.status = d.status;
        a.feedback = d.feedback;
        a.revision++;
        a.evaluated_at = date;
      }
      if (['submit', 'grade'].includes(input.p_action)) {
        const answer = state.answers.find((a) => a.id === id)!;
        const activity = state.activities.find(
          (a) => a.id === answer.activity_id,
        )!;
        const lesson = state.lessons.find((l) => l.id === activity.lesson_id)!;
        if (
          answer.status === 'completed' &&
          lesson.reward_tier &&
          !state.rewards.some(
            (r) =>
              r.lesson_id === lesson.id && r.traveler_id === answer.traveler_id,
          )
        )
          state.rewards.push({
            lesson_id: lesson.id,
            traveler_id: answer.traveler_id,
            tier: lesson.reward_tier,
            criterion: activity.criterion,
          });
      }
      if (input.p_action === 'attendance') {
        const old = state.attendance.find(
          (a) => a.lesson_id === id && a.traveler_id === d.travelerId,
        );
        const item: Attendance = {
          lesson_id: id,
          traveler_id: d.travelerId,
          status: d.status as unknown as 'present' | 'absent',
          reason: d.reason,
          revision: (old?.revision ?? 0) + 1,
          marked_by: actor,
          updated_at: date,
        };
        if (old) Object.assign(old, item);
        else state.attendance.push(item);
      }
      body = { id, revision: 1 };
    }
    await route.fulfill({ json: body });
  });
}
async function login(page: Page, role: Role) {
  await page.goto('/auth');
  await page.getByLabel('E-mail').fill(`${role}@fixture.invalid`);
  await page.getByLabel('Senha').fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: `Bem-vindo à jornada, ${names[role]}.` }),
  ).toBeVisible();
}
async function open(page: Page) {
  await page.goto('/journey/guild/ebd');
  await expect(
    page.getByRole('heading', { name: 'Aprender juntos' }),
  ).toBeVisible();
}
async function area(page: Page, label: string) {
  await expect(
    page.getByRole('heading', { name: 'Escola Bíblica', exact: true }),
  ).toBeVisible();
  const select = page.getByLabel('Área da Escola Bíblica');
  await expect(select).toBeAttached();
  if (await select.isVisible()) await select.selectOption({ label });
  else await page.getByRole('button', { name: label, exact: true }).click();
}
async function fit(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test('leader authorizes teacher, teacher drafts/publishes, student submits, teacher evaluates and records attendance', async ({
  page,
  context,
  browser,
}, info) => {
  const state = store();
  await mock(context, state, 'leader');
  await login(page, 'leader');
  await page.goto('/journey/guild');
  await page.getByRole('link', { name: 'Escola Bíblica', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Aprender juntos' }),
  ).toBeVisible();
  await area(page, 'Professores');
  const permission = page.getByRole('form', { name: 'Permissões de Rui' });
  await permission.getByLabel('Professor autorizado').check();
  await permission.getByLabel('Pode publicar suas aulas').check();
  await permission.getByLabel('Pode registrar presença em suas aulas').check();
  await permission.getByRole('button', { name: 'Salvar permissões' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Permissões atualizadas.' }),
  ).toBeVisible();
  const tc = await browser.newContext({ ...info.project.use });
  const sc = await browser.newContext({ ...info.project.use });
  await mock(tc, state, 'teacher');
  await mock(sc, state, 'student');
  const teacher = await tc.newPage();
  const student = await sc.newPage();
  await login(teacher, 'teacher');
  await login(student, 'student');
  await open(teacher);
  await open(student);
  await area(teacher, 'Criar aula');
  await expect(teacher.getByLabel('Conteúdo livre')).toHaveValue('');
  await teacher
    .getByLabel('Título', { exact: true })
    .fill('Aula sintética EBD');
  await teacher.getByLabel('Tema', { exact: true }).fill('Tema livre de teste');
  await teacher
    .getByLabel('Conteúdo livre')
    .fill('Conteúdo sintético do professor, somente neste teste.');
  await teacher.getByLabel('Data e horário').fill('2026-12-20T12:00');
  await teacher.getByLabel('Recompensa opcional').selectOption('normal');
  await fit(teacher);
  await teacher.screenshot({
    path: `build/task-0083-ebd/${info.project.name}-editor.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await teacher.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(
    teacher.getByRole('heading', { name: 'Rascunhos', exact: true }),
  ).toBeVisible();
  await student.reload();
  await expect(
    student.getByRole('heading', { name: 'Aprender juntos' }),
  ).toBeVisible();
  await expect(
    student.getByText('Aula sintética EBD', { exact: true }),
  ).toHaveCount(0);
  await expect(
    student.getByRole('button', { name: 'Criar aula', exact: true }),
  ).toHaveCount(0);
  await teacher.getByRole('button', { name: 'Abrir aula' }).click();
  await teacher.getByRole('button', { name: 'Criar atividade' }).click();
  await teacher
    .getByLabel('Título da atividade')
    .fill('Registro reflexivo de teste');
  await teacher
    .getByLabel('Enunciado')
    .fill('Registre a resposta sintética deste teste.');
  await teacher.getByRole('button', { name: 'Salvar atividade' }).click();
  await expect(
    teacher
      .getByRole('status')
      .filter({ hasText: 'Atividade salva no rascunho.' }),
  ).toBeVisible();
  await teacher.getByRole('button', { name: 'Criar atividade' }).click();
  await teacher
    .getByLabel('Título da atividade')
    .fill('Questão objetiva de teste');
  await teacher.getByLabel('Tipo de atividade').selectOption('choice');
  await teacher
    .getByLabel('Enunciado')
    .fill('Selecione a segunda opção sintética.');
  await teacher
    .getByLabel('Opção 1', { exact: true })
    .fill('Primeira opção de teste');
  await teacher
    .getByLabel('Opção 2', { exact: true })
    .fill('Segunda opção de teste');
  await teacher
    .getByLabel('Resposta correta', { exact: true })
    .selectOption('1');
  await teacher.getByRole('button', { name: 'Salvar atividade' }).click();
  await expect(
    teacher.getByRole('form', { name: 'Editor de atividade' }),
  ).toHaveCount(0);
  await teacher.getByRole('button', { name: 'Publicar aula' }).click();
  await expect(
    teacher.getByRole('status').filter({ hasText: 'Aula: Publicada.' }),
  ).toBeVisible();
  await student.reload();
  await student.getByRole('button', { name: 'Abrir aula' }).click();
  const reflective = student.getByRole('article', {
    name: 'Atividade: Registro reflexivo de teste',
  });
  const objective = student.getByRole('article', {
    name: 'Atividade: Questão objetiva de teste',
  });
  await expect(student.getByText(/Gabarito/)).toHaveCount(0);
  await reflective
    .getByLabel('Sua resposta')
    .fill('Resposta sintética exclusiva deste teste.');
  await reflective.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(
    student.getByText('Aguardando avaliação', { exact: true }),
  ).toBeVisible();
  await expect(student.getByText(/Gabarito/)).toHaveCount(0);
  await objective.getByLabel('Sua resposta').selectOption('1');
  await objective.getByRole('button', { name: 'Enviar resposta' }).click();
  await expect(
    objective.getByText(/Gabarito após avaliação concluída/),
  ).toBeVisible();
  await teacher.reload();
  await area(teacher, 'Atividades e questionários');
  await teacher
    .getByLabel('Feedback do professor')
    .fill('Feedback sintético do professor.');
  await teacher.getByRole('button', { name: 'Registrar avaliação' }).click();
  await expect(
    teacher.getByRole('status').filter({ hasText: 'Avaliação registrada.' }),
  ).toBeVisible();
  await area(teacher, 'Presença');
  await teacher.getByLabel('Aluno', { exact: true }).selectOption(studentId);
  await teacher.getByRole('button', { name: 'Registrar presença' }).click();
  await expect(
    teacher
      .getByRole('status')
      .filter({ hasText: 'Presença registrada com histórico.' }),
  ).toBeVisible();
  await fit(teacher);
  await teacher.screenshot({
    path: `build/task-0083-ebd/${info.project.name}-attendance.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await student.reload();
  await area(student, 'Histórico de aprendizado');
  await expect(
    student.getByText(/Feedback sintético do professor/),
  ).toBeVisible();
  await expect(student.getByText(/Recompensa pendente/)).toBeVisible();
  await area(student, 'Presença');
  await expect(student.getByText(/Seu registro: Presente/)).toBeVisible();
  await expect(
    student.getByRole('button', { name: 'Registrar presença' }),
  ).toHaveCount(0);
  await fit(student);
  await student.screenshot({
    path: `build/task-0083-ebd/${info.project.name}-student.png`,
    fullPage: true,
    animations: 'disabled',
  });
  expect(
    state.writes.every(
      (w) =>
        ![
          'apply_guild_mission_reward',
          'complete_story',
          'add_coins',
          'grant_traveler_chest',
        ].includes(w),
    ),
  ).toBe(true);
  expect(state.rewards).toHaveLength(1);
  await tc.close();
  await sc.close();
});
test('conflict retains text, unsafe link is rejected, and missing backend does not create demo lessons', async ({
  page,
  context,
}, info) => {
  const state = store();
  await mock(context, state, 'leader');
  await login(page, 'leader');
  await open(page);
  await area(page, 'Criar aula');
  await page.getByLabel('Título', { exact: true }).fill('Teste de conflito');
  await page.getByLabel('Tema', { exact: true }).fill('Tema sintético');
  await page
    .getByLabel('Conteúdo livre')
    .fill('Texto preservado após conflito.');
  await page.getByRole('button', { name: 'Adicionar material' }).click();
  await page.getByLabel('Nome do material').fill('Link inválido de teste');
  await page.getByLabel('URL HTTPS').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Revise os materiais' }),
  ).toBeVisible();
  expect(state.lessons).toHaveLength(0);
  await page.getByRole('button', { name: 'Remover material 1' }).click();
  state.conflict = true;
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Outra atualização foi salva' }),
  ).toBeVisible();
  await expect(page.getByLabel('Conteúdo livre')).toHaveValue(
    'Texto preservado após conflito.',
  );
  await fit(page);
  await page.screenshot({
    path: `build/task-0083-ebd/${info.project.name}-conflict.png`,
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Descartar edição' }).click();
  await context.unroute('**/rest/v1/**');
  await mock(context, state, 'leader', true);
  await page.reload();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Escola Bíblica indisponível' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeVisible();
  expect(state.lessons).toHaveLength(0);
});
