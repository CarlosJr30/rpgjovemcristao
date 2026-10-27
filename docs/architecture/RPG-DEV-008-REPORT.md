# RPG-DEV-008 — Recuperação do Modo História

27/10/2026. **008A DONE / DEPLOY_COMPLETE — Jornada somente leitura publicada. 008B e 008C em preparação separada, ainda não publicadas.** Base `0357b444e191e60ae3d95b58f0ea9b80ff72ad89`; candidato `4a6ed0fe76427b3e5b3a3a5b10d520cf330ab501`, [PR #15](https://github.com/CarlosJr30/rpgjovemcristao/pull/15), merge normal `bd9dcb7373fcee2f22fd62e952aa25f9558beb0a`. PR #12 preservada aberta/draft em `61b7177`. O fechamento abaixo prevalece sobre os checkpoints históricos.

## Publicação concluída de 008A

- Oficial: https://rpgjovemcristao-web-inky.vercel.app, deployment `dpl_95c8SJGkM4hUJggpTpX76ER338ga`, READY/production/merge `bd9dcb7`, alias exato reconfirmado. CI merge [40488432305](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40488432305) success. Mesmo artefato Git promovido após150 checks produtivos aprovados; sem rebuild duplicado. autoAssignCustomDomains restaurado a true, proteção original preservada.
- **150 checks reais após promoção na URL oficial PASS**, além dos150 antes de promover e141 TEST. Chromium desktop/WebKit390px, Auth normal, conta/avatar ativo50 autorizados, legado persistido distinto do catálogo vazio, nove mundos/cinco histórias, recarga/estados bloqueados/isolamento e regressão007. **54 tentativas profile ignore-duplicates por rodada completa**, próprias e sem mudança de dados; não alegar zero POST.
- Migration mínima aplicada TEST `20261027101252` e PROD `20261027102522`; somente SELECT authenticated sob RLS existente. Conclusão, DML, economia, anonimato e leitura alheia continuam bloqueados.
- **38 tabelas PROD /40 TEST com contagens e hashes idênticos** ao baseline, reconferidos após publicação. **75 funções e39 policies PROD preservadas**; comparação estrutural completa identificou somente o grant exato autorizado. Sem alteração de dados de jogadores, avatar antigo, XP/moedas/inventário/equipamentos/cartas/progresso/Guilda/EBD.
- Evidência sanitizada: [RPG-DEV-008A-RELEASE-EVIDENCE.json](RPG-DEV-008A-RELEASE-EVIDENCE.json). Logs, capturas, falhas e snapshots privados em build/rpg-dev-008. QA/Security/editorial pelo autor, sem independência alegada.

Não há bloqueio crítico para a consulta publicada. story_progress hospedado está vazio em ambos ambientes: positivo parcial é prova PostgreSQL isolada, sem fingir progresso hospedado ou criar registros para testar. Atividades, minigames, conclusões persistentes e economia não são liberados por008A. B/C exigem seus próprios gates e não estão declarados DONE. Fechamento documental não exige deploy artificial.

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

## 008A — gates remotos e retenção do domínio

- CI candidato `4a6ed0f`: [push40485830229](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40485830229) e [PR40485867782](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40485867782), ambos success. Merge CI [40488432305](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40488432305) ainda em andamento neste checkpoint.
- [Preview TEST](https://rpgjovemcristao-fb810vfps-carlos-junior-s-projects.vercel.app), `dpl_2ELZGsvajsxFyANcs6aCLPgYXWmw`, READY/candidato exato/backend TEST. Somente as duas configurações públicas TEST da nova branch foram copiadas em memória; proteção mantida, acesso por CLI autenticada/cookie restrito à origem, sem mudar Trusted Sources.
- Migration008A aplicada TEST `20261027101252` e posteriormente PROD, após gates prévios. Apenas SELECT authenticated em story_progress; RLS/policy/owner function/complete_story e economia preservados. Scope TEST hero-equipment-006 e PROD guild-ebd-001, protocolo3. Versão remota PROD será vinculada no fechamento.
- **141 checks reais TEST PASS**: Auth normal da conta nova, consultas/recargas, nove mundos/cinco histórias/estados bloqueados/vazio canônico, desktop Chromium/WebKit390px, regressão dos três módulos007, negações alheias/anônimas, menu onze/sete links/quatro bloqueios e autoridade econômica403. Reutilização da mesma sessão em memória nas engines, sem alegar logins independentes ou aparelho físico. **54 POSTs preexistentes de profile ignore-duplicates**, verificados no próprio perfil existente; não são ausência absoluta de tentativas de escrita. Sem mutação econômica/de progresso observada, 40 tabelas TEST preservadas.
- Coletor real: primeiro deixou expectativa antiga de cinco bloqueios após liberar Jornada; segundo passou toda a UI/API em ambas engines, mas seu HTTP final usou header OIDC vazio e encontrou proteção Vercel. Falhas preservadas separadamente. Corrigida autenticação do coletor para cookie CLI e repetidos somente os oito checks HTTP pendentes, aprovados; resultado141 combina UI/API e esse seguimento no mesmo SHA. Nenhum filtro de erros, mudança runtime/Auth/RLS/CORS ou enfraquecimento de assertion para esconder falha. Não declarar as rodadas anteriores inteiramente PASS.
- **Preflight PROD12 e API pós-DDL13 PASS**, sessão autorizada/ativo50 confirmada; inventário6 linhas e equipamentos6 existentes, cinco hashes próprios idênticos; story_progress vazio próprio acessível após DDL, outro UID invisível/anon negado. Avatar antigo não foi selecionado para testes, sem concessões ou avanço.
- Baselines renovados imediatamente antes de PROD: **38 PROD /40 TEST idênticos ao007**. Snapshot estrutural privado com75 funções/38 tabelas/39 policies PROD, plano de compensação SELECT-only, recuperação isolada e probe em subtransação aprovados antes da migration/merge. Advisors mantêm categorias legadas, sem correção de configuração global.
- Deployment Git único `dpl_95c8SJGkM4hUJggpTpX76ER338ga`, [URL produtiva retida](https://rpgjovemcristao-j9bta82js-carlos-junior-s-projects.vercel.app), READY/merge `bd9dcb7`. autoAssignCustomDomains temporariamente false, proteção original all_except_custom_domains mantida; domínio oficial segue007. Homologação produtiva desse artefato em andamento, sem promoção nem DEPLOY_COMPLETE neste checkpoint.

Preparações independentes: `codex/rpg-dev-008b-missions` e `codex/rpg-dev-008c-minigames`, cada uma em worktree próprio sobre main007, sem inclusão da PR12. B prepara componentes originais com callbacks somente em memória e exploração restrita a três fragmentos, sem baús/coletas. C reutiliza engine/arte e callbacks de tutorial/resultado só em memória. Ainda não publicados; gates próprios pendentes. Conteúdo das quatro histórias candidatas não é liberado; não há autoridade persistente ou economia aprovada.
