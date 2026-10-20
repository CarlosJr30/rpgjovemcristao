import {
  battleBalanceConfig as rules,
  calculateEquipmentPower,
  equipmentEffects,
  normalizeBattleStat,
  type BattleEffectId,
  type BattleFighterState,
  type BattleLogEntry,
  type BattleParticipantSnapshot,
  type BattleState,
} from './index';
import {
  arenaCombatConfig,
  arenaSpecials,
  specialCost,
} from './arena-combat-v2';
import type { ArenaBaseAction } from './arena-deck';

export const arenaNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(value);
const n = arenaNumber;
const mult = (value: number) => `×${n(value)}`;
const has = (fighter: BattleFighterState, id: BattleEffectId) =>
  fighter.snapshot.equipment.some((e) => e.effectIds.includes(id));
export type ArenaRuleDescription = Readonly<{
  headline: string;
  explanation: string;
  condition: string;
  duration: string;
  focusCost: number;
  minimumLevel: number;
}>;
export function arenaAttributeRules() {
  return {
    life: `Vida máxima = arredondar(${n(rules.hpBase)} + ${n(rules.hpPerLife)} × Vida). Não é cura.`,
    strength: `Cada ponto de Força acrescenta ${n(rules.strengthDamageMultiplier)} à parcela ofensiva antes da Defesa, multiplicadores e arredondamentos; não é dano final fixo.`,
    defense: `Cada ponto de Defesa subtrai ${n(rules.defenseReductionMultiplier)} antes dos multiplicadores e arredondamentos. Dano mínimo ${n(rules.minimumDamage)}, salvo esquiva.`,
    wisdom: `Iniciativa: ${n(rules.wisdomInitiativeMultiplier)} × Sabedoria, mais efeitos e variação determinística. Discernimento: ${mult(rules.focusBaseMultiplier)} + ${n(rules.focusPerWisdom)} × Sabedoria, limitado a ${mult(rules.focusMaximumMultiplier)}.`,
  } as const;
}
export function arenaDamageRule() {
  return `Parcela ofensiva = ${n(rules.baseDamage)} + ${n(rules.strengthDamageMultiplier)} × Força + ${n(rules.equipmentPowerDamageMultiplier)} × soma do poder de todos os itens equipados. Subtrai ${n(rules.defenseReductionMultiplier)} × Defesa do alvo; aplica multiplicadores e arredonda ao inteiro mais próximo, mínimo ${n(rules.minimumDamage)}. Atributos e poder de cada item limitados a 0–${n(rules.maximumStat)}. Guarda/armadura arredondam para cima em etapas; esquiva causa 0 e dano aplicado não ultrapassa o HP restante.`;
}
export function describeArenaAction(
  action: ArenaBaseAction | null,
  fighter?: BattleFighterState,
): ArenaRuleDescription {
  const special = arenaSpecials.find((s) => `special:${s.id}` === action);
  const base = {
    focusCost: special
      ? fighter
        ? specialCost(fighter.snapshot, special)
        : special.focusCost
      : 0,
    minimumLevel: special?.minimumLevel ?? 1,
    condition:
      'Carta selecionada, ainda não usada; batalha aberta e rodada atual.',
  };
  const rounding = `Arredonda para cima, mínimo ${n(rules.minimumDamage)}; a redução final pode variar pelo arredondamento.`;
  if (action === 'attack')
    return {
      ...base,
      headline: `Ataque básico · até +${n(arenaCombatConfig.attackFocus)} Foco`,
      explanation: `Ao executar, gera até ${n(arenaCombatConfig.attackFocus)} Foco, limitado a ${n(arenaCombatConfig.maximumFocus)}; se cair antes de agir, não gera Foco. ${arenaDamageRule()}`,
      duration:
        'Um ataque aceito; bônus preparados são consumidos quando o ataque é executado.',
    };
  if (action === 'defend')
    return {
      ...base,
      headline: `Dano recebido ${mult(rules.defendDamageMultiplier)} · até +${n(arenaCombatConfig.defendFocus)} Foco`,
      explanation: `Gera até ${n(arenaCombatConfig.defendFocus)} Foco, limitado a ${n(arenaCombatConfig.maximumFocus)}. Aplica ${mult(rules.defendDamageMultiplier)} ao dano já arredondado do próximo golpe recebido. ${rounding} Não soma Defesa nem cura. A armadura pode multiplicar a proteção depois.`,
      duration:
        'Até receber um golpe não esquivado; sem prazo fixo em turnos. Não substitui uma Guarda forte já preparada.',
    };
  if (action === 'special:path-strike') {
    const power =
      fighter?.snapshot.specialModifiers?.['path-strike']?.powerMultiplier;
    const boundedPower = Number.isFinite(power)
      ? Math.max(
          1,
          Math.min(arenaCombatConfig.maximumSpecialPowerMultiplier, power!),
        )
      : 1;
    return {
      ...base,
      headline: `Golpe ${mult(arenaCombatConfig.strikeMultiplier)}`,
      explanation: `Multiplica por ${n(arenaCombatConfig.strikeMultiplier)} a parcela ofensiva menos a Defesa, antes do arredondamento e da guarda. Não é percentual da vida do alvo. Modificador de potência do snapshot: ${mult(boundedPower)}. Reforços da espada e vantagem preparada podem multiplicar esse resultado.`,
      duration:
        'Um ataque; carta consumida após aceite. Se cair antes de agir, o turno aceito ainda gasta a carta.',
    };
  }
  if (action === 'special:steadfast-guard')
    return {
      ...base,
      headline: `Próximo dano recebido ${mult(rules.fortifiedDefendDamageMultiplier)}`,
      explanation: `Guarda preparada antes da iniciativa; aplica ${mult(rules.fortifiedDefendDamageMultiplier)} ao dano já arredondado, no lugar da defesa básica ${mult(rules.defendDamageMultiplier)}. ${rounding} O escudo não acrescenta outro multiplicador.`,
      duration:
        'Próximo golpe não esquivado; permanece preparada até esse golpe, sem prazo fixo em turnos.',
    };
  if (action === 'special:discernment') {
    const boost =
      fighter &&
      has(fighter, 'prudence-amulet') &&
      (fighter.cooldowns['prudence-amulet'] ?? 0) === 0 &&
      fighter.usedEffects.filter((id) => id === 'prudence-amulet').length <
        equipmentEffects['prudence-amulet'].usesPerBattle
        ? rules.prudenceAmuletBoost
        : 0;
    const value = fighter
      ? Math.min(
          rules.focusMaximumMultiplier,
          rules.focusBaseMultiplier +
            boost +
            normalizeBattleStat(fighter.snapshot.attributes.wisdom) *
              rules.focusPerWisdom,
        )
      : null;
    return {
      ...base,
      headline:
        value === null
          ? `Próximo ataque até ${mult(rules.focusMaximumMultiplier)}`
          : `Multiplicador preparado: ${mult(value)}`,
      explanation: `Prepara multiplicador ${n(rules.focusBaseMultiplier)} + ${n(rules.focusPerWisdom)} × Sabedoria${boost ? ` + ${n(boost)} do amuleto disponível` : ''}, limitado a ${n(rules.focusMaximumMultiplier)}. Aplica sobre a parcela ofensiva menos a Defesa, antes do arredondamento. Revela somente a intenção provável permitida pela mecânica após o uso.`,
      duration:
        'Próximo ataque executado, básico ou Golpe; substitui a vantagem anterior, não acumula. Defesa não a consome.',
    };
  }
  if (action === 'special:pilgrim-step')
    return {
      ...base,
      headline: 'Evita o próximo golpe recebido · dano 0',
      explanation:
        'Prepara uma esquiva garantida para um golpe recebido; não usa probabilidade nem recupera vida. Tem prioridade sobre o uso automático das botas.',
      duration:
        'Um golpe recebido; permanece até ocorrer, sem prazo fixo em turnos. Não acumula esquivas ao repetir.',
    };
  return {
    ...base,
    headline: 'Efeito indisponível',
    explanation: 'Efeito ainda indisponível.',
    duration: 'Não pode ser ativada.',
  };
}
export function describeArenaEffect(
  id: BattleEffectId,
  fighter?: BattleFighterState,
) {
  const effect = equipmentEffects[id];
  const descriptions: Record<
    BattleEffectId,
    Pick<
      ArenaRuleDescription,
      'headline' | 'explanation' | 'condition' | 'duration'
    >
  > = {
    'path-sword': {
      headline: `Reforço do Golpe ${mult(rules.swordAttackMultiplier)}; resposta após Defender ${mult(rules.swordAfterDefendMultiplier)}`,
      explanation: `O reforço do Golpe do Caminho multiplica antes do arredondamento e tem ${effect.usesPerBattle} uso por batalha. Separadamente, um ataque na rodada imediatamente após Defender recebe ${mult(rules.swordAfterDefendMultiplier)}, sem gastar esse reforço. Não é aumento fixo de Força.`,
      condition:
        'Golpe por carta válida para o reforço; ataque após uma rodada de defesa para a resposta.',
      duration: 'Cada bônus vale para o ataque correspondente.',
    },
    'steadfast-shield': {
      headline: 'Registro automático da Guarda; sem redução adicional',
      explanation: `Ao usar Guarda Perseverante, registra ${effect.usesPerBattle} uso do escudo. A proteção continua ${mult(rules.fortifiedDefendDamageMultiplier)} da própria Guarda; o reforço não reduz dano além disso. Os atributos do item continuam aplicados.`,
      condition: 'Guarda por carta válida; não ativa pela defesa básica.',
      duration: 'A Guarda protege o próximo golpe não esquivado.',
    },
    'prudence-amulet': {
      headline: `+${n(rules.prudenceAmuletBoost)} ao multiplicador de Discernimento`,
      explanation: `Soma ${n(rules.prudenceAmuletBoost)} antes do teto ${mult(rules.focusMaximumMultiplier)}; no teto, o ganho pode ser 0. Não concede Foco de recurso. ${effect.usesPerBattle} reforços por batalha; espera ${effect.cooldown} rodadas após o uso.`,
      condition:
        'Discernimento por carta válida, usos restantes e cooldown zerado.',
      duration:
        'Vantagem no próximo ataque executado; não acumula com vantagem anterior.',
    },
    'pilgrim-boots': {
      headline: `Evita ${effect.usesPerBattle} golpe no limiar de ${n(rules.lowHealthThreshold * 100)}% da vida máxima`,
      explanation: `Se a vida projetada após o golpe ficar em ${n(rules.lowHealthThreshold * 100)}% ou menos da vida máxima, evita todo esse golpe. Sem teste de chance. Mobilidade já preparada evita primeiro, preservando o uso das botas.`,
      condition: 'Receber ataque que alcance o limiar; botas ainda não usadas.',
      duration:
        'Um golpe por batalha; a carta Passo e a esquiva do perfil Ágil são efeitos separados.',
    },
    'traveler-helmet': {
      headline: `+${n(rules.helmetInitiativeBonus)} Iniciativa`,
      explanation: `Soma ${n(rules.helmetInitiativeBonus)} à iniciativa de cada rodada, além de ${n(rules.wisdomInitiativeMultiplier)} × Sabedoria e da variação determinística. Não aumenta dano por esse efeito.`,
      condition: 'Elmo equipado.',
      duration: 'Todas as rodadas; passivo sem consumo.',
    },
    'traveler-armor': {
      headline: `Dano sob guarda ${mult(rules.armorDefendDamageMultiplier)} adicional`,
      explanation: `Após a redução da defesa ou Guarda, multiplica o dano por ${n(rules.armorDefendDamageMultiplier)}, arredonda para cima, mínimo ${n(rules.minimumDamage)}. Não reduz o dano por esse efeito quando não há guarda.`,
      condition:
        'Armadura equipada e guarda básica ou forte no golpe recebido.',
      duration: 'Em cada golpe coberto por guarda; passivo sem consumo.',
    },
  };
  return {
    ...descriptions[id],
    usesRemaining:
      effect.type === 'PASSIVE'
        ? null
        : Math.max(
            0,
            effect.usesPerBattle -
              (fighter?.usedEffects.filter((used) => used === id).length ?? 0),
          ),
    cooldownRemaining: fighter?.cooldowns[id] ?? 0,
  };
}
export function arenaOffensiveTerm(snapshot: BattleParticipantSnapshot) {
  return (
    rules.baseDamage +
    normalizeBattleStat(snapshot.attributes.strength) *
      rules.strengthDamageMultiplier +
    calculateEquipmentPower(snapshot) * rules.equipmentPowerDamageMultiplier
  );
}
export function arenaConfirmedLog(battle: BattleState, entry: BattleLogEntry) {
  if (!entry.specialId || entry.focusAfter === undefined) return entry.message;
  const special = arenaSpecials.find((s) => s.id === entry.specialId);
  const actor = [battle.player, battle.opponent].find(
    (f) => f.snapshot.id === entry.actorId,
  );
  if (!special || !actor) return entry.message;
  return `${entry.message} Consumiu ${n(specialCost(actor.snapshot, special))} Foco; Foco após a ação: ${n(entry.focusAfter)}.`;
}
