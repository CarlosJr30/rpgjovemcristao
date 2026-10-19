# TASK-0082 — revisão de segurança local

19/10/2026. Autor assume Security/QA/Database; revisão não independente. Avalia novo diff e SQL proposto, sem consultar ou modificar serviços/dados reais.

## Controles e evidências

- Contexto e identidade existentes reutilizados. Autorização de cada RPC no servidor: auth.uid vinculado ao Viajante, auth.users.is_anonymous=false, Guilda ativa, vínculo ativo e liderança consistente com guilds.leader_traveler_id. Role enviada pela interface não autoriza nada.
- RLS em missões/progresso/tentativas; rascunhos só para liderança, publicação para elegíveis e dados de prova para proprietário/líder da própria Guilda. Leitura por conta não dá permissão de atuar por outro avatar. Snapshot e UI respeitam o Viajante atual ao filtrar público-alvo.
- Sem INSERT/UPDATE/DELETE de cliente nas tabelas de missões/tentativas/histórico. Helpers em schema guild_ops não exposto; somente o predicado booleano de RLS tem EXECUTE para authenticated. Funções privilegiadas com search_path vazio/nomes qualificados; PUBLIC/anon sem EXECUTE nas novas RPCs.
- Modelo de dados completo validado no servidor: tipos/chaves JSON esperados, limites de texto/lista, tiers existentes, datas e destinos na Guilda. Sem HTML/URL de anexo executável; chamadas SDK parametrizadas.
- Locks consistentes: missão → ator/membership → progresso/tentativa. Validação de prazo após espera por lock. Revisão otimista nos rascunhos e tentativa esperada na submissão/decisão; replay com chave e conteúdo iguais é idempotente; chave reutilizada com conteúdo diferente é recusada.
- Autoaprovação negada no nível de conta, não apenas de avatar. Revisor não pode alterar decisão já finalizada por nova chave. Rejeição/correção exigem motivo. Cada tentativa e decisão mantém autor/data/resultado.
- Aprovação não concede economia: sem chamadas a wallet/XP/chest/claims. Endpoints antigos de escrita/payout de missão são revogados na proposta de cutover para impedir bypass. Não há carteira paralela. Economia antiga em geral não é certificada por esta tarefa.
- Prova textual privada até 500 caracteres; sem anexos/armazenamento externo. Log geral não contém provas, e-mails, Auth IDs, Diário ou reflexões privadas. Tentativas anteriores são preservadas; pendências legadas sem prova não podem ser aprovadas por fabricação de evidência.
- QR/pedidos/membros usam funções existentes; teste PostgreSQL usa o baseline completo e confirmou criação/revogação de convite, entrada pendente e aprovação normal após a proposta.
- Sem pacotes/lockfile novos, services/MCP externos ou secrets. Auditoria DEV encerrada da TASK-0080 não reaberta. Conteúdo bíblico gerado N/A: apenas campos do líder, sem novas narrativas oficiais; UI distingue autoria do líder.

O teste PostgreSQL encontrou inicialmente um filtro de snapshot que considerava outro avatar da mesma conta. Correção aplicada para público-alvo do Viajante solicitado; cenário negativo passou na rodada final. Sem achado alto/crítico novo aberto identificado após a correção, dentro do recorte local. Não alegar revisão independente, advisors hospedados, prova de Auth real ou aceite econômico remoto.

Referências usadas na modelagem: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Functions](https://supabase.com/docs/guides/database/functions), changelog/documentação e skills Supabase/Postgres já consultados nesta sessão. Testes executam PostgreSQL17 sintético real em container offline/read-only, sem portas, bind mounts, backup ou dados reais. Fixtures de roles/Auth/publication/default grants não são migrations para Supabase.

## Limites para aceite

SQL é proposta local, sem migration registrada/advisor remoto/aplicação hospedada. Permanecem pendentes revisão de schema efetivo/cutover, Auth/JWT/PostgREST com duas contas reais em ambiente isolado autorizado, integração econômica da TASK-0078, retenção/recuperação operacional e teste em aparelhos. Nenhuma dessas dependências foi contornada com keys/URLs reais ou produção. Recompensa pendente é estado intencional, não recibo de concessão.
