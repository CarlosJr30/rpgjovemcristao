import { GARDEN_HELMET, PATH_AMULET, STARTER_EQUIPMENT, type Equipment } from '../domain/traveler';

export type ShopOffer = { equipment: Equipment; price: number; description: string };

export const SHOP_OFFERS: readonly ShopOffer[] = [
  {
    equipment: { id: 'traveler-sword-common', name: 'Espada do Caminho', slot: 'weapon', rarity: 'comum', power: 1, stats: { strength: 2 } },
    price: 35,
    description: 'Arma fictícia inicial para a jornada.',
  },
  {
    equipment: { id: 'traveler-armor-uncommon', name: 'Couraça do Viajante', slot: 'armor', rarity: 'incomum', power: 2, stats: { life: 1, defense: 1 } },
    price: 65,
    description: 'Armadura fictícia inspirada na firmeza de caráter.',
  },
  {
    equipment: { id: 'traveler-shield-rare', name: 'Escudo da Perseverança', slot: 'shield', rarity: 'raro', power: 3, stats: { life: 1, defense: 2 } },
    price: 115,
    description: 'Escudo fictício para quem explorou e poupou moedas.',
  },
] as const;

export const EQUIPMENT_CATALOG: readonly Equipment[] = [
  ...STARTER_EQUIPMENT,
  GARDEN_HELMET,
  PATH_AMULET,
  ...SHOP_OFFERS.map((offer) => offer.equipment),
];

export const RARITIES = ['comum', 'incomum', 'raro', 'épico', 'lendário'] as const;
