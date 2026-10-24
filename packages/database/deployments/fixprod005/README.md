# FIX-PROD-005 — liquidação da Torre, ainda sem homologação

Autorização: contrato ativo FIX-PROD-005 e tabela proposta pelo usuário no FIX-PROD-004. Migration incremental `20261024025957_fix_prod_005_tower_settlement.sql`. Não reaplicar migrations históricas nem executar este arquivo no banco produtivo enquanto os gates permanecerem bloqueados.

## Contrato implementado

Valores por andar: XP20/30/40/50/60/80/150 e moedas10/15/20/25/30/40/75. Somente o campeão concede um baú épico **fechado**. Total430XP/215moedas/um baú; nenhum bônus adicional de moedas por subida de nível. A versão da política é `fix-prod-005-proposed-v1`, inicialmente disabled, sem aprovação, data ou catálogo homologado. Não existe RPC de ativação nem controle enviado pelo navegador.

O servidor TypeScript existente deriva o resultado canônico; a RPC existente mantém Auth, propriedade, reconciliação, cartas, CAS e progressão sequencial. Apenas o ramo de liquidação da Torre passa ao helper privado. Vitória, atualização de XP/nível, carteira, baú, recibo e claim compartilham a transação do comando final. Locks: conta → Viajante → batalha → política. A claim é única por Viajante/versão da Torre/andar, independente de battleId ou versão de valores; conserva conta, batalha, recibo e política para auditoria. Não há ACL direta para anon/authenticated/service_role nos novos objetos privados, e as tabelas têm RLS.

Sem homologação, vitória gera somente resultado/recibo de zero créditos e conserva o progresso legítimo. Derrota e repetição não pagam. Aprovação posterior não paga batalhas iniciadas antes da aprovação nem vitórias históricas bloqueadas: exigem decisão explícita de backfill, ainda ausente. Uma política habilitada também precisa corresponder ao catálogo aprovado e não revogado; a autorização/posse das sete cartas continua sendo conferida pela autoridade existente. A consulta de progresso conserva seu `rewardStatus=blocked` conservador; qualquer ativação futura exige revisão do contrato e da apresentação, não apenas alteração de flag.

## Recuperação e preservação

Antes de DDL hospedado: conferir projeto **testes `wkdvdzfkbwvhyjmamrsg`**, journal de21 migrations e ausência das duas tabelas novas; obter definição/ACL da função antiga e hashes das tabelas existentes. Snapshot privado próprio da tarefa: `build/fix-prod-005/pre-migration-backup.json`, ignorado pelo Git. Não contém senha, token nem backup de Auth.

A migration é aditiva e não atualiza jogadores, saldos, inventário, recibos ou progresso. Plano de recuperação sem reset: impedir novos testes; restaurar **somente a definição exata anterior** de `public.arena_authority_v3(uuid,uuid,text,jsonb)` pelo mecanismo oficial de migration; preservar ACL/owner e todos os dados/ledgers; manter a política desativada e revalidar protocolo, RLS, hashes e negações. Não apagar tabelas, contas ou claims para desfazer histórico. A restauração da função é ensaiada no PostgreSQL descartável dentro de uma transação revertida, sem alterar o banco hospedado. Uma recuperação remota efetiva precisaria de nova migration registrada, nunca reexecução da antiga.

Publicar no Git/CI antes de aplicar somente a migration nova em testes. Verificar hashes antes/depois da DDL, política false, claims zero, recibos/saldos preservados e ausência de acesso direto. Não aplicar em produção ou habilitar prêmios antes de origem legada, homologações e demais gates obrigatórios aprovados.

## Evidências e limites

`apps/web/lib/authority/tower-settlement.postgres.test.ts` usa o motor real e PostgreSQL17 descartável, sem rede. Catálogo, atributos fortes, simulação de aprovação, carteira ausente e estoque cheio pertencem exclusivamente às fixtures offline. Abrange sete andares, campeão, orçamento, recibos vinculados, replay, concorrência, rollback de carteira e capacidade do baú, reconexão, derrota, isolamento e regressão da Arena. Não equivale a completar a Torre hospedada com uma conta elegível e não homologa créditos reais.

Os16XP/6moedas produtivos permanecem sem evento autoritativo comprovado. Logs recuperados mostram PATCH do avatar ativo e `add_coins` em16/10/2026, mas não contêm payload ou recibo de batalha suficiente para certificar esses valores. A consulta de reconciliação continua exclusivamente de leitura; não atribuir `economic_verified_at`, fabricar recibos ou alterar saldos por coincidência numérica. Equipamentos visuais do corpo alvo e sessão/identidade da liderança permanecem gates separados.
