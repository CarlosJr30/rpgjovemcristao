# Revisão de segurança — Guilda Supabase V1

Data: 2026-09-29. Revisão executada pelo próprio autor; não é auditoria independente.

## Fronteiras e controles

- Identidade vem exclusivamente de `auth.uid()`; `traveler_id` recebido é revalidado por ownership.
- Browser usa publishable key e não recebe service role, connection string ou operação privilegiada genérica.
- Novas tabelas expõem apenas `SELECT` a `authenticated`; escritas passam por RPCs específicas.
- Liderança é comprovada por membership ativa `role = 'leader'`, nunca por flag/toggle da UI.
- Recompensa é calculada no SQL por tier fechado. A função interna de reward não tem grant para `authenticated`.
- Ledger com unicidade impede XP/moedas/Baús duplicados; o grant de Baú usa uma segunda chave determinística na mesma transação.
- Funções `SECURITY DEFINER` usam `search_path = ''`, nomes qualificados, grants/revokes explícitos e checks antes da mutação.
- Listagens privilegiadas retornam somente nome do Traveler e estado operacional. E-mail, Auth, Diário, inventário e reflexões não são retornados.
- Texto não confiável tem limites no banco e React faz escaping. URL bíblica aceita somente HTTPS em `www.bible.com`.
- Metadata JSON tem limite de 2 KiB; nota de conclusão, 500 caracteres.

## Riscos e resultado

| Severidade | Risco                                                                                          | Resultado                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Alta       | Isolamento/RPCs ainda não foram exercitados no Supabase real com duas contas                   | Bloqueia aceite remoto; aplicar migration e executar roteiro de `GUILD-SUPABASE-V1.md`                                                          |
| Média      | Migration 0000 mantém `add_coins` e updates de XP/wallet client-callable para sistemas legados | Preexistente e fora da autoridade exclusiva desta Guilda; a Guilda não usa esses caminhos. Exige hardening global antes de economia competitiva |
| Baixa      | UUID da Guilda funciona como identificador de convite na V1                                    | Não concede membership; apenas cria request pendente. Convites com expiração ficam preparados para futura UI                                    |

Nenhum secret foi adicionado. Não há achado crítico no diff local, mas o resultado final permanece condicionado ao teste RLS real.
