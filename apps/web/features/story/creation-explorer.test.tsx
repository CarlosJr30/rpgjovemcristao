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

import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { CheckpointExplorer, CreationExplorerView } from './creation-explorer';

vi.mock('./use-story-progress', () => ({
  useStoryProgress: () => ({ records: [] }),
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
});

test('shows the sanctuary, enters day one, retries the challenge, and returns without claiming canonical progress', () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  render(<CreationExplorerView traveler={traveler} />);
  expect(screen.getByText('Santu\u00e1rio da Jornada')).toBeInTheDocument();
  expect(
    screen.getByText(/Espa\u00e7o fict\u00edcio do jogo/),
  ).toBeInTheDocument();
  for (const day of [
    'Luz e trevas',
    'Firmamento',
    'Terra e vegeta\u00e7\u00e3o',
    'Luminares',
    'Aves e criaturas das \u00e1guas',
    'Animais terrestres e humanidade',
    'Descanso e reflex\u00e3o',
  ]) {
    expect(screen.getAllByText(new RegExp(day)).length).toBeGreaterThan(0);
  }
  const alternative = screen.getByRole('list', { name: 'Navegação acessível' });
  fireEvent.click(within(alternative).getByRole('button', { name: /Portal/ }));
  expect(
    screen.queryByText('O que Deus criou no primeiro dia?'),
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(alternative).getByRole('button', { name: 'Marco da luz' }),
  );
  expect(screen.getByTestId('traveler-position')).toHaveStyle({ left: '22%' });
  fireEvent.click(screen.getByLabelText('O firmamento.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getAllByText(/Tente novamente/).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByLabelText('A luz.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(screen.getByText(/separou a luz das trevas/)).toBeInTheDocument();
  fireEvent.click(
    within(alternative).getByRole('button', { name: 'Retornar ao Santuário' }),
  );
  expect(screen.getByText(/Santu\u00e1rio fict\u00edcio/)).toBeInTheDocument();
  expect(storageWrite).not.toHaveBeenCalled();
});

test('moves with desktop keyboard controls and exposes the real traveler avatar', () => {
  render(<CreationExplorerView traveler={traveler} />);
  const avatar = screen.getByTestId('traveler-position');
  const map = screen.getByRole('group', { name: 'Mapa de exploração' });
  fireEvent.keyDown(map, { key: 'ArrowRight' });
  expect(avatar).toHaveStyle({ left: '23%' });
  fireEvent.keyDown(map, { key: 'ArrowUp' });
  expect(avatar).toHaveStyle({ top: '45%' });
});

test('requires each day’s educational interaction and correct answer before advancing through all seven days', () => {
  const storageWrite = vi.spyOn(Storage.prototype, 'setItem');
  const view = render(
    <CreationExplorerView traveler={traveler} canonicalSteps={['missions']} />,
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
  choose('Portal · Dia 1');
  choose('Retornar ao Santuário');
  expect(
    screen.queryByRole('button', { name: 'Abrir Harmonia da Criação' }),
  ).not.toBeInTheDocument();
  choose('Portal · Dia 1');
  const itinerary = [
    { markers: ['Marco da luz'], correct: 'A luz.' },
    {
      markers: ['Marco do céu'],
      correct: 'As águas de cima das águas de baixo.',
    },
    {
      markers: ['Terra', 'Mares', 'Vegetação'],
      correct: /Aparece a terra seca/,
    },
    { markers: ['Marco dos luminares'], correct: /Iluminar a terra/ },
    { markers: ['Marco da vida'], correct: 'Seres aquáticos e aves.' },
    { markers: ['Marco da humanidade'], correct: /Os seres humanos, criados/ },
    {
      markers: ['Marco do descanso'],
      correct: /Deus havia concluído sua obra/,
    },
  ];
  itinerary.forEach(({ markers, correct }, index) => {
    expect(
      screen.getByRole('heading', { name: new RegExp(`^Dia ${index + 1} —`) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ler Gênesis.*NVI/ }),
    ).toBeInTheDocument();
    for (const marker of markers) {
      expect(
        screen.queryByRole('form', { name: 'Desafio demonstrativo' }),
      ).not.toBeInTheDocument();
      choose(marker);
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
        : 'Voltar ao Santuário e liberar Harmonia';
    fireEvent.click(wrong);
    submit();
    expect(screen.getByText(/Tente novamente/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: advance }),
    ).not.toBeInTheDocument();
    fireEvent.click(answer);
    submit();
    expect(
      screen.getByText(/Resposta correta. Explicação do relato/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: advance }));
  });
  expect(
    screen.getByText('Você percorreu os sete dias da demonstração.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/Registros canônicos consultados: 1/),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: 'Abrir Harmonia da Criação' }),
  );
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
  click('Voltar à demonstração');
  expect(
    bank.getByRole('button', { name: /Luz e trevas, posicionado/ }),
  ).toHaveAttribute('aria-disabled', 'true');
  symbols
    .slice(1)
    .forEach((name) => fireEvent.click(bank.getByRole('button', { name })));
  click('Verificar sequência');
  click('Abrir Quiz da Criação');

  const expectedAnswers = [
    'A luz',
    'Terceiro dia',
    'Os luminares',
    'De Deus',
    /Concluiu Sua obra/,
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
  respond('Os animais terrestres', 0);
  click('Abrir Diário Bíblico');
  click('Voltar à demonstração');
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
  click('Voltar à demonstração');
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
  click('Voltar à demonstração');
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
  click('Voltar à demonstração');
  expect(screen.getByRole('status')).toHaveTextContent(
    'Conclusão oficial bloqueada',
  );
  expect(storageWrite).not.toHaveBeenCalled();
  view.unmount();
  render(<CreationExplorerView traveler={traveler} />);
  expect(
    screen.queryByText('Você percorreu os sete dias da demonstração.'),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Santuário fictício')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Abrir Harmonia da Criação' }),
  ).not.toBeInTheDocument();
});

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
  const portal = accessibleMap().getByRole('button', { name: /Portal.*Dia 4/ });
  await act(async () => resolveOld({ ...remoteSnapshot, completedDays: [] }));
  fireEvent.click(portal);
  expect(screen.getByRole('heading', { name: /^Dia 4/ })).toBeInTheDocument();
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
  expect(
    await screen.findAllByRole('button', { name: /Portal.*Dia 1/ }),
  ).toHaveLength(2);
  expect(repo.submitDay).not.toHaveBeenCalled();
});

test('advances a day only after the server returns a confirmed checkpoint snapshot', async () => {
  const repo = makeRepository();
  const first = { ...remoteSnapshot, completedDays: [] };
  repo.submitDay
    .mockResolvedValueOnce({ completed: false })
    .mockResolvedValueOnce({ completed: true });
  repo.read.mockResolvedValue({ ...first, completedDays: [1] });
  render(
    <CreationExplorerView
      traveler={traveler}
      remote={{ accountId: 'owner', initial: first, repository: repo }}
    />,
  );
  fireEvent.click(
    accessibleMap().getByRole('button', { name: /Portal.*Dia 1/ }),
  );
  fireEvent.click(
    accessibleMap().getByRole('button', { name: 'Marco da luz' }),
  );
  fireEvent.click(screen.getByLabelText('A luz.'));
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(await screen.findByText(/Tente novamente/)).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Prosseguir/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Conferir resposta' }));
  expect(
    await screen.findByRole('button', { name: /Prosseguir para o Dia 2/ }),
  ).toBeInTheDocument();
  expect(repo.submitDay).toHaveBeenCalledWith(traveler.id, 1, 1, 1);
});

test('retries a failed quiz submission with the same operation ID and displays the server score', async () => {
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
        bestQuizScore: 2,
      });
      throw new Error('connection lost');
    })
    .mockImplementationOnce(
      async (_traveler, revision, attemptId) => ({
        score: 2,
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
  expect(await screen.findByText(/2 de 5 acertos/)).toBeInTheDocument();
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

test('renders the official server manifest instead of requiring a bundled copy', async () => {
  const repo = makeRepository();
  const official = JSON.parse(CREATION_MANIFEST);
  official.days[0].title = 'Título publicado pelo servidor';
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
    await screen.findByText(/Dia 1 · Título publicado pelo servidor/),
  ).toBeInTheDocument();
});

test('resumes the same committed quiz after reloading and losing the HTTP response', async () => {
  const repo = makeRepository();
  const initial = {
    ...remoteSnapshot,
    completedDays: [1, 2, 3, 4, 5, 6, 7],
    harmonyCompleted: true,
    quizAttempts: 1,
    bestQuizScore: 3,
  };
  const pending = preparePendingQuiz(
    JSON.stringify(['owner', traveler.id, 1, manifest]),
    [1, 2, 3, 1, 2],
  );
  repo.read.mockResolvedValue(initial);
  repo.submitQuiz.mockResolvedValue({
    attemptId: pending.id,
    revision: 1,
    score: 3,
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
  expect(await screen.findByText(/3 de 5 acertos/)).toBeInTheDocument();
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
