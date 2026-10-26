# UI-MOBILE-001 — interface original, aprovação visual pendente

Data: 2026-10-25. PR [#11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`. Status: **VALIDATING / PENDING_VISUAL_APPROVAL**. Não houve merge, publicação desta interface, acesso/escrita no Supabase ou criação de recursos pagos.

## Referência e causa da diferença visual

O primeiro pai do lançamento `808433a`, `5edc93f5857b26a59b183e8abfb963110831f90c`, contém a referência original. RELEASE-EBD-001 substituiu as entradas Home/Map pelo ReleaseHome e adotou um shell reduzido: fundo escuro, links horizontais e cartões grandes de acesso. Os componentes originais de identidade, cabeçalho, sidebar, paisagem e avatar ainda existiam. A restauração reutiliza esses componentes, sem reverter o commit de lançamento, que também contém mudanças válidas de segurança e sistemas.

As capturas “antes” correspondem à PR em `1b65cba178bb2156f70c737a31b00f25a5babfdc`, anterior a esta edição. Não representam uma nova captura remota de produção.

## Implementação

- Shell original com variante `released`: marca, paleta creme/verde/dourado, cabeçalho/HUD e sidebar. A variante expõe exclusivamente Início, Meu avatar, Guilda e EBD; não inclui os atalhos de gameplay nem a navegação inferior antiga.
- Home pública recupera tipografia e paisagem originais. Home autenticada apresenta o Viajante em destaque, sem a grade de links grandes. Avatar usa o renderer/artes atuais, com nível/XP/atributos somente para leitura.
- Guilda, EBD e criação de Viajante continuam usando suas implementações atuais dentro do shell restaurado. Login/cadastro/recuperação não tiveram lógica modificada. Troca de Viajante e logout usam as ações existentes pelo menu da conta; a troca mantém a confirmação original.
- Menu móvel com alvos de44px, foco inicial, ciclo de Tab, Escape, toque fora, fechamento ao navegar e liberação do scroll. Header compacto em320px e composição adaptada à paisagem. A revisão React foi aplicada pelo próprio autor.

## Validações locais

| Verificação                                | Resultado                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `npm test -- --run`                        | 801 PASS /74 SKIP; preserva798 anteriores e acrescenta3 regressões de navegação                            |
| `npm run lint`                             | PASS, zero warnings                                                                                        |
| `npm run typecheck`                        | PASS                                                                                                       |
| `npm run build`                            | PASS; gates de áudio e9PNGs/10composições aprovadas PASS                                                   |
| `node --test scripts/ci/*.test.mjs`        | 25 PASS                                                                                                    |
| Fixture RSC `--expect-stable --extended`   | 63/63 PASS, sem pageerrors; mesma barreira e assertions do RPG-DEV-005                                     |
| `local-rsc-app-regression.mjs --ui-mobile` | 24/24 execuções da aplicação completa PASS, três repetições por cenário; zero erros RSC/página/DOM/console |
| Validação móvel na aplicação completa      | Duas rodadas finais com4telas/122checks PASS cada: Chromium1440×1000, WebKit390×844/320×740/844×390        |
| Capturas comparáveis                       | 10antes+11depois; mais4telas validadas, sem overflow nas páginas verificadas                               |

Os74 SKIP pertencem aos testes Postgres já existentes; não foram tratados como testes executados nesta tarefa. Nenhuma mudança SQL foi feita. QA e Security realizados pelo próprio autor, sem alegação de revisão independente.

Os testes usam o bundle de produção completo e servidor HTTP Auth/API sintético em loopback; não substituem Preview com backend real. Os controles nativos48 e corrigidos63 do RPG-DEV-005 continuam no CI; esta tarefa não modifica o patch Next16.4.2, não desliga prefetch nem filtra erros.

Uma primeira rodada do novo ensaio móvel falhou ao consultar o formulário de recuperação imediatamente após `goto`, antes da hidratação, sem erros de página/console; foi corrigida para aguardar o título visível e preservada em `browser-first-failed.json`. O login dos ensaios existentes também aguarda o botão habilitado antes de preencher, respeitando o bootstrap já existente. Não houve alteração no código Auth nem relaxamento das assertions RSC ou dos403.

CI configurado para executar todos os gates anteriores e acrescentar a matriz móvel ao job Windows. O resultado remoto do candidato será registrado na PR e na atualização final deste relatório; não inferir PASS de CI a partir dos resultados locais.

## Segurança e preservação

Comparação com1b65cba sem diferenças em `apps/web/lib`, `proxy.ts`, Auth/providers, packages, Supabase/migrations, lockfile/dependências, assets públicos e patch RSC. Relatórios/evidências anteriores preservados. A lista dos caminhos e hashes das capturas/provas está em [UI-MOBILE-001-EVIDENCE.json](UI-MOBILE-001-EVIDENCE.json).

As negativas HTTP mantiveram403 em Arena, Torre (ambas as entradas), equipamentos, loja, mochila, diário, História/mundos e endpoint de autoridade starter. `GAMEPLAY_ENABLED=false`, allowlist e controles de servidor permanecem intactos. Nenhum grant, recompensa, XP, moeda, conta ou progresso de jogador foi modificado. A demonstração usa exclusivamente dados sintéticos; não se alega auditoria nova das tabelas remotas.

## Revisão visual e publicação

[Galeria antes/depois](../reviews/UI-MOBILE-001/index.html), [índice Markdown](../reviews/UI-MOBILE-001/README.md). Há comparações de Home pública/autenticada, avatar, Guilda e EBD no desktop/celular, menu aberto e telas320px/paisagem. Capturas são PNGs originais do navegador, sem edição de imagem.

**Aprovação visual ainda não recebida.** Por instrução explícita do usuário, a interface não será publicada em produção antes dessa aprovação. Estado produtivo previamente confirmado: Guilda/EBD `808433a`, deployment `dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, [URL oficial](https://rpgjovemcristao-web-inky.vercel.app). Nenhuma operação Vercel desta tarefa; a Preview anterior do RPG-DEV-005 não representa esta UI.

Após aprovação, seguir `.agent/RELEASE_POLICY.md`: CI do SHA candidato, Preview vinculado ao backend correto, testes reais com contas autorizadas, gates de segurança/dados e somente então avaliação de promoção normal. Supabase só se necessário; nenhuma migration é necessária para esta restauração visual. Esta PR também contém trabalho anterior de gameplay; aprovação estética não libera esses módulos nem autoriza promoção irrestrita de todo o conteúdo da PR.

Bloqueios anteriores permanecem: proveniência16XP/6moedas, catálogo/recompensas/positivos hospedados e Safari físico. Não houve reavaliação nem fechamento desses bloqueios nesta tarefa. Não declarar DONE ou DEPLOY_COMPLETE; produção/merge continuam condicionados aos gates aplicáveis.
