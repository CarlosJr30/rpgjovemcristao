import { beforeEach, describe, expect, test } from 'vitest';
import { createTraveler, DEFAULT_APPEARANCE } from './domain/traveler';
import { SHOP_OFFERS } from './data/equipmentCatalog';
import { purchaseFromShop } from './data/shop';
import { GUILD_CONTENT_KEY, guildContentRepository } from './data/guildContent';
import { journeyRepository } from './persistence/journey-storage';
import { approveGuildActivity, claimGuildActivity, joinGuild, publishGuildContent, submitGuildActivity } from './state/use-journey';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}
const storage = new MemoryStorage();
const firstId = '12345678-1234-4321-8234-000000000001';
const secondId = '12345678-1234-4321-8234-000000000002';
const make = (name: string, id: string) => createTraveler(name, DEFAULT_APPEARANCE, id, '2026-09-24T00:00:00.000Z');

beforeEach(() => { storage.clear(); Object.assign(globalThis, { window: { localStorage: storage } }); });

describe('Loja visível e conteúdo local da Guilda', () => {
  test('compra desconta uma vez, persiste no Viajante correto e rejeita falta de saldo', () => {
    const offer = SHOP_OFFERS[0];
    const first = { ...make('Ana', firstId), coins: offer.price };
    const second = make('Bia', secondId);
    expect(purchaseFromShop(second, offer.equipment.id)).toEqual({ status: 'insufficient' });
    const purchased = purchaseFromShop(first, offer.equipment.id);
    expect(purchased.status).toBe('purchased');
    if (purchased.status !== 'purchased') return;
    expect(purchased.traveler.coins).toBe(0);
    expect(purchased.traveler.inventory).toContainEqual({ ...offer.equipment, isNew: true });
    expect(purchaseFromShop(purchased.traveler, offer.equipment.id)).toEqual({ status: 'owned' });
    expect(journeyRepository.saveNew(purchased.traveler)).toBe(true);
    expect(journeyRepository.saveNew(second)).toBe(true);
    journeyRepository.startSession(secondId);
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { id: secondId, coins: 0 } });
    journeyRepository.startSession(firstId);
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { id: firstId, coins: 0 } });
    expect(journeyRepository.listSaved()[0].inventory.some((item) => item.id === offer.equipment.id)).toBe(true);
    expect(journeyRepository.listSaved()[1].inventory.some((item) => item.id === offer.equipment.id)).toBe(false);
  });

  test('lição e missão publicadas aparecem para outro membro e recompensa é única', () => {
    journeyRepository.saveNew(make('Ana', firstId));
    journeyRepository.saveNew(make('Bia', secondId));
    journeyRepository.startSession(firstId);
    expect(joinGuild('CELULA01')).toBe(true);
    const common = { title: 'Cuidar do próximo', description: 'Atividade objetiva de serviço.', biblicalReference: 'Efésios 6:15', bibleUrl: 'https://www.bible.com/pt/bible/129/EPH.6.15.NVI', objective: 'Realizar uma ação concreta.', date: '2026-09-24', theme: 'Serviço', questions: 'Como ajudar?', groupActivity: 'Conversar em grupo', practicalMission: 'Ajudar alguém', difficulty: 'normal' as const, audience: 'individual' as const, collectiveTarget: null, tier: 'normal' as const };
    expect(publishGuildContent({ ...common, kind: 'lesson' })).toBe(true);
    expect(publishGuildContent({ ...common, kind: 'mission', title: 'Missão de serviço' })).toBe(true);
    const contents = guildContentRepository.list('guild-celula01');
    expect(contents).toHaveLength(2);
    journeyRepository.startSession(secondId);
    expect(joinGuild('CELULA01')).toBe(true);
    expect(guildContentRepository.list('guild-celula01').map((item) => item.title)).toContain('Missão de serviço');
    const missionId = contents[1].id;
    expect(submitGuildActivity(missionId)).toBe(true);
    expect(submitGuildActivity(missionId)).toBe(false);
    journeyRepository.startSession(firstId);
    expect(approveGuildActivity(secondId, missionId)).toBe(true);
    expect(approveGuildActivity(secondId, missionId)).toBe(false);
    journeyRepository.startSession(secondId);
    expect(claimGuildActivity(missionId)).toBe(true);
    expect(claimGuildActivity(missionId)).toBe(false);
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { id: secondId, xp: 80, coins: 25 } });
    journeyRepository.startSession(firstId);
    expect(journeyRepository.load()).toMatchObject({ status: 'ready', traveler: { id: firstId, xp: 0, coins: 0 } });
  });

  test('conteúdo inválido no storage não derruba a Guilda', () => {
    storage.setItem(GUILD_CONTENT_KEY, JSON.stringify([{ guildId: 'guild-celula01', title: null }]));
    expect(guildContentRepository.list('guild-celula01')).toEqual([]);
  });
});
