import type { ArenaCard, ArenaBaseAction } from './arena-deck';

export type Content040Initiative = Readonly<{
  bonus: number;
  timing: 'current' | 'next';
  rounds?: number;
}>;
export type Content040Rule = Readonly<{
  mode: 'attack' | 'guard' | 'tactic' | 'support' | 'resistance';
  focusCost: number;
  minimumLevel: number;
  attackMultiplier?: number;
  multiplierWhenGuarded?: number;
  multiplierWhenUnguarded?: number;
  multiplierWhenSelfHpAtMost?: number;
  multiplierWhenSelfHpAtMostMultiplier?: number;
  requiresSelfHpAtMost?: number;
  multiplierWhenTargetHpAtMost?: number;
  multiplierWhenTargetHpAtMostMultiplier?: number;
  guardMultiplier?: number;
  guardHits?: number;
  guardRounds?: number;
  requiresNoGuard?: boolean;
  replaceOnlyIfBetter?: boolean;
  focusGain?: number;
  initiative?: Content040Initiative;
  tacticalMultiplier?: number;
  revealIntent?: boolean;
  healPercent?: number;
  healCap?: number;
  healWhenSelfHpAtMost?: number;
  focusGainWhenHealed?: number;
  damageReduction?: number;
  damageReductionRounds?: number;
  artPath: string;
  summary: string;
  explanation: string;
}>;

export type Content040CardDefinition = Omit<ArenaCard, 'action'> &
  Readonly<{
    action: ArenaBaseAction;
    minimumLevel: number;
    focusCost: number;
    artPath: string;
    summary: string;
    explanation: string;
    rule: Content040Rule;
  }>;

function define(
  id: string,
  name: string,
  rarity: ArenaCard['rarity'],
  type: ArenaCard['type'],
  folder: 'attack' | 'defense' | 'strategy' | 'support',
  minimumLevel: number,
  focusCost: number,
  summary: string,
  explanation: string,
  rule: Omit<
    Content040Rule,
    'focusCost' | 'minimumLevel' | 'artPath' | 'summary' | 'explanation'
  >,
): Content040CardDefinition {
  const action: ArenaBaseAction = type === 'OFFENSIVE' ? 'attack' : 'defend';
  const artPath = `/assets/cards/arena/content-040/${id}.webp`;
  return Object.freeze({
    id,
    name,
    rarity,
    type,
    action,
    minimumLevel,
    focusCost,
    artPath,
    summary,
    explanation,
    rule: Object.freeze({
      ...rule,
      minimumLevel,
      focusCost,
      artPath,
      summary,
      explanation,
    }),
  });
}

/** Owner-approved 040A card rules. Acquisition remains a separate server contract. */
export const ARENA_CONTENT_040_CARDS: readonly Content040CardDefinition[] =
  Object.freeze([
    define(
      'arena-card-traveler-charge',
      'Investida do Viajante',
      'comum',
      'OFFENSIVE',
      'attack',
      1,
      0,
      'Avance antes do golpe.',
      'Um ataque ×1,05; iniciativa +2 nesta rodada. Não gera Foco.',
      {
        mode: 'attack',
        attackMultiplier: 1.05,
        initiative: { bonus: 2, timing: 'current' },
      },
    ),
    define(
      'arena-card-precise-cut',
      'Corte Preciso',
      'incomum',
      'OFFENSIVE',
      'attack',
      3,
      1,
      'Encontre uma abertura na guarda.',
      '×1,20 contra guarda; ×1,05 sem guarda. A guarda continua reduzindo normalmente.',
      {
        mode: 'attack',
        multiplierWhenGuarded: 1.2,
        multiplierWhenUnguarded: 1.05,
      },
    ),
    define(
      'arena-card-brave-advance',
      'Avanço Corajoso',
      'incomum',
      'OFFENSIVE',
      'attack',
      4,
      2,
      'Ataque e proteja seu avanço.',
      'Ataque ×1,35 e guarda ×0,80 para um golpe até o fim da próxima rodada.',
      {
        mode: 'attack',
        attackMultiplier: 1.35,
        guardMultiplier: 0.8,
        guardHits: 1,
        guardRounds: 1,
      },
    ),
    define(
      'arena-card-perseverance-blow',
      'Golpe da Perseverança',
      'raro',
      'OFFENSIVE',
      'attack',
      8,
      2,
      'Responda sob pressão.',
      '×1,50 com HP próprio até 35%; caso contrário, ×1,20.',
      {
        mode: 'attack',
        attackMultiplier: 1.2,
        multiplierWhenSelfHpAtMost: 0.35,
        multiplierWhenSelfHpAtMostMultiplier: 1.5,
      },
    ),
    define(
      'arena-card-double-charge',
      'Investida Dupla',
      'raro',
      'OFFENSIVE',
      'attack',
      10,
      3,
      'Uma investida em dois movimentos.',
      'Uma única resolução ×1,55; guarda, esquiva e equipamentos processam uma vez. Os dois movimentos são apenas visuais.',
      { mode: 'attack', attackMultiplier: 1.55 },
    ),
    define(
      'arena-card-guard-break',
      'Ruptura de Guarda',
      'raro',
      'OFFENSIVE',
      'attack',
      11,
      2,
      'Pressione a defesa.',
      '×1,60 contra guarda; ×1,10 sem guarda. Não remove a proteção antes do ataque.',
      {
        mode: 'attack',
        multiplierWhenGuarded: 1.6,
        multiplierWhenUnguarded: 1.1,
      },
    ),
    define(
      'arena-card-decisive-blow',
      'Golpe Decisivo',
      'épico',
      'OFFENSIVE',
      'attack',
      16,
      3,
      'Aproveite o momento.',
      '×1,65 contra alvo com HP até 35%; caso contrário, ×1,25. Sem execução automática.',
      {
        mode: 'attack',
        attackMultiplier: 1.25,
        multiplierWhenTargetHpAtMost: 0.35,
        multiplierWhenTargetHpAtMostMultiplier: 1.65,
      },
    ),
    define(
      'arena-card-guardian-cut',
      'Corte do Guardião',
      'épico',
      'OFFENSIVE',
      'attack',
      18,
      3,
      'Ataque sem abandonar a guarda.',
      'Ataque ×1,40 e guarda ×0,60 para um golpe até o fim da próxima rodada.',
      {
        mode: 'attack',
        attackMultiplier: 1.4,
        guardMultiplier: 0.6,
        guardHits: 1,
        guardRounds: 1,
      },
    ),
    define(
      'arena-card-last-resistance',
      'Última Resistência',
      'lendário',
      'OFFENSIVE',
      'attack',
      25,
      3,
      'Um último contra-ataque.',
      'Só pode ser usada com HP próprio até 25%; ataque ×1,70. Sem cura ou invulnerabilidade.',
      { mode: 'attack', attackMultiplier: 1.7, requiresSelfHpAtMost: 0.25 },
    ),
    define(
      'arena-card-firm-block',
      'Bloqueio Firme',
      'comum',
      'DEFENSIVE',
      'defense',
      1,
      0,
      'Proteja-se e prepare Foco.',
      'Guarda ×0,70 para um golpe e recupera até 2 Foco, limitado a 3.',
      { mode: 'guard', guardMultiplier: 0.7, guardHits: 1, focusGain: 2 },
    ),
    define(
      'arena-card-prudent-posture',
      'Postura Prudente',
      'incomum',
      'DEFENSIVE',
      'defense',
      3,
      1,
      'Defenda e observe.',
      'Guarda ×0,40 para um golpe; o próximo ataque recebe ×1,08.',
      {
        mode: 'guard',
        guardMultiplier: 0.4,
        guardHits: 1,
        tacticalMultiplier: 1.08,
      },
    ),
    define(
      'arena-card-traveler-wall',
      'Muralha do Viajante',
      'incomum',
      'DEFENSIVE',
      'defense',
      5,
      1,
      'Resista ao próximo impacto.',
      'Guarda ×0,35 para um golpe; não gera Foco.',
      { mode: 'guard', guardMultiplier: 0.35, guardHits: 1 },
    ),
    define(
      'arena-card-reinforced-guard',
      'Guarda Reforçada',
      'incomum',
      'DEFENSIVE',
      'defense',
      9,
      2,
      'Resista a uma sequência de golpes.',
      'Guarda ×0,65 por até dois golpes não esquivados até o fim da próxima rodada. Requer ausência de guarda.',
      {
        mode: 'guard',
        guardMultiplier: 0.65,
        guardHits: 2,
        guardRounds: 1,
        requiresNoGuard: true,
      },
    ),
    define(
      'arena-card-strategic-defense',
      'Defesa Estratégica',
      'raro',
      'DEFENSIVE',
      'defense',
      11,
      2,
      'Prepare sua resposta.',
      'Guarda ×0,40 para um golpe e iniciativa +2 na próxima rodada.',
      {
        mode: 'guard',
        guardMultiplier: 0.4,
        guardHits: 1,
        initiative: { bonus: 2, timing: 'next' },
      },
    ),
    define(
      'arena-card-safe-shelter',
      'Abrigo Seguro',
      'épico',
      'DEFENSIVE',
      'defense',
      15,
      3,
      'Proteção breve contra pressão.',
      'Guarda ×0,35 por até dois golpes; expira no fim da próxima rodada. Não soma cargas e só substitui guarda se melhorar a proteção.',
      {
        mode: 'guard',
        guardMultiplier: 0.35,
        guardHits: 2,
        guardRounds: 1,
        replaceOnlyIfBetter: true,
      },
    ),
    define(
      'arena-card-courage-bastion',
      'Bastião da Coragem',
      'épico',
      'DEFENSIVE',
      'defense',
      18,
      3,
      'Segure um golpe decisivo.',
      'Só com HP próprio até 50%; guarda ×0,20 para um golpe. Não cura.',
      {
        mode: 'guard',
        guardMultiplier: 0.2,
        guardHits: 1,
        requiresSelfHpAtMost: 0.5,
      },
    ),
    define(
      'arena-card-persevering-fortress',
      'Fortaleza Perseverante',
      'lendário',
      'DEFENSIVE',
      'defense',
      26,
      3,
      'Sustente a linha por um instante.',
      'Guarda ×0,25 por até dois golpes até o fim da próxima rodada. Só substitui guarda se melhorar a proteção.',
      {
        mode: 'guard',
        guardMultiplier: 0.25,
        guardHits: 2,
        guardRounds: 1,
        replaceOnlyIfBetter: true,
      },
    ),
    define(
      'arena-card-breathe-observe',
      'Respirar e Observar',
      'comum',
      'TACTICAL',
      'strategy',
      1,
      0,
      'Prepare-se para agir primeiro.',
      '+1 Foco e iniciativa +3 na próxima rodada. Não protege nem causa dano; bônus de iniciativa não se acumula.',
      {
        mode: 'tactic',
        focusGain: 1,
        initiative: { bonus: 3, timing: 'next' },
      },
    ),
    define(
      'arena-card-side-step',
      'Passo Lateral',
      'incomum',
      'TACTICAL',
      'strategy',
      4,
      1,
      'Mude o ângulo do confronto.',
      'Iniciativa +3 nesta rodada e guarda ×0,70 para um golpe até o fim da rodada; não garante esquiva.',
      {
        mode: 'tactic',
        guardMultiplier: 0.7,
        guardHits: 1,
        guardRounds: 0,
        initiative: { bonus: 3, timing: 'current' },
      },
    ),
    define(
      'arena-card-opponent-reading',
      'Leitura do Adversário',
      'incomum',
      'TACTICAL',
      'strategy',
      6,
      1,
      'Leia o ritmo do combate.',
      'O próximo ataque recebe ×1,12; após a resolução, mostra apenas a intenção provável permitida.',
      { mode: 'tactic', tacticalMultiplier: 1.12, revealIntent: true },
    ),
    define(
      'arena-card-careful-preparation',
      'Preparação Cuidadosa',
      'incomum',
      'TACTICAL',
      'strategy',
      7,
      1,
      'Prepare um golpe calculado.',
      'O próximo ataque recebe ×1,18 e a iniciativa aumenta +1 na próxima rodada.',
      {
        mode: 'tactic',
        tacticalMultiplier: 1.18,
        initiative: { bonus: 1, timing: 'next' },
      },
    ),
    define(
      'arena-card-reposition',
      'Reposicionamento',
      'raro',
      'TACTICAL',
      'strategy',
      10,
      2,
      'Conquiste uma posição melhor.',
      'Guarda ×0,55 para um golpe e iniciativa +4 na próxima rodada. Não move o personagem no mapa.',
      {
        mode: 'tactic',
        guardMultiplier: 0.55,
        guardHits: 1,
        initiative: { bonus: 4, timing: 'next' },
      },
    ),
    define(
      'arena-card-tactical-planning',
      'Planejamento Tático',
      'raro',
      'TACTICAL',
      'strategy',
      12,
      2,
      'Prepare a próxima ofensiva.',
      'O próximo ataque recebe ×1,30; após o custo, recupera até 1 Foco, limitado a 3.',
      { mode: 'tactic', tacticalMultiplier: 1.3, focusGain: 1 },
    ),
    define(
      'arena-card-constant-watch',
      'Vigilância Constante',
      'épico',
      'TACTICAL',
      'strategy',
      17,
      2,
      'Mantenha a leitura do adversário.',
      'Iniciativa +4 nas próximas duas rodadas; revela intenção provável após cada resolução, sem expor a escolha futura.',
      {
        mode: 'tactic',
        initiative: { bonus: 4, timing: 'next', rounds: 2 },
        revealIntent: true,
      },
    ),
    define(
      'arena-card-master-strategy',
      'Estratégia do Mestre',
      'lendário',
      'TACTICAL',
      'strategy',
      28,
      3,
      'Una preparo e proteção.',
      'O próximo ataque recebe ×1,45 e uma guarda ×0,60 protege um golpe até o fim da próxima rodada. Não acumula vantagens.',
      {
        mode: 'tactic',
        tacticalMultiplier: 1.45,
        guardMultiplier: 0.6,
        guardHits: 1,
        guardRounds: 1,
      },
    ),
    define(
      'arena-card-regather-strength',
      'Recompor Forças',
      'incomum',
      'TACTICAL',
      'support',
      3,
      1,
      'Recupere um pouco de vida.',
      'Cura C(10%;6), limitada pela vida faltante e pelo orçamento compartilhado de cura.',
      { mode: 'support', healPercent: 0.1, healCap: 6 },
    ),
    define(
      'arena-card-renewed-courage',
      'Coragem Renovada',
      'incomum',
      'TACTICAL',
      'support',
      5,
      1,
      'Reúna coragem para continuar.',
      'Cura C(8%;4) e recupera até 1 Foco após custo, somente se a cura for efetiva.',
      {
        mode: 'support',
        healPercent: 0.08,
        healCap: 4,
        focusGainWhenHealed: 1,
      },
    ),
    define(
      'arena-card-prudent-recovery',
      'Recuperação Prudente',
      'raro',
      'TACTICAL',
      'support',
      9,
      2,
      'Recupere-se com cautela.',
      'Cura C(8%;8) e guarda ×0,75 para um golpe até o fim da próxima rodada.',
      {
        mode: 'support',
        healPercent: 0.08,
        healCap: 8,
        guardMultiplier: 0.75,
        guardHits: 1,
        guardRounds: 1,
      },
    ),
    define(
      'arena-card-persevering-spirit',
      'Ânimo Perseverante',
      'raro',
      'TACTICAL',
      'support',
      12,
      2,
      'Retome o ritmo.',
      'Cura C(8%;5) e prepara ×1,12 para o próximo ataque.',
      {
        mode: 'support',
        healPercent: 0.08,
        healCap: 5,
        tacticalMultiplier: 1.12,
      },
    ),
    define(
      'arena-card-second-wind',
      'Segundo Fôlego',
      'épico',
      'TACTICAL',
      'support',
      16,
      2,
      'Ganhe fôlego sob pressão.',
      'Só com HP próprio até 50%; cura C(10%;10).',
      {
        mode: 'support',
        healPercent: 0.1,
        healCap: 10,
        healWhenSelfHpAtMost: 0.5,
      },
    ),
    define(
      'arena-card-heroic-endurance',
      'Resistência Heroica',
      'épico',
      'TACTICAL',
      'support',
      20,
      3,
      'Resista à pressão por duas rodadas.',
      'Dano recebido ×0,70 por duas rodadas incluindo a atual. Não multiplica guarda; aplica somente a melhor proteção.',
      { mode: 'resistance', damageReduction: 0.7, damageReductionRounds: 2 },
    ),
    define(
      'arena-card-unwavering-resolve',
      'Determinação Inabalável',
      'raro',
      'TACTICAL',
      'support',
      14,
      2,
      'Erga-se para responder.',
      'Só com HP próprio até 35%; cura C(10%;7) e iniciativa +2 na próxima rodada.',
      {
        mode: 'support',
        healPercent: 0.1,
        healCap: 7,
        healWhenSelfHpAtMost: 0.35,
        initiative: { bonus: 2, timing: 'next' },
      },
    ),
    define(
      'arena-card-firm-until-end',
      'Firme Até o Fim',
      'lendário',
      'TACTICAL',
      'support',
      30,
      3,
      'Permaneça firme sob pressão.',
      'Só com HP próprio até 25%; cura C(8%;8) e guarda ×0,35 para um golpe até o fim da próxima rodada.',
      {
        mode: 'support',
        healPercent: 0.08,
        healCap: 8,
        healWhenSelfHpAtMost: 0.25,
        guardMultiplier: 0.35,
        guardHits: 1,
        guardRounds: 1,
      },
    ),
  ]);

export const CONTENT_040_CARD_BY_ID = new Map(
  ARENA_CONTENT_040_CARDS.map((entry) => [entry.id, entry]),
);
