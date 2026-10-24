# FIX-PROD-004 — Torre e pendências de produção

ID: FIX-PROD-004
TITLE: Concluir gates restantes com preservação de dados
OBJECTIVE: Partir de f9f7c36, confirmar remotos, validar progressão legítima da Torre, reconciliar apenas por proveniência comprovada, corrigir visual autorizado e verificar liderança antes de produção.
PRIORITY: P1 High
STATUS: ACTIVE
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
