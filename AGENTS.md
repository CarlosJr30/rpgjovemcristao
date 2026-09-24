# Entrada dos agentes

## Fluxo obrigatório
REQUEST → READ GLOBAL CONTEXT → READ CURRENT STATE → IDENTIFY TASK → SELECT MINIMUM CONTEXT → SELECT SPECIALIST → EXECUTE → SELF VALIDATE → QA WHEN REQUIRED → SECURITY WHEN REQUIRED → ACCEPTANCE CHECK → UPDATE MEMORY → DONE

1. Leia [.agent/GLOBAL_CONTEXT.md](.agent/GLOBAL_CONTEXT.md) e [.agent/memory/CURRENT_STATE.md](.agent/memory/CURRENT_STATE.md).
2. Identifique ou registre uma tarefa conforme [.agent/WORKFLOW.md](.agent/WORKFLOW.md). Leia [.agent/ORCHESTRATOR.md](.agent/ORCHESTRATOR.md) ao coordenar trabalho.
3. Selecione somente os trechos necessários do projeto, regras e perfil especialista. Consulte [.agent/TOKEN_POLICY.md](.agent/TOKEN_POLICY.md) para recuperação seletiva.
4. Antes de alterar arquivos, aplique [.agent/RULES.md](.agent/RULES.md) e [.agent/SECURITY.md](.agent/SECURITY.md). O perfil e suas skills delimitam a atuação.
5. Execute no escopo autorizado, valide com evidências, aplique os gates de QA e Security do workflow e verifique o aceite.
6. Atualize memória e status da tarefa. Falhas exigem REWORK; somente aceite comprovado permite DONE.

Nunca carregue todos os documentos, agentes, ADRs, tarefas ou RAG automaticamente. Perfis são contratos de trabalho; não registram nem executam subagentes automaticamente. Use somente os especialistas necessários, respeitando as capacidades e permissões reais do ambiente.

## Limite da fase
A fundação contém apenas governança, documentação e diretórios reservados. Nenhuma implementação do jogo, instalação de dependências, serviço externo ou MCP está autorizada por estes documentos. O roadmap não → autorização para executar funcionalidades.
