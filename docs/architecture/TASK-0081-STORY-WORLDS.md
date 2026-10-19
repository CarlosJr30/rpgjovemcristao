# TASK-0081 — Modo História / contexto 01 de 09

STATUS: BLOCKED — arquitetura local preparada; campanha integral não aceita.

Branch: `codex/story-nine-worlds`. Worktree: `build/task-0081-story-worlds/checkout`. Base local: `99fb2c0` da TASK-0080, escolhida por já conter a autenticação de conta e correções do convite. Nenhum arquivo pendente do checkout 0080 foi copiado como fonte. Recibos e logs em `build/task-0081-story-worlds/`, fora do versionamento; o hash local validado será acrescentado ao controle após o commit.

## Auditoria e reaproveitamento

Existiam oito atos, uma fase `garden-choice` / rota `o-jardim-e-a-escolha`, exploração com Fragmentos, leitura de Gênesis 2–3 e compreensão, Devotional, Fuga da Serpente, banco de quiz, persistência por Viajante e componentes Shell/RequireTraveler. Map/Act/Spotlight/Phase ainda encaminhavam ao Desafio da Célula para desbloqueio narrativo. A flag `nextPhaseUnlocked` é derivada do fluxo antigo da Guilda e editável no save; não é evidência segura para a nova campanha.

Reutilizados Shell, identidade Auth, seleção de Viajantes, links/rotas antigas, asset `act_01_journey_map.png`, AdventurePortals, todo o motor visual/colisão da Serpente, leitura, quiz e devocional. Sem novos assets, serviços ou pacotes. A fachada CAMPAIGN agora deriva os nove mundos do catálogo único, mantendo GARDEN e seus identificadores para consumidores legados.

## Campanha e Mundo 1

| Ordem | Mundo | Estado desta entrega |
| --- | --- | --- |
| 1 | As Origens | Cinco histórias configuradas e navegáveis para consulta; Jardim adaptado; conclusão oficial pendente |
| 2 | Os Patriarcas | Estrutura e identidade visual; histórias em preparação |
| 3 | Libertação | Estrutura e identidade visual; histórias em preparação |
| 4 | Terra Prometida | Estrutura e identidade visual; histórias em preparação |
| 5 | Reis e Profetas | Estrutura e identidade visual; histórias em preparação |
| 6 | Exílio e Retorno | Estrutura e identidade visual; histórias em preparação |
| 7 | Vida de Jesus | Estrutura e identidade visual; histórias em preparação |
| 8 | Igreja Primitiva | Estrutura e identidade visual; histórias em preparação |
| 9 | Apocalipse e Nova Criação | Estrutura e identidade visual; histórias em preparação |

As Origens: `creation` (Gênesis 1–2), `garden-choice` (Gênesis 3; atividades legadas Gênesis 2–3 preservadas), `cain-abel` (4), `noah-ark` (6–9), `babel` (11). Quatro capítulos estão preparados, sem novos quizzes/lições/minigames de preenchimento. O Jardim não representa a implementação de todos os cinco capítulos. Sobreposições e classificação estão no [parecer editorial](../biblical/TASK-0081-ORIGINS-REVIEW.md).

IDs anteriores origins/patriarchs/liberation/kings/return/jesus/church permanecem quando semanticamente adequados. O agrupamento antigo `exile` foi consolidado em Exílio e Retorno (`return`); `promised-land` e `new-creation` são novos. Não havia progresso persistido individual por ato a migrar. `garden-choice`, chave econômica legada e rotas antigas permanecem. Nenhum save ou recompensa antiga foi apagado.

## Arquitetura e navegação

- `features/story/catalog.ts`: mundos/histórias com IDs, ordem, referências, requisitos, minigame, vídeo, recompensa e estado editorial. Adicionar história usa configuração e os componentes existentes; exige também seed/atestação revisados do servidor, não uma página por capítulo.
- `/journey`: mapa responsivo de nove mundos, identidade por cor/símbolo, descrições, estados e percentuais. `/journey/worlds/[worldId]`: histórias. `/journey/stories/[storyId]`: etapas, pendências, próximo passo, vídeo e conclusão. IDs desconhecidos retornam 404.
- Novo Viajante vai ao mapa; retorno de convite explícito é preservado. Início → Modo História → mapa → mundo → história. A rota antiga de As Origens reutiliza a nova lista.
- Progresso calcula conclusão por histórias oficiais; mundos vazios não contam como 100% nem liberam conteúdo inexistente. Revisita não chama concessão de recompensa. Erro de consulta não é exibido como percentual confirmado.
- Save legado do Jardim mantém sua etapa. Reward/diary antigos passam primeiro pelos requisitos de leitura/devocional e chegam ao vídeo; histórico `done` continua visível, explicitamente sem certificar o novo vídeo. Ao acabar o quiz, chega-se ao vídeo; não há concessão local antecipada de XP/moedas/baú/amuleto.
- Aprovação de líder deixou de ser pré-requisito e direcionamento narrativo. Guilda, suas aprovações, missões, recompensas e estado salvo não foram modificados. `nextPhaseUnlocked` permanece apenas para compatibilidade de Guilda; o novo motor não a consulta.

## Vídeos, persistência e recompensa

O contrato inclui provedor/ID/URL, autoria/fonte, autorização/termos/evidência, idioma, duração, disponibilidade, mecanismo de observação, legendas e alternativa acessível. Os cinco vídeos reais estão missing/pending, sem URL ou licença inventada. Embeds aprovados podem ser carregados explicitamente, mas não há player selecionado nem ingestão de eventos pronta. Abrir um embed não atesta conclusão; vídeo ausente, indisponível ou sem mecanismo de registro mantém bloqueio. Prova oficial e eventual observação de reprodução são distintas.

`storyRepository` usa o cliente Supabase tipado existente, lê snapshots por Viajante e invoca apenas a confirmação protegida. O hook cancela respostas antigas e nunca exibe o snapshot de outra conta. Não existe segundo sistema de identidade nem importação automática de saves como provas.

`packages/database/proposals/task0081-story-progress.sql` é proposta local, não migration registrada/aplicada. Define catálogo controlado, snapshots owner-only, recibos privados de etapas e confirmação idempotente com lock/ordem/revisão. Backend exige recibos de vídeo e recompensa antes de concluir, sem Guilda. Flags de ativação começam false. Foi aplicada somente em PostgreSQL sintético descartável. Nenhum backend hospedado está configurado/validado por esta entrega.

XP, moedas, baús e conquista têm contrato configurável; recompensa especial por mundo está preparada sem valor inventado. O Jardim conserva referência à configuração 120 XP/30 moedas/Baú Comum, porém não a concede novamente pelo novo fluxo. Falta adapter da economia/recibo da TASK-0078; não foi criado nem alterado saldo, wallet, RPC econômico ou contrato daquela tarefa. Unicidade e idempotência são comprovadas para a confirmação/recibo, não para uma concessão econômica ainda não integrada.

## Validação e gates

| Check | Evidência final |
| --- | --- |
| Unitários | 100 PASS / 11 arquivos / 0 FAIL; `unit-final.log` |
| PostgreSQL | 11 nós PASS, 0 FAIL/SKIP (10 cenários + teste pai); `postgres-first.log` |
| Navegador da campanha | 9 PASS, 0 FAIL/retry; `e2e-final.log` |
| Regressão de cadastro/login/recuperação | 3 PASS, 0 FAIL/retry; `e2e-registration-rework.log` |
| Lint/TypeScript/build | PASS; `lint-acceptance.log`, `typecheck-acceptance.log`, `build-final.log` |
| QA visual/acessibilidade local | Capturas desktop e celular inspecionadas, contraste corrigido, navegação por teclado e ausência de overflow testadas |

Chromium desktop 1440×900, móvel 320×740; WebKit móvel 390×844. Integrações SDK/Data API são simuladas; PostgreSQL é real/sintético, sem rede. Não equivalem a teste hospedado nem físico. Config temporária de regressão fica em `checkout/build/task-0081-story-worlds/registration.config.ts`; usa o mesmo build da campanha e seleciona apenas o fluxo afetado em `quick-registration.spec.ts`.

Evidências locais preservam falhas iniciais e REWORK: expectativas antigas no Diário; junction externa rejeitada pelo build; seletor de alerta colidindo com anunciador Next; config de registro anterior exigindo outro dist; navegação documental abortando prefetch WebKit, corrigida com links reais. QA/Security pelo autor, sem independência. [Revisão de segurança](../security/TASK-0081-STORY-SECURITY.md).

## Arquivos modificados

- `apps/web/features/story/`: catalog, progression + testes, use-story-progress + testes, world-map, world-screen, story-screen, video-panel, story.module.css e testes de UI.
- `apps/web/app/journey/worlds/[worldId]/page.tsx` e `stories/[storyId]/page.tsx`.
- `apps/web/features/journey/`: screens/map, act, phase, create, diary; components/journey-spotlight; data/campaign, phaseProgress, diaryView; testes phase-progress, phase-video-gate, diary-experience e screens/create.
- `apps/web/lib/supabase/`: database.types e repositories/story-repository.
- `packages/database/proposals/task0081-story-progress.sql`, `tests/story-progress.postgres.test.mjs`.
- `playwright.story-worlds.config.ts`, `tests/e2e/story-worlds.spec.ts`, ajustes direcionados em `tests/e2e/quick-registration.spec.ts`.
- Este relatório, pareceres próprios em docs/biblical e docs/security, contrato TASK-0081 e CURRENT_STATE. `next-env.d.ts` gerado foi restaurado; manifests, lockfile, migrations existentes e contratos anteriores permanecem iguais à base.

## Dependências e próxima etapa

1. Revisar/produzir conteúdo real dos quatro capítulos preparados, começando por A Criação; reaproveitamento do Jardim não substitui esse conteúdo.
2. Selecionar vídeos com autorização e mecanismo de observação, legendas/alternativas; implementar o adapter e o validador de eventos. Eventos do navegador não equivalem a antifraude.
3. Integrar recibos de atividades e a recompensa idempotente ao backend revisado da TASK-0078, reconciliando recompensas já recebidas sem duplicá-las.
4. Converter a proposta SQL em migration/schema revisados e validar em ambiente isolado autorizado; Auth/JWT/PostgREST e sincronização real entre aparelhos seguem pendentes.
5. Conferir aceite físico/editorial com Carlos. Não avançar ao contexto 02/09 antes de concluir o controle desta etapa.

Não houve push, merge, deploy, migration remota nem alteração de produção/main. A ausência de vídeos/conteúdo/integração impede DONE; não é falha mascarada como sucesso.
