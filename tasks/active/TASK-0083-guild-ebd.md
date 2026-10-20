# TASK-0083 — Escola Bíblica personalizável
ID: TASK-0083
TITLE: Modo EBD — contexto 03/09
OBJECTIVE: Ferramenta educacional da Guilda, sem aulas prontas e sem gate do Modo História.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: features/guild-ebd; rota e entradas na Guilda existente; repository/tipos; proposta SQL local versionada que amplia guild_lessons; testes, documentação e memória próprios.
OUT_OF_SCOPE: push/deploy/merge/main, SQL ou recursos remotos/dados reais, TASK-0078/economia, Auth/QR, progressão/contrato Story, chat/ranking, dependências/assets novos, uploads e conteúdo bíblico pronto.
DEPENDENCIES: Base 775d7e70fcd2b12a7037a21b636d976d776f2a4e da TASK-0082; baseline0000–0008+QR0080; futura autorização de schema/hospedagem; TASK-0078 só para futura concessão.
ASSIGNED_AGENT: Autor assume Architect, Frontend, Backend, Database, Game Designer, Biblical Content, QA e Security, sem delegação e sem revisão independente.
REQUIRED_CONTEXT: AGENTS; GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/ORCHESTRATOR/TOKEN_POLICY; contratos0016/0030/0080/0081/0082; guild_lessons0005/repository/UI; perfis/skills pertinentes já lidos.
SECURITY_CONSIDERATIONS: Autoridade de membro ativo no servidor; professor com escopo próprio e permissões explícitas; respostas/gabaritos privados; RLS/ACL; versões e decisões auditáveis; limites e URLs HTTPS; nenhuma carteira/grant paralelo.
ACCEPTANCE_CRITERIA:
- Escola Bíblica responsiva com aulas/editor vazio, rascunhos, publicação, atividades/avaliação, professores, agenda/presença, alunos e histórico.
- Professor não ganha administração da Guilda; aluno só vê aulas elegíveis e registros próprios; publicação/presença exigem autorização.
- Salvar não publica; edição concorrente gera conflito preservando texto; gabarito não chega ao aluno antes da conclusão avaliada.
- Recompensa opcional em tier existente permanece pendente, idempotente e sem impacto econômico ou Story.
- SQL local comprovado em PG sintético e checks direcionados/lint/tipos/build/browser, QA/Security e relatório.
TEST_PLAN: Unit/UI; SQL real offline sobre baseline completo; fluxos leader/teacher/student, isolamento, concorrência, links, sigilo, presença e idempotência; navegador desktop/móvel; regressões missões/convites/Story sem suites extensas.
DEFINITION_OF_DONE: Gates e aceite comprovados; ausência de evidência hospedada não vira PASS. Limites/dependências remotas ficam explícitos.

## Contexto mínimo / auditoria
- Pedido atual autoriza contexto03/09 e runtime EBD somente local; substitui limite anterior de não iniciar03.
- Worktree build/task-0083-ebd/checkout, branch codex/guild-ebd, base0082 limpa. Raiz e checkouts anteriores preservados.
- Reutilizar guild_lessons (0005), membros/Travelers/Auth, Shell/RequireTraveler, estilos do painel e tiers guildMissionRewards. Não duplicar calendário: derivar datas das aulas/atividades.
- Legado tem aula/texto/referência/agenda e leitura pelo membro, mas apenas líder escreve; não tem professores, avaliações, presença ou versões. Escritas legadas devem ser fechadas na proposta para não contornar novos controles.
- Orquestrador autoriza os perfis do contrato a editar os caminhos do SCOPE e seus testes/docs. QA/Security pelo autor, não independentes.
- Sem conteúdo narrativo novo: autoria pedagógica do professor, exibida como tal; nenhum texto é declarado Escritura canônica. Materiais por referência/link validado; uploads adiados por falta de storage privado.

## Checklist
- [x] Auditoria e base isolada
- [x] Contratos e proposta SQL
- [x] Painel/editor/publicação
- [x] Atividades/respostas/avaliação
- [x] Professores/agenda/presença/histórico
- [x] Testes/gates/segurança
- [x] Relatório/memória/aceite local
- [ ] Aceite hospedado (fora da autorização atual)

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE

Versão local concluída. BLOCKED se refere ao aceite integral/hospedado, sem falha final aberta nas verificações executadas. Não houve revisão independente; autor assumiu os perfis autorizados. Conteúdo bíblico novo N/A: ferramentas vazias e autoria do professor identificada, sem narrativa ou lição oficial gerada.

| Gate | Evidência |
| --- | --- |
| UNIT/UI | PASS41/41 em cinco arquivos, `unit-visual-acceptance.log` |
| PostgreSQL local | PASS8 nós (sete cenários + pai), zero fail/skip, `postgres-initial.log`: autoridade, escopo, isolamento, privacidade, URLs, versões, concorrência, tentativas, avaliações, presença, recibo idempotente e saldos/XP intactos |
| Browser EBD | PASS6 cenários finais, `e2e-visual-acceptance.log`; desktop1440, mobile320, WebKit390, ambos fluxos em cada projeto |
| Regressões | PASS2 missões/pedidos, PASS1 QR/cadastro, PASS1 Story independente; logs próprios |
| LINT / TYPECHECK / BUILD | PASS, logs `*-visual-acceptance.log`; build inclui rota/journey/guild/ebd e gates herdados de assets intactos |
| VISUAL/A11Y | Capturas inspecionadas, sem overflow nos testes; labels de selects/presença corrigidos; recompensa em texto completo no celular; vazio sem faixa1–0 |
| SECURITY | Revisão local PASS, parecer próprio; CLI/advisors e ambiente Auth/JWT/PostgREST real indisponíveis/não autorizados, não alegados como testados |
| DOCS/MEMORY/NO SECRETS | Relatório/parecer/checklist e memória raiz, preservação do histórico; diff/revisão sem secret, pacote, serviço ou dado real novo |
| Aceite integral | BLOCKED: SQL/migration/schema/cutover autorizados, Auth real/contas/aparelhos; adapter econômico da TASK-0078 para concessão futura |

Reworks e falhas iniciais detalhados no relatório e preservados nos logs. Não houve push/deploy/merge/main/SQL remoto, modificação de dados reais, economia, contratos0080/0081/0082/0078 ou progressão Story. Apenas links de entrada alteram as duas telas existentes da Guilda. Propostas anteriores e migrations intactas.

Relatório completo de12 itens: [TASK-0083-GUILD-EBD](../../docs/architecture/TASK-0083-GUILD-EBD.md). Parecer: [TASK-0083-EBD-SECURITY](../../docs/security/TASK-0083-EBD-SECURITY.md). Logs/capturas/recibo em build/task-0083-ebd fora do versionamento. Próximo: revisão do pacote e validação isolada hospedada sob autorização posterior; contexto04/09 não iniciado.

Commit local da implementação validada: `c4b3d92a8f4a77f1dc0f1f0821382067a6932ff2`. Controle seguinte altera somente este contrato e o relatório. Memória raiz atualizada, corpo anterior preservado. Nenhuma nova execução de suíte extensa para esta atualização documental.
