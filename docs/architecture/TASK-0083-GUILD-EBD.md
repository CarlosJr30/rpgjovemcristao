# TASK-0083 — Escola Bíblica da Guilda

Implementação concluída e validada localmente: **local PASS; aceite integral/hospedado BLOCKED**. Não há aulas prontas, interpretação religiosa automática nem conteúdo narrativo oficial novo. O responsável escreve seu material; a interface identifica essa autoria. Nenhuma aula sintética é inserida fora dos testes.

## 1. Base e controle

- Branch local `codex/guild-ebd`, worktree `build/task-0083-ebd/checkout`.
- Base confirmada: `775d7e70fcd2b12a7037a21b636d976d776f2a4e`, TASK-0082, herdando0081/0080. Sem copiar alterações pendentes de outro checkout.
- Main local `0df8787`, origin/main local `5508514`, raiz `integration/chat-notebook-20261014/a1a2053` preservadas; não houve fetch/push/merge/deploy/SQL remoto.
- Commit local da implementação é identificado no registro final de controle abaixo; nenhum commit foi enviado ao remoto.

## 2. Recursos reaproveitados

Auditoria dos contratos0016/0030/0080/0081/0082 e migration0005 confirmou `guild_lessons`, leitura de aulas na Guilda, agenda derivada, Auth/Travelers/membros e tiers econômicos existentes. A proposta amplia a tabela, sem duplicar identidades, cursos oficiais, carteira ou calendário. Mantém textos, main_points, discussion_questions, activity_text e vínculo legado com missão; exibe esses campos sem reinterpretar ou apagá-los.

Reutiliza `Shell`, `RequireTraveler`, cliente Supabase singleton e CSS do painel0082. Entradas para `/journey/guild/ebd` na área comum e no painel de missões. Convites/QR/pedidos/missões continuam nos fluxos existentes. Editor/RPCs antigos de aula são revogados apenas no cutover da proposta, para não contornar versões/permissões. Seus arquivos e os contratos anteriores ficam preservados.

## 3. Painel e editor

Dez áreas: visão geral, aulas, criar aula, rascunhos, atividades/questionários, agenda, presença, alunos, professores e histórico. Celular usa seletor nativo de seção. Paginação explícita de 20 aulas; agenda, atividades e resultados referem-se à página de aulas carregada, indicada na interface. Auditoria mostra até100 alterações recentes; snapshots integrais continuam privados no banco.

Editor vazio: título, tema, descrição, conteúdo livre, referência opcional, data/hora local convertida para timestamptz, professor responsável, público geral ou até100 membros, até20 materiais, objetivos e tier opcional. Salvar mantém rascunho; publicar/agendar são ações separadas. Estados: draft → scheduled/published/archived; scheduled → draft/published/archived; published → closed; closed → archived. Estados completed/cancelled legados preservados. Agendamento não executa publicação automática. Conteúdo e atividades ficam imutáveis após publicar; criar outro rascunho é opção para novo conteúdo.

Versão esperada e locks impedem sobrescrita concorrente. Conflito40001 mantém texto do editor e orienta copiar antes de recarregar/descartar. O editor tem aviso ao fechar a página; não grava rascunhos pedagógicos no localStorage. É necessário salvar explicitamente para continuar depois. UUID estável permite repetir criação após perda da resposta, sem duplicar aula/atividade.

## 4. Papéis

| Papel | Escopo |
| --- | --- |
| Líder efetivo | Sua Guilda ativa: professores, aulas, publicação, respostas e presença |
| Professor ativo autorizado | Rascunhos e resultados das aulas sob sua responsabilidade; publicar e registrar presença dependem de flags separadas |
| Aluno ativo | Aulas published/closed/completed elegíveis, suas respostas, feedback, presenças e pendências |

Autorização usa Auth owner real, conta não anônima, Guilda e vínculo ativos; não usa user_metadata ou papel enviado pela interface. Professor não vira líder, não recebe APIs de missão, convites ou moderação. Rascunhos/agendadas não são expostos ao aluno. Nome/ID mínimos dos membros permitem escolher professor/público; não há e-mail, diário, Auth IDs ou ranking de alunos. Remover autorização bloqueia gestão; sair da Guilda bloqueia todo acesso EBD.

## 5. Atividades e avaliações

Até20 atividades por aula, cada uma com enunciado/pergunta. Tipos: múltipla escolha (2–6 opções), aberta, reflexiva, presencial e tarefa para casa. Formam um conjunto de perguntas/atividades na aula; não há competição obrigatória ou nota de espiritualidade. Prazo opcional, 1–5 tentativas, critério de conclusão explícito.

Objetivas são avaliadas pelo servidor por acerto ou participação, conforme configuração. Demais tipos aguardam avaliação manual completed/revise com feedback até1000 caracteres. Uma tentativa pendente impede novo envio; uma conclusão encerra novos envios. Avaliação de si próprio, inclusive outro avatar da mesma conta, é negada. Erros/ausência não retiram XP.

Gabarito fica em tabela sem SELECT para clientes. Workspace o remove de todas as atividades do aluno até completed ou última tentativa avaliada sem acerto; professores só recebem gabaritos das aulas sob sua gestão. Respostas são retornadas só ao autor ou gestor daquela aula, inclusive quando um professor acessa outra aula como aluno. Retry de envio usa UUID estável; unique(activity,traveler,attempt) e serialização impedem duplicidade.

## 6. Agenda e presença

Agenda deriva datas das aulas e prazos de atividades, sem nova entidade de calendário/cron. Líder/professor com can_attend registra present/absent em aula publicada/encerrada para aluno ativo elegível. Não existe autoatestado do aluno. Justificativa opcional até500 caracteres, com orientação para evitar dados sensíveis. Correção exige versão atual e guarda before/after, responsável e instante; aluno vê só sua presença.

## 7. SQL e segurança

Proposta local [task0083-guild-ebd.sql](../../packages/database/proposals/task0083-guild-ebd.sql), sem registro de migration/journal ou aplicação remota. Ordem de ensaio: baseline real0000–0008 + QR0080 + proposta0082 + proposta0083. Requer futura migração gerada/revisada e alinhamento do schema quando houver ambiente autorizado. CLI Supabase ausente; nenhum pacote foi instalado nem advisor remoto chamado. PostgreSQL/ACL/RLS e revisão manual não são apresentados como resultado de advisors.

Amplia guild_lessons e cria grants de professores, atividades/gabaritos, respostas/avaliações, presença, histórico/snapshots e recibos de recompensa pendente. Novas tabelas têm RLS e nenhum grant direto ao cliente; política de leitura de aulas respeita acesso/autoria/elegibilidade. RPCs públicas são SECURITY INVOKER; implementação privilegiada está em ebd_ops não exposto, com auth/ownership explícitos, search_path vazio, ACL exata e sem SQL dinâmico com entrada do cliente. SQL dinâmico do bloco de instalação usa apenas nomes constantes/format %I.

Comandos EBD são serializados por Guilda usando advisory transaction lock e locks de linha, além de versões. Alterações importantes e avaliações/presenças guardam histórico restrito; snapshots não entram no workspace do aluno. Controles de público também são aplicados à leitura legada de guild_lessons. Nenhuma alteração nas RPCs de missões, convites, Auth ou Story.

Materiais: texto/referência até2000 caracteres ou URL HTTPS pública até500, sem credenciais, portas, IPs/hosts locais, esquemas executáveis ou HTML renderizado. Imagem/PDF são referências externas abertas com noopener/noreferrer; nenhum fetch, embed, upload, cópia de obra ou bucket. Como não há upload, MIME/tamanho real de arquivo externo não é verificado nem afirmado; upload exigirá storage privado e validação própria.

## 8. Evidências de validação

Logs separados em `build/task-0083-ebd/`, fora do versionamento. Vitest testa contratos/UI e regressão do painel/membro; banco real descartável testa a proposta sem reescrever SQL; Playwright usa SDK/DataAPI sintéticos e bloqueia rede externa. Não equivale a integração Auth/JWT/PostgREST hospedada ou teste físico.

| Gate | Resultado / evidência |
| --- | --- |
| Unit/UI + regressão Guilda | PASS: 41/41, cinco arquivos, `unit-visual-acceptance.log` |
| PostgreSQL17 real/sintético/offline | PASS: oito nós (sete cenários compostos + pai), zero FAIL/SKIP, `postgres-initial.log`; proposta exata e baseline completo |
| EBD browser | PASS: seis cenários, dois fluxos × desktopChromium1440×900 / mobileChromium320×740 / WebKit390×844, `e2e-visual-acceptance.log` |
| Missões/pedidos | PASS: dois cenários desktop herdados, `e2e-guild-regression.log` |
| QR/cadastro/entrada pending | PASS: um cenário desktop herdado, `e2e-qr-final.log` |
| História independente | PASS: um cenário desktop herdado de revisita/desbloqueio sem Guilda, `e2e-story-regression.log`; fontes/contrato0081 intactos |
| Lint / TypeScript / build | PASS: `lint-visual-acceptance.log`, `typecheck-visual-acceptance.log`, `build-visual-acceptance.log` |
| Visual/acessibilidade local | Capturas inspecionadas desktop/editor/presença e móvel320/editor/WebKit390/aluno; sem overflow nos testes, labels explícitos, foco/controles nativos. Recompensa completa quebra linha fora do seletor no celular |
| Segurança / bibliografia / preservação | Parecer próprio, sem achado crítico/alto aberto no diff; nenhum conteúdo bíblico oficial novo. Comparação Git confirma AuthQR/Story/SQLs/contratos anteriores/economia/pacotes intactos |

QA e Security pelo autor, sem independência. Revisão React Best Practices aplicada a hooks, cleanup, dados assíncronos, controles/labels, renderização de texto e estilos existentes.

Reworks documentados, sem falha final aberta: sintaxe de callbacks TSX, inferência de ref em JSX (ações extraídas para componente), relógio do prazo com estado/cleanup, opção `exact` da biblioteca de teste corrigida; browser inicial3FAIL/3PASS por rótulo de Aluno, segunda rodada5FAIL/1PASS por espera de nav CSS-oculta e rótulos de select ambíguos. Corrigidos nomes acessíveis e espera pelo seletor montado; desktop2PASS/mobile4PASS, seguidos dos seis cenários repetidos após revisão visual final. Capturas e logs anteriores preservados em diretórios separados. QR inicial não iniciou por config herdada apontar cache móvel0062; config local temporária usa build atual, sem alterar configuração antiga ou criar dependência. O cenário QR subsequente passou.

## 9. Arquivos

- `apps/web/features/guild-ebd/*`: contratos, editor de aula/atividade, participação, professores/presença, painel, tela e testes/fixtures somente de teste.
- `apps/web/app/journey/guild/ebd/page.tsx`: rota.
- `apps/web/lib/supabase/repositories/guild-ebd-repository.ts` e duas assinaturas RPC em database.types.ts.
- Duas entradas por link: painel0082 e OnlineGuildHub existente.
- Proposta SQL, ensaio PostgreSQL e Playwright próprios.
- Este relatório, parecer Security e contrato0083. Nenhum asset, pacote/lockfile ou contrato anterior modificado.

## 10. Dependências externas

Aplicação de SQL/schema/cutover em ambiente isolado e autorizado; validação real Auth/JWT/PostgREST, contas e aparelhos. TASK-0078 continua bloqueando concessão econômica; EBD funciona sem ela. Tiers reutilizam guildMissionRewards; recibo único (lesson,traveler) registra primeira atividade avaliada concluída, tier e critério imutáveis, sem saldo/XP/baú/claim. Recompensa opcional é explicitamente pendente. Conquista educacional e adapter econômico são integração futura sujeita ao contrato apropriado; não há nova carteira ou endpoint de grant.

## 11. Checklist

Ver [contrato ativo](../../tasks/active/TASK-0083-guild-ebd.md): escopo local e gates comprovados; memória atualizada na raiz de controle, preservando histórico e alterações anteriores. Aceite integral depende de provas hospedadas; não classificar pendência de ambiente como DONE.

## 12. Próxima etapa

Revisar o pacote SQL/cutover e preparar validação isolada hospedada sob autorização específica posterior. Não iniciar contexto04/09, não publicar ou aplicar SQL no escopo deste pedido. Preservar validações anteriores e repetir somente o que a próxima mudança afetar.
