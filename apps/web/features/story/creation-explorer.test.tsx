// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from '../journey/domain/traveler';
import { CreationExplorerView } from './creation-explorer';

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
  expect(screen.getAllByRole('link', { name: /Gênesis.*NVI/ })).toHaveLength(5);
  click('Abrir Diário Bíblico');
  click('Voltar à demonstração');
  expect(screen.getByRole('status')).toHaveTextContent('4 de 5 acertos');
  click('Repetir quiz');
  expectedAnswers.forEach(respond);
  expect(screen.getByRole('status')).toHaveTextContent('5 de 5 acertos');
  expect(
    screen.getByText(/Recompensa futura prevista.*60 XP.*Baú Raro/),
  ).toBeInTheDocument();
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
