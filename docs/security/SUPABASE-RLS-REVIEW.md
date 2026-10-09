# Revisão de segurança — Supabase/RLS inicial

Data: 2026-09-26. Revisão executada pelo próprio autor; não é auditoria independente.

## Controles verificados

- Somente a publishable key entra no cliente; nenhuma chave `service_role`, secret ou conexão PostgreSQL foi adicionada.
- RLS está declarada nas seis tabelas e policies usam `auth.uid()` ou ownership por `travelers.user_id`.
- `anon` não recebe grants nas tabelas/funções; RPCs são concedidas somente a `authenticated`.
- Funções usam `SECURITY INVOKER`, argumentos tipados e `search_path` vazio.
- Carteira rejeita saldo negativo; gasto é atômico e exige saldo suficiente.
- Item equipado precisa existir no inventário do mesmo Viajante.
- Cache local online é associado ao ID do usuário e não é exibido para outra sessão pela aplicação.
- Erros da UI e da fila de sync não incluem detalhes do banco ou credenciais.

## Riscos residuais

| Severidade | Risco                                                                                      | Tratamento                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Média      | Cliente pode alterar XP, stats, inventário e saldo dentro da própria conta                 | Aceito somente para esta etapa de desenvolvimento; migrar recompensas/economia competitiva para autoridade server-side antes de ranking/PvP |
| Média      | Escritas concorrentes de XP/inventário usam última escrita                                 | Fila serial resolve o mesmo navegador; adicionar versionamento/commands server-side em etapa futura                                         |
| Baixa      | Cache local não oferece confidencialidade contra quem controla o mesmo perfil do navegador | Cache é fallback temporário; não armazenar credenciais ou dados sensíveis nele                                                              |

## Gate pendente

O schema remoto e o isolamento real entre duas sessões ainda precisam ser comprovados no projeto Supabase. Ausência dessa evidência impede classificar a revisão como PASS final.
