import { expect, test } from 'vitest';
import {
  blankLesson,
  fromLesson,
  rewardLabel,
  safeMaterialUrl,
  validateLesson,
} from './contracts';
import { fixtureLesson } from './fixtures.test-data';
test('editor starts blank without pedagogical templates or publication', () => {
  const form = blankLesson('actor');
  expect(form.content).toBe('');
  expect(form.reference).toBe('');
  expect(form.materials).toEqual([]);
  expect(form.rewardTier).toBe('');
  expect('publish' in form).toBe(false);
});
test.each([
  'javascript:alert(1)',
  'data:text/html,hello',
  'http://www.example.org/a',
  'https://user:pass@www.example.org/a',
  'https://127.0.0.1/a',
  'https://host.local/a',
  'https://host.invalid/a',
  'https://example.org:443/a',
  'https://example.org/a\n',
  '//example.org/a',
])('rejects unsafe material URL %s', (url) =>
  expect(safeMaterialUrl(url)).toBe(false),
);
test('validates text, public HTTPS references and selected audience', () => {
  const form = {
    ...blankLesson('actor'),
    title: 'Minha aula',
    theme: 'Tema livre',
  };
  expect(validateLesson(form)).toBe('');
  expect(safeMaterialUrl('https://www.example.org/arquivo.pdf?cap=1')).toBe(
    true,
  );
  expect(
    validateLesson({ ...form, audience: 'selected', targetIds: [] }),
  ).toMatch(/público/);
  expect(validateLesson({ ...form, content: 'a'.repeat(10001) })).toMatch(
    /limites/,
  );
  expect(
    validateLesson({
      ...form,
      materials: [
        { kind: 'link', title: 'Material', value: 'javascript:alert(1)' },
      ],
    }),
  ).toMatch(/HTTPS/);
});
test('reopens exact saved content, optional references and centralized reward tier', () => {
  const lesson = fixtureLesson({
    content: 'Linha 1\nLinha 2',
    reward_tier: 'normal',
  });
  expect(fromLesson(lesson).content).toBe(lesson.content);
  expect(fromLesson(lesson).reference).toBe('');
  expect(rewardLabel('normal')).toMatch(/80 XP.*25 moedas/);
});
