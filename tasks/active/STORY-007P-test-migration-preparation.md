# STORY-007P — Aprovação pedagógica e preparação de TEST

Status: aprovação pedagógica registrada. Aplicação Supabase TEST NÃO AUTORIZADA.

## Decisão do proprietário

- Aprovados uma avaliação oficial por dia e duas tentativas oficiais de quiz por conta e revisão.
- Aprovado feedback diário indicando avanço. O risco de dedução por exclusão foi avaliado e aceito para esta fase, considerando a cota diária.
- A demonstração permanece separada e não cria progresso oficial. Recuperação após esgotar tentativas depende de futura revisão autorizada com exercícios distintos.
- STORY-007M: implementação local concluída no commit `35e1d4cdd48aae6b89c4e86e6279fb662f500d8c`.
- STORY-007N: revisão técnica direcionada concluída. Os testes PostgreSQL e Vitest selecionados passaram, os corpos SQL conferem e a economia permanece sem alterações. A revisão foi realizada na mesma sessão da implementação e não é independente.
- O bloqueio pedagógico anterior está resolvido. Permanecem pendentes autorização específica para aplicação em TEST, eventual publicação editorial e qualquer ativação posterior da persistência remota.

## Preparação SQL somente leitura

Migration e proposta existem:

- `supabase/migrations/20261124185354_story_007c_creation_checkpoints_test.sql`
- `packages/database/proposals/story007-creation-checkpoints.sql`

Os corpos SQL são equivalentes após excluir a guarda de TEST e o empacotamento da migration. A migration valida o marcador de projeto `story007c.target_project`, a migration baseline `20261021031958/deploy002_11_task0081_story_progress` e `creation` revisão 1 com `content_ready`, `video_ready` e `reward_ready` falsos. Define lock timeout de 5 segundos e statement timeout de 60 segundos. Cria tabelas privadas, funções e RPCs. Não concede economia.

Não há `supabase/config.toml` neste checkout. O arquivo alvo reside no diretório padrão `supabase/migrations`, portanto um `supabase db push` normal tentaria incluí-lo. A guarda `story007c.target_project` é uma configuração da sessão PostgreSQL; não é fornecida automaticamente pelo CLI durante `db push`. A migration não está registrada no histórico local visível. A baseline de TEST foi documentada anteriormente como somente leitura, sem evidência atualizada nesta tarefa.

## Procedimento operacional futuro — não executar nesta tarefa

Pré-condições obrigatórias:

1. Obter autorização explícita do proprietário para aplicar exatamente este SHA e esta migration no projeto Supabase TEST identificado por `wkdvdzfkbwvhyjmamrsg`.
2. Conferir `git rev-parse HEAD`, branch e árvore limpa. Confirmar que o diff dos corpos da migration e proposta continua sem diferenças.
3. Obter uma conexão direta de TEST por canal de segredo aprovado, sem imprimir ou registrar a string. Confirmar servidor/projeto pelo canal administrativo e conferir a baseline `20261021031958`, a Criação na revisão 1 e os três gates falsos.
4. Resolver o mecanismo de execução: usar uma sessão SQL autenticada ao projeto TEST com `SET LOCAL story007c.target_project='wkdvdzfkbwvhyjmamrsg'` e executar a migration inteira na mesma transação. O `supabase db push` padrão não satisfaz essa guarda de sessão. Não usar `db push` até existir configuração verificada que exclua migrations não autorizadas e injete a guarda de forma segura.
5. Antes do DDL, revisar o plano SQL integral e garantir que o cliente SQL interrompa em qualquer erro e faça rollback da transação.

Execução futura, somente após satisfazer todos os itens acima:

```sql
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='60s';
SET LOCAL story007c.target_project='wkdvdzfkbwvhyjmamrsg';
-- Executar aqui, sem truncar, todo o arquivo da migration TEST.
COMMIT;
```

Verificações pós-aplicação, usando a mesma conexão TEST e sem ativar persistência remota:

1. Confirmar objetos privados e quatro RPCs esperadas, grants limitados a `authenticated`, RLS nas tabelas privadas e nenhum privilégio direto de API nas tabelas de recibos/configuração.
2. Confirmar revisão 1 em `draft`, manifesto não disponível pela RPC e `content_ready`, `video_ready`, `reward_ready` falsos.
3. Confirmar catálogo, recibos e economia inalterados. Não publicar revisão, ativar flag ou executar tentativas com contas reais.
4. Registrar resultado, identificador do projeto, versão/hash da migration e estado observado, sem secrets ou dados pessoais.

## Interrupção

Parar antes de executar se branch/SHA, projeto, baseline, revisão ou flags divergirem; se a guarda de projeto não puder ser aplicada na mesma transação; se a origem da conexão não puder ser confirmada; se o cliente SQL não assegurar rollback; se houver erro/timeout; ou se aparecer alteração fora do escopo. Em erro, verificar o estado da transação e dos objetos antes de qualquer retomada. Não repetir às cegas e não tentar remediação manual. Registrar a divergência e solicitar nova decisão do proprietário.
