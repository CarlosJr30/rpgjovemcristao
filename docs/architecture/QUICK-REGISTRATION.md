# Cadastro rápido — TASK-0067

Cadastro em `/auth`: nome de exibição, e-mail e senha. Supabase Auth continua responsável pela identidade e sessão. O cadastro valida a sessão via getSession/getUser e armazenamento antes de abrir `/journey/create`; sem sessão, mostra mensagem honesta e não finge confirmação de e-mail.

Criação oferece três personagens prontos com assets aprovados e personalização opcional. O nome da conta sugere o nome do herói; nomes incompatíveis com o domínio usam “Viajante”, editável. A RPC existente cria o avatar e seus registros essenciais; somente a confirmação de leitura online permite abrir a primeira missão. Modo local explícito e múltiplos Viajantes continuam disponíveis.

O login/reload recupera o herói ativo automaticamente; a troca explícita continua abrindo o seletor. `travelers.journey_progress` guarda checkpoints e dados de progresso, validados pelo parser existente. Esse campo não autoriza ações de servidor. Registros antigos permanecem com NULL: o cache de progresso do próprio usuário é preservado e enviado no próximo save normal. Progresso que só existia em um navegador antigo precisa desse navegador para sua primeira sincronização; não pode ser reconstruído remotamente.

## Configuração manual do Supabase

No projeto **RPGJOVEMCRISTAO**, em **Authentication → Sign In / Providers → Email** (ou Providers → Email):

- Desativar **Confirm email** e salvar. Carlos confirmou a alteração; o teste real posterior comprovou login imediato.
- Manter Email habilitado e novos cadastros permitidos; ambos já estavam habilitados.
- Nenhuma outra proteção/RLS deve ser desativada. Nenhum usuário existente foi confirmado, excluído ou recriado em lote.

A opção de confirmação é uma configuração do serviço Auth hospedado; não é alterável pelo frontend nem pelas ferramentas MCP disponíveis. [Documentação oficial](https://supabase.com/docs/guides/auth/passwords).

## Migração e preservação

Migração aditiva `packages/database/migrations/0006_traveler_journey_progress.sql`, aplicada no projeto existente como `20261011141155_traveler_journey_progress`. JSON deve ser objeto ou NULL, até 128 KiB. SELECT/INSERT/UPDATE/DELETE de propriedade existentes permanecem. Sem dependências novas. CLI Supabase não disponível: artefato local segue a numeração estabelecida do repositório, aplicação hospedada via MCP com histórico próprio; não reaplicar os dois artefatos como migrações distintas.

Baseline: 5 usuários, 7 avatares. Depois da migração: mesmos valores e fingerprint das colunas anteriores `cc911ad950b5433688968b0988d600ce`. Depois dos testes reais: 7 usuários e 9 avatares, sendo 2 contas/avatares novos de QA; os 7 originais mantêm o fingerprint. Nenhum registro existente foi editado por esses testes.

## Validação

- Lint, typecheck e build PASS; gates de mídia: 209 arquivos públicos/727 artefatos/8 hashes preservados, 54 identidades HD.
- 367 testes dos módulos Journey/Supabase PASS; Auth/create após ajustes finais: 13 PASS (incluem 6 Auth).
- 14 E2E desktop/mobile PASS/zero skips: cadastro, herói pronto, personalização, falha de save, ausência de sessão, primeira missão, reload, login com cache vazio e preservação de dois perfis locais. Capturas em 320×568, 360×800, 390×844, 430×932 e 844×390.
- `node scripts/quick-registration-online-check.mjs`: Supabase real PASS, cadastro/avatares/progresso/novo navegador/reload/acesso anônimo negado. Credenciais aleatórias somente em memória, sem traces de sessões reais. Duas entradas QA preservadas: primeira execução parou por uma expectativa excessivamente restrita no teste (acesso anônimo retorna 401/403, também válido); segunda PASS.
- RLS como authenticated: 6 avatares próprios visíveis no baseline e zero de outro proprietário. QA/Security pelo autor, sem independência. Teste físico de celular permanece com Carlos.

Evidências locais: `build/task-0067-quick-registration/online-check.json`, capturas e reworks. A execução online cria uma conta de QA e requer build atual; não integra a suíte padrão e não envia e-mail quando Confirm email está desativado.
