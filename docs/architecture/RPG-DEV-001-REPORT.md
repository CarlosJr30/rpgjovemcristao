# RPG-DEV-001 — Preparação isolada de equipamentos, Arena e Torre

Data: 24/10/2026. **BLOCKED para liberação dos módulos de gameplay.** Guilda/EBD permanecem publicadas em `808433a`. Este trabalho não remove as restrições do lançamento parcial.

## Estado confirmado e preservação — DONE

- `origin/main`: `808433a780e96a048c4a3f2d7e419351ab85e5a3`; CI [40127254263](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40127254263) success.
- Produção: <https://rpgjovemcristao-web-inky.vercel.app>, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, READY, SHA acima. Alias oficial reconferido via API autenticada.
- PROD `wspafhlbtlpabypzymjo`; TEST `wkdvdzfkbwvhyjmamrsg`, ambos ACTIVE_HEALTHY. Histórico remoto: PROD seis migrations, TEST 24; nenhuma reaplicada.
- Nova worktree `C:/Users/carlo/rpg-worktrees/rpg-dev-001`, branch `codex/rpg-dev-001`, baseada em `561d613` (encerramento documental do lançamento, descendente de `808433a`). Worktrees e alterações anteriores preservadas.
- Lidos política de release, relatório final RELEASE-EBD-001 e relatório FIX-PROD-008. Correções visuais e testes determinísticos anteriores não foram refeitos como implementação.

## Problemas e correções — DONE no candidato isolado

Respostas assíncronas usavam somente o UID como controle de validade. Uma leitura antiga podia substituir uma leitura mais recente do equipamento; hidratação atrasada, inclusive com erro, podia trocar ou limpar o avatar ativo após mudança de conta. Seleção atrasada também podia marcar o avatar da sessão anterior como ativo no cliente. Quatro falhas foram reproduzidas antes da correção, com log preservado.

`online-sync.ts` agora distingue sessões consecutivas, descarta hidratações/seleções substituídas e ordena leituras por Viajante. `online-equipment.ts` verifica a revisão da sessão depois do RPC, inclusive quando a mesma conta saiu e entrou novamente. Não há compensação de saldo nem tentativa de desfazer um RPC já confirmado no servidor.

Regressões cobrem troca de conta, logout/login do mesmo UID, respostas fora de ordem, hidratação atrasada com sucesso/erro, seleção e concorrência com leitura de equipamento. São testes isolados de comportamento; não se apresentam como testes hospedados de Auth/RLS.

## Equipamentos e avatar

| Item | Estado | Evidência/limite |
| --- | --- | --- |
| Couraça 3 e empunhadura | DONE na preservação e ensaio | PNGs, manifestos e compositor não foram alterados. Gate: cinco PNGs/seis composições aprovadas, zero pendentes publicados. |
| Equipar/desequipar, atributos, persistência | DONE no ensaio local | Comandos reais de estado e compositor real no Chromium 1440 e WebKit 390; reload preserva estado e inventário. |
| Troca positiva no mesmo slot | DONE somente em fixture | Segunda espada explicitamente sintética, sem arte homologada ou aquisição real. Confere substituição do bônus sem acumular nem consumir itens. |
| Troca hospedada entre itens homologados | BLOCKED | Falta segunda variante homologada/adquirida e ambiente de gameplay hospedado com acesso autorizado. |
| Elmo/escudo/botas/medalhão no corpo alvo | REWORK | Continuam sem overlay homologado para esse corpo. Não reutilizadas calibrações arquivadas como aprovação. |
| Celular físico | BLOCKED | Indisponível; WebKit móvel é emulação, não teste físico. |

Fixture nova em `tests/fixtures/equipment-recovery-harness/`, servida exclusivamente em loopback por Vite. Não é rota Next, não muda o catálogo e não integra a aplicação publicada. O navegador bloqueia requisições externas durante o ensaio. O estado sintético não pertence a jogadores.

## Arena, Torre e economia

| Item | Estado | Resultado |
| --- | --- | --- |
| Arena: regras e controles existentes | DONE na preservação | Suíte unitária atual inclui motor, baralho, autoridade e recibos; nenhum grant novo. |
| Catálogo oficial/aquisição hospedada | BLOCKED | PROD tem zero entradas no catálogo; TEST tem sete entradas de teste. Catálogo de teste não homologa produção. |
| Torre determinística 1–7/campeão | DONE na evidência anterior | Preservados FIX-PROD-006 (10 PG) e FIX-PROD-007 (36 PG), sem mudança no motor/SQL. Não executados novamente nesta tarefa nem contados como novos PASS. |
| Vitórias hospedadas 2–7 e campeão | BLOCKED | Pendência anterior permanece. TEST agora está isolado por RELEASE-EBD-001; não foram reabertas permissões para fabricar execução positiva. |
| Contrato de recompensa | BLOCKED para créditos reais | Proposta 430 XP/215 moedas/um baú épico, somente primeira vitória. TEST mantém `enabled=false`, sem homologação e com zero claims. Contrato não antecipado em PROD. |
| Reconciliação 16 XP/6 moedas | BLOCKED | Nova leitura: 33 operações com recibos, zero batalhas do alvo, delta continua 16/6 e `economic_verified_at=NULL`. Não apareceu evento canônico que comprove a origem. |

A investigação anterior de checkpoints e logs permanece válida: compatibilidade aritmética com dois treinos não comprova ocorrência. Nenhuma correção manual, certificação retroativa, abertura de baú, aquisição de carta ou vitória forçada foi executada.

PROD mantém 24 Viajantes, 245376 XP, 1006767 moedas e 37 entradas de inventário. Zero tabelas públicas sem RLS. TEST e PROD retornam `release_scope=guild-ebd-001`, sem EXECUTE de autoridade/equipamentos para authenticated. Em PROD o RPC novo de equipamento e a política de Torre ainda nem estão instalados; não são falhas do escopo Guilda/EBD e não foram antecipados.

## Testes e falhas preservadas

| Gate | Estado | Resultado |
| --- | --- | --- |
| Regressões de sincronização/equipamento | DONE | 24 PASS em execução dedicada. |
| Unitários integrais | DONE | Execução final: 764 PASS/74 SKIP, 116 arquivos aprovados/sete omitidos. SKIP não é PASS. |
| PostgreSQL descartável | DONE | 17 PASS: oito da fronteira Guilda/EBD e nove de equipamentos/RLS; rede desativada, sem banco de jogadores. |
| Equipamento em navegador | DONE | Dois testes PASS, Chromium desktop e WebKit móvel. Capturas inspecionadas; couraça e empunhadura preservadas. |
| Fronteira de release em navegador | DONE | Quatro PASS desktop/móvel: rotas e API excluídas negadas, recuperação pública acessível. Não repete envio de e-mail. |
| Lint/TypeScript/build | DONE local | Lint e TypeScript completos finais com exit 0; build aprovado, incluindo gate de assets e isolamento de áudio. |
| Protocolo de publicação | DONE | 25 PASS. |
| QA/Security | DONE na revisão pelo autor | Sem revisão independente alegada. Fronteiras, ACLs, assets, diff e ausência de secrets revisados. |

Rodada PG inicial: nove timeouts no limite padrão de cinco segundos do runner ao atravessar WSL, oito PASS. Reexecução integral com `--testTimeout=60000`, mesmas asserções, resultou em 17 PASS. Sem alteração de SQL ou controles para passar.

A fixture visual inicial foi rejeitada pelo próprio parser porque o timestamp não usava milissegundos ISO; corrigido somente o timestamp sintético. Typecheck da nova fixture exigiu JSX e tipos Vite/CSS no projeto de testes. Falhas e logs iniciais preservados; não foram classificados como aprovados.

## Arquivos alterados

- `apps/web/lib/supabase/online-sync.ts` e testes; `online-equipment.ts` e testes.
- `tests/fixtures/equipment-recovery-harness/`, `tests/e2e/equipment-recovery.spec.ts`, `playwright.rpg-dev-001.config.ts`.
- `playwright.config.ts` separa o ensaio loopback; `tsconfig.json` inclui os novos testes e tipos JSX.
- Contrato RPG-DEV-001, este relatório e memória.

## GitHub, Preview e produção

Candidato, CI e Preview em preparação; nenhum merge ou deployment produtivo desta tarefa. Evidências privadas em `build/rpg-dev-001/`, ignoradas pelo Git. Não publicar logs de sessão ou credenciais.

**Migrations aplicadas: nenhuma.** Auth, URLs, redirects e limites de e-mail não foram alterados. Não foram promovidos jogadores nem modificados papéis de Guilda/EBD.

Próxima tarefa recomendada: homologar catálogo e política econômica com evidência da reconciliação e preparar ambiente hospedado de gameplay separado do TEST que atende a Preview Guilda/EBD. Depois validar aquisição/troca legítimas e vitórias 2–7/campeão sem progressão manual. Manter produção intacta enquanto esses gates estiverem pendentes.
