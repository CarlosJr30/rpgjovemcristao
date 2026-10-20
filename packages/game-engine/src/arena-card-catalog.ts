import { battleBalanceConfig as rules, type BattleFighterState } from './index';
import { arenaCombatConfig, arenaSpecials } from './arena-combat-v2';
import {
  describeArenaAction,
  type ArenaRuleDescription,
} from './arena-descriptions';
import {
  ARENA_CARD_ACTIONS,
  ARENA_DECK_SIZE,
  type ArenaBaseAction,
  type ArenaCard,
} from './arena-deck';

export const ARENA_CARD_CATALOG_VERSION = 'arena-cards-2026-10-20.2';
export const ARENA_CARD_ID_PREFIX = 'arena-card-';
export const ARENA_CARD_BALANCE_VERSION = 'arena-v2-measured-strike-003a.1';
export const ARENA_CARD_RARITIES = Object.freeze([
  'comum',
  'incomum',
  'raro',
  'épico',
  'lendário',
] as const);
export type ArenaCardRarity = (typeof ARENA_CARD_RARITIES)[number];
export type ArenaCardAcquisitionSource =
  'starter' | 'chest' | 'guild-mission' | 'journey' | 'authorized-challenge';
export type OfficialArenaCardDefinition = Readonly<{
  id: string;
  name: string;
  type: ArenaCard['type'];
  rarity: ArenaCardRarity;
  action: ArenaBaseAction;
  description: ArenaRuleDescription;
  parameters: Readonly<Record<string, number>>;
  minimumLevel: number;
  focusCost: number;
  usesPerBattle: 1;
  remainsOwnedAfterBattle: true;
  catalogVersion: typeof ARENA_CARD_CATALOG_VERSION;
  balanceVersion: typeof ARENA_CARD_BALANCE_VERSION;
  biblicalReference: string | null;
  art: Readonly<{ approved: false; reference: null }>;
  homologation: Readonly<{
    status: 'proposed' | 'approved' | 'retired';
    approvalReference: string | null;
  }>;
  acquisition: Readonly<{
    status: 'pending-server-contract' | 'enabled';
    proposedSources: readonly ArenaCardAcquisitionSource[];
    authorizedSources: readonly ArenaCardAcquisitionSource[];
    approvalReference: string | null;
  }>;
}>;

const proposedSources: readonly ArenaCardAcquisitionSource[] = Object.freeze([
  'starter',
  'chest',
  'guild-mission',
  'journey',
  'authorized-challenge',
]);
const identities: readonly Readonly<{
  id: string;
  action: ArenaBaseAction;
  name: string;
  type: ArenaCard['type'];
}>[] = Object.freeze([
  Object.freeze({
    id: 'arena-card-basic-attack',
    action: 'attack',
    name: 'Ataque Simples',
    type: 'OFFENSIVE',
  }),
  Object.freeze({
    id: 'arena-card-basic-defense',
    action: 'defend',
    name: 'Defesa',
    type: 'DEFENSIVE',
  }),
  Object.freeze({
    id: 'arena-card-path-strike',
    action: 'special:path-strike',
    name: 'Golpe do Caminho',
    type: 'OFFENSIVE',
  }),
  Object.freeze({
    id: 'arena-card-steadfast-guard',
    action: 'special:steadfast-guard',
    name: 'Guarda Perseverante',
    type: 'DEFENSIVE',
  }),
  Object.freeze({
    id: 'arena-card-discernment',
    action: 'special:discernment',
    name: 'Discernimento',
    type: 'TACTICAL',
  }),
  Object.freeze({
    id: 'arena-card-pilgrim-step',
    action: 'special:pilgrim-step',
    name: 'Passo do Peregrino',
    type: 'TACTICAL',
  }),
  Object.freeze({
    id: 'arena-card-measured-strike',
    action: 'special:measured-strike',
    name: 'Golpe Medido',
    type: 'OFFENSIVE',
  }),
]);

// Inspection data only: the resolver still selects its own constants by action.
// Never accept this object, an effect or numeric overrides from a browser command.
function parameters(action: ArenaBaseAction): Readonly<Record<string, number>> {
  const maximumFocus = arenaCombatConfig.maximumFocus;
  if (
    action === 'attack' ||
    action === 'special:path-strike' ||
    action === 'special:measured-strike'
  )
    return Object.freeze({
      baseDamage: rules.baseDamage,
      strengthMultiplier: rules.strengthDamageMultiplier,
      equipmentPowerMultiplier: rules.equipmentPowerDamageMultiplier,
      defenseMultiplier: rules.defenseReductionMultiplier,
      minimumDamage: rules.minimumDamage,
      maximumStat: rules.maximumStat,
      offensiveMultiplier:
        action === 'attack'
          ? 1
          : action === 'special:path-strike'
            ? arenaCombatConfig.strikeMultiplier
            : arenaCombatConfig.measuredStrikeMultiplier,
      gainedFocus: action === 'attack' ? arenaCombatConfig.attackFocus : 0,
      maximumSpecialPowerMultiplier:
        arenaCombatConfig.maximumSpecialPowerMultiplier,
      maximumFocus,
    });
  if (action === 'defend' || action === 'special:steadfast-guard')
    return Object.freeze({
      receivedDamageMultiplier:
        action === 'defend'
          ? rules.defendDamageMultiplier
          : rules.fortifiedDefendDamageMultiplier,
      armorMultiplier: rules.armorDefendDamageMultiplier,
      minimumDamage: rules.minimumDamage,
      gainedFocus: action === 'defend' ? arenaCombatConfig.defendFocus : 0,
      maximumFocus,
    });
  if (action === 'special:discernment')
    return Object.freeze({
      baseMultiplier: rules.focusBaseMultiplier,
      wisdomMultiplier: rules.focusPerWisdom,
      maximumMultiplier: rules.focusMaximumMultiplier,
      amuletBoost: rules.prudenceAmuletBoost,
      maximumStat: rules.maximumStat,
      maximumFocus,
    });
  return Object.freeze({ avoidedHits: 1, receivedDamage: 0, maximumFocus });
}

/** Registry of proposals, not an owned collection or authorization to grant. */
export function getArenaCardCatalog(): readonly OfficialArenaCardDefinition[] {
  return Object.freeze(
    identities.map((identity) => {
      const special = arenaSpecials.find(
        (entry) => `special:${entry.id}` === identity.action,
      );
      return Object.freeze({
        ...identity,
        name: special?.name ?? identity.name,
        type: special?.type ?? identity.type,
        rarity: 'comum' as const,
        description: Object.freeze(describeArenaAction(identity.action)),
        parameters: parameters(identity.action),
        minimumLevel: special?.minimumLevel ?? 1,
        focusCost: special?.focusCost ?? 0,
        usesPerBattle: 1 as const,
        remainsOwnedAfterBattle: true as const,
        catalogVersion: ARENA_CARD_CATALOG_VERSION,
        balanceVersion: ARENA_CARD_BALANCE_VERSION,
        biblicalReference: null,
        art: Object.freeze({ approved: false as const, reference: null }),
        homologation: Object.freeze({
          status: 'proposed' as const,
          approvalReference: null,
        }),
        acquisition: Object.freeze({
          status: 'pending-server-contract' as const,
          proposedSources,
          authorizedSources: Object.freeze([]),
          approvalReference: null,
        }),
      });
    }),
  );
}

export function findArenaCardDefinition(id: unknown) {
  return typeof id === 'string'
    ? (getArenaCardCatalog().find((entry) => entry.id === id) ?? null)
    : null;
}

/** Costs/descriptions use the actual frozen fighter, including equipment modifiers. */
export function describeCatalogCard(id: unknown, fighter?: BattleFighterState) {
  const definition = findArenaCardDefinition(id);
  return definition ? describeArenaAction(definition.action, fighter) : null;
}

export function getApprovedArenaCards(): readonly ArenaCard[] {
  return Object.freeze(
    getArenaCardCatalog()
      .filter(
        (entry) =>
          entry.homologation.status === 'approved' &&
          !!entry.homologation.approvalReference &&
          entry.acquisition.status === 'enabled' &&
          !!entry.acquisition.approvalReference &&
          entry.acquisition.authorizedSources.length > 0,
      )
      .map(({ id, name, rarity, type, action }) =>
        Object.freeze({ id, name, rarity, type, action }),
      ),
  );
}

/** Resolves only a server-known ID. No user-supplied definition can be promoted. */
export function resolveApprovedArenaCard(id: unknown): ArenaCard | null {
  return typeof id === 'string'
    ? (getApprovedArenaCards().find((entry) => entry.id === id) ?? null)
    : null;
}

export function getArenaCardReadiness(level = 1) {
  if (!Number.isSafeInteger(level) || level < 1)
    throw new Error('Nível inválido.');
  const proposals = getArenaCardCatalog();
  const approved = getApprovedArenaCards();
  const missing = Math.max(
    0,
    ARENA_DECK_SIZE - new Set(proposals.map((entry) => entry.action)).size,
  );
  return Object.freeze({
    requiredDeckSize: ARENA_DECK_SIZE,
    proposedCards: proposals.length,
    distinctExistingEffects: new Set(ARENA_CARD_ACTIONS).size,
    missingDistinctEffects: missing,
    approvedCards: approved.length,
    proposedUsableAtLevel: proposals.filter(
      (entry) => entry.minimumLevel <= level,
    ).length,
    // No authoritative entitlement/starter/receipt protocol exists yet. Adding a
    // catalog approval alone must never activate browser inventory as authority.
    collectionAvailable: false,
    starterAvailable: false,
    authoritativeAcquisitionAvailable: false,
    blockers: Object.freeze([
      ...(missing ? ['seventh-effect-pending' as const] : []),
      'homologation-pending',
      'server-acquisition-pending',
      'starter-contract-pending',
    ] as const),
  });
}
