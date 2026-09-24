import { describe, expect, test } from 'vitest';
import { createTraveler } from './domain/traveler';
import { getGameplayAvatarPortrait } from './data/gameplayAvatarPortrait';
import { addExperience, addGameplayReward, levelForXp, nextUnlock, xpForLevel } from './data/progression';

const traveler = () => createTraveler('Ana', { hair: 'longo', outfit: 'azul', skin: 'escuro' }, '00000000-0000-4000-8000-000000000001', '2026-09-23T00:00:00.000Z');

describe('progressão por gameplay', () => {
  test('XP cruza marcos, concede bônus do nível 2 uma vez e preserva o saldo', () => {
    const first = addExperience(traveler(), 120);
    expect(first.level).toBe(1);
    const second = addExperience(first, 80);
    expect(second.level).toBe(2);
    expect(second.coins).toBe(10);
    expect(addExperience(second, 400)).toMatchObject({ level: 3, xp: 600, coins: 10 });
    expect(levelForXp(200)).toBe(2);
    expect(xpForLevel(3)).toBe(600);
    expect(nextUnlock(2)?.level).toBe(5);
    expect(addGameplayReward(first, 80, 30)).toMatchObject({ level: 2, xp: 200, coins: 40 });
  });

  test('retrato usa a aparência e o tipo corporal do Viajante ativo', () => {
    const current = traveler();
    current.avatar.gender = 'female';
    expect(getGameplayAvatarPortrait(current).imageUrl).toBe('/assets/avatar/runtime/female/female_long_blue_dark.png');
  });
});
