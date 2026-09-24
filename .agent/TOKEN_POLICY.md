# Política de contexto e tokens

## Estratégia

1. **Hierarchical Context:** começar por AGENTS, contexto global e estado; descer para tarefa, perfil, skill e fontes conforme necessidade.
2. **Progressive Disclosure:** abrir detalhes somente após identificar a questão concreta.
3. **Selective Retrieval:** pesquisar termos e caminhos; recuperar trechos relevantes com referência e versão.
4. **Task Scoped Context:** restringir entradas ao objetivo, escopo, dependências e aceite da tarefa.
5. **Deduplication:** referenciar a fonte de verdade em vez de copiar regras entre arquivos.
6. **Context Pruning:** descartar resultados irrelevantes, saídas repetidas e hipóteses superadas.
7. **Context Summarization:** resumir evidências e decisões preservando suas referências.

Nunca carregar automaticamente todo RAG, histórico, ADRs, tasks ou perfis. Uma tarefa simples não exige todos os especialistas. Contexto global deve conter apenas invariantes; estado deve caber em poucas linhas.

Antes de ampliar contexto, registrar a pergunta que a leitura resolverá. Parar a busca quando houver evidência suficiente para decisão e aceite; não economizar eliminando verificações de segurança necessárias.

## Memória

Atualizar estado ao concluir ou bloquear tarefas. Compactar ao encerrar uma fase ou quando houver repetição que dificulte localizar o próximo passo. Preservar decisões, estado, blockers, riscos, trabalho concluído e próximo passo; manter evidências em tarefas/ADRs e links no resumo. Não armazenar conversas completas ou secrets. Não apagar decisões vigentes ao compactar.
