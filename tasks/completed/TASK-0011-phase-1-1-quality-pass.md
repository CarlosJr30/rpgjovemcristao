# TASK-0011 — Passe de qualidade da Fase 1.1
ID: TASK-0011
TITLE: Progressão bíblica, exploração, Quiz e redesign da Fuga da Serpente
OBJECTIVE: Tornar a Fase 1.1 mais profunda, correta e visualmente integrada sem alterar Avatar, sessão, equipamentos ou gates da Guilda.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Leitura bíblica e checkpoint; Devocional privado; objetivos da exploração; Quiz; colisão e apresentação da Fuga da Serpente; persistência/migração e testes relacionados.
OUT_OF_SCOPE: Novas fases, autenticação, Avatar Runtime, Herói, Equipamentos, economia geral, regras internas da Guilda e novos assets gerados.
DEPENDENCIES: TASK-0010
ASSIGNED_AGENT: FRONTEND, com revisão BIBLICAL CONTENT, QA e Security pelo próprio autor.
REQUIRED_CONTEXT: Solicitações anexadas; Gênesis 2–3; docs/biblical/README.md; domínio/persistência da Jornada; componentes da Fase 1.1; assets existentes.
SECURITY_CONSIDERATIONS: Links externos usam origem centralizada e `noopener noreferrer`; reflexão permanece somente no save local, com limite de tamanho e sem envio; migração deve ser não destrutiva.
ACCEPTANCE_CRITERIA:
- Leitura de Gênesis 2 e 3 exige abertura registrada, confirmação explícita e checkpoint antes do Devocional.
- Devocional obrigatório inclui reflexão privada, sem pontuação espiritual, e oração opcional.
- Três Fragmentos da exploração exigem pequenas mecânicas e persistem sem duplicação.
- Quiz possui ao menos 12 perguntas, IDs estáveis, Fisher–Yates determinístico e respostas corretas distribuídas em A/B/C/D.
- Colisão usa corpo lógico menor, movimento por eixo e tolerância de canto sem atravessar paredes.
- Fuga da Serpente usa cenário orgânico, Avatar Runtime, Serpente animada, HUD compacto e efeitos leves com reduced motion.
- Guilda e demais sistemas fora do escopo permanecem preservados.
TEST_PLAN:
- Testes de migração, progressão, leitura, Quiz com várias seeds e motor de colisão.
- Lint, typecheck, suíte completa e build.
- Inspeção visual desktop/mobile no navegador integrado quando disponível.
DEFINITION_OF_DONE:
- Aceite comprovado, revisão bíblica registrada, checks aplicáveis aprovados, memória atualizada e tarefa movida para completed.

## Evidências de aceite

- Leitura externa: links centralizados para Gênesis 2 e 3, abertura e confirmação separadas e checkpoint obrigatório antes do Devocional.
- Devocional: reflexão privada limitada a 800 caracteres, conclusão obrigatória e oração opcional sem pontuação.
- Exploração: três desafios distintos concedem Fragmentos somente depois da resolução e registram objetivos sem duplicação.
- Quiz: banco de 14 questões, sessão de 5, Fisher–Yates com seed por tentativa, gabarito por ID e distribuição A/B/C/D comprovada por testes.
- Colisão: collider de pés 8 × 5,5, resolução por eixo, wall sliding, tolerância de quina e pathfinding da Serpente.
- Visual: terreno orgânico em canvas, vegetação/pedras/água/ponte, Avatar Runtime, Serpente animada, sombras, partículas, portal, HUD compacto e reduced motion.
- Persistência: migração não destrutiva e ciclo logout/login cobertos para leitura, Devocional, objetivos e tentativa do Quiz.
- Revisão bíblica: `docs/biblical/PHASE-1-1-CONTENT-REVIEW.md`.

## Gates

- BUILD PASS — `npm run build`; Next.js compilou e gerou 15 páginas estáticas.
- LINT PASS — `npm run lint`; zero avisos/erros.
- TYPECHECK PASS — `npm run typecheck`; web e workspaces aprovados.
- UNIT/INTEGRATION TEST PASS — `npm test -- --run`; 10 arquivos, 67 testes aprovados.
- SECURITY REVIEW PASS — links externos centralizados com `noopener noreferrer`; reflexão permanece local e limitada; nenhuma credencial ou transmissão criada. Revisão pelo próprio autor, sem independência.
- BIBLICAL CONTENT PASS — fontes, classificações e limites registrados; revisão pelo próprio autor, sem independência.
- VISUAL BROWSER CHECK LIMITADO — conexão com o navegador integrado indisponível por erro ambiental de metadados. Build, testes DOM e regras responsivas aprovados; playtest visual interativo permanece recomendado.
- NO KNOWN CRITICAL REGRESSIONS PASS — sistemas fora do escopo não foram alterados por esta tarefa.
