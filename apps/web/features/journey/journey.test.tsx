import { describe, expect, test } from 'vitest';
import {
  createTraveler,
  DEFAULT_APPEARANCE,
  GARDEN_HELMET,
  PATH_AMULET,
  HAIR,
  OUTFITS,
  SKIN,
  parseTraveler,
  validateName,
} from './domain/traveler';
import {
  createJourneyRepository,
  ACTIVE_TRAVELER_ID_KEY,
  SESSION_KEY,
  STORAGE_KEY,
} from './persistence/journey-storage';
const id = '12345678-1234-4321-8234-123456789abc';
const date = '2026-09-17T12:00:00.000Z';
const traveler = () =>
  createTraveler('  Ana Clara  ', DEFAULT_APPEARANCE, id, date);
describe('Viajante', () => {
  test('criação válida e mínima, com nome normalizado', () => {
    const player = traveler();
    expect(player.name).toBe('Ana Clara');
    expect(player).toMatchObject({
      level: 1,
      xp: 0,
      coins: 0,
      progress: { introCompleted: false },
    });
    expect(player).not.toHaveProperty('class');
    expect(parseTraveler(player)).toEqual(player);
  });
  test.each([
    '',
    ' ',
    'A',
    'a'.repeat(25),
    '<script>',
    '1234',
    'Ana\nLia',
    'Ana  Lia',
    'A\u202EB',
    '😀',
  ])('rejeita nome inválido %j', (name) => {
    expect(validateName(name)).not.toBeNull();
    expect(() => createTraveler(name, DEFAULT_APPEARANCE, id, date)).toThrow();
  });
  test.each(['João', 'Ana Clara', 'Ágata', "D'Ávila", 'Ana-Lia'])(
    'aceita nome %s',
    (name) => expect(validateName(name)).toBeNull(),
  );
  test('todas as 27 combinações cosméticas mantêm atributos iguais e independentes', () => {
    for (const hair of HAIR)
      for (const outfit of OUTFITS)
        for (const skin of SKIN) {
          const player = createTraveler(
            'Lia',
            { hair, outfit, skin },
            id,
            date,
          );
          expect(player.attributes).toEqual({
            life: 1,
            strength: 1,
            defense: 1,
            wisdom: 1,
          });
          expect(player.attributes).not.toBe(traveler().attributes);
        }
  });
  test('dados adulterados ou com campos privados são rejeitados', () => {
    for (const invalid of [
      { ...traveler(), level: 99 },
      { ...traveler(), xp: -1 },
      { ...traveler(), email: 'extra' },
      { ...traveler(), attributes: { vigor: 999 } },
      { ...traveler(), appearance: { hair: 'script' } },
      { ...traveler(), progress: { currentPhase: 'jesus' } },
      { ...traveler(), createdAt: 'invalid' },
      { ...traveler(), inventory: [null] },
      { ...traveler(), equipped: { helmet: 'item-inexistente' } },
    ])
      expect(parseTraveler(invalid)).toBeNull();
  });
});
describe('adapter local', () => {
  function setup() {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    };
    return { data, repository: createJourneyRepository(() => storage) };
  }
  test('limpa somente perfis e sessão e permite criar um único Viajante após reload', () => {
    const { data, repository } = setup();
    data.set('outro-app', 'preservar');
    expect(repository.load()).toEqual({ status: 'empty' });
    expect(repository.save(traveler())).toBe(true);
    expect(repository.startSession(id)).toBe(true);
    expect(repository.load()).toEqual({
      status: 'ready',
      traveler: traveler(),
    });
    expect(repository.clear()).toBe(true);
    expect(repository.load()).toEqual({ status: 'empty' });
    expect(repository.listSaved()).toEqual([]);
    expect(repository.isSessionActive()).toBe(false);
    expect(repository.activeTravelerId()).toBeNull();
    expect(data.has(STORAGE_KEY)).toBe(false);
    expect(data.has(SESSION_KEY)).toBe(false);
    expect(data.has(ACTIVE_TRAVELER_ID_KEY)).toBe(false);
    expect(data.get('outro-app')).toBe('preservar');
    expect(repository.saveNew(traveler())).toBe(true);
    expect(repository.listSaved()).toHaveLength(1);
  });
  test.each([
    '{invalid',
    'null',
    '[]',
    '{}',
    'x'.repeat(4 * 1024 * 1024 + 1),
    '{"version":99,"traveler":{}}',
  ])('não quebra com storage inválido', (raw) => {
    const { data, repository } = setup();
    data.set(STORAGE_KEY, raw);
    expect(repository.load()).toEqual({ status: 'corrupt' });
    expect(data.get(STORAGE_KEY)).toBe(raw);
  });
  test('retoma intro concluída sem conceder XP', () => {
    const { repository } = setup();
    const player = traveler();
    player.progress.introCompleted = true;
    repository.save(player);
    expect(repository.load()).toEqual({ status: 'ready', traveler: player });
    expect(player.xp).toBe(0);
  });
  test('migra nível de XP legado e mantém progresso isolado por Viajante', () => {
    const { data, repository } = setup();
    const first = { ...traveler(), xp: 600, level: 1 };
    const second = { ...traveler(), id: '12345678-1234-4321-8234-000000000002', xp: 0, level: 1 };
    data.set(STORAGE_KEY, JSON.stringify({ version: 2, travelers: [first, second] }));
    expect(repository.listSaved().map((saved) => [saved.id, saved.level, saved.xp])).toEqual([
      [first.id, 3, 600], [second.id, 1, 0],
    ]);
    repository.startSession(second.id);
    expect(repository.load()).toMatchObject({ status: 'ready', traveler: { id: second.id, level: 1 } });
    repository.startSession(first.id);
    expect(repository.load()).toMatchObject({ status: 'ready', traveler: { id: first.id, level: 3 } });
  });
  test('migra atributos e equipamentos antigos sem persistir total derivado', () => {
    const { data, repository } = setup();
    const legacy = structuredClone(traveler()) as unknown as Record<string, unknown>;
    legacy.attributes = { vigor: 1, dexterity: 1, perception: 1, wisdom: 1 };
    legacy.inventory = (legacy.inventory as Record<string, unknown>[]).map((equipment) => {
      const migrated = { ...equipment };
      Reflect.deleteProperty(migrated, 'stats');
      return migrated;
    });
    data.set(STORAGE_KEY, JSON.stringify({ version: 2, travelers: [legacy] }));
    const loaded = repository.load();
    expect(loaded.status).toBe('ready');
    if (loaded.status !== 'ready') return;
    expect(loaded.traveler.attributes).toEqual({ life: 1, strength: 1, defense: 1, wisdom: 1 });
    expect(loaded.traveler.inventory[0].stats).toEqual({ life: 1 });
    expect(loaded.traveler).not.toHaveProperty('totalStats');
  });
  test('preserva e carrega vários Viajantes quando o save ultrapassa 4 KB', () => {
    const { data, repository } = setup();
    const names = ['Viajante Um', 'Viajante Dois', 'Viajante Três', 'Viajante Quatro', 'Viajante Cinco', 'Viajante Seis'];
    for (let index = 1; index <= names.length; index += 1) {
      const travelerId = `12345678-1234-4321-8234-${String(index).padStart(12, '0')}`;
      expect(
        repository.saveNew(
          createTraveler(
            names[index - 1],
            DEFAULT_APPEARANCE,
            travelerId,
            date,
          ),
        ),
      ).toBe(true);
    }
    expect(data.get(STORAGE_KEY)?.length).toBeGreaterThan(4096);
    expect(repository.listSaved()).toHaveLength(6);
    expect(repository.load().status).toBe('ready');
  });
  test('migra somente o nome do amuleto antigo sem perder recompensa ou equipamento', () => {
    const { data, repository } = setup();
    const player = traveler();
    player.inventory.push({ ...PATH_AMULET, name: 'Amuleto do Caminho', isNew: true });
    player.equipped.amulet = PATH_AMULET.id;
    player.xp = 120;
    data.set(STORAGE_KEY, JSON.stringify({ version: 2, travelers: [player] }));
    const loaded = repository.load();
    expect(loaded.status).toBe('ready');
    if (loaded.status !== 'ready') return;
    expect(loaded.traveler.inventory.find((item) => item.id === PATH_AMULET.id)).toMatchObject({ name: PATH_AMULET.name, isNew: true });
    expect(loaded.traveler.equipped.amulet).toBe(PATH_AMULET.id);
    expect(loaded.traveler.xp).toBe(120);
  });
  test('persiste loot, baús, segredo e equipamento encontrados no Jardim', () => {
    const { repository } = setup();
    const player = traveler();
    player.coins = 33;
    player.inventory.push({ ...GARDEN_HELMET, isNew: true });
    player.progress.gardenExploredPoints = ['stones', 'leaves'];
    player.progress.gardenFragments = 2;
    player.progress.gardenOpenedChests = ['chest-path', 'chest-hidden'];
    player.progress.gardenCollectedLoot = ['coins-grove'];
    player.progress.gardenSecrets = ['hidden-corner'];
    player.progress.gardenEvents = ['blocked-passage', 'wind-pattern'];
    expect(repository.save(player)).toBe(true);
    expect(repository.load()).toEqual({ status: 'ready', traveler: player });
    expect(player.equipped.helmet).toBeUndefined();
  });
  test('preserva leitura, devocional, objetivos e tentativa após logout e nova sessão', () => {
    const { repository } = setup();
    const player = traveler();
    player.progress.bibleReading = {
      genesis2Opened: '2026-09-17T12:10:00.000Z',
      genesis2Confirmed: true,
      genesis3Opened: '2026-09-17T12:15:00.000Z',
      genesis3Confirmed: true,
      comprehensionCompleted: true,
    };
    player.progress.devotionalCompleted = true;
    player.progress.devotionalReflection = 'Responsabilidade pelo cuidado.';
    player.progress.explorationObjectives = ['care-signs', 'limit-sequence', 'choice-consequence-order'];
    player.progress.quizAttemptId = 4;
    player.progress.gardenStep = 'mission';

    expect(repository.save(player)).toBe(true);
    expect(repository.startSession(player.id)).toBe(true);
    expect(repository.logout()).toBe(true);
    expect(repository.isSessionActive()).toBe(false);
    expect(repository.listSaved()).toEqual([player]);

    expect(repository.startSession(player.id)).toBe(true);
    expect(repository.load()).toEqual({ status: 'ready', traveler: player });
  });
  test('migra save anterior sem apagar o progresso existente', () => {
    const { data, repository } = setup();
    const legacy = structuredClone(traveler()) as unknown as { progress: Record<string, unknown> };
    for (const key of [
      'gardenOpenedChests', 'gardenCollectedLoot', 'gardenSecrets', 'gardenEvents',
      'bibleReading', 'devotionalCompleted', 'devotionalReflection', 'explorationObjectives', 'quizAttemptId',
    ])
      Reflect.deleteProperty(legacy.progress, key);
    data.set(STORAGE_KEY, JSON.stringify({ version: 2, travelers: [legacy] }));
    const loaded = repository.load();
    expect(loaded.status).toBe('ready');
    if (loaded.status === 'ready') {
      expect(loaded.traveler.progress.gardenOpenedChests).toEqual([]);
      expect(loaded.traveler.progress.gardenSecrets).toEqual([]);
      expect(loaded.traveler.progress.bibleReading).toEqual({
        genesis2Opened: null,
        genesis2Confirmed: false,
        genesis3Opened: null,
        genesis3Confirmed: false,
        comprehensionCompleted: false,
      });
      expect(loaded.traveler.progress.devotionalCompleted).toBe(false);
      expect(loaded.traveler.progress.explorationObjectives).toEqual([]);
      expect(loaded.traveler.progress.quizAttemptId).toBe(0);
      expect(loaded.traveler.name).toBe('Ana Clara');
    }
  });
  test('trata acesso bloqueado e erro de gravação/remoção', () => {
    const repository = createJourneyRepository(() => {
      throw new Error('denied');
    });
    expect(repository.load()).toEqual({ status: 'unavailable' });
    expect(repository.save(traveler())).toBe(false);
    expect(repository.clear()).toBe(false);
  });
});
