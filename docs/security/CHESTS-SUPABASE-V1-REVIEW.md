# Revisão de segurança — Baús Supabase V1

Data: 2026-09-29. Revisão executada pelo próprio autor; não é auditoria independente.

## Controles

- `traveler_chests` e `chest_operations` têm RLS por `travelers.user_id = auth.uid()`.
- Browser autenticado recebe somente `SELECT`; não há grant direto de `INSERT`, `UPDATE` ou `DELETE`.
- Compra e abertura aceitam intenção (`traveler`, tier, operação), nunca preço, saldo, roll ou reward.
- RPCs usam `SECURITY DEFINER`, `search_path = ''`, nomes qualificados, ownership explícito e grants mínimos.
- `grant_traveler_chest` é interna e teve execução revogada de `authenticated`.
- Compra reutiliza `spend_coins` dentro da mesma transação de ledger + grant.
- Abertura bloqueia a pilha, materializa o RNG no servidor e registra resultado antes da resposta.
- Chave única por Traveler/operação impede recompensa ou débito duplicado.
- Tipos, quantidades, preço, nível, origem e tamanhos têm constraints.
- Equipamentos concedidos vêm de IDs fechados no SQL; não há item arbitrário enviado pelo cliente.
- Nenhum secret, service role ou connection string foi incluído.

## Riscos residuais

| Severidade | Risco                                                                                                                                                           | Tratamento                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Alta       | RLS, locks e retries ainda não exercitados no Supabase real                                                                                                     | Bloqueia aceite remoto; aplicar migration e executar roteiro com duas contas                                       |
| Média      | O progresso narrativo da fase ainda é local; `claim_chest_reward` protege ownership, chave fechada e unicidade, mas não comprova conclusão em uma tabela remota | Aceito apenas como ponte do sistema atual; migrar progresso da fase antes de economia competitiva                  |
| Média      | `add_coins`, `spend_coins` e DML econômico direto da migration 0000 continuam client-callable                                                                   | Risco preexistente; Baús não aceita valores do browser e usa RPCs compostas, mas o hardening global segue pendente |
| Baixa      | `random()` do PostgreSQL não é RNG criptográfico                                                                                                                | Adequado para loot recreativo sem valor monetário; trocar por fonte verificável antes de qualquer economia real    |

Não há achado crítico no diff local. O resultado permanece condicionado à execução real da migration e dos testes de isolamento/concorrência.
