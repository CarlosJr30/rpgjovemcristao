# RPG-COMMUNITY-043B.2 — decisões técnicas consolidadas

**Estado: planejamento e revisão; sem runtime, SQL executável, migration, consulta/escrita Supabase ou publicação.** Consolida os contratos 043B.1 sem alterar aprovações anteriores. As quotas numéricas e diretrizes de papéis já foram aprovadas; as semânticas marcadas como propostas e os itens de produto/privacidade pendentes abaixo não são autorização para implementar.

## 1. Estado e dependências

- Base documental conhecida: `724f0e76e2e519e21e369cfdd24e334d1a7f6a9a`; branch de trabalho `docs/rpg-community-043b1-foundation`.
- PR #54 está aberta, sem merge. CI `43486669144` terminou **success** no SHA-base documental `c6f2eba9b300c8d40b0be070b3b9ad860a3fc878`; jobs PostgreSQL isolado, testes/lint/tipos/build e RSC/móvel concluíram success. O job condicional de Preview foi **skipped**, não PASS; a PR é documental e não teve deploy. Qualquer atualização posterior da branch tem seu próprio estado de checks e não herda esse resultado.
- PR #53 está aberta, sem merge. CI conhecido `43458777891` success no candidato `c98638aecec0ff37db1ad3b933b3dbc12992d036`. Sua finalidade é alinhar o histórico local da ECONOMY-041 com a versão PROD `20261113153902`, preservando o SQL SHA-256 `1f377a035c68cde8921909536820a2e8fe3cc8d9c6b4d3c8dafe8901c6609ad0`.
- Integrar PR #53 pelo fluxo normal e conferir novamente versão/hash locais e remotos antes de qualquer migration comunitária. Não integrar PR #53 nem #54 nesta etapa; não executar `db push`.
- Tag `backup/rpg-equipment-fix-014-aprovado-2026-11-11` permanece na referência aprovada `3cfa561ab4cd76d86e89e9757d31ad3e11d504e1`.

## 2. Autoridades e delegações propostas

Cada operação é escopada a uma `guild_id` explícita. Auth, ownership do avatar, status da membership, papel e delegação são revalidados no servidor na transação; após lock/espera, revalidar novamente antes da escrita. Revogação vale no próximo pedido autorizado, sem confiar em cache ou JWT antigo para papel local.

| Papel | Autoridade local proposta | Limites e revogação |
|---|---|---|
| Membro | Participar de atividades; submeter prova conforme contrato; enviar pedido de entrada ou aceitar convite para avatar próprio; denunciar/bloquear conforme controles disponíveis. | Não administra terceiros, missões, convite de Guilda ou papel. |
| Moderador | Analisar denúncias e moderar conteúdo/interações da própria Guilda dentro de competências enumeradas e auditáveis. | Sem gestão de membership, convites, missões, liderança ou economia por padrão; não age em outra Guilda. Suspensão de conteúdo não equivale à suspensão de membership. |
| Colíder | Auxilia gestão de membros, convites e missões **somente** em ações explicitamente delegadas pelo líder, por Guilda e revogáveis. | Não transfere liderança, não designa/revoga líder, não assume moderação automaticamente, não recebe Admin global/EBD/economia. Ausência de grant granular significa negar. |
| Líder | Administra somente sua Guilda; aprova pedidos, gerencia membros, cria/administra missões e designa colíder/moderadores conforme a matriz aprovada. | Não emite recompensas ou recursos; não altera outras Guildas, Admin global ou papéis escolares. Transferência é transação separada com liderança contínua. |
| Administração global | Contenção de comunidade abusiva, incidente grave e recurso por autoridade administrativa global própria, com justificativa e auditoria. | Não herda nem assume liderança, membership ou acesso irrestrito ao conteúdo da Guilda. Escopo e processo de recurso precisam de operação definida. |

O detalhamento por 18 operações, autoridade atual, RPC candidata, Auth/ownership, RLS/ACL, lock/idempotência, auditoria e negativas está em [043B.1 Permission Matrix](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md). Responsabilidades não são grants nem permissões existentes. Mudanças de delegação além desta proposta exigem aprovação antes do runtime.

## 3. Criação comum sem autoridade global

Reutilizar `public.create_guild`/`guild_admin_private.guild_command` somente após separar duas autoridades: **criar minha própria Guilda** e **administrar Guildas globalmente**. Hoje o helper de criação ainda exige `leader_authorizations`; não remover esse controle dos comandos administrativos e não usá-lo como requisito para a criação comum.

Criação exige conta Auth válida, não anônima/suspensa, avatar próprio ativo, elegibilidade confirmada, nome/conteúdo validados e limite vitalício de uma Guilda criada por conta. A criação deriva `created_by` da sessão, insere Guilda + membership líder + marcador de quota + auditoria na mesma transação e aceita request key. Não inventar mínimo de nível nem regra de idade. Account/avatar removidos, erro, timeout, replay, concorrência e recuperação estão detalhados em [Creation Contract](RPG-COMMUNITY-043B1-CREATION-CONTRACT.md).

### Separação de lançamento

1. **043B-IMPL-1 — criação controlada:** desenvolver e homologar em TEST, com diretório desligado e novas Guildas privadas/não listáveis por padrão; possível allowlist temporária somente server-side em TEST. Não habilitar descoberta, ingresso público ou contato. Rollout para criar Guildas em PROD requer plano/gate próprio.
2. **043B-IMPL-2 — descoberta pública:** visibilidade pública, diretório autenticado e pedidos aprovados só após controles de denúncia/bloqueio/moderação, proteção de menores, revisão jurídica e capacidade operacional demonstradas.

## 4. Quotas aprovadas e semântica

Os números aprovados permanecem exatamente estes:

| Regra | Limite |
|---|---:|
| Guildas criadas por conta | 1, vitalícia para o registro da conta |
| Participações ativas por avatar | 5 |
| Integrantes ativos por Guilda | 50, incluindo todos os papéis |
| Links ativos por Guilda | 10 |
| Validade de link novo | Até 30 dias |
| Usos de link novo | Até 50 |
| Convites individuais | 20/Guilda/janela móvel 24h |
| Pedidos de entrada | 5/conta/janela móvel 24h |
| Pedido pendente | 1/avatar/Guilda |
| Espera após rejeição | 24h |
| Mudança de nome | 1/Guilda/janela móvel 7 dias |

Aplicação técnica proposta: somente ações confirmadas no servidor consomem; janelas usam UTC do banco; retries com mesma request key/payload retornam resultado sem contar de novo; mesma chave com payload divergente é negada. Criação consome após commit completo; membership ativa consome vaga e saída/remoção libera; convite/link não reserva vaga; capacidade é revalidada na aprovação. Link conta uso na membership aprovada iniciada por link válido. Pedido persiste e consome a quota de pedidos quando criado; rejeição/cancelamento não devolve essa quota. Emissão individual conta quando persistida; revogar depois não devolve emissão. Rename consome somente após alteração bem-sucedida.

Detalhes ainda sujeitos a confirmação de produto/privacidade: se revogação de link cancela pedido que já foi submetido sob validade; confirmação de cooldown por avatar/Guilda; política de retenção do marcador após exclusão/recuperação de conta; não reembolso de quotas após pedido confirmado. Ver [043B.1 Quotas](RPG-COMMUNITY-043B1-QUOTAS.md). Nenhuma quota pode emitir XP/moedas/itens ou alterar ECONOMY-041.

## 5. Convites e dados históricos

- Preservar Guildas, líderes, memberships multiguild, pedidos pendentes, missões, progresso, claims, EBD e ECONOMY-041.
- Convites e QR existentes mantêm hash, validade, status, revogação, consumos e associação a pedidos; não reescrever, revogar, encurtar nem estimar usos históricos.
- Novas regras de 30 dias/50 usos só aplicam após ponto de corte a links comprovadamente novos. Caso não seja possível distingui-los, continuar comportamento legado até expiração natural, sem inferência baseada na contagem atual de membros.
- Não reintroduzir índice que impeça multiguild. Não abrir RLS/tabela base para o diretório; responder apenas projeção allowlisted autenticada e nunca roster/PII/escola/convites/pedidos privados.
- Default recomendado para Guilda não classificada: não listável/privada, sem mudar membership. Confirmar método aditivo e sem UPDATE amplo na tarefa de implementação.

Mais detalhes de dados/autoridades/recuperação: [043B.1 Compatibility](RPG-COMMUNITY-043B1-COMPATIBILITY.md).

## 6. Proteção de menores e operação

Diretrizes aprovadas: privacidade por padrão, dados mínimos, nomes públicos moderáveis, diretório sem roster, denúncia/bloqueio acessíveis, contenção de conteúdo, prevenção de assédio/aliciamento, revisão do chat atual e sem comunicação privada irrestrita entre adultos e menores. Não inferir idade por avatar, nível ou atividade.

As metas previamente propostas de triagem (comum até 72h, assédio/ameaça/exposição de dados até 24h, risco iminente encaminhado imediatamente) **não são SLAs**. Antes da IMPL-2 precisam existir responsável nomeado, cobertura/capacidade comprovada, procedimento de triagem e escalonamento, retenção/exclusão/acesso aos registros, recurso e revisão jurídica de LGPD/requisitos para crianças/adolescentes e regras de autorização/representação aplicáveis. Sem esses itens, manter diretório e funções de contato desligados.

## 7. Testes e recuperação futuros

Executar somente depois de contrato runtime aprovado, PR #53 integrada, preflight de schema/ACL/migration e escopo formal:

- Criação atômica, replay, payload divergente, corrida entre avatares da mesma conta, conta/avatar inválido/removido/suspenso e uma criação vitalícia.
- Limites exatos e acima do limite; cinco memberships; capacidade com 50 papéis ativos; vagas liberadas por saída/removal; relógio UTC, cancelamento/rejeição e retentativas conforme semântica aprovada.
- Cada uma das 18 ações por papel permitido/negado; delegação e revogação concorrentes; papel local contra Guilda errada; Admin global sem herança local; Auth/RLS/ACL e chamadas diretas.
- Links antigos e novos separados: hash/status/expiração/consumo intactos; novo link revogado/expirado/esgotado, replay, 50º uso, competição simultânea no limite e capacidade não ultrapassada.
- Diretório allowlisted sem roster/PII e sem enumeração de Guilda privada; zero alteração econômica; missões sem payout 043B; EBD e contratos legados preservados.
- Falha após cada etapa, contenção por feature/ação, app anterior compatível com schema expandido e comparação de baselines. Não chamar export de schema de backup restaurável; restore exige ensaio controlado e autorização própria.

Plano completo e gates estão em [043B.1 Test Plan](RPG-COMMUNITY-043B1-TEST-PLAN.md). RELEASE_POLICY exige CI no SHA, migration aprovada em TEST, Preview/backend TEST, login e smoke real aplicáveis; mocks/SQL não substituem. Não repetir suites sem mudança relevante.

## 8. Aprovações ainda necessárias

### Produto/privacidade

1. Confirmar definição de 50 usos e efeito de revogação/expiração sobre pedidos já criados.
2. Confirmar cooldown de rejeição por par avatar/Guilda e tratamento de cancelamento/reembolso das quotas.
3. Aprovar retenção do marcador de criação após exclusão/recuperação Auth.
4. Aprovar se contagem agregada aparece no diretório, além dos campos públicos já listados.
5. Confirmar delegação granular de colíder: aprovação de pedidos, remoção/suspensão de membros, emissão/revogação de convites e criação/revisão de missões; padrão seguro é negar sem grant específico.

### Operação/segurança para IMPL-2

6. Concluir parecer legal e política de privacidade/retention para menores.
7. Nomear responsáveis, comprovar cobertura de atendimento e aprovar protocolo/recursos/SLAs públicos.
8. Aprovar controles de nome/descrição, denúncia, bloqueio, contenção e comunicação apropriada à faixa etária; definir faixa/consentimento sem inferência de avatar.

### Elegibilidade e rollout

9. Confirmar se basta conta ativa/confirmada, avatar próprio ativo e sem suspensão, ou se há critérios adicionais. Não inventar nível mínimo ou exigir Admin global.
10. Definir limite e canal do rollout de produção da criação IMPL-1 depois de TEST; esta fase não autoriza abertura pública nem produção.

## 9. Critérios de início e fora de escopo

043B-IMPL-1 só pode iniciar após fechar semânticas de quotas e delegações, critérios de elegibilidade, compatibilidade do schema e recuperação, integração/conferência da PR #53 e autorização runtime específica. 043B-IMPL-2 depende adicionalmente de todas as aprovações legais e operacionais acima.

Fora desta execução: código, migrations, grants/RLS, feature flags, consulta ou escrita Supabase, dados de jogador, implementação de missão/recompensa, abertura do diretório, merge de PR #53/#54 e deployment.

## Referências de planejamento

- [Permissões](RPG-COMMUNITY-043B1-PERMISSION-MATRIX.md)
- [Criação](RPG-COMMUNITY-043B1-CREATION-CONTRACT.md)
- [Quotas](RPG-COMMUNITY-043B1-QUOTAS.md)
- [Compatibilidade e recuperação](RPG-COMMUNITY-043B1-COMPATIBILITY.md)
- [Plano de testes](RPG-COMMUNITY-043B1-TEST-PLAN.md)
- [Decisões abertas 043B](RPG-COMMUNITY-043B-OPEN-DECISIONS.md)
