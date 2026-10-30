import { expect, test } from 'vitest';
import { parseClassesWorkspace, validateClass } from './contracts';
const g = '00000000-0000-4000-8000-000000000001',
  c = '00000000-0000-4000-8000-000000000002';
const value = () => ({
  version: 1,
  guildId: g,
  classId: c,
  leader: false,
  classes: [
    {
      id: c,
      name: 'Classe',
      description: '',
      status: 'active',
      revision: 1,
      role: 'student',
    },
  ],
  members: [],
  teachers: [],
  history: [],
});
test('server-confirmed selected class and empty states are accepted', () => {
  expect(parseClassesWorkspace(value(), g, c).classes).toHaveLength(1);
  expect(
    parseClassesWorkspace({ ...value(), classId: null, classes: [] }, g, null)
      .classes,
  ).toHaveLength(0);
});
test('foreign Guild or class response is rejected', () => {
  expect(() => parseClassesWorkspace(value(), c, c)).toThrow();
  expect(() => parseClassesWorkspace(value(), g, g)).toThrow();
});
test('unconfirmed selection and duplicate class cannot masquerade as valid workspace', () => {
  expect(() =>
    parseClassesWorkspace({ ...value(), classes: [] }, g, c),
  ).toThrow();
  expect(() =>
    parseClassesWorkspace(
      { ...value(), classes: [...value().classes, ...value().classes] },
      g,
      c,
    ),
  ).toThrow();
});
test('invalid permissions and missing arrays fail closed', () => {
  expect(() =>
    parseClassesWorkspace(
      {
        ...value(),
        classes: [{ ...value().classes[0], role: 'administrator' }],
      },
      g,
      c,
    ),
  ).toThrow();
  expect(() =>
    parseClassesWorkspace({ ...value(), teachers: null }, g, c),
  ).toThrow();
});
test('class details validate useful lengths without adding sample classes', () => {
  expect(validateClass('  Jovens  ', '')).toBe(true);
  expect(validateClass(' ', '')).toBe(false);
  expect(validateClass('x'.repeat(81), '')).toBe(false);
  expect(validateClass('Classe', 'x'.repeat(1001))).toBe(false);
});
