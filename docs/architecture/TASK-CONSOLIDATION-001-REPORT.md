# TASK-CONSOLIDATION-001 — Integração geral e preparação da Preview

2026-10-20. **Consolidação e preparação local validadas; Preview BLOCKED.** Nenhuma publicação ou operação remota executada. QA/Security pelo autor, sem independência. O resultado reúne código já existente, provas de integração e um plano operacional; não simula backend hospedado.

## 1. Branch e commit da consolidação

Branch `codex/consolidation-preview-001`, worktree `build/task-consolidation-001/checkout`, base consolidada auditada `6a683f4b690e54c19a56aaaf41e89861faa6e510`. Implementação validada `e9e74ee1a93d12a1ff44cfbec1f2082a4dc6772e`; follow-up somente documental registra fechamento/memória. HEAD final em `build/task-consolidation-001/final-receipt.json` da raiz. Memória raiz atualizada por prefixo com bytes anteriores preservados. Não partir de main, reaplicar tarefas ou incorporar pendências de outros checkouts.

## 2. Mapa de ancestralidade

0080→0081→0082→0083→0084→0085→0086→0087→0088→0089 está presente integralmente na base. Cada HEAD documental real foi conferido, inclusive o6a683f4 posterior ao áudioa573cd1. [Mapa completo](CONSOLIDATION-001-ANCESTRY.md) registra branches, implementações, HEADs e estados. Todos são ancestrais confirmados com Git; não houve merge/cherry-pick.

`main` local0df8787 é ancestral,0/30 commits de divergência. `origin/main` em cache5508514 é ancestral,0/24; estado remoto atual não consultado. Seis predecessores de CI/mobile já aprovados explicam a diferença. Os intervalos de tarefa foram inspecionados por arquivos/contratos/recibos, sem inclusão de branches paralelas.

## 3. Divergências e conflitos

Nenhum conflito de Git ou implementação ausente. Há sete pendências no checkout0080, não commitadas, preservadas por status/hash e excluídas da base automática. Raiz suja e main/checkouts anteriores preservados.

Diferenças operacionais importantes: QR0080 não está no journal Drizzle; propostas0081–0083 não são migrations aplicadas; projeto/condições do publicador CLOUD não cobrem a branch consolidada nem o projectId de teste autorizado. Esses casos exigem planejamento/cutover próprio, não merge ou atualização de hash para forçar elegibilidade.

## 4. Integrações confirmadas

| Integração | Confirmação local | Limite |
| --- | --- | --- |
| Login→Avatar→Story | Conta sintética recupera Avatar próprio; nove mundos, páginas e conclusão bloqueada; logout impede acessar painel privado | SDK/DataAPI interceptados; não comprova Auth real |
| Login→Guilda→convite | Server de convite verifica getUser/origem, gera QR local; API sem sessão401, sem dados e com headers restritos | Nenhuma câmera/conta/convite real |
| Líder→missão→decisão | Criação/publicação, prova, correção, aprovação e prêmio pendente por atores separados | Sem crédito econômico |
| Professor→EBD→aluno | Autorização, publicação, resposta/avaliação e presença; calendário existente preservado | Sem novo papel global ou prêmio pago |
| Arena→baralho→Torre | Coleção vazia não permite salvar/iniciar; sete andares visíveis, sem cartas fictícias | Combate local não homologado como autoridade |
| Baú→recibo→revelação | Registro confirmado, animação, comparação, reload/replay sem nova abertura no ensaio | Fixtures não comprovam concessão remota/hardening0078 |
| Vídeo→áudio | Testes UI selecionados da0089 mantêm retenção do player e liberação sem concluir Story | Sem vídeo/licença inventado; produção silenciosa |
| Mesma identidade no SQL | QR/missão/EBD coexistem no baseline real, usam mesmo ator/Guilda e negam outro dono/conta anônima | JWT/Auth de teste emulado no PostgreSQL local |

História permanece independente da aprovação do líder. Conteúdo/vídeo/recibo são necessários para concluir, mesmo que o ator seja líder. Catálogos de cartas e áudio continuam vazios; posse/raridades/efeitos/equipamentos não foram modificados nesta consolidação.

## 5. Correções realizadas

**Runtime:** falha visual reproduzida no cabeçalho do painel da Guilda, onde o link de Escola Bíblica0083 se sobrepunha ao link de membros0082. A geometria antes da correção falhou em `guild-overlap-before.log`. Alteração mínima em `apps/web/features/guild-missions/panel.module.css`: links do hero passam a inline-flex, reservando a altura mínima existente e mantendo limite de largura. Nenhuma ação/JSX/permissão/regra mudou. Teste verifica caixas sem interseção e alvos de pelo menos44 px.

**Ensaios:** fixture cruzada passou a retornar lista vazia de chest_operations, em vez de null; config usa3183 para compatibilidade com o contexto secundário de membro do teste Guilda herdado. Teste SQL esperava guild_id, corrigido para o contrato real guildId. Story aguarda o estado de consulta terminar; percurso consolidado usa links/menu da interface, evitando cancelar o frame durante prefetch no WebKit. Nenhum erro coletado foi filtrado/ignorado para passar. Logs das falhas e rechecks preservados.

Não houve outra correção runtime nem mudança de schema, economia, ledger, engine, inventário, Auth/RLS, conteúdo ou mídia. O risco de escrita econômica herdado foi reproduzido e classificado, sem correção fora do contrato0078.

## 6. Testes executados e evidências reutilizadas

| Execução nova | Resultado e arquivo |
| --- | --- |
|15 arquivos de integração unitária selecionados |102 PASS, `../integration-unit.log` |
| Protocolo CI/publicação existente |25 PASS, `../ci-protocol.log`; gate local eligible=false |
| PostgreSQL17 cumulativo |7 nós PASS, `../postgres-rework.log`;13 arquivos SQL aplicados offline, manifesto gerado |
| Matriz browser7 fluxos×3navegadores |19 PASS/2 FAIL no primeiro ciclo completo, `../browser-rework.log`; falhas de cancelamento de consulta/prefetch WebKit tratadas no ensaio |
| Rechecks direcionados | Story WebKit1 PASS em `../browser-webkit-recheck.log` (arquivo também preserva falha anterior do percurso); percurso final3 PASS em `../browser-navigation-final.log` |
| Regressão visual Guilda/EBD | Antes1 FAIL geométrico; depois6 cenários direcionados nos três navegadores, `../guild-ebd-final.log` |
| Lint/TypeScript | `../lint-final-delivery.log`, `../typecheck-final-delivery.log` |
| Build final | `../build-guild-final.log`; gate protótipo948 artefatos/0achado/8 hashes preservados e gate Avatar PASS |
| Segurança/escopo/artefatos | [parecer](../security/CONSOLIDATION-001-SECURITY.md), recibo e auditoria final ignorados |

Os 21 cenários distintos ficam cobertos pelos resultados mais recentes aplicáveis; rechecks não são contados como cenários novos. A matriz inteira não foi repetida depois de cada ajuste: só os fluxos afetados. Chromium1440×900, Chromium320×740 e WebKit390×844. Capturas do mapa, painel móvel e Torre inspecionadas por amostra; capturas320/390 da Guilda após correção confirmaram os links sem sobreposição. Não se afirma revisão de todos os pixels, aparelhos físicos ou áudio audível.

Reutilizados sem repetir integralmente: recibos0080–0089, auditoria de dependências encerrada, testes históricos PostgreSQL de concorrência/expiração/provas/decisões, engine/posse/cartas e validação de vídeo/recibos já documentados. Execuções novas usam testes selecionados existentes e ensaio cruzado adicional, nunca soma de contagens históricas como se fossem testes únicos desta sessão.

## 7. Migrations e ordem sugerida

[Plano SQL](CONSOLIDATION-001-MIGRATION-PLAN.md): baseline journal0000–0008 → QR0080 → proposta Story0081 → proposta missão0082 → proposta EBD0083. Story é independente dos dois últimos; a ordem cumulativa acima foi testada. QR fora do journal e propostas não aplicadas permanecem assim. Manifesto local contém hashes/ordem; nenhum SQL remoto ou histórico alterado.

Rever schema efetivo, extensão/auth/publication, constraints/RLS/ACL/RPC, cutover de11 assinaturas antigas e migração de evidência real. Rollback antes de commit testado no QR. Após commit, suspender módulo/usar correção incremental, preservando dados e recusando reativar endpoints legados ou executar down destrutivo para contornar falha.

## 8. Classificação P0–P3

[Matriz completa](CONSOLIDATION-001-PREVIEW-PLAN.md): P0 para identidade/configuração do ambiente isolado e Auth/baseline necessários à Preview autenticada; P1 para API econômica mutável, módulos que precisam de cutover, autoridade e publicação pelo método/alvo corretos; P2 para cartas, áudio, abertura de baú e conclusão de histórias mantidos indisponíveis no escopo mínimo. P3 não contém nova funcionalidade obrigatória deste contrato.

O teste cumulativo reproduziu XP/saldo próprios graváveis no baseline. Isso não foi introduzido pela consolidação e não bloqueia conceitualmente todo módulo, mas **uma configuração que ainda exponha essas escritas não recebe GO**. Não basta esconder botões. Não criar outra carteira/ledger nem habilitar combate/recompensa até os gates0078/autoridade.

## 9. Escopo mínimo da Preview segura

Após ambiente, Auth/RLS e superfície de API aprovados: conta/Avatar próprio, QR/pedido/Guilda, missões e EBD com recompensas pendentes, mapa/leitura/preparação Story, visualizações de baralho/Torre bloqueados sem cartas, consulta de recibo legítimo e preferências de áudio silencioso. [Checklist de capacidades](CONSOLIDATION-001-PREVIEW-PLAN.md) distingue sem recompensa, pendência e operações proibidas sem concessão autoritativa.

O perfil de disponibilidade/negação de API ainda não foi aplicado. Runtime consolidado não equivale a Preview já segura; sua configuração mínima depende de contrato específico para fechamento dessas superfícies e avisos. Não inventar cartas, vídeos, som, contas reais ou conclusão para viabilizar o deploy.

## 10. Operações remotas pendentes de autorização

Identificar/revalidar Supabase de teste e Vercel de teste por metadados, depois criação/configuração se necessária, pacote SQL/ACL/cutover, contas fictícias, env/APP_BASE_URL/redirects, push/CI do SHA consolidado e publicação Preview protegida no projeto autorizado. Nenhuma etapa executada aqui. Projeto Vercel histórico0080 existe como evidência anterior, não confirmação atual.

Não usar produção, hook CLOUD ou projeto com ID diferente. A revisão de deploy será posterior, com SHA completo/CI verde correspondente e verificações de projectId/READY/proteção/Git. CI antigo não aprova automaticamente a consolidação.

## 11. Checklist consolidado e estado

- [x] Git real, HEADs/ancestralidade, divergências, worktrees e pendências registrados.
- [x] Branch isolada contém0080–0089 sem reaplicação ou trabalho não aprovado.
- [x] Integrações selecionadas, SQL cumulativo e negativo de identidade/cutover testados.
- [x] Falha visual reproduzida e correção mínima submetida aos gates.
- [x] Plano SQL, prioridades, escopo mínimo, checklist Vercel/Supabase/env/CI e Security documentados.
- [x] Evidências novas/reutilizadas, falhas/reworks e limites diferenciados.
- [ ] Aceite de ambiente externo/Auth/RLS e autorização operacional para disponibilizar Preview.
- [ ] Fechar superfície econômica e aplicar perfil mínimo seguro no contrato apropriado.
- [ ] Homologações de conteúdo/cartas/mídias e aceite físico por funcionalidade.

**Concluído/testado localmente:** consolidação, ensaios cruzados e correção CSS. **Preparado, não executado:** plano de ambiente/SQL/publicação. **Externo:** identidade/configuração/CI remoto/hosted. **Homologação:** conteúdo/cartas/áudio. **Segurança/economia:** autoridade e negação das APIs legadas. TASK-CONSOLIDATION-001 permanece **BLOCKED** para disponibilização, com preparação local concluída; sem declarar jogo DONE.

## 12. Próximo passo executável

Usar este pacote para autorizar uma inspeção somente de metadados dos recursos exclusivos de teste: identificar se há Supabase adequado e revalidar projeto Vercel, proteção/Git/configuração, sem ler dados/segredos ou aplicar SQL. Sem essa autorização, o próximo passo é revisão do pacote local, não comando remoto. Depois, definir o contrato mínimo de ambiente/ACL e respectivas evidências antes de push/deploy. Nenhuma funcionalidade adicional ou contexto02 iniciado.
