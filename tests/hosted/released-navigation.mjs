// Exercise visible navigation on desktop/mobile without altering prefetch,
// routes, permissions, or error assertions.
async function followReleasedLink(page, link) {
  const href = await link.getAttribute('href');
  if (!href) throw new Error('Released navigation requires a destination');
  const destination = new URL(href, page.url()).href;
  await link.click();
  // Home and Hero can already contain the same traveler heading. A heading
  // alone cannot prove the prior route committed before reopening the menu.
  await page.waitForURL(destination);
}
export async function navigateReleased(page, name) {
  if (
    name === 'Início' &&
    !(await page.getByRole('link', { name, exact: true }).count())
  )
    return followReleasedLink(
      page,
      page.getByRole('link', {
        name: 'RPG Jovem Cristão — início',
        exact: true,
      }),
    );
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
  const link = page
    .getByRole('navigation', { name: 'Navegação principal', exact: true })
    .getByRole('link', { name, exact: true });
  await followReleasedLink(page, link);
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
