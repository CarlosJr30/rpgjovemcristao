# Conexão inicial com Supabase

O cliente de navegador fica centralizado em `apps/web/lib/supabase/client.ts`. Ele é criado sob demanda e reutilizado; componentes não devem chamar `createClient` diretamente.

## Ambiente

O app exige estas variáveis públicas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Os valores locais ficam em `apps/web/.env.local`, que é ignorado pelo Git. Somente a publishable key é aceita nesta camada de frontend; chaves `service_role`, secret ou admin não devem ser usadas.

Na Vercel, cadastrar os mesmos dois nomes em **Project Settings → Environment Variables** para cada ambiente aplicável. O `.env.local` não deve ser enviado ao Git nem copiado para a Vercel como arquivo.

## Diagnóstico

`apps/web/lib/supabase/diagnostics.ts` expõe `checkSupabaseConnection`. A função consulta o endpoint público `/auth/v1/settings`, sem depender de tabela e sem alterar dados. O retorno informa somente `connected` ou um erro genérico; URL e chave não são registradas.

O diagnóstico não é executado automaticamente nem aparece na UI final. Ele pode ser chamado explicitamente por uma ferramenta de desenvolvimento quando necessário.

A primeira camada de Auth, schema, RLS e sincronização gradual está descrita em [SUPABASE-GAMEPLAY-PERSISTENCE](SUPABASE-GAMEPLAY-PERSISTENCE.md).
