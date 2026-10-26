# RELEASE-EBD-001 — Guilda e Escola Bíblica em produção

Atualizado em 24/10/2026. **DONE — publicação inicial concluída e conferida remotamente. DEPLOY_COMPLETE para o escopo Guilda/EBD.**

## Publicação confirmada

| Item | Estado | Evidência |
| --- | --- | --- |
| Produção oficial | DONE | <https://rpgjovemcristao-web-inky.vercel.app> |
| Deployment | DONE | `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, target production, READY |
| SHA publicado | DONE | `808433a780e96a048c4a3f2d7e419351ab85e5a3`, corresponde ao alias público e ao deployment |
| PR | DONE | [PR #10](https://github.com/CarlosJr30/rpgjovemcristao/pull/10), merge normal, sem bypass; head aprovado `7a02640` |
| CI do SHA produtivo | DONE | [Run 40127254263](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40127254263), push de `808433a`, completed/success |
| Backend produtivo | DONE | Supabase `wspafhlbtlpabypzymjo` / `RPGJOVEMCRISTAO`; nenhuma troca pelo banco TEST |
| Preview validada | DONE | <https://rpgjovemcristao-ebd001-preview.vercel.app>, `dpl_ALfghjQxopcwRozMx4D4CEast7JR`, runtime `23391b5`, backend TEST `wkdvdzfkbwvhyjmamrsg` |
| Verificação após publicação | DONE | 38 checks no navegador + 43 na API + 8 de recuperação real em PROD = 89 checks PASS |

O merge em main cria build produtivo automaticamente. A associação automática de domínios foi temporariamente suspensa para manter `5edc93f` no ar enquanto o novo SHA passava no CI. O build existente de `808433a` ficou READY em staging; somente depois do CI, das migrations e das verificações de preservação foi promovido. Não houve deploy duplicado. O valor anterior de associação automática foi restaurado ao final, com o alias oficial permanecendo no deployment aprovado.

O relatório de encerramento é persistido na branch documental `codex/release-ebd-001-report`, sem merge/deploy adicional da aplicação apenas para documentação.

## Funcionalidades liberadas e bloqueadas

**DONE:** cadastro e autenticação; seleção/criação de avatar; logout e recuperação; criação explícita de Guilda; convite com QR real; solicitação/aprovação de membros; liderança por criação autorizada de Guilda; professor com permissões escopadas; criação/edição/publicação de aulas; atividades e questionários; agenda, presença, histórico e persistência após reconexão; isolamento de Guildas e autorização por avatar/UID.

**BLOCKED por desenho do lançamento:** Arena, Torre, aquisição/uso de cartas, XP/moedas/recompensas, loja, baús, mutações de equipamentos econômicos e História. O código e os dados foram preservados. UI/navegação, proxy/API e permissões SQL impedem operações excluídas, inclusive chamadas diretas; ocultação de botões não é a única proteção. Hidratação autorizada de dados antigos continua somente leitura.

Não há liderança automática no cadastro de conta ou avatar. O líder dos testes assumiu apenas a liderança da Guilda criada explicitamente pelo mecanismo oficial; o professor foi autorizado dentro dessa Guilda. Nenhuma conta recebeu `service_role` ou administração global.

## Correções entregues

- Shell e rotas restritos a Auth/avatar/Guilda/EBD; API de autoridade retorna 403 e a fronteira SQL revoga operações fora do lançamento.
- Criação de avatar passa a não entregar XP, moedas, equipamentos ou baús. Dados antigos não foram recalculados.
- EBD não oferece recompensas; servidor rejeita `rewardTier` não vazio e bloqueia novos créditos pendentes. Avaliação, quiz, presença e auditoria continuam funcionando.
- Permissão mínima `UPDATE(is_active)` restaurada para seleção de avatar pelo RPC invoker, mantendo RLS de titularidade e negando XP/nível/proprietário.
- Contraste do conteúdo EBD corrigido e seletor móvel limitado ao viewport apropriado; desktop/móvel finais inspecionados.
- Recuperação por e-mail implementada e validada até a troca de senha e novo login, tanto na Preview TEST quanto na origem produtiva publicada.
- Auth PROD corrigido previamente com autorização explícita: Site URL da origem oficial e redirects `/auth` e `/auth/recover` nessa origem. Os dois destinos TEST anteriores foram removidos; não havia outros destinos produtivos legítimos na lista. Backup/diff/verificação foram registrados antes/depois. Nesta rodada final, URLs e limites não foram alterados.

Arquivos funcionais concentram-se em `apps/web/features/release-ebd/`, Auth/recuperação, páginas públicas/Guilda/EBD, `apps/web/proxy.ts`, API de autoridade, `apps/web/lib/release-scope*`, testes e duas migrations. Commits funcionais `9cc4b73`, `6403416`, `23391b5`; o merge produtivo contém esses commits e o histórico anterior aprovado/isolado. As cinco PNGs e seis composições aprovadas, incluindo couraça 3 e empunhadura, ficaram intactas.

## Testes e limites de evidência

| Gate | Estado | Resultado |
| --- | --- | --- |
| Unitários | DONE | 756 PASS / 74 SKIP no comando unitário; SKIP não contado como aprovado |
| PostgreSQL EBD isolado | DONE | 8 PASS em execução dedicada: RLS/titularidade, seleção, ausência de grants econômicos, Guilda/EBD e recuperação estrutural |
| Navegador local | DONE | 14 PASS desktop/móvel; mocks identificados, sem alegar prova hospedada |
| API real TEST | DONE | 75 checks PASS com contas autorizadas |
| Navegador real TEST | DONE | 35 checks no fluxo anterior e 25 no candidato final; cadastro/Auth com 6 checks adicionais |
| Recuperação TEST | DONE | Novo envio normal HTTP 200, e-mail real, callback original correto, nova senha, login com mesmo avatar e logout: 2 + 6 checks PASS |
| Lint, TypeScript, build e protocolo | DONE | PASS; protocolo 25 checks; CI do SHA produtivo também aprovado |
| Navegador real PROD | DONE | 38 checks PASS, três contas distintas, criação de avatar/Guilda, QR decodificado dos pixels, membros, professor, aula/quiz, presença, agenda, reconexão e logout |
| API real PROD | DONE | 43 checks PASS: propriedade, papéis, isolamento, idempotência, ausência de créditos e negações econômicas/RPCs/escritas diretas |
| Recuperação real PROD | DONE | Envio normal HTTP 200, e-mail recebido na caixa real, callback da origem oficial, senha da conta dedicada, novo login/avatar/logout: 2 + 6 checks PASS |
| Móvel e visual | DONE | Navegação real com backend hospedado em viewport móvel 390; sem overflow; capturas desktop/móvel inspecionadas |
| Celular físico | REWORK futuro | Dispositivo indisponível; não executado e não apresentado como PASS físico. Emulação explicitamente identificada |
| QA e Security | DONE | Revisão pelo autor, sem alegação de independência; RLS ativo, fronteiras verificadas e dados existentes preservados |

O HTTP 429 anterior foi respeitado, sem aumentar limites ou desativar proteções. Após o intervalo, um único novo pedido TEST foi aceito. Usou-se o novo e-mail, sem reescrever destino/token; apenas quebras de linha introduzidas pela serialização Markdown do conector foram removidas ao ler o link. As falhas anteriores continuam nas evidências e no histórico Git.

O primeiro harness de API pós-deploy enviou `p_revision` ao workspace em vez de `p_offset`; foi corrigido somente no harness privado, conforme a assinatura existente. A execução inicial falha foi preservada separadamente. A execução final de 43 checks passou sem alteração da aplicação. Não houve teste obrigatório falho reclassificado como PASS.

## Contas dedicadas e permissões

**DONE:** três contas PROD distintas, usando exatamente os endereços já existentes nas fixtures exclusivas TEST, da caixa real acessível; não foram inventados endereços nem usadas contas de jogadores. Cadastro pelo endpoint público normal, login e `getUser` reais verificados antes da publicação, sem avatares ou privilégios iniciais.

| Finalidade | UID PROD | Avatar principal de homologação |
| --- | --- | --- |
| Líder | `9ca3047c-6832-4008-bcd8-481e17c17b01` | `c2ba6da4-996c-4360-9db2-5818f8a68a07` |
| Professor | `02838502-87f6-4dd6-9998-9bfcc0d4dfc7` | `7892b67f-4055-4ff4-8762-7531675e021f` |
| Aluno | `55a1e310-fea5-4151-8ba7-76f36cdf868c` | `9e555e9e-767c-42cf-8884-b27324beb681` |

PROD já tinha `emailAutoConfirm=true`, comprovado também pelo registro anterior `build/deploy-005/production-auth-public-settings.json`. Essa política foi preservada; não foi habilitada para o teste e não houve confirmação administrativa artificial. A recuperação posterior da conta dedicada de líder comprovou recebimento real de e-mail e funcionamento do callback produtivo. Credenciais geradas/atualizadas ficaram somente em DPAPI local, sem senhas, tokens ou links de autenticação no Git ou relatório.

Para isolamento entre Guildas, foi criado um quarto avatar de fixture, no mesmo cadastro dedicado de professor, e uma segunda Guilda pelo mecanismo normal. O avatar principal do professor foi restaurado como ativo pelo RPC oficial após o teste. As fixtures foram mantidas para auditoria; nenhuma conta, avatar ou tabela foi apagada.

Teste Chat A: avatar ativo nível 50 permanece membro; avatar antigo nível 1 permanece preservado. A promoção específica desse jogador não foi realizada e continua pendência separada; não impede o lançamento parcial nem autoriza privilégios automáticos.

## Migrations, recuperação e dados

| Arquivo local | Registro TEST já validado | Registro PROD executado |
| --- | --- | --- |
| `20261024151503_release_ebd_001_isolation.sql` | `20261024154422 release_ebd_001_isolation` | `20261024195457 release_ebd_001_isolation` |
| `20261024154319_release_ebd_001_avatar_selection.sql` | `20261024155038 release_ebd_001_avatar_selection` | `20261024195507 release_ebd_001_avatar_selection` |

**DONE:** conteúdo normalizado dos dois arquivos locais conferido contra as statements registradas em TEST; nenhum registro dessas migrations existia em PROD antes. Foram aplicadas somente as duas acima, sem reaplicar o histórico TEST, reset, recriação de tabelas ou concessões econômicas.

**DONE:** plano de recuperação estrutural registra definições de funções e ACLs de funções/tabelas/colunas/defaults. A restauração já havia sido executada com sucesso no PostgreSQL isolado; snapshot PROD renovado por leitura era idêntico ao preparado anteriormente, SHA-256 `7f71544b8e5ee2b4d7fb495f07c93b55eb98f2f02daea6734653372797d7b029`. É backup estrutural adequado à alteração de DDL/ACL; não foi chamado de dump completo dos jogadores. Não foi necessário restaurar.

**DONE preservação:** 39 hashes de tabelas exatamente iguais antes/depois de cada migration PROD. Após os testes, 38 tabelas não Auth mantiveram os dados originais exatamente iguais ao excluir somente os IDs conhecidos das novas fixtures; as nove contas anteriores de `auth.users` também ficaram exatamente iguais. Os 20 avatares preexistentes foram preservados; agora há 24, incluindo quatro fixtures nível 1/XP 0/moedas 0. Totais de XP 245.376, moedas 1.006.767 e inventário 37 permanecem iguais. Zero tabelas públicas sem RLS. Nenhum item, baú ou crédito foi entregue às fixtures por EBD.

Advisors remanescentes registrados: aviso de [RPCs SECURITY DEFINER executáveis por authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), aviso de [proteção contra senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) e informação de [RLS ativo sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Não se desativou controle para remover alertas; RLS, autorização e negações foram testados. Acompanhamento operacional desses avisos permanece REWORK, sem falha crítica aberta no escopo liberado.

## Evidências e pendências

Evidências privadas em `build/release-ebd-001/` e `build/release-ebd-001/release-gates-20261024/production/`: CI/SHA/deployment/alias, conta/cadastro, recuperação TEST/PROD, 38 checks browser, 43 API, hashes e preservação, migrations e capturas visuais. Tokens, senhas, sessões e convites privados não foram publicados. Arquivos de recuperação não foram executados em produção.

**BLOCKED, fora do lançamento:** homologação de combate/cartas/Torre/economia/História; origem legada de 16 XP/6 moedas não comprovada, sem ajuste manual; promoção específica do Teste Chat A. Permanecem isolados, sem créditos liberados. **REWORK futuro:** celular físico quando disponível e acompanhamento dos avisos operacionais de segurança. Nenhum desses itens foi apresentado como PASS ou desbloqueado por esta publicação.

**Aceite do escopo Guilda/EBD: DONE.** Publicação remota, CI do SHA exato e testes reais posteriores confirmados. Não houve alteração adicional de Site URL, redirects ou quotas durante a conclusão; somente os dados das fixtures autorizadas e as duas migrations aprovadas foram criados/aplicados.
