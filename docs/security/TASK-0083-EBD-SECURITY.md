# TASK-0083 — Revisão de segurança local

Autor da implementação também executou QA/Security. Revisão não independente. Escopo: diff local da EBD sobre775d7e7; nenhum dado/ambiente real consultado. A auditoria de dependências da TASK-0080 não foi reaberta, nem suas exceções ampliadas. Sem dependência nova, service_role, secret, storage, serviço externo ou concessão econômica.

## Modelo e controles

| Risco | Controle / evidência |
| --- | --- |
| IDOR / professor autodeclarado | RPC valida Auth owner, conta não anônima, vínculo/Guilda ativos; grant persistido pelo líder efetivo. PostgreSQL nega aluno, anônimo, ator de outra conta/Guilda |
| Professor com poder global | manager exige professor responsável da aula e grant ativo; flags de publicar/presença separadas. APIs de missões/convites não alteradas; professor não recebe papel leader |
| Rascunho / público incorreto | Política RLS da guild_lessons e workspace usam gestão ou elegibilidade published/closed/completed. Audience por Traveler atual; rascunho/agendada não chegam ao aluno |
| Vazamento de gabarito/reflexão | Tabelas EBD sem grants diretos, RLS habilitada; workspace remove answer_key antes da conclusão/fim das tentativas avaliadas. Respostas só autor ou gestor da aula; snapshots não são retornados ao aluno |
| Bypass por API antiga | Revogações de save_guild_lesson e set_guild_lesson_status no SQL de cutover. SELECT legado continua protegido pela política nova |
| Lost update / corrida / duplicação | Advisory transacional por Guilda antes de locks de linha; revisões esperadas; IDs estáveis na criação/submissão e unique(activity,traveler,attempt). PG concorrente real comprova um vencedor e um conflito, sem overwrite silencioso |
| Fraude de presença | Apenas gestor com can_attend ou líder, aluno ativo/elegível; optimistic revision, before/after e responsável privados. Não existe autopresença definitiva |
| Avaliação própria | Manualgrade nega todos os Travelers da mesma conta do avaliador; teacher só sua aula, líder sua Guilda |
| Inflação econômica | Tier whitelist existente; recibo único lesson+traveler aponta atividade/resposta/critério. Não chama wallet/XP/grant/claim. Snapshot de saldos e XP intacto no teste PostgreSQL |
| XSS / URLs perigosas | Conteúdo como texto React, nenhum HTML executável. HTTPS com host público, sem credenciais/IP/porta/controle; limites em UI e servidor; noopener/noreferrer nos links. Não faz fetch/embed/upload ou download automatizado |
| Permissão de função / search_path | Entradas public SECURITY INVOKER; implementações SECURITY DEFINER no schema ebd_ops, search_path vazio, Auth explícito, sem grant PUBLIC/anon. Somente funções necessárias têm EXECUTE authenticated |

## Resultados e limites

Ensaio PostgreSQL17 descartável/offline sobre o baseline completo real mais propostas0082/0083 PASS: sete cenários compostos + teste pai, incluindo ACL/raw SELECT negado, ownership, isolamento, papéis, dados privados, tentativa/feedback, correções, revogação, input/URLs e concorrência. Ambiente sem rede, porta publicada, bind mount, secrets ou persistência de dados reais; container rotulado e removido ao encerrar.

Vitest e Playwright cobrem apresentação e operações da interface. SDK/DataAPI simulados não comprovam autenticação de plataforma. Não alegar teste real de JWT/PostgREST, segurança hospedada ou dispositivos/câmera. Faltam ambiente isolado autorizado, cutover/migração/schema revisados e roteiro de contas/aparelhos. Advisors Supabase não executados (CLI indisponível; nenhum acesso remoto autorizado). A proposta não é uma migration aplicada.

Sem achado crítico/alto aberto no diff local após os reworks registrados no contrato. Isso não elimina riscos preexistentes do baseline nem substitui revisão do pacote completo antes do cutover. A proposta0083 depende da proposta0082; não aplicar isoladamente sobre produção antiga.

## Materiais e privacidade

Imagens/PDF são links externos, sem promessa de inspeção de MIME/tamanho/segurança do arquivo remoto. Nenhum bucket público ou cópia de obra. Um upload futuro exigirá storage privado, autorização por Guilda/aula, quotas, MIME/extensão/tamanho e inspeção de conteúdo em contrato próprio.

Respostas reflexivas e justificativas são texto limitado, com orientação para não incluir dados sensíveis. Membros comuns não veem outros alunos; professores veem nomes/IDs mínimos de membros para selecionar público, mas resultados apenas das próprias aulas. Gestores podem ver histórico de resultados de suas aulas; sair da Guilda elimina acesso do participante. Exclusão/retenção/exportação de dados requer política de produto e operação própria antes de adoção ampla; nenhum dado real foi criado nesta entrega.

## Recuperação e próxima validação

SQL de proposta em transação; falha aborta integralmente. Antes de uma futura aplicação: backup/restauração ensaiada, preflight do baseline/schema/ACL, migration gerada pela ferramenta autorizada, advisors e revisões no alvo isolado; testar Auth real, antigos endpoints, duas contas/Guildas, revogação, concorrência e browser. Reverter aplicação após uso exigirá plano que preserve respostas e snapshots, sem DROP automático destrutivo. Não houve alteração em produção ou execução desses passos nesta tarefa.

Referências primárias consultadas em19/10/2026: [Supabase Functions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security); changelog da mesma sessão anterior reaproveitado. Skills Supabase/Postgres e checklist React aplicados dentro da autorização exclusivamente local do usuário.
