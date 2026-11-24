# STORY-007C — Revisão e integração dos checkpoints

Status: VALIDATING. Base `e08fd40375d32f90115cce9db8d69a46913e2e19`.

## Segurança e compatibilidade

- As quatro RPCs usam SQL estático, `search_path=''` e execução restrita a `authenticated`. Validam `auth.uid()`, conta permanente, propriedade e Viajante ativo. As tabelas de evidência têm RLS e negam acesso direto aos papéis da API. As escritas serializam pelo Viajante e usam chaves por revisão para recibos e tentativas.
- Cada envio exige a revisão exibida pelo cliente. A escrita trava as linhas de publicação, inclusive no replay. O SQL valida a sequência dos dias, a Harmonia e a pontuação. O leitor não usa vídeo agregado como evidência da revisão. A inspeção desta entrega foi feita pelo autor das correções. O aceite independente permanece pendente.
- O catálogo do Supabase TEST `wkdvdzfkbwvhyjmamrsg` confirmou `auth.users`, `travelers`, `story_definitions`, `story_progress`, `story_private` e a migration `20261021031958`. O agregado tem três colunas adicionais de conclusão, com RLS de leitura por proprietário e sem DML para `authenticated`. Nenhuma RPC ou tabela de checkpoint conflita com o catálogo consultado. A Criação está na revisão 1, com conteúdo, vídeo e recompensa fechados.
- A migração `20261124185354_story_007c_creation_checkpoints_test.sql` exige o marcador `story007c.target_project`, a baseline e os gates fechados. O marcador declara o destino selecionado pelo operador. A instalação local deixa a revisão candidata em rascunho. As consultas ao TEST foram somente leitura.

## Integração

A opção de build `NEXT_PUBLIC_CREATION_CHECKPOINTS=true` funciona com a URL oficial do TEST. A rota usa a demonstração quando a opção está desligada, a RPC não existe ou a revisão de conteúdo não está disponível ou não corresponde à do aplicativo. Falhas de sessão e rede oferecem nova tentativa. A troca de sessão ou Viajante descarta leituras anteriores. O resultado do quiz vem do servidor. Reenvios da mesma tentativa reutilizam seu UUID.

Para habilitar, concluir a revisão independente e obter autorização específica para aplicar a migração no TEST. Aprovar editorialmente e publicar a revisão correspondente no aplicativo e no banco. Ligar a opção em TEST e verificar com contas autorizadas a retomada em outro dispositivo, o isolamento e a revogação. Economia, vídeo e próxima história têm seus próprios gates.

## Verificações

- PostgreSQL efêmero local: 6/6 com a migração candidata exata, incluindo recusa sem marcador de destino, propriedade, ACL/RLS, sequência, concorrência, replay, troca de revisão e revogação.
- Vitest direcionado: 14/14 na exploração, Harmonia e adaptador. Inclui demonstração, retomada, troca de Viajante, sessão/rede, resposta incorreta e reenvio de quiz com o mesmo UUID.
- TypeScript, ESLint e `git diff --check` aprovados. A compatibilidade no TEST vem de consultas de metadados. O smoke autenticado depende da aplicação e ativação autorizadas.
