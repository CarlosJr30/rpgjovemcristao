# UI-RESTORE-002 — recuperação da identidade completa do RPG

Data: 26/10/2026. PR [#11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), branch `codex/rpg-dev-001`, base `f0abffadee6d4cb75bc1bfd7cd0ebf7f55a3c287`. **VALIDATING / PENDING_VISUAL_APPROVAL**. A proposta UI-MOBILE-001 **não foi aprovada**. Não houve merge, deploy, migration, desbloqueio de gameplay ou recurso pago.

## Referência e comparação

O usuário confirmou `5edc93f5857b26a59b183e8abfb963110831f90c` como referência principal. A imagem de14/10 foi enviada no ChatGPT, mas não está disponível neste turno; não alegamos comparação pixel a pixel com ela. A [galeria](../reviews/UI-RESTORE-002/index.html) compara uma reconstrução local de5edc93f com a proposta atual, usando o mesmo Viajante sintético e dimensões desktop1440×1000/celular390×844.

A reconstrução usa uma worktree detached separada, dependências já instaladas, backendHTTP sintético e somente loopback. O ajuste isolado em `next.config.ts` da worktree histórica amplia a raiz Turbopack para resolver a junction de dependências; nenhum componente visual histórico foi editado. O patch de transporteRSC já instalado permanece na dependência compartilhada, sem efeito visual. Não é uma execução de gameplay hospedado nem uma nova fotografia de14/10. Turbopack inicialmente não resolveu a junction; Webpack rejeitou CSS global legado; o ajuste de raiz permitiu compilar a fonte visual original. Uma tentativa de captura na porta3198 foi rejeitada pelo simulador, que aceita exclusivamente3199; a captura final usou3199, sem mudar CORS do simulador ou da aplicação.

## Restauração entregue para aprovação

O menu verde reutiliza a própria lista original `primaryLinks`, ícones e ordem: **Herói, Jornada, Missões, Equipamentos, Mochila, Loja, Coleção, Diário, Guilda e Arena**. **EBD** foi acrescentada ao mesmo menu. Há uma única navegação principal; a navegação inferior duplicada permanece ausente nesta variante.

Herói, Guilda e EBD têm links somente para as rotas já homologadas. Os outros oito itens aparecem com **Em desenvolvimento**, como elementos inertes sem `href`, botão, handler de ação ou prefetch. Jornada aqui representa o módulo de História/mundos ainda não homologado; a marca do cabeçalho continua levando ao início seguro. Visibilidade do módulo não concede autorização.

O cabeçalho, marca, HUD, tipografia, verde/dourado, fundo e componentes de cenário originais foram preservados. O Santuário recupera a disposição de `HeroScreen`: avatar central, aura/sombra, seis espaços de equipamentos ao redor no desktop, nível/XP e atributos abaixo. No celular, a composição original empilha avatar e espaços em duas colunas. Usa o `AvatarRuntime` atual com os assets aprovados, sem troca de arte. A apresentação consulta os dados atuais para leitura e não equipa, compra, concede XP ou executa RPC.

O menu móvel mantém abertura/fechamento, alvo44px, foco, Tab/Escape, toque no fundo, scroll e fechamento após navegação. O menu tem onze opções também em320px/paisagem; EBD continua alcançável por rolagem. As páginas atuais de Guilda/EBD e o fluxo de Cadastro/Auth permanecem implementados pelos mesmos módulos; não foram substituídos por cartões administrativos.

## Inventário dos sistemas

| Módulo                                 | Código/dados/artes preservados                                                                    | Apresentação restaurada                                             | Pendente ou limite funcional                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Cadastro, Auth e recuperação           | `features/auth`, `lib/supabase`, providers e sessões sem diff                                     | Cabeçalho existente, ações de conta existentes                      | Fluxos reais hospedados serão revalidados antes de publicação; nenhuma configuração Auth alterada |
| Herói / Avatar                         | `screens/hero`, domínioTraveler, AvatarRuntime, resolvedores e artes intactos                     | Santuário, avatar central, seis espaços e atributos somente leitura | Nenhuma operação econômica ou de equipamento disponível                                           |
| Jornada / História / nove mundos       | `features/story`, mapas, catálogo, fases e progresso intactos                                     | Opção e ícone originais                                             | Em desenvolvimento; não navega para História/mundos                                               |
| Missões                                | Fase/Jardim, phaseProgress e `guild-missions` intactos                                            | Opção original                                                      | Missões de gameplay bloqueadas; recursos já homologados de Guilda não foram removidos             |
| Equipamentos                           | Tela, inventário, atributos e regras/resolvedores intactos;9PNGs/10composições aprovadas mantidas | Opção original e espaços de equipamento somente leitura             | Em desenvolvimento, sem equipar/remover/comprar                                                   |
| Mochila                                | Tela/backpack e domínio de inventário intactos                                                    | Opção original                                                      | Em desenvolvimento, sem manipular itens                                                           |
| Loja                                   | Tela/shop, catálogo e preços intactos                                                             | Opção original                                                      | Em desenvolvimento, sem compras                                                                   |
| Coleção                                | Tela/collection e catálogo de cartas intactos                                                     | Opção original                                                      | Em desenvolvimento, sem abertura/concessão                                                        |
| Diário                                 | Tela/diary, registros e progresso intactos                                                        | Opção original                                                      | Em desenvolvimento, sem operações da Jornada                                                      |
| Guilda                                 | Telas/hub/manage, convites, chat, papéis e permissões intactos                                    | Opção original; sistemas atuais dentro do shell                     | Apenas escopo já homologado; nenhum grant novo                                                    |
| Arena e Torre                          | `arena-deck`, `arena-tower`, telaArena, motores e autoridade intactos                             | OpçãoArena original                                                 | Em desenvolvimento; Arena/Torre/API protegidas                                                    |
| EBD                                    | `guild-ebd`, aulas, atividades, respostas, presença, professores e histórico intactos             | Acrescentada ao menu original único                                 | Mantém controles atuais por papel/membro; nenhuma recompensa nova                                 |
| Minigames, exploração, enigmas e áudio | Jardim/Serpente, chest-reveal, áudio e fontes privadas preservados                                | Componentes históricos não apagados                                 | Gameplay permanece protegido; áudios privados/pending assets não entram no artefato               |
| Economia e persistência                | packages/game-engine, packages/database, migrations, RPCs e autoridade intactos                   | Apenas valores existentes de nível/XP/saldo em leitura              | Reconciliação/catálogo/recompensas anteriores continuam bloqueados                                |

O [inventário por arquivo](UI-RESTORE-002-INVENTORY.json) contém os Git blob IDs dos dez diretórios de features, mídia e packages/dados. **602/602 caminhos históricos continuam presentes; zero exclusões** no conjunto auditado de5edc93f. **249 arquivos de mídia** versionados inventariados. Isso prova retenção de arquivos, não homologação funcional de cada módulo. Módulos modificados por tarefas anteriores não foram revertidos para lógica antiga. Artes privadas não versionadas não foram movidas, editadas ou removidas nesta tarefa.

## Dados e segurança

Comparação comf0abffa: diff vazio em `apps/web/lib`, `proxy.ts`, Auth/providers, packages, Supabase/migrations, assets públicos/fontes, lockfile/dependências e patchRSC005. `GAMEPLAY_ENABLED=false`, allowlist, guardsHTTP/API e autoridade servidor permanecem intactos. Não houve mudança Auth/CORS/RLS/permissõesVercel, instalação de dependências, acesso ao projeto de outro produto ou escrita remota.

Auditoria **somente de leitura** no projetoPROD confirmado `wspafhlbtlpabypzymjo` (`RPGJOVEMCRISTAO`, ACTIVE_HEALTHY):35tabelas públicas/economy_private comRLS ativa, todas inventariadas. **35/35 hashes completos de dados de jogo/Guilda/EBD/economia iguais antes/depois**. Permanecem24Viajantes,24carteiras,37itens de inventário; a evidência cobre todas as35tabelas, não apenas essas contagens. Consultas retornaram agregados/MD5, sem conteúdo de jogadores ou credenciais. [Prova de preservação](UI-RESTORE-002-DATA-PRESERVATION.json).

O conjunto adicional `auth.users` manteve12contas, mas seu hash completo variou durante a auditoria. Não houve escrita Auth nesta tarefa; **a causa dessa variação não foi determinada**. A contagem sozinha não prova identidade; a prova separada registra o hash dos identificadores e contas confirmadas em duas leituras. Não tratar variação de metadados Auth como perda comprovada nem declarar todo o banco byte a byte idêntico. Não há restauração/reset/migration ou tentativa de “corrigir” esse delta. Produção não recebeu código desta UI.

## Testes e evidências

| Verificação                                             | Resultado local                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Suíte unitária integral                                 | 801PASS /74SKIP existentes; zero testes removidos                                                       |
| Lint                                                    | PASS, zero warnings                                                                                     |
| TypeScript                                              | PASS                                                                                                    |
| Build completo                                          | PASS;9artes/10composições e isolamento de áudio PASS                                                    |
| ProtocoloCI/release                                     | 25PASS                                                                                                  |
| Aplicação completa, Chromium/WebKit,3repetições/cenário | 24/24PASS, sem errosRSC/página/DOM/console                                                              |
| Navegação desktop/móvel                                 | 4telas,138checksPASS;11itens/8inertes, foco/scroll/toque/Escape, Guilda/EBD/Herói/logout                |
| NegativasHTTP reais em loopback                         | 403 em Arena/Torre, equipamentos/loja/mochila/coleção/diário, fase/História/mundos e autoridade starter |
| Capturas                                                | 21PNGs:6referência5edc93f,11proposta,4telas validadas; sem overflow nos checks das páginas capturadas   |

Os74SKIP Postgres existentes não equivalem a execução nesta tarefa; nenhum SQL/motor mudou. As36leituras agregadas remotas são evidência de preservação, não execução de fluxos de gameplay.

As primeiras rodadas expuseram seletores antigos do menu, inferência de tipo do ícone e um seletor de teste com acentos corrompidos; foram corrigidos e registrados. A rodada que terminou comFAIL na matrizUI já havia aprovado24/24RSC; oFAIL era o seletor do menu, com zero erros de página/console. A matriz posterior confirmou138checks. Não foi alterado timeout ou filtro de erros para ocultar RSC. Logs/provas locais em `docs/reviews/UI-RESTORE-002/evidence`.

O CI mantém controles nativos48 e correção63 da fixtureRSC e acrescenta a nova matriz ao comando da aplicação completa `--ui-mobile --restore`. Evidência remota canônica: [Checks da PR11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11/checks) para o SHA desta entrega; resultados/runs finais são registrados na descrição daPR. PASS local não substitui CI. Nenhum job de deploy é exigido/ativado nesta branch para esta revisão.

QA/Security e revisão React realizados pelo próprio autor, sem alegar independência. Validação móvel usa WebKit emulado, não Safari físico. Cadastro/recuperação foram verificados estruturalmente sem criar conta/envio de e-mail real; login/logout usam backend sintético local, não substituem testes reais de Preview.

## Aprovação e pendências

**Sem aprovação visual; sem merge/publicação.** A galeria usa o commit principal confirmado pelo usuário; a imagem14/10 original permanece indisponível neste turno. O aceite estético pertence ao usuário. UI-MOBILE-001 ficaREWORK/não aprovada, preservando seu histórico e evidências.

Antes de qualquer publicação, aplicar `.agent/RELEASE_POLICY.md`:CI do SHA exato, Preview com backend correto, fluxos reais autorizados e gates de segurança/dados. Nenhuma migration é necessária para esta UI. Aprovação visual não aprova gameplay ou todo o conteúdo anterior da PR11. Os bloqueios anteriores de16XP/6moedas, catálogo/recompensas/positivos hospedados/Safari físico continuam registrados; esta tarefa não os fechou.

Produção Guilda/EBD não foi alterada por esta tarefa; nenhum comando de deploy/promote/merge foi executado. Referência produtiva anterior808433a/URLoficial permanece apenas histórica, sem alegar novo READY remoto nesta auditoria. Tarefa **VALIDATING**, nãoDONE/DEPLOY_COMPLETE.
