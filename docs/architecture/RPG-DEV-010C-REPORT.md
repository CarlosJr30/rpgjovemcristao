# RPG-DEV-010C — Células e atividades

## 31/10/2026 — 010C.1 / histórico privado validado localmente

Autorização do proprietário: preservar os motivos completos em histórico privado, mantendo o limite legado de **512 bytes**. Implementação acrescenta registros append-only por solicitação/revisão, com autor, beneficiário, estados anterior/posterior e data. Somente líder atual ou substituto autorizado para aquele encontro/atividade consulta o histórico completo; o participante consulta seu resultado e orientação atuais. Revogação é conferida novamente no servidor. Replay não duplica histórico ou auditoria. O log anterior guarda apenas contexto compacto e digest do motivo; registros e contrato anteriores preservados.

**9 verificações adicionais PostgreSQL PASS**, além de dois checks compartilhados de bootstrap (11 na rodada), cobrindo Unicode completo, autorização/isolamento, replay, corrida com um vencedor/PT409, revogação imediata, recusa de UPDATE/DELETE, rejeição de padrões de credenciais/contatos e contenção preservadora. Os **23 checks anteriores permanecem arquivados**, sem repetir a suíte completa ou somar bootstrap como casos novos. Primeira rodada adicional interrompida por revisão incorreta na fixture de delegação; corrigida somente a fixture e repetido este conjunto, sem mudar limites/assertions/autoridade. Guardas de definições/ACLs canônicas também passaram no mesmo ensaio isolado.

17 unitários direcionados anteriores preservados; lint, TypeScript, build e protocolo25 aprovados nos respectivos checkpoints. Nenhuma dependência, arte ou autoridade econômica acrescentada. QA/Security/React pelo autor, sem revisão independente. Sem DDL/deploy010C remoto ou alteração PROD neste checkpoint. Próximos gates: commit/CI exato, migration somente TEST, Preview TEST e homologação real com as duas identidades autorizadas. **Não DONE/DEPLOY_COMPLETE.** Os registros abaixo são históricos.

Decisão para010C.3 registrada separadamente: cada Guilda é equipe; média da lista fixada antes do início, ausentes zero e uma identidade por equipe concorrente/evento. Não libera competição neste incremento.

## 31/10/2026 — ACTIVE /010C.1 em implementação

Pedido completo autoriza implementação/publicação progressiva, sem economia. Branch `codex/rpg-dev-010c-guild-activities` criada da main4ded3c5, com fechamento documental a03c1c0 incorporado; dez worktrees e arquivos anteriores preservados. PROD4ded3c5/dpl_4s1wFrncQr8xrod1HTyzRmNxmx7oREADY/alias/configuração originais reconfirmados; CImerge41162803090success. TEST37migrations63tabelas180funções;PROD14/58/172,39policies cada; baselines63TEST/58PROD privados capturados. NenhumDDL/deploy/grant010C remoto.

Auditoria: reutilizar guild_missions/progress/attempts/activity_log, MissionEditor/CSS, GuildScope e permissões010A; sete comandos/consultas de missões antigos continuam owner-only, não serão desbloqueados. Novos wrappers terão Guilda explícita e autorização atual. Complementos privados para encontros/acesso/delegação/elegibilidade futura, sem converter legado, misturar classesEBD ou conceder recompensas. 010C.1 entrega encontros/atividades manuais;010C.2 quiz7/equipes;010C.3 aceite entreGuildas/equilíbrio/limites. Formato competitivo solicitado ao proprietário enquanto trabalho independente continua. Nenhum teste010C declaradoPASS nesta preparação.

## 31/10/2026 — preparação documental após010B.3

Dependências010A e010B publicadas; referência atual4ded3c5/010B.3. [Preparação separada](RPG-DEV-010C-PREPARATION.md) identifica reutilização, fronteiras e decisõesD1–D6 pendentes. Nenhuma regra competitiva/conteúdo aprovada automaticamente. Sem runtime, testes010C, migration ou publicação010C; XP/moedas/baús continuam bloqueados até010D. Backlog próprio, fora da PR21. O checkpoint abaixo é histórico; não declarar010C DONE.

28/10/2026 — **PENDING; publicação BLOCKED por dependências010A/B**. Reutilizar guild_missions/guild_ops/revisão educativa. Encontros presenciais/digitais, estudos, desafios e campanhas sem impor fotos/localização precisa. Validação presencial por responsável autorizado e auditado; não pontuar fé/oração/reflexão.

Eventos conjuntos exigem aceite de todos os líderes, regras fixadas antes do início, equipes equilibradas e pontuação proporcional aos elegíveis. Uma conta não integra equipes concorrentes no mesmo evento; participação/recompensa compartilhada tem uma identidade canônica global. Sem listas públicas de adolescentes.

Nenhuma implementação/teste/migration/publicação010C realizada nesta preparação. Definição de algoritmo de equilíbrio/elegibilidade e integração escopada devem ser verificadas, sem inventar resultados de eventos. [Matriz geral](RPG-DEV-010-REPORT.md).
