// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { fixtureLesson, fixtureWorkspace } from './fixtures.test-data';
import type { Workspace } from './contracts';
const mocks = vi.hoisted(() => ({ load: vi.fn(), command: vi.fn() }));
vi.mock(
  '../../lib/supabase/repositories/guild-ebd-repository',
  async (original) => ({ ...(await original<object>()), ebdRepository: mocks }),
);
import { EbdConflict } from '../../lib/supabase/repositories/guild-ebd-repository';
import { EbdPanel } from './panel';
const traveler = createTraveler(
  'Lia',
  DEFAULT_APPEARANCE,
  'leader',
  '2026-10-19T12:00:00Z',
);
let workspace: Workspace;
beforeEach(() => {
  vi.clearAllMocks();
  workspace = fixtureWorkspace();
  mocks.load.mockImplementation(async () => structuredClone(workspace));
  mocks.command.mockResolvedValue({ id: 'result', revision: 1 });
});
afterEach(cleanup);
const mount = async () => {
  render(<EbdPanel traveler={traveler} />);
  await screen.findByText('Aprender juntos');
};
const area = (name: string) =>
  fireEvent.click(screen.getByRole('button', { name }));
test('student gets published views, private history and no administration controls', async () => {
  workspace = fixtureWorkspace({
    leader: false,
    teacher: false,
    members: [],
    teachers: [],
    lessons: [
      fixtureLesson({
        status: 'published',
        canEdit: false,
        canPublish: false,
        canAttend: false,
      }),
    ],
  });
  await mount();
  expect(
    screen.queryByRole('button', { name: 'Criar aula' }),
  ).not.toBeInTheDocument();
  area('Presença');
  expect(
    screen.queryByRole('button', { name: 'Registrar presença' }),
  ).not.toBeInTheDocument();
  area('Aulas');
  fireEvent.click(screen.getByRole('button', { name: 'Abrir aula' }));
  expect(
    screen.queryByRole('button', { name: 'Publicar aula' }),
  ).not.toBeInTheDocument();
  expect(screen.getByText(/Conteúdo sintético/)).toBeInTheDocument();
});
test('blank draft save stays unpublished, empty content is allowed until publication', async () => {
  await mount();
  area('Criar aula');
  expect(screen.getByLabelText('Conteúdo livre')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('Título', { exact: true }), {
    target: { value: 'Novo título' },
  });
  fireEvent.change(screen.getByLabelText('Tema', { exact: true }), {
    target: { value: 'Novo tema' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  await waitFor(() => expect(mocks.command).toHaveBeenCalled());
  expect(mocks.command.mock.calls[0].slice(0, 2)).toEqual(['leader', 'lesson']);
  expect(mocks.command.mock.calls[0][4]).toMatchObject({
    title: 'Novo título',
    content: '',
  });
  expect(mocks.command.mock.calls[0][4].publish).toBeUndefined();
});
test('conflict preserves unsaved editor text and never silently resubmits with a new revision', async () => {
  await mount();
  area('Rascunhos');
  fireEvent.click(screen.getByRole('button', { name: 'Editar rascunho' }));
  fireEvent.change(screen.getByLabelText('Conteúdo livre'), {
    target: { value: 'Minha edição não salva' },
  });
  mocks.command.mockRejectedValue(
    new EbdConflict('Conflito: preserve seu texto.'),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Salvar rascunho' }));
  await screen.findByText('Conflito: preserve seu texto.');
  expect(screen.getByLabelText('Conteúdo livre')).toHaveValue(
    'Minha edição não salva',
  );
  expect(mocks.command).toHaveBeenCalledTimes(1);
});
test('teacher without publish permission can edit own returned draft but has no publication or teacher grants', async () => {
  workspace = fixtureWorkspace({
    leader: false,
    lessons: [fixtureLesson({ canPublish: false, canAttend: false })],
  });
  await mount();
  area('Rascunhos');
  fireEvent.click(screen.getByRole('button', { name: 'Abrir aula' }));
  expect(
    screen.getByRole('button', { name: 'Criar atividade' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Publicar aula' }),
  ).not.toBeInTheDocument();
  area('Professores');
  expect(
    screen.queryByRole('button', { name: 'Salvar permissões' }),
  ).not.toBeInTheDocument();
});
test('permission form grants scoped capabilities and attendance needs a server command', async () => {
  workspace.lessons = [fixtureLesson({ status: 'published' })];
  await mount();
  area('Professores');
  fireEvent.click(screen.getByLabelText('Professor autorizado'));
  fireEvent.click(screen.getByLabelText('Pode publicar suas aulas'));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar permissões' }));
  await waitFor(() =>
    expect(mocks.command).toHaveBeenCalledWith(
      'leader',
      'teacher',
      'student',
      0,
      { active: true, publish: true, attend: false },
    ),
  );
  area('Presença');
  const form = screen.getByLabelText('Aluno');
  fireEvent.change(form, { target: { value: 'student' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar presença' }));
  await waitFor(() =>
    expect(mocks.command).toHaveBeenCalledWith(
      'leader',
      'attendance',
      'lesson',
      0,
      { travelerId: 'student', status: 'present', reason: '' },
    ),
  );
});
test('student activity has no answer key and stable submission key after a network failure', async () => {
  workspace = fixtureWorkspace({
    leader: false,
    teacher: false,
    lessons: [
      fixtureLesson({
        status: 'published',
        canEdit: false,
        canPublish: false,
        canAttend: false,
      }),
    ],
    activities: [
      {
        id: 'activity',
        lesson_id: 'lesson',
        title: 'Pergunta sintética',
        kind: 'choice',
        prompt: 'Enunciado sintético',
        options: ['Primeira', 'Segunda'],
        deadline: null,
        attempt_limit: 2,
        criterion: 'correct',
        revision: 1,
      },
    ],
  });
  await mount();
  area('Atividades e questionários');
  expect(screen.queryByText(/Gabarito/)).not.toBeInTheDocument();
  const card = screen.getByRole('article', {
    name: 'Atividade: Pergunta sintética',
  });
  fireEvent.change(within(card).getByLabelText('Sua resposta'), {
    target: { value: '1' },
  });
  mocks.command.mockRejectedValueOnce(new Error('Falha de rede'));
  fireEvent.click(
    within(card).getByRole('button', { name: 'Enviar resposta' }),
  );
  await screen.findByText('Falha de rede');
  fireEvent.click(
    within(card).getByRole('button', { name: 'Enviar resposta' }),
  );
  await waitFor(() => expect(mocks.command).toHaveBeenCalledTimes(2));
  expect(mocks.command.mock.calls[0][2]).toBe(mocks.command.mock.calls[1][2]);
});
test('optional reward remains pending without economic RPC, no Story dependency', async () => {
  workspace.rewards = [
    {
      lesson_id: 'lesson',
      traveler_id: 'leader',
      tier: 'normal',
      criterion: 'correct',
    },
  ];
  await mount();
  area('Histórico de aprendizado');
  expect(screen.getByText(/Recompensa pendente/)).toHaveTextContent(
    'Sem concessão econômica',
  );
  expect(mocks.command).not.toHaveBeenCalled();
  expect(
    screen.getByText(/independente da posição no Modo História/),
  ).toBeInTheDocument();
});
test('missing backend exposes retry and does not invent lessons', async () => {
  mocks.load.mockRejectedValue(new Error('Banco pendente'));
  render(<EbdPanel traveler={traveler} />);
  await screen.findByText(/Banco pendente/);
  expect(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeInTheDocument();
  expect(screen.queryByText('Aula de teste')).not.toBeInTheDocument();
});
