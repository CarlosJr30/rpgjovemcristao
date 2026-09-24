import type { Equipment, EquipmentSlot } from '../domain/traveler';

export type EquipmentBibleMetadata = {
  biblicalReference: string;
  bibleUrl: string;
  biblicalTheme: string;
  biblicalDescription: string;
  biblicalClassification: 'thematic';
  foundAt: string;
};

const ephesians = 'https://www.bible.com/pt/bible/129/EPH.6.14-17.NVI';

export const SLOT_INSPIRATION: Record<EquipmentSlot, Pick<EquipmentBibleMetadata, 'biblicalReference' | 'bibleUrl' | 'biblicalTheme'>> = {
  helmet: { biblicalReference: 'Efésios 6:17', bibleUrl: ephesians, biblicalTheme: 'Capacete da salvação' },
  armor: { biblicalReference: 'Efésios 6:14', bibleUrl: ephesians, biblicalTheme: 'Couraça da justiça' },
  weapon: { biblicalReference: 'Efésios 6:17', bibleUrl: ephesians, biblicalTheme: 'Espada do Espírito e Palavra de Deus' },
  shield: { biblicalReference: 'Efésios 6:16', bibleUrl: ephesians, biblicalTheme: 'Escudo da fé' },
  boots: { biblicalReference: 'Efésios 6:15', bibleUrl: ephesians, biblicalTheme: 'Prontidão do evangelho da paz' },
  amulet: { biblicalReference: 'Provérbios 3:5–6', bibleUrl: 'https://www.bible.com/pt/bible/129/PRO.3.5-6.NVI', biblicalTheme: 'Confiança e direção' },
};

export const EQUIPMENT_BIBLE: Record<string, EquipmentBibleMetadata> = {
  'traveler-boots': {
    ...SLOT_INSPIRATION.boots,
    biblicalDescription: 'Botas fictícias de jogo inspiradas na imagem de prontidão. O texto bíblico não descreve estas botas nem concede bônus de jogo.',
    biblicalClassification: 'thematic',
    foundAt: 'Equipamento inicial',
  },
  'traveler-helmet-rare': {
    ...SLOT_INSPIRATION.helmet,
    biblicalDescription: 'Elmo fictício de jogo inspirado na imagem do capacete da salvação. Não é uma relíquia bíblica; seu poder é uma regra de gameplay.',
    biblicalClassification: 'thematic',
    foundAt: 'Baú do Jardim',
  },
  'wisdom-amulet': {
    ...SLOT_INSPIRATION.amulet,
    biblicalDescription: 'Medalhão fictício de jogo inspirado no tema de confiar em Deus ao seguir um caminho. Provérbios não menciona um medalhão.',
    biblicalClassification: 'thematic',
    foundAt: 'Conclusão da Fase 1.1',
  },
  'traveler-sword-common': {
    ...SLOT_INSPIRATION.weapon,
    biblicalDescription: 'Espada fictícia de jogo inspirada na metáfora da Palavra em Efésios. Não representa objeto bíblico real nem poder espiritual.',
    biblicalClassification: 'thematic',
    foundAt: 'Loja do Viajante',
  },
  'traveler-armor-uncommon': {
    ...SLOT_INSPIRATION.armor,
    biblicalDescription: 'Couraça fictícia de jogo inspirada na imagem da justiça. O bônus pertence somente às regras do RPG.',
    biblicalClassification: 'thematic',
    foundAt: 'Loja do Viajante',
  },
  'traveler-shield-rare': {
    ...SLOT_INSPIRATION.shield,
    biblicalDescription: 'Escudo fictício de jogo inspirado na metáfora da fé em Efésios. Não é relíquia nem possui poder espiritual real.',
    biblicalClassification: 'thematic',
    foundAt: 'Loja do Viajante',
  },
};

export function equipmentBibleFor(item: Equipment): EquipmentBibleMetadata | undefined {
  return EQUIPMENT_BIBLE[item.id];
}
