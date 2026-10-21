# DEPLOY-002 — verificação hospedada e limites

2026-10-21. Revisão QA/Security pelo autor, sem independência. Alvo único `wkdvdzfkbwvhyjmamrsg`; nenhuma consulta ou alteração em produção. Base aprovada `cb66b6c4b87645cf5911a86b8b99943cc2d1664b`. [Receita e recuperação](../architecture/DEPLOY-002-MIGRATION-PLAN.md), [registro aplicado](../../packages/database/deployments/deploy002/applied.json).

## Controles comprovados

O snapshot final contém 38 tabelas da aplicação, 96 funções e 39 políticas; as 30 tabelas públicas têm RLS. Grants de tabela e coluna econômicas verificados pelo guard de liberação, incluindo XP, moedas, inventário, equipamentos, baús e recibos. RPCs legadas de crédito, gasto, baú e payout sem EXECUTE para anon/authenticated/service_role. `arena_authority_v3` é executável somente pelo serviço entre esses três papéis. Todas as funções DEFINER inventariadas têm search_path explícito; isso não substitui autorização por identidade/recurso.

Defaults permissivos do projeto vazio exigiram prepare_acl: revogar grants automáticos para futuros objetos de postgres, inclusive EXECUTE global de PUBLIC. Acesso ao schema público ficou contido entre etapas; a liberação ocorreu somente após CONTRACT e guards locais/remotos. Não houve alteração de roles gerenciadas, dos 15 SQL históricos, de RLS ou da economia aprovada.

| Evidência executada | Resultado e limite |
| --- | --- |
| 28 testes PostgreSQL locais opt-in | PASS; inclui concorrência, unicidade de recibos e rollback em PG17.6. Não comprova concorrência via HTTP hospedado. |
| 5 testes de implantação locais | PASS; sequência exata sob defaults gerenciados, quarentena, falha atômica, release e fixture hospedada. |
| Fixture SQL hospedada | 31 assertions PASS; cinco papéis sintéticos com SET LOCAL ROLE/claims. Propriedade, outra Guilda, liderança, convite/pedido/aprovação, missão/submissão/replay de revisão, professor/aula/publicação/resposta/presença e negativas econômicas. Não autentica JWT nem cria conta confirmada. |
| Economia na fixture | Escritas XP/moedas/inventário, crédito/gasto/baú arbitrário, claim sem prova e autoridade forjada negados. Aprovação de missão permanece sem crédito; recibos zero. Starter do serviço negado por catálogo não homologado. |
| HTTP real com chave publicável | 16 checks PASS: settings, leitura anônima negada, seis schemas privados fora da exposição PostgREST, RPCs anônimas negadas, JWT inválido rejeitado, cadastro anônimo desativado e senha de conta inexistente rejeitada. |
| Estado após rollback | Auth users, Travelers, Guildas, aulas, recibos e cartas homologadas: todos zero. Fixture usa transação revertida; sequências identity podem avançar e não representam dados persistidos. |

`hosted-checks.mjs` não cria passwords, JWTs ou contas de Auth válidas: insere referências mínimas somente durante uma transação integralmente revertida. O token de convite permanece em GUC transacional e não é retornado. Nenhuma lição sintética persiste. Asserções de negação exigem erro correspondente; não tratam qualquer erro como autorização comprovada. A execução hospedada ocorreu somente após a mesma fixture passar localmente.

## Advisors finais

Zero ERROR de segurança. Os resultados agrupados contêm 34 achados de segurança; não são apenas dois achados. Classificação pelo autor para ambiente isolado, com acompanhamento antes de uso público:

- **14 INFO — RLS sem policy:** cinco tabelas economy_private, rate_limits de chat, link_invites, seis tabelas EBD RPC-only e step_receipts. Negação padrão deliberada; acesso somente pelos caminhos privilegiados autorizados. Não criar policies permissivas para silenciar. [Orientação oficial](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- **20 WARN — authenticated pode executar DEFINER público:** interfaces explícitas de Guilda/missão/História e seus helpers de ownership/membership. Inventário nominal em advisors-summary.json. Fontes congeladas conferidas, search_path fixo, checagens de propriedade/Guilda existentes preservadas; fixture comprova criação/convite/isolamento/missão e negativas de História. Não é prova individual de todos os métodos por JWT real. Resíduo acompanhado no gate Auth e na próxima revisão de superfície pública; sem refatoração ampla para silenciar o advisor. [Orientação oficial](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- **Performance:** 28 INFO FK sem índice de cobertura, 2 WARN initplan nas policies story_definitions_read/story_progress_owner, 19 INFO índices ainda sem uso. Banco vazio, sem carga representativa; não são prova de falha de autorização. Manter índices existentes e medir antes de ampliar/remover; otimização de fontes históricas em tarefa própria. [FK](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), [initplan](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan), [índices](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Gates abertos

O P1 econômico tem grants e negativas SQL hospedadas comprovados; não está declarado integralmente resolvido para publicação. Concorrência/recibos positivos hospedados com JWTs e serviço reais ainda não executados, e o catálogo aprovado vazio impede Arena/Torre positivas. Sem concessão de cartas ou prêmios para contornar.

Settings reais Auth já estavam conformes: email habilitado, signup habilitado, confirmação preservada, anônimos desativados. Nenhuma configuração Auth foi alterada. Cadastro confirmado/login/logout/persistência/recuperação exigem contas sintéticas confirmadas e acesso Auth disponível. Não há admin Auth nas ferramentas nem navegador conectado; solicitada disponibilidade sem pedir credenciais na conversa. Não desabilitar confirmação nem fabricar sessões pelo banco. URL real/allowlist/callbacks/QR em aparelho dependem de DEPLOY-003. Gate público continua fechado até essas evidências, sem reabrir auditorias DEV históricas.
