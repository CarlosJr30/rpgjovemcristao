// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('./common-invites', () => ({
  CommonInvites: () => <div>Convites autorizados</div>,
}));
const mock = vi.hoisted(() => ({
  load: vi.fn(),
  command: vi.fn(),
  members: vi.fn(),
}));
vi.mock('../../lib/ebd-classes/client', () => ({
  classesRepository: { load: mock.load, command: mock.command },
  ClassCommandRejected: class extends Error {},
}));
vi.mock('../../lib/supabase/repositories/guild-repository', () => ({
  guildRepository: { listMembersScoped: mock.members },
}));
import { EbdClasses } from './classes';
const g = '00000000-0000-4000-8000-000000000001',
  c = '00000000-0000-4000-8000-000000000002';
const workspace = (selected: string | null = null, leader = true) => ({
  version: 1,
  guildId: g,
  classId: selected,
  leader,
  classes: [
    {
      id: c,
      name: 'Classe existente',
      description: 'Descrição',
      status: 'active',
      revision: 3,
      role: leader ? 'leader' : 'student',
    },
  ],
  members: [],
  teachers: [],
  history: [],
});
beforeEach(() => {
  vi.resetAllMocks();
  mock.load.mockImplementation((_a, _g, s) => Promise.resolve(workspace(s)));
  mock.members.mockResolvedValue([]);
  mock.command.mockResolvedValue({ id: c, revision: 4, replayed: false });
});
afterEach(cleanup);
test('classes require explicit selection and no automatic enrollment', async () => {
  render(<EbdClasses actor="actor" guildId={g} />);
  await screen.findByRole('option', { name: /Classe existente/ });
  expect(screen.getByRole('combobox', { name: 'Classe ativa' })).toHaveValue(
    '',
  );
  expect(mock.command).not.toHaveBeenCalled();
});
test('creating while another class is selected never edits that existing class', async () => {
  render(<EbdClasses actor="actor" guildId={g} />);
  await screen.findByRole('option', { name: /Classe existente/ });
  fireEvent.change(screen.getByRole('combobox', { name: 'Classe ativa' }), {
    target: { value: c },
  });
  await screen.findByRole('button', { name: 'Editar classe' });
  fireEvent.click(screen.getByRole('button', { name: 'Criar classe' }));
  fireEvent.change(screen.getByLabelText('Nome da classe'), {
    target: { value: 'Nova classe' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar classe' }));
  await waitFor(() => expect(mock.command).toHaveBeenCalledOnce());
  expect(mock.command.mock.calls[0][2]).not.toBe(c);
  expect(mock.command.mock.calls[0][4]).toBe(0);
});
test('old Guild response after replacement cannot reveal the previous class', async () => {
  let resolve!: (v: unknown) => void;
  mock.load
    .mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    )
    .mockResolvedValue({ ...workspace(), classes: [] });
  const view = render(<EbdClasses actor="actor" guildId={g} />);
  view.rerender(<EbdClasses key="next" actor="actor" guildId={c} />);
  await screen.findByText('Nenhuma classe disponível nesta Guilda.');
  await act(async () => resolve(workspace()));
  expect(screen.queryByRole('option', { name: /Classe existente/ })).toBeNull();
});
test('student cannot access naming teachers or creating classes', async () => {
  mock.load.mockResolvedValue(workspace(null, false));
  render(<EbdClasses actor="actor" guildId={g} />);
  await screen.findByRole('option', { name: /Classe existente/ });
  expect(screen.queryByRole('button', { name: 'Criar classe' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Nomear professor' })).toBeNull();
  expect(mock.members).not.toHaveBeenCalled();
});
