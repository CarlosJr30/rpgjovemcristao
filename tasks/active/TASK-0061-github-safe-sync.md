# TASK-0061 — Sincronização segura do RPG com GitHub
ID: TASK-0061
TITLE: Sincronização segura para notebook
OBJECTIVE: Publicar o estado auditado em origin/main e verificar a versão remota.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: Fetch, auditoria local/staged, revisão de duplicações offline, staging explícito, commit com mensagem autorizada, push normal e verificação remota; guia notebook, evidências, contrato e memória. Orquestrador amplia DEVOPS/SECURITY locais a esses arquivos e operações conforme autorização explícita da TASK-0061.
OUT_OF_SCOPE: force push, reset, rebase automático, exclusão destrutiva, instalação, deploy, Supabase/migrations, alteração de gameplay e credenciais versionadas.
DEPENDENCIES: TASK-0060; remoto compatível e revisão segura antes de publicar.
ASSIGNED_AGENT: Autor assume DEVOPS e SECURITY; QA documental pelo autor, sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, ORCHESTRATOR, RULES, SECURITY, perfis/skills DEVOPS e SECURITY, relatório TASK-0060.
SECURITY_CONSIDERATIONS: Somente arquivos auditados; varredura redigida do index, sem ler/exibir ambiente privado. Nenhum save privado ou trace temporário enviado. Parar se houver divergência, remoção inesperada ou segredo.
ACCEPTANCE_CRITERIA:
- Branch main e URL autorizada confirmadas; fetch e comparação sem divergência.
- Artefatos originais essenciais preservados; duplicações analisadas sem apagar arquivos.
- Diff staged, tamanho, whitespace e secrets verificados; duas remoções confirmadas como mudança de pasta de contratos.
- Commit autorizado publicado sem força; hash remoto confirmado, árvore e status final verificados.
- Guia notebook sem secrets; memória e estado atualizados com evidências reais.
TEST_PLAN:
- Auditoria de caminhos, conteúdo, hashes, deduplicação e git diff --cached --check.
- Verificação das referências remotas e clone sem checkout para comparar árvore/objetos publicados.
DEFINITION_OF_DONE:
- Aceite remoto comprovado; guia e memória disponíveis, limitações de instalação limpa e tarefas antigas registradas.

## Verificação anterior ao staging

Fetch PASS: 0/0 em main/origin/main. Duas remoções anteriores confirmadas como contratos TASK-0015/0016 agora em active. Artefatos950/950 SHA PASS;68 cópias canônicas deixadas ignoradas sem apagar arquivos,882retidos. Novo restore-script: lint e fixture de criação/hash/idempotência/no-overwrite PASS. Build sem ambiente privado da TASK-0060 permanece evidência válida para runtime intacto; instalação limpa e gates remotos antigos não certificados. QA/Security pelo autor, sem independência. Aceite de publicação ainda pendente.

## Gate do commit

Staging explícito1.559 alterações/index1.888 arquivos; inventário/tamanhos/diff/duas remoções PASS. Varredura textual de bytes do index sem achados, exemplos vazios e54HD/16sources/882artefatos/68originais canônicos PASS. Whitespace padrão PASS após reconhecer CRLF histórico por atributos, sem mudar os bytes dos artefatos. Snapshot do index restaurou68cópias e build54HD/TypeScript/20páginas PASS; dependências locais reutilizadas, instalação limpa não executada. Lint do script novo e fixture comportamental PASS. E2E global N/A: não houve alteração runtime; aceite online/visual das tasks antigas permanece separado. Commit/push/verificação remota pendentes.
