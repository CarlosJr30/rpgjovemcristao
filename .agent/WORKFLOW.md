# Workflow e contratos

## Ciclo de tarefa

`BACKLOG → ACTIVE → VALIDATING → DONE`; falha de validação leva a `REWORK → ACTIVE`. Dependência ou informação indispensável ausente leva a `BLOCKED`; registrar condição de desbloqueio e retomar quando resolvida.

BACKLOG fica em `tasks/backlog/`; ACTIVE, VALIDATING, REWORK e BLOCKED em `tasks/active/`; DONE em `tasks/completed/`. Mover o mesmo arquivo, sem duplicar contratos. IDs `TASK-XXXX` são únicos e estáveis.

Prioridades: P0 Critical; P1 High; P2 Normal; P3 Low. Prioridade não dispensa dependências nem autoriza implementação.

## TASK CONTRACT → modelo

```markdown
# TASK-XXXX → título
ID: TASK-XXXX
TITLE: título
OBJECTIVE: resultado esperado
PRIORITY: P2 Normal
STATUS: BACKLOG
SCOPE: arquivos e comportamentos autorizados
OUT_OF_SCOPE: exclusões explícitas
DEPENDENCIES: IDs ou nenhuma
ASSIGNED_AGENT: perfil responsável
REQUIRED_CONTEXT: referências mínimas
SECURITY_CONSIDERATIONS: riscos e controles; ou N/A justificado
ACCEPTANCE_CRITERIA:
- resultado observável e verificável
TEST_PLAN:
- verificação, resultado esperado e evidência a registrar
DEFINITION_OF_DONE:
- aceite atendido, checks aplicáveis aprovados e memória atualizada
```

## Execução e gates

Autor faz SELF VALIDATE em toda entrega, registrando comando/inspeção, resultado e limitações no contrato.

**QA WHEN REQUIRED:** comportamento executável, correção de bug, múltiplos módulos, integração ou risco de regressão exige QA. Documentação isolada de baixo impacto permite revisão estrutural pelo autor, com justificativa registrada.

**SECURITY WHEN REQUIRED:** secrets/configuração de ambiente, auth, autorização, dados pessoais, entrada não confiável, dependências, infraestrutura, MCP ou permissões exige Security. Nesta fundação, política, `.gitignore` e permissões exigem revisão documental de segurança. Revisão pelo próprio autor deve ser identificada; não alegar revisão independente. Se a tarefa exigir independência e ela não estiver disponível, registrar BLOCKED.

**BIBLICAL CONTENT:** mudanças narrativas exigem classificação e revisão das referências por esse perfil antes do aceite.

## Definition of Done

| Check | Aplicabilidade |
| --- | --- |
| BUILD PASS | Quando existe artefato compilável/build configurado |
| LINT PASS | Quando existe código com linter configurado |
| TYPECHECK PASS | Quando a stack oferece verificação de tipos |
| UNIT TEST PASS | Lógica alterada e testes unitários pertinentes |
| INTEGRATION TEST PASS | Fronteiras e integrações afetadas |
| ACCEPTANCE CRITERIA PASS | Sempre |
| SECURITY REVIEW PASS | Quando os gatilhos de segurança se aplicam |
| DOCUMENTATION UPDATED | Sempre avaliar impacto e atualizar referências |
| NO SECRETS | Sempre |
| NO KNOWN CRITICAL REGRESSIONS | Sempre |

Registrar PASS, FAIL ou N/A com motivo e evidências para cada check. Check necessário sem ferramenta ou evidência não → PASS nem N/A: → bloqueio. Testes devem avaliar comportamento e riscos; não criar testes que apenas repetem implementação. Falhou: REWORK. Passou todos os checks aplicáveis: atualizar memória e marcar DONE.
