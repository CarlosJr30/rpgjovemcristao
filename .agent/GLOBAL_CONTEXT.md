# Contexto global

- Projeto: RPG Jovem Cristão; visão em `projects/RPG-JOVEM-CRISTAO.md`.
- Aplicar KISS, separação de responsabilidades, SOLID quando útil e DRY sem abstração prematura.
- Preferir monólito modular inicialmente; não antecipar microserviços.
- Menor privilégio e segurança por padrão. Secrets nunca entram em arquivos versionados, memória, RAG, logs ou prompts.
- Narrativa distingue CANONICAL (com origem), INTERPRETATIVE e FICTIONAL; ficção nunca → apresentada como texto bíblico.
- Trabalhar por contrato de tarefa e contexto mínimo. Código gerado não equivale a entrega aceita.
- Estado mutável fica em `memory/CURRENT_STATE.md`; decisões relevantes em memória ou ADR.
- Alterações funcionais/visuais aprovadas seguem [a política permanente de publicação](RELEASE_POLICY.md): implementar, testar, segurança, commit/push normal, Vercel e verificação pública; teste físico pelo usuário. Exceções exigem instrução explícita ou bloqueio registrado.
- Preferência de Carlos reafirmada em 2026-10-11: sempre publicar no Vercel as alterações aprovadas que estamos fazendo, após os gates, sem solicitar novamente autorização de publicação. Não encerrar apenas com resultado local.
