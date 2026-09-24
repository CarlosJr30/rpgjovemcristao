# Contexto global

- Projeto: RPG Jovem Cristão; visão em `projects/RPG-JOVEM-CRISTAO.md`.
- Aplicar KISS, separação de responsabilidades, SOLID quando útil e DRY sem abstração prematura.
- Preferir monólito modular inicialmente; não antecipar microserviços.
- Menor privilégio e segurança por padrão. Secrets nunca entram em arquivos versionados, memória, RAG, logs ou prompts.
- Narrativa distingue CANONICAL (com origem), INTERPRETATIVE e FICTIONAL; ficção nunca → apresentada como texto bíblico.
- Trabalhar por contrato de tarefa e contexto mínimo. Código gerado não equivale a entrega aceita.
- Estado mutável fica em `memory/CURRENT_STATE.md`; decisões relevantes em memória ou ADR.
