// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import { CREATION_MANIFEST } from './creation-manifest';
import { preparePendingQuiz } from './creation-pending-quiz';
import { CreationAttemptLimitReached } from '../../lib/supabase/repositories/creation-checkpoint-repository';

import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import {
  CheckpointExplorer,
  CreationExplorerScreen,
  CreationExplorerView,
} from './creation-explorer';

const creationScreenMocks = vi.hoisted(() => ({
  snapshot: null as unknown,
  rpc: vi.fn(),
}));

vi.mock('../release-ebd/archive', () => ({
  ArchiveAccess: ({ children }: { children: (snapshot: unknown) => React.ReactNode }) =>
    children(creationScreenMocks.snapshot),
}));

vi.mock('../../lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ rpc: creationScreenMocks.rpc }),
}));

vi.mock('./use-story-progress', () => ({
  useStoryProgress: () => ({ records: [] }),
}));

vi.mock('./creation-day-one', () => ({
  default: ({ onUnavailable }: { onUnavailable: () => void }) => (
    <button type="button" data-testid="creation-3d-day-1" onClick={onUnavailable}>
      Simulate Day 1 renderer failure
    </button>
  ),
}));

vi.mock('./creation-days-3d', () => ({
  default: ({
    dayNumber,
    onUnavailable,
  }: {
    dayNumber: number;
    onUnavailable: () => void;
  }) => (
    <div data-testid={`creation-3d-day-${dayNumber}`}>
      <button type="button" onClick={onUnavailable}>
        Simulate Day {dayNumber} renderer failure
      </button>
    </div>
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const traveler = createTraveler(
  'Viajante Teste',
  DEFAULT_APPEARANCE,
  'traveler-test',
  '2026-01-01',
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  creationScreenMocks.snapshot = null;
});

test('opens day one directly in the local demonstration without claiming official progress', () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  render(<CreationExplorerView traveler={traveler} />);
  expect(screen.getByRole('heading', { level: 1, name: /^Dia 1/ })).toBeInTheDocument();
  expect(screen.getByText(/sempre come\u00e7a no Dia 1/)).toBeInTheDocument();
  const alternative = screen.getByRole('list', { name: 'Navegação acessível' });
  fireEvent.click(
    within(alternative).getByRole('button', { name: 'Marco da luz' }),
  );
  expect(screen.getByTestId('traveler-position')).toHaveStyle({ left: '22%' });
  fireEvent.click(screen.getByLabelText('O painel de recompensas.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getAllByText(/Tente novamente/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByLabelText('O portal do Santuário.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getByText(/Resposta correta.*portal do Santuário/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Voltar à Jornada/ })).toHaveAttribute('href', '/journey');
  expect(screen.queryByText('Santuário da Jornada')).not.toBeInTheDocument();
  expect(storageWrite).not.toHaveBeenCalled();
});

test('moves with desktop keyboard controls and exposes the real traveler avatar', () => {
  render(<CreationExplorerView traveler={traveler} />);
  const avatar = screen.getByTestId('traveler-position');
  const map = screen.getByRole('group', { name: 'Exploração do Dia 1' });
  fireEvent.keyDown(map, { key: 'ArrowRight' });
  expect(avatar).toHaveStyle({ left: '27%' });
  fireEvent.keyDown(map, { key: 'ArrowUp' });
  expect(avatar).toHaveStyle({ top: '47%' });
});

test('requires each day’s educational interaction and correct answer before advancing through all seven days', () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  const view = render(
    <CreationExplorerView traveler={traveler} />,
  );
  const list = within(
    screen.getByRole('list', { name: 'Navegação acessível' }),
  );
  const choose = (name: string) =>
    fireEvent.click(list.getByRole('button', { name }));
  const submit = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));

  expect(
    screen.queryByRole('button', { name: 'Abrir Harmonia da Criação' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Abrir Harmonia da Criação' }),
  ).not.toBeInTheDocument();
  const itinerary = [
    { markers: ['Marco da luz'], correct: 'O portal do Santuário.' },
    {
      markers: ['Marco do céu'],
      correct: 'Visitando os marcos da cena.',
    },
    {
      markers: ['Terra', 'Mares', 'Vegetação'],
      correct: /A descoberta continua registrada uma vez/,
    },
    { markers: ['Marco dos luminares'], correct: /Na navegação acessível/ },
    { markers: ['Marco da vida'], correct: 'Usando a saída da cena.' },
    { markers: ['Marco da humanidade'], correct: /A demonstração reinicia/ },
    {
      markers: ['Marco do descanso'],
      correct: /Concluir as atividades dos sete dias/,
    },
  ];
  itinerary.forEach(({ markers, correct }, index) => {
    expect(
      screen.getByRole('heading', { level: 1, name: new RegExp(`^Dia ${index + 1} —`) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ler Gênesis.*NVI/ }),
    ).toBeInTheDocument();
    for (const [markerIndex, marker] of markers.entries()) {
      expect(
        screen.queryByRole('form', { name: 'Desafio demonstrativo' }),
      ).not.toBeInTheDocument();
      choose(marker);
      if (index === 2) {
        const remaining = markers.length - markerIndex - 1;
        if (remaining)
          expect(
            screen.getByText(new RegExp(`Faltam ${remaining} de 3 marcos\\.`)),
          ).toBeInTheDocument();
        else
          expect(
            screen.getByText(/Desafio do Dia 3 disponível/),
          ).toBeInTheDocument();
        if (markerIndex === 0) {
          fireEvent.click(
            list.getByRole('button', { name: `${marker} · Visitado` }),
          );
          expect(
            screen.getByText(/Faltam 2 de 3 marcos\./),
          ).toBeInTheDocument();
          expect(list.getByRole('button', { name: 'Terra · Visitado' })).toBeInTheDocument();
        }
      }
    }
    if (index === 2)
      expect(
        within(
          screen.getByRole('list', { name: 'Notas dos marcos visitados' }),
        ).getAllByRole('listitem'),
      ).toHaveLength(3);
    const answer = screen.getByRole('radio', { name: correct });
    const wrong = screen
      .getAllByRole('radio')
      .find((radio) => radio !== answer)!;
    const advance =
      index < 6
        ? `Prosseguir para o Dia ${index + 2}`
        : 'Abrir Harmonia da Criação';
    fireEvent.click(wrong);
    submit();
    expect(screen.getByText(/Tente novamente/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: advance }),
    ).not.toBeInTheDocument();
    fireEvent.click(answer);
    submit();
    expect(
      screen.getByText(/Resposta correta/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: advance }));
  });
  expect(
    screen.getByRole('heading', { name: 'Harmonia da Criação' }),
  ).toHaveFocus();
  expect(
    within(
      screen.getByRole('list', { name: 'Símbolos embaralhados' }),
    ).getAllByRole('button'),
  ).toHaveLength(7);
  const click = (name: string) =>
    fireEvent.click(screen.getByRole('button', { name }));
  const bank = within(
    screen.getByRole('list', { name: 'Símbolos embaralhados' }),
  );
  const symbols = [
    'Luz e trevas',
    'Firmamento',
    'Terra, mares e vegetação',
    'Luminares',
    'Aves e criaturas das águas',
    'Animais terrestres e humanidade',
    'Descanso do sétimo dia',
  ];
  expect(
    screen.queryByRole('button', { name: 'Abrir Quiz da Criação' }),
  ).not.toBeInTheDocument();
  fireEvent.click(bank.getByRole('button', { name: symbols[0] }));
  click('Abrir Diário Bíblico');
  const chapter = within(
    screen.getByRole('region', { name: 'Diário Bíblico da Criação' }),
  );
  expect(chapter.getAllByText('Descoberto nesta demonstração')).toHaveLength(7);
  expect(chapter.getAllByRole('link', { name: /Ler Gênesis/ })).toHaveLength(7);
  click('Voltar ao Dia 7');
  expect(
    bank.getByRole('button', { name: /Luz e trevas, posicionado/ }),
  ).toHaveAttribute('aria-disabled', 'true');
  symbols
    .slice(1)
    .forEach((name) => fireEvent.click(bank.getByRole('button', { name })));
  click('Verificar sequência');
  click('Abrir Quiz da Criação');

  const expectedAnswers = [
    'No Santuário.',
    'O estado Visitado.',
    'Para consultar referências e resumos.',
    'Os sete símbolos dos dias.',
    'Nenhum progresso oficial.',
  ];
  function respond(answer: string | RegExp, index: number) {
    expect(
      screen.getByRole('heading', {
        name: new RegExp(`Pergunta ${index + 1} de 5`),
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Confirmar resposta' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: answer }));
    click('Confirmar resposta');
  }
  respond('No vídeo.', 0);
  click('Abrir Diário Bíblico');
  click('Voltar ao Dia 7');
  expectedAnswers.slice(1).forEach((answer, i) => respond(answer, i + 1));
  expect(screen.getByRole('status')).toHaveTextContent(
    'Você concluiu o Quiz da Criação! 4 de 5 acertos.',
  );
  expect(screen.getByText(/7 de 7 dias/)).toBeInTheDocument();
  expect(screen.getByText(/vídeo obrigatório ainda falta/)).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: /Gênesis.*NVI/ })).toHaveLength(7);
  expect(
    within(
      screen.getByRole('list', { name: 'Resumo dos sete dias da Criação' }),
    ).getAllByRole('listitem'),
  ).toHaveLength(7);
  click('Abrir Diário Bíblico');
  click('Voltar ao Dia 7');
  expect(screen.getByRole('status')).toHaveTextContent('4 de 5 acertos');
  click('Repetir quiz');
  expectedAnswers.forEach(respond);
  expect(screen.getByRole('status')).toHaveTextContent('5 de 5 acertos');
  expect(
    screen.getByText(/Recompensa futura prevista.*60 XP.*Baú Raro/),
  ).toBeInTheDocument();
  click('Abrir etapa do vídeo obrigatório');
  expect(
    screen.getByRole('heading', { name: 'Vídeo educativo' }),
  ).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent('Vídeo pendente');
  expect(view.container.querySelector('video, iframe')).toBeNull();
  click('Abrir Diário Bíblico');
  click('Voltar ao Dia 7');
  expect(screen.getByRole('status')).toHaveTextContent('Vídeo pendente');
  click('Ver estado da conclusão');
  expect(
    screen.getByRole('heading', { name: 'Encerramento da Criação' }),
  ).toHaveFocus();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Conclusão oficial bloqueada',
  );
  expect(screen.getByText('Quiz: 5 de 5 acertos.')).toBeInTheDocument();
  expect(
    within(
      screen.getByRole('table', { name: 'Planejamento de recompensas' }),
    ).getByText('500 XP + 200 moedas + 4 baús'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Recebidas nesta demonstração/).closest('p'),
  ).toHaveTextContent('nenhuma');
  expect(
    screen.getByRole('link', { name: 'Voltar ao mapa de mundos' }),
  ).toHaveAttribute('href', '/journey/worlds');
  expect(
    screen.queryByRole('link', { name: /Jardim do Éden/i }),
  ).not.toBeInTheDocument();
  click('Abrir Diário Bíblico');
  click('Voltar ao Dia 7');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Conclusão oficial bloqueada',
  );
  expect(storageWrite).not.toHaveBeenCalled();
  view.unmount();
  render(<CreationExplorerView traveler={traveler} />);
  expect(screen.getByRole('heading', { level: 1, name: /^Dia 1/ })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Abrir Harmonia da Criação' }),
  ).not.toBeInTheDocument();
}, 15_000);

const accessibleMap = () =>
  within(screen.getByRole('list', { name: /Navega.*acess.vel/ }));

const manifest = createHash('sha256').update(CREATION_MANIFEST).digest('hex');

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('TextEncoder', TextEncoder);
});
afterEach(() => vi.unstubAllGlobals());

const remoteSnapshot = {
  manifestText: CREATION_MANIFEST,
  manifestHash: manifest,
  version: 1 as const,
  storyId: 'creation' as const,
  revision: 1,
  available: true,
  completedDays: [1, 2, 3],
  harmonyCompleted: false,
  quizAttempts: 0,
  bestQuizScore: null,
  videoCompleted: false,
};
const archive = { traveler, inventory: [], persistedProgress: false };

test('keeps the production demo local and never calls checkpoint RPCs when the flag is off', () => {
  vi.stubEnv('NEXT_PUBLIC_CREATION_CHECKPOINTS', 'false');
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_URL',
    'https://wkdvdzfkbwvhyjmamrsg.supabase.co',
  );
  creationScreenMocks.snapshot = archive;
  render(<CreationExplorerScreen />);
  expect(screen.getByRole('heading', { level: 1, name: /^Dia 1/ })).toBeInTheDocument();
  expect(creationScreenMocks.rpc).not.toHaveBeenCalled();
});

test.each([
  { failedDay: 1, marker: 'Marco da luz' },
  { failedDay: 2, marker: 'Marco do céu' },
])('falls back on Day $failedDay and mounts the next day in 3D', async ({ failedDay, marker }) => {
  vi.stubGlobal('WebGL2RenderingContext', class WebGL2RenderingContext {});
  const repo = makeRepository();
  const before = { ...remoteSnapshot, completedDays: failedDay === 1 ? [] : [1] };
  const after = { ...before, completedDays: [...before.completedDays, failedDay] };
  repo.read
    .mockResolvedValueOnce(before)
    .mockResolvedValueOnce(after);
  repo.submitDay.mockResolvedValue({ completed: true });

  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: before, repository: repo }}
    />,
  );

  expect(await screen.findByTestId(`creation-3d-day-${failedDay}`)).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: `Simulate Day ${failedDay} renderer failure` }),
  );
  expect(
    screen.getByRole('group', { name: `Exploração do Dia ${failedDay}` }),
  ).toBeInTheDocument();
  fireEvent.click(
    accessibleMap().getByRole('button', { name: marker }),
  );
  fireEvent.click(screen.getAllByRole('radio')[0]!);
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  fireEvent.click(
    await screen.findByRole('button', { name: `Prosseguir para o Dia ${failedDay + 1}` }),
  );

  expect(await screen.findByTestId(`creation-3d-day-${failedDay + 1}`)).toBeInTheDocument();
});

const makeRepository = () => ({
  read: vi.fn(),
  submitDay: vi.fn(),
  submitHarmony: vi.fn(),
  submitQuiz: vi.fn(),
});

test('resumes at the first pending day and ignores an old traveler response', async () => {
  const repo = makeRepository();
  let resolveOld!: (result: typeof remoteSnapshot) => void;
  repo.read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveOld = resolve;
      }),
  );
  repo.read.mockResolvedValueOnce(remoteSnapshot);
  const view = render(
    <CheckpointExplorer
      accountId="owner"
      snapshot={archive}
      repository={repo}
    />,
  );
  const other = { ...archive, traveler: { ...traveler, id: 'other-traveler' } };
  view.rerender(
    <CheckpointExplorer accountId="owner" snapshot={other} repository={repo} />,
  );
  await screen.findByText(/Dias confirmados pelo servidor: 3/);
  await act(async () => resolveOld({ ...remoteSnapshot, completedDays: [] }));
  expect(screen.getByRole('heading', { level: 1, name: /^Dia 4/ })).toBeInTheDocument();
  expect(repo.read).toHaveBeenLastCalledWith('other-traveler');
});

test.each(['network unavailable', 'invalid session'])(
  'offers retry for %s without showing a saved state',
  async (error) => {
    const repo = makeRepository();
    repo.read
      .mockRejectedValueOnce(new Error(error))
      .mockResolvedValueOnce(remoteSnapshot);
    render(
      <CheckpointExplorer
        accountId="owner"
        snapshot={archive}
        repository={repo}
      />,
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /conex.o e sess.o/,
    );
    expect(screen.queryByText(/Dias confirmados/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(
      await screen.findByText(/Dias confirmados pelo servidor: 3/),
    ).toBeInTheDocument();
  },
);

test('keeps the demo playable with the server publication gate closed', async () => {
  const repo = makeRepository();
  repo.read.mockResolvedValue({ ...remoteSnapshot, available: false });
  render(
    <CheckpointExplorer
      accountId="owner"
      snapshot={archive}
      repository={repo}
    />,
  );
  expect(await screen.findByRole('heading', { level: 1, name: /^Dia 1/ })).toBeInTheDocument();
  expect(repo.submitDay).not.toHaveBeenCalled();
});

test('resends the same daily answer after a lost response and waits for a confirmed snapshot', async () => {
  const repo = makeRepository();
  const first = { ...remoteSnapshot, completedDays: [] };
  repo.submitDay
    .mockRejectedValueOnce(new Error('connection lost'))
    .mockResolvedValueOnce({ completed: true });
  repo.read.mockResolvedValue({ ...first, completedDays: [1] });
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: first, repository: repo }}
    />,
  );
  fireEvent.click(
    accessibleMap().getByRole('button', { name: 'Marco da luz' }),
  );
  fireEvent.click(screen.getByLabelText('O portal do Santuário.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(await screen.findByText(/Não foi possível confirmar o checkpoint/)).toBeInTheDocument();
  expect(screen.getByLabelText('O painel de recompensas.')).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: /Prosseguir/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(
    await screen.findByRole('button', { name: /Prosseguir para o Dia 2/ }),
  ).toBeInTheDocument();
  expect(repo.submitDay).toHaveBeenCalledTimes(2);
  expect(repo.submitDay.mock.calls[1]).toEqual([traveler.id, 1, 1, 1]);
  expect(repo.submitDay.mock.calls[1]).toEqual(repo.submitDay.mock.calls[0]);
});

test('shows incorrect server results and locks the official evaluation without advancing', async () => {
  const repo = makeRepository();
  const first = { ...remoteSnapshot, completedDays: [] };
  repo.read.mockResolvedValue(first);
  repo.submitDay.mockResolvedValue({ completed: false });
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: first, repository: repo }}
    />,
  );
  await screen.findByText(/Dias confirmados pelo servidor: 0 de 7/);
  fireEvent.click(accessibleMap().getByRole('button', { name: 'Marco da luz' }));
  fireEvent.click(screen.getAllByRole('radio')[0]!);
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));

  expect(await screen.findByText(/resposta foi incorreta/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Conferir resposta' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: /Prosseguir para o Dia 2/ })).not.toBeInTheDocument();
});

test('reconciles a duplicate attempt against the server checkpoint before showing a lock', async () => {
  const repo = makeRepository();
  const first = { ...remoteSnapshot, completedDays: [] };
  repo.read.mockResolvedValueOnce(first).mockResolvedValueOnce({ ...first, completedDays: [1] });
  repo.submitDay.mockRejectedValue(new CreationAttemptLimitReached());
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: first, repository: repo }}
    />,
  );
  await screen.findByText(/Dias confirmados pelo servidor: 0 de 7/);
  fireEvent.click(accessibleMap().getByRole('button', { name: 'Marco da luz' }));
  fireEvent.click(screen.getAllByRole('radio')[0]!);
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));

  expect(await screen.findByRole('button', { name: /Prosseguir para o Dia 2/ })).toBeInTheDocument();
  expect(screen.getByText('Resposta correta.')).toBeInTheDocument();
});

test('renders a server-side attempt lock clearly and keeps only review available', async () => {
  const repo = makeRepository();
  const first = { ...remoteSnapshot, completedDays: [] };
  repo.read.mockResolvedValue(first);
  repo.submitDay.mockRejectedValue(new CreationAttemptLimitReached());
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: first, repository: repo }}
    />,
  );
  await screen.findByText(/Dias confirmados pelo servidor: 0 de 7/);
  fireEvent.click(accessibleMap().getByRole('button', { name: 'Marco da luz' }));
  fireEvent.click(screen.getAllByRole('radio')[1]!);
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));

  expect(await screen.findByText(/aguarde uma nova revisão autorizada/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Conferir resposta' })).toBeDisabled();
  expect(screen.getByRole('link', { name: /Ler Gênesis/ })).toBeInTheDocument();
});

test('restores completed-day progression from the checkpoint after reload', async () => {
  const repo = makeRepository();
  repo.read.mockResolvedValue({ ...remoteSnapshot, completedDays: [1] });
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: { ...remoteSnapshot, completedDays: [1] }, repository: repo }}
    />,
  );

  expect(await screen.findByRole('heading', { level: 1, name: /^Dia 2/ })).toBeInTheDocument();
  expect(screen.getByText(/Dias confirmados pelo servidor: 1 de 7/)).toBeInTheDocument();
});

test('retries a failed quiz submission with the same operation ID and keeps partial scores private', async () => {
  const repo = makeRepository();
  const initial = {
    ...remoteSnapshot,
    completedDays: [1, 2, 3, 4, 5, 6, 7],
    harmonyCompleted: true,
  };
  repo.submitQuiz
    .mockImplementationOnce(async () => {
      repo.read.mockResolvedValue({
        ...initial,
        quizAttempts: 1,
        bestQuizScore: null,
      });
      throw new Error('connection lost');
    })
    .mockImplementationOnce(
      async (_traveler, revision, attemptId) => ({
        score: null,
        revision,
        attemptId,
      }),
    );
  repo.read.mockResolvedValue(initial);
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial, repository: repo }}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /Abrir Harmonia/ }));
  fireEvent.click(await screen.findByRole('button', { name: /Abrir Quiz/ }));
  for (let index = 0; index < 5; index++) {
    const question = await screen.findByRole('group', {
      name: new RegExp('Pergunta ' + (index + 1) + ' de 5'),
    });
    fireEvent.click(within(question).getAllByRole('radio')[0]);
    fireEvent.click(
      within(question).getByRole('button', { name: 'Confirmar resposta' }),
    );
  }
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /confirmar a tentativa/,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Reenviar tentativa' }));
  expect(await screen.findByText(/pontuação parcial fica reservada/)).toBeInTheDocument();
  expect(repo.submitQuiz).toHaveBeenCalledTimes(2);
  expect(repo.submitQuiz.mock.calls[1]).toEqual(repo.submitQuiz.mock.calls[0]);
  expect(
    screen.queryByRole('button', { name: /v.deo obrigat.rio/ }),
  ).not.toBeInTheDocument();
});

test('blocks a modified published manifest with an arbitrary server hash', async () => {
  const repo = makeRepository();
  repo.read.mockResolvedValue({
    ...remoteSnapshot,
    manifestHash: '0'.repeat(64),
  });
  render(
    <CheckpointExplorer
      accountId="owner"
      snapshot={archive}
      repository={repo}
    />,
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(/n.o p.de ser validado/);
  expect(repo.submitDay).not.toHaveBeenCalled();
});

test('renders the public server projection with no grading keys in the client manifest', async () => {
  const repo = makeRepository();
  const official = JSON.parse(CREATION_MANIFEST);
  expect(CREATION_MANIFEST).not.toMatch(/"(?:answer|correctOptionId|explanation)":/);
  official.days[3].title = 'Título publicado pelo servidor';
  const manifestText = JSON.stringify(official);
  const manifestHash = createHash('sha256').update(manifestText).digest('hex');
  repo.read.mockResolvedValue({ ...remoteSnapshot, manifestText, manifestHash });
  render(
    <CheckpointExplorer
      accountId="owner"
      snapshot={archive}
      repository={repo}
    />,
  );
  expect(
    await screen.findByRole('heading', { level: 1, name: /^Dia 4.*Título publicado pelo servidor/ }),
  ).toBeInTheDocument();
});

test('resumes the same committed quiz after reloading and losing the HTTP response', async () => {
  const repo = makeRepository();
  const initial = {
    ...remoteSnapshot,
    completedDays: [1, 2, 3, 4, 5, 6, 7],
    harmonyCompleted: true,
    quizAttempts: 1,
    bestQuizScore: null,
  };
  const pending = preparePendingQuiz(
    JSON.stringify(['owner', traveler.id, 1, manifest]),
    [1, 2, 3, 1, 2],
  );
  repo.read.mockResolvedValue(initial);
  repo.submitQuiz.mockResolvedValue({
    attemptId: pending.id,
    revision: 1,
    score: null,
    replayed: true,
  });
  render(
    <CheckpointExplorer
      accountId="owner"
      snapshot={archive}
      repository={repo}
    />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: /Retomar tentativa pendente/ }),
  );
  expect(await screen.findByText(/pontuação parcial fica reservada/)).toBeInTheDocument();
  expect(repo.submitQuiz).toHaveBeenCalledWith(
    traveler.id,
    1,
    pending.id,
    pending.answers,
  );
  expect(
    screen.queryByRole('button', { name: /Retomar tentativa pendente/ }),
  ).not.toBeInTheDocument();
});

test('invalidates pending attempts on traveler change and clears a revoked open screen', async () => {
  const repo = makeRepository();
  const initial = {
    ...remoteSnapshot,
    completedDays: [1, 2, 3, 4, 5, 6, 7],
    harmonyCompleted: true,
  };
  preparePendingQuiz(
    JSON.stringify(['owner', traveler.id, 1, manifest]),
    [1, 2, 3, 1, 2],
  );
  repo.read.mockResolvedValue(initial);
  const view = render(
    <CheckpointExplorer
      accountId="owner"
      snapshot={archive}
      repository={repo}
    />,
  );
  await screen.findByRole('button', { name: /Retomar tentativa pendente/ });
  const other = { ...archive, traveler: { ...traveler, id: 'other-traveler' } };
  view.rerender(
    <CheckpointExplorer accountId="owner" snapshot={other} repository={repo} />,
  );
  fireEvent.click(
    await screen.findByRole('button', { name: /Abrir Harmonia/ }),
  );
  await screen.findByRole('button', { name: /Abrir Quiz/ });
  expect(
    screen.queryByRole('button', { name: /Retomar tentativa pendente/ }),
  ).not.toBeInTheDocument();
  repo.read.mockResolvedValue({ ...initial, available: false });
  fireEvent.focus(window);
  expect(await screen.findByRole('alert')).toHaveTextContent(/indispon.vel/);
  expect(
    screen.queryByRole('button', { name: /Abrir Quiz/ }),
  ).not.toBeInTheDocument();
  expect(repo.submitQuiz).not.toHaveBeenCalled();
});
