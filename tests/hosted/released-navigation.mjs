// Exercise visible navigation on desktop/mobile without altering prefetch,
// routes, permissions, or error assertions.
export async function navigateReleased(page, name) {
  if (
    name === 'Início' &&
    !(await page.getByRole('link', { name, exact: true }).count())
  )
    return page
      .getByRole('link', { name: 'RPG Jovem Cristão — início', exact: true })
      .click();
  if (
    name === 'Meu avatar' &&
    !(await page
      .getByRole('navigation', {
        name: 'Navegação principal',
        includeHidden: true,
      })
      .getByRole('link', { name, exact: true, includeHidden: true })
      .count())
  )
    name = 'Herói';
  const trigger = page.getByRole('button', { name: 'Abrir menu', exact: true });
  if (await trigger.isVisible()) await trigger.click();
  await page
    .getByRole('navigation', { name: 'Navegação principal', exact: true })
    .getByRole('link', { name, exact: true })
    .click();
}

export async function accountAction(page, name) {
  const direct = page.getByRole('button', { name, exact: true });
  if (await direct.isVisible()) await direct.click();
  else {
    await page
      .getByRole('button', { name: 'Abrir Herói', exact: true })
      .click();
    await page.getByRole('menuitem', { name, exact: true }).click();
  }
  if (name === 'Trocar Viajante') {
    const confirmation = page.getByRole('dialog', {
      name: 'Trocar de Viajante?',
      exact: true,
    });
    await confirmation
      .getByRole('button', { name: 'Trocar Viajante', exact: true })
      .click();
  }
}

// Legacy lessons remain available by an explicit disclosure, without assigning
// them to a class or selecting a class implicitly for the visitor.
export async function openLegacyLessons(page) {
  await page
    .getByRole('heading', { name: 'Minhas classes de EBD', exact: true })
    .waitFor();
  await page.getByText('Aulas anteriores da Guilda', { exact: true }).click();
  await page
    .getByRole('navigation', {
      name: 'Áreas da Escola Bíblica',
      exact: true,
      includeHidden: true,
    })
    .waitFor({ state: 'attached' });
}
