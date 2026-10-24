# FIX-PROD-004 — Torre e pendências de produção

ID: FIX-PROD-004
TITLE: Concluir gates restantes com preservação de dados
OBJECTIVE: Partir de f9f7c36, confirmar remotos, validar progressão legítima da Torre, reconciliar apenas por proveniência comprovada, corrigir visual autorizado e verificar liderança antes de produção.
PRIORITY: P1 High
STATUS: BLOCKED
SCOPE: Diagnóstico e correções estritamente necessárias de Torre/economia/equipamentos/permissões; testes autorizados em contas isoladas, inspeção de produção, recuperação, documentação e pipeline condicionado à RELEASE_POLICY.
OUT_OF_SCOPE: Alterar adversário/seed/resultado para fabricar vitória; créditos ou níveis artificiais; considerar saldo antigo como prova de si mesmo; copiar jogador produtivo para fabricar fixture; reset; reexecução de migrations; ampliar privilégio global; ativar arte arquivada sem revisão.
ASSIGNED_AGENT: Orquestrador assume Database, Backend, Frontend, GameDesigner, QA, Security e DevOps. Ampliação desses perfis para o escopo explícito deste pedido; sem subagentes.
DEPENDENCIES: Proveniência econômica verificável; contrato de recompensas; arte elegível; UID autenticado antes da liderança; acessos reais e gates de publicação.
REQUIRED_CONTEXT: RELEASE_POLICY; FIX-PROD-003-REPORT; WORKFLOW/RULES/SECURITY; perfis/skills selecionados e contratos específicos.
SECURITY_CONSIDERATIONS: Sem secrets em evidências, sem leitura de perfis de navegador; usar configuração protegida existente de testes apenas internamente; preservar todas as pendências/worktrees/dados.
ACCEPTANCE_CRITERIA:
- Torre2–7/campeão, recompensas e reconexão comprovados sem progressão artificial, ou bloqueio específico com evidência.
- Saldos reconciliados só por fontes autorizadas, sem perda de dados; caso contrário preservar e registrar lacunas.
- Visual/atributos/persistência em desktop/móvel validados para arte e identidade elegíveis.
- Liderança apenas mediante getUser/UID e operação administrativa auditável.
- Testes afetados/lint/types/build/CI e Preview real aprovados antes de produção; nenhum teste omitido contado PASS.
TEST_PLAN: Confirmar remotos e journal; testar progresso legítimo existente sem reiniciar andar1; rastrear recibos/origens e equivalência de saldos; rever ativos visuais e contratos; executar testes afetados e registrar cobertura/limitações.
DEFINITION_OF_DONE: Todos os gates e produção conferidos; dependência indispensável ausente exige BLOCKED com condição de desbloqueio; falha corrigível exige REWORK.

## Complemento explícito do usuário — proposta de recompensas

Autoriza-se contrato e testes isolados com XP20/30/40/50/60/80/150 e moedas10/15/20/25/30/40/75, baú épico no7, somente primeira vitória válida por andar, sem concessão por repetição/derrota. Nenhum crédito real antes de homologação final de catálogo/política. Preparar e testar os valores propostos, sem integrar grant ao runtime; a resposta não é homologação final nem autorização para fabricar progresso. Instalação reproduzível pelo lockfile no novo worktree para validar os novos testes, sem atualizar dependências. Contrato/modelo isolado em packages/database/deployments/fixprod004; nenhuma operação de concessão é exportada ao servidor.

## Aceite parcial e bloqueios

DONE: origem administrativa TASK-0077 localizada e hash do backup confere; auditoria SELECT executada confirma estoque/baús, identifica delta16XP/6moedas sem evento comprovado e conserva marcaNULL. Nova batalhaTorre2 legítima derrotada, recibocf9d9377-c0f7-4e3b-912d-b994831e0c36,0créditos,nextFloor2,reconexão e salto7 negado;14checksPASS. Browserdesktop/WebKit390=14PASS,regressão704PASS/47SKIP e lint/types/buildPASS. Proposta430XP/215moedas/1baú épico isolada,17testesPASS,grantsempre0/0/0. Falha inicial no total530/265 corrigida sem alterar valores por andar. Gates locais da proposta lint/types/buildPASS; CI novoSHA e Preview são próximos checks operacionais, registrados no relatório.

BLOCKED: vitórias2–7/campeão sem identidade elegível/progressão; integração transacional de pagamentos e homologação final pendentes (não solicitá-la antes dos testes); origem do delta legado; arte aprovada para corpo alvo inexistente; UID autenticado do TesteChatA inacessível por kernel-assets do Chrome. Nenhum saldo/role/flag produtivo alterado; nenhuma migration aplicada/reaplicada. Homologação e testes faltantes não são PASS. Produção5edc93f/READY preservada; relatório docs/architecture/FIX-PROD-004-REPORT.md.
