/** Owner-approved ECONOMY-041. Presentation only; server policy authorizes transactions. */
export const ECONOMY_041_VERSION = 'economy041-chest-v1' as const;
export const ECONOMY_041_CHESTS = {
  common: {
    price: 40,
    rarity: 'comum',
    coins: 25,
    coinWeight: 70,
    cardWeight: 15,
    equipmentWeight: 15,
  },
  uncommon: {
    price: 80,
    rarity: 'incomum',
    coins: 55,
    coinWeight: 60,
    cardWeight: 20,
    equipmentWeight: 20,
  },
  rare: {
    price: 150,
    rarity: 'raro',
    coins: 105,
    coinWeight: 50,
    cardWeight: 25,
    equipmentWeight: 25,
  },
  epic: {
    price: 250,
    rarity: 'épico',
    coins: 190,
    coinWeight: 40,
    cardWeight: 30,
    equipmentWeight: 30,
  },
  extraordinary: {
    price: 400,
    rarity: 'lendário',
    coins: 360,
    coinWeight: 30,
    cardWeight: 35,
    equipmentWeight: 35,
  },
} as const;
export const ECONOMY_041_RESALE = {
  comum: 10,
  incomum: 20,
  raro: 35,
  épico: 70,
  lendário: 120,
} as const;
export const ECONOMY_041_MISSIONS = {
  normal: { coins: 25, chest: 'common' },
  great: { coins: 100, chest: 'uncommon' },
  epic: { coins: 220, chest: 'rare' },
  extraordinary: { coins: 360, chest: 'epic' },
} as const;
export const ECONOMY_041_WORLDS = {
  origins: { coins: 30, chest: 'common' },
  patriarchs: { coins: 45, chest: 'common' },
  liberation: { coins: 60, chest: 'uncommon' },
  'promised-land': { coins: 80, chest: 'uncommon' },
  kings: { coins: 100, chest: 'rare' },
  return: { coins: 125, chest: 'rare' },
  jesus: { coins: 150, chest: 'epic' },
  church: { coins: 180, chest: 'epic' },
  'new-creation': { coins: 220, chest: 'extraordinary' },
} as const;
