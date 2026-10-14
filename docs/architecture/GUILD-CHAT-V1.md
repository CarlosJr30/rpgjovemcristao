# Chat da célula V1 — TASK-0071

Implementado em 2026-10-14. Aceite **BLOCKED** pelo teste de duas sessões reais em navegadores distintos. Código, migrações, SQL de segurança e QA com fixtures foram executados; não equivalem à comprovação do transporte Realtime autenticado.

Na conciliação do notebook (TASK-0072), o contrato local originalmente chamado TASK-0062 foi reidentificado como TASK-0071: TASK-0062 já identifica a entrega mobile publicada. Os registros publicados foram preservados. As migrações locais do chat passaram de 0006/0007 para 0007/0008 para acomodar `0006_traveler_journey_progress.sql`; os nomes/versões já aplicados no Supabase continuam iguais. Nenhuma migração foi reaplicada por causa da renumeração.

## Auditoria e integração

- AuthProvider e cliente browser Supabase existentes, com sessão persistente e sincronização de Viajantes. Nenhuma alteração no Auth, saves ou mecânicas.
- Guilda online usa `guilds`/`guild_members`; papéis existentes: leader/co_leader/moderator/member. Associação exige aprovação no fluxo existente.
- Projeto `RPGJOVEMCRISTAO` (`wspafhlbtlpabypzymjo`), URL local conferida pelo teste da API. O usuário autorizou explicitamente aplicar a migração.
- Antes do teste: 8 contas não anônimas, 11 Viajantes, 0 Guildas e 0 associações. Seleção read-only de dois Viajantes de contas distintas: “Viajante Teste”, ID final `51057`, e “Viajante”, final `eff5b`. Não foram obtidas senhas, tokens ou novas credenciais.
- Testes SQL criaram Guildas e associações somente dentro de uma transação com `ROLLBACK`; depois: 0 Guildas, 0 associações, 0 mensagens. Sequências podem avançar durante testes revertidos, comportamento normal de Postgres.
- Chat na Guilda online `/journey/guild`, botão “Abrir chat”. Modo local não busca nem simula conversa remota. O painel de gerenciamento continua acessível pelo fluxo existente; a moderação do chat fica na Guilda comum.

## Esquema e API

| Tabela | Finalidade | Acesso autenticado direto |
| --- | --- | --- |
| `guild_chat_messages` | Texto, avatar/nome de Viajante obtidos do banco, horário, aviso de líder e marcador de remoção | SELECT com participação ativa |
| `guild_chat_reads` | Cursor monotônico de leitura por conta/célula | SELECT da própria conta e célula |
| `guild_chat_reports` | Denúncias categorizadas e resolução | SELECT apenas de moderadores da célula |
| `guild_chat_moderation_log` | Ator, mensagem, motivo, ação e horário | SELECT apenas de moderadores da célula |
| `guild_chat_private.rate_limits` | Limites compartilhados entre abas/Viajantes da conta | Nenhum grant/policy de acesso direto |

Todas têm RLS. Nenhuma escrita direta é concedida a anon/authenticated. Cinco RPCs públicas **SECURITY INVOKER** chamam implementações **SECURITY DEFINER** em schema não exposto, com `search_path=''`, grants explícitos e autorização por `auth.uid()` + vínculo atual no banco. `user_metadata` e papéis enviados pelo cliente não autorizam nada. Contas anônimas são rejeitadas.

RPCs: `send_guild_chat_message`, `guild_chat_summary`, `mark_guild_chat_read`, `report_guild_chat_message`, `moderate_guild_chat_message`.

Envio: 1–1.000 caracteres, até 4.000 bytes, mínimo de 3 segundos entre mensagens e até 10 por janela de 60 segundos por conta. Denúncias: 5 por janela/3 segundos. Limites são autoritativos no banco; linhas/advisory locks serializam concorrência. `client_id` torna retries de envio idempotentes; alterações no mesmo retry são rejeitadas. Mensagens da mesma célula serializam a atribuição/commit de sequência para impedir que o cursor de leitura pule um commit tardio.

Leader publica avisos; leader/co_leader/moderator removem conteúdo e encerram denúncias. Remoção apaga somente o corpo da mensagem nova e preserva um marcador; não há DELETE exposto. Atualização da mensagem, resolução de denúncias e log ocorrem na mesma transação. Ator/motivo não são autodeclarados pelo cliente.

Histórico usa keyset por sequência, 30 mensagens por página, memória limitada à página atual e navegação para mensagens recentes. O histórico antigo continua paginável além de 300 mensagens. Leitura usa “Marcar como lidas” e apenas o maior cursor da página exibida; o badge não conta mensagens dos próprios Viajantes da conta.

Realtime publica somente a tabela de mensagens. O cliente escuta INSERT/UPDATE filtrados por célula, usando os eventos como invalidação; busca novamente com RLS e não confia no payload. Retorno ao canal/foco/rede e polling de 15 segundos recuperam conteúdo e permissões. Página histórica é atualizada por IDs para preservar o ponto de leitura. DELETE não é escutado, porque eventos DELETE não recebem o mesmo controle RLS ([documentação Supabase](https://supabase.com/docs/guides/realtime/postgres-changes)).

Troca de conta/célula/Viajante desmonta a sessão, cancela respostas obsoletas e remove canal/listeners/timer. Negação no banco esvazia mensagens e oculta moderação. A revogação impede novas consultas imediatamente no banco; conteúdo já entregue pode permanecer na tela até a próxima checagem (15 segundos em aba ativa; timers de abas em segundo plano dependem do navegador). Desconexão preserva rascunho e bloqueia envio até reconectar.

## Migrações

1. `packages/database/migrations/0007_guild_chat.sql`: tabelas, índices, RLS, RPCs/grants e publicação.
2. `packages/database/migrations/0008_guild_chat_commit_order.sql`: correção aditiva da ordem de commit de mensagens da mesma célula.

Aplicadas via MCP autorizado como `20261014032438_guild_chat_v1` e `20261014033334_guild_chat_commit_order`. Não reaplicar CREATE no projeto atual. Em outro ambiente, o chat requer 0000/0001; a Guilda completa depende das migrações próprias 0002–0005. Journal/snapshots locais atualizados com o Drizzle instalado, pois Supabase CLI não está instalado. A skill recomenda CLI; a alternativa preservou a convenção real deste repositório sem instalar dependências.

Rollback operacional em `0007_guild_chat.down.sql`: revoga somente a API nova e remove sua publicação; mantém tabelas, logs e RLS. Não executado. A correção 0008 permanece durante o rollback; reativação restaura grants/publicação, sem recriar tabelas. Nenhum reset, drop, instalação, push ou deploy foi realizado.

## Evidências

| Check | Resultado |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS, incluindo fixture TSX |
| `npm run build` | PASS; auditor de 54 identidades Avatar também PASS |
| `npm test` | PASS, 64 arquivos / 414 testes |
| Novos testes de chat após ajuste final | PASS, 2 arquivos / 11 testes |
| `tests/security/guild-chat-rls.sql` no Supabase | PASS, transação revertida; duas contas com claims SQL simuladas |
| `node scripts/test-guild-chat-anon.mjs` | PASS: tabela/RPC anônimos HTTP 401; schema privado HTTP 406 |
| `node scripts/test-guild-chat-browser.mjs` | PASS: 10 checks, Chrome e Edge; 360/390/768/1440 px, imagens carregadas, sem overflow; envio/leitura/reconexão/remoção/troca de conta **com fixtures** |
| QA visual | Screenshots mobile/desktop inspecionados pelo autor; verde/dourado, nome/avatar/horário, botões e avisos legíveis |
| Regressão E2E da Guilda/Auth | PASS: 14 testes desktop/mobile, em 24,1 s |
| `git diff --check` e revisão de secrets/diff | PASS; 24 arquivos alterados/novos, varredura heurística sem credenciais; `next-env.d.ts` restaurado |
| Duas sessões Auth + transporte Realtime real | **BLOCKED**: nenhum navegador/sessão conectado à automação |

Artefatos locais de UI: `build/task-0071/browser/results.json`, `index.html`, oito screenshots. Reprodução não depende de nenhum serviço remoto. Revisões QA/Security pelo próprio autor, sem alegar independência.

SQL cobre SELECT cruzado, falsificação de Viajante, aviso por membro, moderação por membro, INSERT/UPDATE/DELETE diretos, limites de tamanho/frequência/janela, retry, leitura futura, denúncias confidenciais/idempotentes, remoção/log/resolução atômicos, papel moderator, Guilda arquivada, remoção de integrante e anon. Locks estão presentes e testados sequencialmente; concorrência de duas sessões e reconexão do WebSocket real aguardam o roteiro abaixo.

## Segurança e usuários menores

Texto simples codificado pelo React, sem HTML/Markdown, links clicáveis, uploads, anexos, mensagens privadas, presença individual ou chat global. Avatar usa somente assets locais do catálogo existente. Orientações visíveis desencorajam dados pessoais e direcionam situações desconfortáveis à denúncia e a adulto de confiança. Denúncias são privadas para a moderação; não expõem o denunciante aos demais jogadores.

Isto não comprova consentimento de responsáveis, verificação de idade ou resposta humana a incidentes. Antes de disponibilizar social a menores, o responsável deve definir consentimento, supervisão, responsáveis por denúncias e prazo de retenção/exportação/exclusão. A V1 não coleta data de nascimento nem instala vigilância automatizada. Nenhum purge automático foi criado: preservação de dados foi requisito explícito. Revisão detalhada em `docs/security/GUILD-CHAT-V1-REVIEW.md`.

## Roteiro de aceite real restante

1. Conectar Chrome e Edge à automação e autenticar manualmente as duas contas selecionadas, sem compartilhar senhas/tokens na conversa. Não usar contas de terceiros sem autorização.
2. Criar célula de teste pelo fluxo existente; outro Viajante solicita entrada e líder aprova. Como o projeto ainda não tem Guildas, isso é pré-requisito real, não falha do chat.
3. Em `/journey/guild`, abrir o chat em ambas as sessões. Enviar texto em A e observar B sem reload; repetir em B. Conferir nome, avatar, horário e ausência de duplicação.
4. Fechar chat em B, enviar em A, conferir badge e leitura após “Marcar como lidas”; testar F5/persistência, histórico >30, aviso somente pelo líder.
5. Desconectar B; enviar/remover em A; reconectar B, comprovar recuperação e tombstone. Validar rascunho/retry sem duplicação, token refresh e logout/troca de conta.
6. Denunciar em B e revisar em A; remover/encerrar com motivo e conferir log. Usar somente mensagens de teste novas.
7. Em célula distinta, confirmar que REST, RPC e subscription não mostram conteúdo de A, mesmo com filtros/IDs alterados. Remover somente o vínculo de teste de B e comprovar revogação. Não alterar associações ou mensagens originais.
8. Registrar evidências redigidas de duas contas, transporte e reconexão reais. Somente então marcar TASK-0071 DONE.

## Arquivos modificados

- `apps/web/features/journey/components/online-guild-hub.tsx`: integração mínima.
- `components/guild-chat.tsx`, `components/guild-chat.module.css`, `hooks/use-guild-chat.ts` (sob `apps/web/features/journey`): interface e ciclo de atualização.
- `apps/web/lib/supabase/database.types.ts`, `repositories/guild-chat-repository.ts` e teste: contratos e acesso.
- `apps/web/features/journey/guild-chat.test.tsx`: comportamento/lifecycle.
- `packages/database/src/schema.ts`, `chat-schema.ts`; migrações 0007/0008, rollback 0007, journal e snapshots 0006/0007/0008 reconciliados.
- `tests/security/guild-chat-rls.sql`, `tests/fixtures/guild-chat-preview.tsx`, `scripts/test-guild-chat-browser.mjs`, `scripts/test-guild-chat-anon.mjs`.
- Este relatório, parecer Security, contrato TASK-0071 e `.agent/memory/CURRENT_STATE.md`.
