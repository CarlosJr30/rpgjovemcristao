# RPG-DEV-008 — Recuperação do Modo História

27/10/2026. **ACTIVE — auditoria e preparação da entrega 008A.** Base main remoto `0357b444e191e60ae3d95b58f0ea9b80ff72ad89`; branch `codex/rpg-dev-008a-journey`, worktree próprio. PR #12 preservada aberta/draft em `61b7177`. Nenhuma migration, merge ou publicação 008 executada.

## Conteúdo identificado

Catálogo existente `features/story/catalog.ts`: nove mundos (As Origens, Os Patriarcas, Libertação, Terra Prometida, Reis e Profetas, Exílio e Retorno, Vida de Jesus, Igreja Primitiva, Apocalipse e Nova Criação). Apenas As Origens tem cinco entradas: Criação; Jardim do Éden e Queda combinados; Caim e Abel; Noé; Babel. Não separar/inventar fases para obter seis. Demais mundos permanecem planejados, sem fases implementadas.

O Jardim e a Escolha é a fase legada de Gênesis 2–3; as outras quatro histórias são candidatas. Vídeos e revisão econômica do catálogo estão pendentes. As telas antigas incluem links/controles operacionais e consulta a story_progress; não podem ser simplesmente desbloqueadas. Progresso legado em travelers.journey_progress é distinto dos registros de histórias e não pode fabricar recibos/conclusões do novo catálogo.

## Gates e limites

- 008A: implementada consulta de mapa, mundos, referências, requisitos, objetivo legado do Jardim e progresso existente; validação local aprovada, CI/Preview/publicação PENDING.
- 008B: auditoria de leituras, oração/reflexão, exploração e quiz; persistência bloqueada até autoridade validada. Execução demonstrativa autorizada pelo usuário como alternativa explícita.
- 008C: auditoria de Fuga da Serpente, controles/câmera/colisões/vitória/derrota/reinício/celular; sem economia. Testes ainda PENDING.
- QA/Security/editorial pelo autor, sem independência alegada. Preservar dados e evidências de 007. Sem recursos pagos ou concessões artificiais.

## Ambientes

GitHub main e PR #12 reconfirmados; PROD 7 migrations / TEST 26. Alias oficial mantém deployment final 007 `dpl_9fGNqsrMoZe3D6qSFQWQdy4Byu8N`. Conferências adicionais de READY/SHA/backend e baselines serão registradas antes das etapas remotas. Sem resultado 008 local ou hospedado declarado aprovado nesta preparação.

## Checkpoint 008A — implementação e validação local

Mapa acessível em `/journey/worlds`, nove páginas de mundo e cinco páginas de história somente leitura. O salão e avatar central permanecem; menu de onze opções agora oferece sete consultas/módulos aprovados, com Missões/Equipamentos/Loja/Arena bloqueados. Nenhuma rota antiga operacional da Jornada foi liberada. Metadados reutilizam catálogo e CSS existentes; não há novas artes, dependências ou narrativa. Objetivos das outras quatro histórias candidatas não são publicados; sua revisão permanece pendente. Parecer [008A](../biblical/RPG-DEV-008A-CATALOG-REVIEW.md).

Leitura fresca do legado reutiliza `ArchiveAccess/readOnlineArchive` sem salvar snapshot. A consulta adicional de `story_progress` seleciona seis campos próprios, valida schema/IDs/etapas/datas/duplicatas, captura revisão de sessão e descarta resposta depois de troca de conta/avatar/sessão. Erro/negação não vira estado vazio. Histórico legado não completa histórias, não presume vídeo/recompensa nem desbloqueia fases.

| Verificação local | Resultado |
| --- | --- |
| Unitários integrais | 851 PASS / 74 SKIP; 125 arquivos aprovados, 7 opt-in omitidos |
| Direcionados de leitura, UI, menu e fronteira | 58 PASS, incluídos na suíte integral |
| Lint / tipos / build completo | PASS, incluindo isolamento de áudio e assets aprovados |
| Protocolo CI local | 25 PASS |
| PostgreSQL isolado | 16 PASS: leitura própria parcial, vazio alheio com/sem filtro, anônimo/sem sujeito, anon/service negados, DML/RPC/economia negadas, preservação e recuperação |
| Bundle real com API/Auth sintéticos | 24 RSC, 222 interface, 48 Guilda PASS; desktop, WebKit 390px/320px/paisagem. Capturas de mapa inspecionadas. Não é prova hospedada ou aparelho físico. |
| Preservação original | 52 caminhos do manifesto, zero divergências; quatro worktrees preservados |

Primeira regressão RSC local: 24 casos funcionais, dois WebKit com erro de fetch `guild_members` durante navegação/recarga imediata. Falha preservada em build/rpg-dev-008/rsc-first-results.json. Segunda execução sem alterações em Auth/RLS/CORS/assertions passou 24/24 sem erros; a primeira não é declarada PASS. PostgreSQL usa o binário temporário já fixado de 007 em loopback, sem serviço Windows, recurso pago ou credenciais remotas; cluster encerrado ao final. Fixtures sintéticas não equivalem a dados hospedados.

### Banco, segurança e recuperação preparada

`story_progress` existe em ambos ambientes, com zero registros, RLS ativa e policy SELECT existente vinculada ao dono e JWT não anônimo. Seus grants de leitura/escrita e `complete_story` estão negados. Migration preparada via CLI 2.122.0: `20261027095417_rpg_dev_008_story_progress_read.sql`. Concede **somente SELECT authenticated nessa tabela**, exige baseline sem permissões, policy de dono exata e RLS ativa; não modifica policy, função, tabela, progressão, Auth ou economia. Sem SELECT para anon/service_role. Nenhuma migration remota 008 aplicada neste checkpoint.

Recuperação ensaiada no PostgreSQL isolado e em subtransação da migration: revogar somente SELECT de authenticated restaura ACL exata, com dados preservados. Antes de qualquer DDL PROD: renovar identidade/versões/ACL/policy/definições, hashes e sessão autorizada; aplicar exclusivamente 008A em transação depois dos gates TEST/CI/Preview. Em falha, parar, preservar/restaurar artefato `0357b44`, revogar apenas a permissão nova conforme snapshot e registrar compensação, sem apagar dados ou histórico de migrations. Aplicação anterior é compatível com a permissão aditiva. Não aplicar migrations pendentes alheias ou a 006.

Baselines renovados: 38 conjuntos PROD e 40 TEST idênticos ao fechamento 007, incluindo tabelas privadas de história/Guilda. Sessão normal PROD novamente confirmada como a conta autorizada e único avatar ativo nível 50; avatar antigo não utilizado. Nenhum dado de jogo modificado. Conector Supabase e CLI Vercel autenticada confirmam ambientes; deployment oficial READY/production/SHA `0357b44`, alias correto. Advisors guardados para comparação, sem mudança de configuração.

Auditoria npm do lockfile existente: 9 avisos (6 moderate, 3 high). High em undici é transitivo de jsdom (teste); Vite é ferramenta de desenvolvimento, sem servidor público habilitado; Zod só valida URL de configuração do pacote database, sem collections arbitrárias ou uso na aplicação web. Revisão de alcance não identificou caminho atingível desses avisos no escopo publicado; execução de testes em modo run/loopback, sem API de mock/editor exposta. Não executar `audit fix --force`, atualizar majors ou declarar ausência geral de vulnerabilidades. Manutenção dessas dependências permanece pendente, sem novo pacote/lockfile alterado nesta entrega.

Antes de produção continuam obrigatórios: CI no SHA exato, Preview TEST com sessão normal e novas consultas/negações hospedadas, comparação de dados/estruturas, preflight/recuperação renovados. Depois de implantação produtiva retida: conferir os fluxos de consulta antes da promoção, READY/SHA/backend/alias, repetir na URL oficial e preservar hashes. Nenhum gate pendente convertido em PASS.
