# Golpe Medido003A — revisão do autor

QA/Security pelo autor, sem revisão independente. Objetivo autorizado: implementação e balanceamento local de candidata. IMPLEMENTATION_LOCAL_DONE depende dos gates finais; PRODUCT_RELEASE_BLOCKED permanece por homologação/concessão/backend e P1 econômico herdado.

## Controles

- Sete propostas distintas, IDs únicos, nova versão de catálogo/regras. Todas continuam proposed, acquisition pending-server-contract, fontes autorizadas vazias; getApprovedArenaCards/APPROVED_ARENA_CARDS vazios e starter/collection indisponíveis.
- Nova ação cardOnly, fora do loadout legado padrão/explícito e da IA. Somente branch interna de carta válida pode ativá-la. Comando direto, objeto de efeito, ID estranho, deck ausente/owner errado, batalha fechada/ID ou rodada incorretos são negados sem consumo.
- Exatamente7, Foco0–3, custo/piso1, nível1, uso único após comando aceito e recuperação por replay mantidos. Rejeição não consome. Comando aceito continua consumindo carta mesmo se o ator cair antes de agir, conforme semântica preexistente; isso não transforma uma rejeição em aceite.
- Especial sem Foco fica desabilitado na UI existente. Dados numéricos vêm do motor/descrições, sem botão independente. Enumerações legadas/avisos/lab filtram cardOnly para evitar ativação ou desbloqueio por nível da candidata.
- Storage testa concorrência/stale, reload, conta/Traveler, derrota, andar seguinte com identidade nova e claimSettlement=false na Torre. Nenhum storage visual vira recibo de aquisição. Inputs e snapshots sintéticos pertencem exclusivamente aos testes/harness; o switch de candidata fica só nesse harness Vite, sem rota/flag Next de produto.

## Economia e autoridade

Nenhuma alteração de wallet/XP/moedas/baús/inventory/ledger/RPC/SQL/0078. Foco é recurso de batalha existente, não moeda/carteira. Nenhum grant, starter, novo sorteio ou recompensa baseado em resultado local foi adicionado. Engine continua local/adulterável, não combate autoritativo004. O P1 de concessões/escritas legadas continua aberto e impede liberação; esconder UI não fecha essa API. Nenhum Supabase, env remota ou dado real acessado.

## Verificação

Regressão do hash64trajetórias pré-mudança, comparativo126linhas e27batalhas sem alterar NPCs, custos/níveis/equipamentos/piso/arredondamentos e guardas. Testes dirigidos/UI/storage/Torre, lint/tipos/build e navegador constam no relatório/recibo. Scan do JavaScript de produto deve excluir marcadores das fixtures/modo de candidato; catálogo proposto real pode estar no bundle, sem possuir/conceder carta.

Reworks preservados:37PASS/10FAIL iniciais por fixture antiga8cartas e adversárioGuardião em cenário sem guarda; corrigidos apenas ensaios. Lint vetou import app→engine invertido no teste, então comparativo foi movido para o app da Torre. TypeScript exigiu rows tipadas, find em vez de findLast para ES2022 e assinatura correta de finishTower. Nenhuma proteção ou regra de combate relaxada. Checklist React aplicado aos filtros/fixture/UI de ensaio; sem novos hooks/efeitos/listeners em produção, props e labels existentes preservados. Guia Next local já lido e mantido antes das edições003A.

Escopo/hashes/refs e28worktrees anteriores, pendências e memória por prefixo conferidos no fechamento. Sem dependência/arte/áudio novo, push/fetch/merge/main/deploy/remoto. Não afirmar homologação/posse/custo-benefício universal ou validação hospedada a partir de testes sintéticos.
