# Painel do Líder V2

## Fluxo

`/journey/guild/manage` usa o contexto autenticado da Guilda. A Home consulta missões correntes, contadores, cinco eventos recentes e próximas aulas; histórico completo, missões antigas e lista de aulas são carregados quando a seção é aberta. No mobile, a navegação principal vira um seletor compacto.

Conteúdo separa Missões, Aulas e Desafios. A criação de missão mantém as regras de recompensa existentes e oferece modelos; a aprovação mostra a recompensa antes da decisão. O desafio coletivo mostra concluídos sobre membros ativos, sem recompensa adicional. O Gate da Jornada recebe prioridade visual na fila. A agenda combina `starts_at`/`due_at` das missões publicadas com `scheduled_at` das aulas, sem outra tabela de calendário. O histórico usa páginas de 20 eventos e filtros sobre as páginas carregadas.

## Aulas e perfil público

Aplicar manualmente `packages/database/migrations/0005_guild_lessons_and_schedule.sql` **após 0004** no projeto Supabase correto. O rollback está no arquivo `.down.sql`; ele remove aulas e seus dados. Aulas têm rascunho, publicação, conclusão e cancelamento. Líder grava por `save_guild_lesson` e `set_guild_lesson_status`; membros ativos da mesma Guilda leem apenas aulas publicadas ou concluídas. O perfil público retorna somente nível e número de missões concluídas da Guilda pela função `guild_public_member_profile`. Nenhum campo de Auth, diário, anotação ou reflexão é exposto.

## Aceite remoto pendente

Após aplicar 0005, usar duas contas em Guildas diferentes e uma conta de membro da mesma Guilda: criar rascunho, confirmar que só o líder o lê, publicar e confirmar leitura do membro, bloquear leitura cruzada, bloquear escrita direta e RPC de membro, confirmar perfil público e ações de status. Abrir painel, agenda e histórico nas larguras 360, 390, 412, 768 e 1440 px. A migração não foi aplicada automaticamente; os testes locais não substituem essas verificações de RLS no Supabase real.
