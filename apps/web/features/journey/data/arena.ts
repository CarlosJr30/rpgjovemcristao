import {
  calculateCombatPower,
  type BattleEffectId,
  type BattleParticipantSnapshot,
} from '@rpg/game-engine';
import { calculateTotalAttributes, equippedItems } from './attributes';
import type { Equipment, Traveler } from '../domain/traveler';

const EFFECT_BY_ITEM: Readonly<Record<string, readonly BattleEffectId[]>> = {
  'traveler-sword-common': ['path-sword'],
  'traveler-shield-rare': ['steadfast-shield'],
  'traveler-boots': ['pilgrim-boots'],
  'wisdom-amulet': ['prudence-amulet'],
  'traveler-helmet-rare': ['traveler-helmet'],
  'traveler-armor-uncommon': ['traveler-armor'],
};

function equipmentSnapshot(item: Equipment) {
  return { id: item.id, name: item.name, power: item.power, effectIds: EFFECT_BY_ITEM[item.id] ?? [] };
}

export function travelerBattleSnapshot(traveler: Traveler): BattleParticipantSnapshot {
  const attributes = calculateTotalAttributes(traveler).total;
  const equipment = equippedItems(traveler).map(equipmentSnapshot);
  const base = {
    id: traveler.id,
    name: traveler.name,
    level: traveler.level,
    attributes,
    equipment,
    avatarKey: `${traveler.avatar.gender}:${traveler.appearance.hair}:${traveler.appearance.outfit}:${traveler.appearance.skin}`,
  };
  return { ...base, combatPower: calculateCombatPower(base) };
}

function trainingSnapshot(id: string, name: string, level: number, attributes: BattleParticipantSnapshot['attributes'], equipment: BattleParticipantSnapshot['equipment']): BattleParticipantSnapshot {
  const base = { id, name, level, attributes, equipment };
  return { ...base, combatPower: calculateCombatPower(base) };
}

export const TRAINING_OPPONENTS: readonly BattleParticipantSnapshot[] = [
  trainingSnapshot('training-apprentice', 'Davi, o Aprendiz', 1, { life: 2, strength: 1, defense: 1, wisdom: 1 }, []),
  trainingSnapshot('training-balanced', 'Elias, o Equilibrado', 2, { life: 4, strength: 4, defense: 4, wisdom: 4 }, [
    { id: 'training-boots', name: 'Botas de Treino', power: 1, effectIds: ['pilgrim-boots'] },
  ]),
  trainingSnapshot('training-guardian', 'Mara, a Guardiã', 3, { life: 7, strength: 3, defense: 7, wisdom: 3 }, [
    { id: 'training-shield', name: 'Escudo de Treino', power: 3, effectIds: ['steadfast-shield'] },
    { id: 'training-armor', name: 'Couraça de Treino', power: 2, effectIds: ['traveler-armor'] },
  ]),
  trainingSnapshot('training-tactician', 'Noemi, a Estrategista', 3, { life: 4, strength: 4, defense: 4, wisdom: 8 }, [
    { id: 'training-amulet', name: 'Medalhão de Treino', power: 2, effectIds: ['prudence-amulet'] },
    { id: 'training-helmet', name: 'Elmo de Treino', power: 2, effectIds: ['traveler-helmet'] },
  ]),
];

export function nearestTrainingOpponent(power: number, opponents: readonly BattleParticipantSnapshot[]): BattleParticipantSnapshot {
  return [...opponents].sort((left, right) => Math.abs(left.combatPower - power) - Math.abs(right.combatPower - power))[0];
}
