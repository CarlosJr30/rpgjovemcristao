# TASK-0001 — Fundação documental

ID: TASK-0001
TITLE: Criar a fundação de engenharia assistida por agentes
OBJECTIVE: Preparar governança, contexto, orquestração, memória, RAG e MCP sem implementar o jogo.
PRIORITY: P0 Critical
STATUS: DONE
SCOPE: Documentos e diretórios especificados na missão, com arquivos .gitkeep quando vazios.
OUT_OF_SCOPE: Frameworks, dependências, UI, API, banco, autenticação, gameplay, MCP real, vector database, credenciais e serviços externos.
DEPENDENCIES: nenhuma
ASSIGNED_AGENT: Orquestrador assumindo ARCHITECT e revisão documental SECURITY; sem subagentes executados.
REQUIRED_CONTEXT: Missão do usuário; AGENTS.md; regras e políticas locais; projeto.
SECURITY_CONSIDERATIONS: Menor privilégio nos perfis; exemplo de ambiente vazio; exclusão de secrets; RAG como DATA; MCP sem acesso irrestrito.
ACCEPTANCE_CRITERIA:
- Estrutura solicitada presente, sem aplicação ou dependências.
- Entrada, orquestrador, nove agentes e dez procedimentos completos e coerentes.
- Segurança, tokens, tarefa, DoD, memória, integridade bíblica, roadmap, RAG e MCP documentados.
- Nenhum secret ou .env real criado.
- Estado atualizado, decisões e pendências registradas; exatamente uma próxima tarefa em backlog.
TEST_PLAN:
- Inspecionar todos os arquivos, diretórios, links Markdown e referências locais.
- Verificar campos obrigatórios dos perfis, contratos e memória.
- Conferir padrões mínimos de .gitignore e exemplo de ambiente sem valores.
- Verificar ausência de .env, manifests, implementações e credenciais.
DEFINITION_OF_DONE:
- Critérios aprovados com evidências, revisão documental de segurança e memória atualizada.
- Checks de aplicação N/A por inexistência de implementação.

## Evidências de validação — 2026-09-15

- PASS: inspeção dos 55 arquivos, estrutura exigida e diretórios reservados.
- PASS: fluxo completo de AGENTS.md; roteamento seletivo e responsabilidades do orquestrador.
- PASS: nove perfis com os onze campos exigidos, escopos de READ/WRITE/EXECUTE e dez procedimentos referenciados existentes.
- PASS: campos obrigatórios dos dois contratos e estado compacto presentes; roadmap completo.
- PASS: links Markdown locais resolvidos e conteúdo UTF-8 sem caracteres corrompidos.
- PASS: política de tokens contempla as sete estratégias e memória sem conversas completas.
- PASS: revisão documental de segurança cobre secrets, permissões, confiança de RAG e declaração futura de MCP.
- PASS: padrões mínimos de .gitignore presentes; exceções para .env.example e .gitkeep de índice na ordem correta. Chaves e recipientes de credenciais têm padrões adicionais específicos.
- PASS: .env.example contém somente APP_ENV= e APP_URL=; nenhum .env real, secret, código de aplicação, manifest ou serviço criado.
- PASS: ACCEPTANCE CRITERIA, SECURITY REVIEW documental, DOCUMENTATION UPDATED, NO SECRETS e NO KNOWN CRITICAL REGRESSIONS.
- N/A: BUILD, LINT, TYPECHECK, UNIT TEST e INTEGRATION TEST de aplicação, pois esta entrega contém somente documentos e marcadores vazios.

A inspeção não comprova controles de runtime futuros. A política deve ser implementada e testada quando existir software. QA estrutural e Security documental realizados pelo próprio autor; não constituem revisão independente. Git CLI indisponível no PATH: validação nativa com git check-ignore não executada; inspeção dos padrões documentada separadamente.
