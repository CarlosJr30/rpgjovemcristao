// Exercise visible navigation on desktop/mobile without altering prefetch,
// routes, permissions, or error assertions.
export async function navigateReleased(page, name) {
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
