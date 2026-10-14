# Security — TASK-0071

2026-10-14, revisão pelo próprio autor; nenhuma revisão independente alegada.

## Resultado

Controles novos revisados localmente e executados no banco real. Sem achado crítico/alto identificado no diff; aceite de transporte autenticado/reconexão entre dois navegadores continua **BLOCKED**. Não declarar conformidade integral para menores.

- RLS em todas as tabelas; grants apenas de SELECT com autorização por conta/vínculo ativo. Anon e contas anônimas sem acesso.
- Helpers/implementações privilegiadas em `guild_chat_private`, confirmado não exposto pela Data API (HTTP 406). RPCs públicas INVOKER, EXECUTE anon negado; nenhum segredo/service role no cliente.
- Identidade/avatar e papel obtidos do banco. Teste SQL rejeitou autor, célula e papel falsificados. Locks compartilhados evitam corrida de remoção de participação com escrita; advisory lock por célula mantém cursores consistentes e lock por conta/rate bucket limita concorrência.
- Texto/tamanho/frequência no banco. Client ID idempotente; UI preserva draft/ID em falha e cancela resposta após desmontagem.
- Moderação somente por papel válido na célula, atualizações e log atômicos; corpo removido não permanece exposto nem é copiado para log público. Relatos categorizados reduzem coleta desnecessária e não são publicados em Realtime.
- Payloads de Realtime são invalidação. INSERT/UPDATE passam por RLS; nenhum DELETE físico/API de mensagens, nenhuma replica identity FULL.
- Página/consultas limitadas, texto renderizado sem HTML ou links; avatar local; sem dados pessoais em logs de teste.
- Nenhum dado anterior apagado. Fixtures SQL revertidas; contagem final de Guildas/associações/mensagens zero. Secrets/env/credenciais não alterados nem registrados.

## Advisors do projeto

- INFO `rls_enabled_no_policy` em `guild_chat_private.rate_limits`: **intencional**, sem grants nem políticas diretas; somente funções internas controlam o bucket. Não criar policy permissiva para silenciar o aviso. [Documentação do aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- 25 WARN `authenticated_security_definer_function_executable`: funções públicas **preexistentes** de gameplay/Guilda/baús. O chat não adicionou nenhuma função pública DEFINER. Rever separadamente, sem alterar as mecânicas nesta tarefa. [Orientação Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- WARN `auth_leaked_password_protection`: proteção contra senhas vazadas já estava desativada; não foi desabilitada nesta tarefa. Responsável deve avaliar a configuração de Auth em escopo próprio. [Orientação de proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Limitações operacionais

- RLS revoga consultas novas imediatamente; não pode apagar conteúdo já visto/copied. UI revalida a cada 15 segundos em aba ativa e no retorno ao foco/canal. Browser throttling pode alongar esse intervalo no background.
- Duas contas foram usadas com claims SQL simuladas. Isso não testa emissão/renovação JWT, Auth de navegador nem isolamento/transporte WebSocket real. Não substituir esse gate por fixtures de UI.
- Não houve teste concorrente entre duas transações de envio reais; locks revisados e fluxos sequenciais testados. A migração 0008 evita avanço de cursor sobre commit tardio na mesma célula.
- Limites por conta são janelas de 60 segundos, não prometem janela móvel exata. DoS distribuído entre muitas contas exige observação/controles operacionais próprios.
- Retenção, resposta humana a denúncias, consentimento/supervisão de menores e pedidos de exclusão precisam de responsáveis e prazos definidos antes da disponibilização social a menores. O chat não coleta idade e não a presume pelo nome/avatar.
- Nome/avatar são snapshots do Viajante no envio. Exclusão de Viajante mantém mensagem/log e zera a FK; minimização/remoção de identificadores históricos deve seguir uma política aprovada. Não foi executada exclusão nesta tarefa.

Evidências e roteiro: [GUILD-CHAT-V1.md](../architecture/GUILD-CHAT-V1.md).
