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
import {
  ARENA_CONTENT_040_CARDS,
  CONTENT_040_CARD_BY_ID,
} from './arena-content-040';

export const ARENA_CARD_CATALOG_VERSION = 'arena-cards-2026-10-20.2';
export const CONTENT_040_CARD_CATALOG_VERSION =
  'arena-cards-2026-11-09.1-content-040a';
export const ARENA_CARD_ID_PREFIX = 'arena-card-';
export const ARENA_CARD_BALANCE_VERSION = 'arena-v2-measured-strike-003a.1';
export const CONTENT_040_CARD_RULES_VERSION = 'arena-content-040a-2026-11-09.1';
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
  catalogVersion:
    typeof ARENA_CARD_CATALOG_VERSION | typeof CONTENT_040_CARD_CATALOG_VERSION;
  balanceVersion:
    typeof ARENA_CARD_BALANCE_VERSION | typeof CONTENT_040_CARD_RULES_VERSION;
  biblicalReference: string | null;
  art: Readonly<{ approved: boolean; reference: string | null }>;
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

/** Static approved definitions. Possession remains receipt-backed and separate. */
export function getArenaCardCatalog(): readonly OfficialArenaCardDefinition[] {
  return Object.freeze([
    ...identities.map((identity) => {
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
    ...ARENA_CONTENT_040_CARDS.map((entry) => ({
      id: entry.id,
      name: entry.name,
      type: entry.type,
      rarity: entry.rarity as ArenaCardRarity,
      action: entry.action,
      description: Object.freeze({
        focusCost: entry.focusCost,
        minimumLevel: entry.minimumLevel,
        condition:
          'Carta própria, não usada nesta batalha, com nível, Foco e condição de HP atendidos.',
        headline: entry.summary,
        explanation: entry.explanation,
        duration:
          'Uma utilização por batalha; ocupa a ação da rodada. O resultado usa somente regras do servidor.',
      }),
      parameters: Object.freeze(
        Object.fromEntries(
          Object.entries(entry.rule).filter(
            ([, value]) => typeof value === 'number',
          ),
        ) as Record<string, number>,
      ),
      minimumLevel: entry.minimumLevel,
      focusCost: entry.focusCost,
      usesPerBattle: 1 as const,
      remainsOwnedAfterBattle: true as const,
      catalogVersion:
        CONTENT_040_CARD_CATALOG_VERSION as typeof CONTENT_040_CARD_CATALOG_VERSION,
      balanceVersion:
        CONTENT_040_CARD_RULES_VERSION as typeof CONTENT_040_CARD_RULES_VERSION,
      biblicalReference: null,
      art: Object.freeze({ approved: true, reference: entry.artPath }),
      homologation: Object.freeze({
        status: 'approved' as const,
        approvalReference: 'CONTENT-040A:OWNER:2026-11-09',
      }),
      acquisition: Object.freeze({
        status: 'pending-server-contract' as const,
        proposedSources,
        authorizedSources: Object.freeze([]),
        approvalReference: null,
      }),
    })),
  ]);
}

export function findArenaCardDefinition(id: unknown) {
  return typeof id === 'string'
    ? (getArenaCardCatalog().find((entry) => entry.id === id) ?? null)
    : null;
}

/** Costs/descriptions use the actual frozen fighter, including equipment modifiers. */
export function describeCatalogCard(id: unknown, fighter?: BattleFighterState) {
  const definition = findArenaCardDefinition(id);
  const content =
    typeof id === 'string' ? CONTENT_040_CARD_BY_ID.get(id) : undefined;
  if (content)
    return Object.freeze({
      focusCost: content.focusCost,
      minimumLevel: content.minimumLevel,
      condition:
        'Carta própria, não usada nesta batalha, com nível, Foco e condição de HP atendidos.',
      headline: content.summary,
      explanation: content.explanation,
      duration:
        'Uma utilização por batalha; ocupa a ação da rodada. O resultado usa somente regras do servidor.',
    });
  return definition ? describeArenaAction(definition.action, fighter) : null;
}

export function getApprovedArenaCards(): readonly ArenaCard[] {
  return Object.freeze(
    getArenaCardCatalog()
      .filter(
        (entry) =>
          entry.homologation.status === 'approved' &&
          !!entry.homologation.approvalReference,
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

export function arenaRulesVersionForDeck(
  cards: readonly Pick<ArenaCard, 'id'>[],
): string {
  return cards.some((card) => CONTENT_040_CARD_BY_ID.has(card.id))
    ? CONTENT_040_CARD_RULES_VERSION
    : ARENA_CARD_BALANCE_VERSION;
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
    // Definitions alone never authorize client inventory, grants, or acquisition.
    collectionAvailable: false,
    starterAvailable: false,
    authoritativeAcquisitionAvailable: false,
    blockers: Object.freeze([
      ...(missing ? ['seventh-effect-pending' as const] : []),
      'server-acquisition-pending',
    ] as const),
  });
}
