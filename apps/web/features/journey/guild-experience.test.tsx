// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { GuildHero } from './components/guild-hero';
afterEach(cleanup);

test('Guild hero presents identity and actual activity counts without a spiritual score', () => {
  render(
    <GuildHero
      name="Comunidade da Jornada"
      leader="Lia"
      description="Nosso encontro semanal"
      participation="Membro da comunidade"
      available={2}
      pending={1}
      completed={0}
    />,
  );
  expect(
    screen.getByRole('heading', { name: 'Comunidade da Jornada', level: 1 }),
  ).toBeVisible();
  expect(screen.getByText('Líder: Lia')).toBeVisible();
  expect(screen.getByText('Membro da comunidade')).toBeVisible();
  const summary = screen.getByLabelText('Resumo das atividades carregadas');
  expect(
    within(summary).getByText('DISPONÍVEIS').nextElementSibling,
  ).toHaveTextContent('2');
  expect(
    within(summary).getByText('AGUARDANDO APROVAÇÃO').nextElementSibling,
  ).toHaveTextContent('1');
  expect(
    within(summary).getByText('CONCLUÍDAS').nextElementSibling,
  ).toHaveTextContent('0');
  expect(screen.getByText(/sem medir fé ou espiritualidade/)).toBeVisible();
});
