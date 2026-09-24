# Changelog

## 2026-09-24 → TASK-0023 (DONE)

- Entregue MVP local funcional da Arena 1x1 com Battle Engine seeded, UI completa, adversários de treino, snapshots de Viajantes salvos, efeitos de equipamentos, recompensas limitadas, anti-farm, histórico e responsividade.
- PvP remoto permanece indisponível e explicitamente identificado por falta de autenticação/backend compartilhado.
- Checks: lint, typecheck, build, 97 testes unitários e 27 E2E aprovados.

## 2026-09-24 → TASK-0022 (DONE)

Sistema de atributos deixou de exibir apenas a base fixa: total centralizado deriva Vida/Força/Defesa/Sabedoria de base, equipamento, progressão configurada e temporários. Stats individuais adicionados ao catálogo; Hero mostra total/origem, Loja e Equipamentos mostram bônus/comparação e mudanças têm feedback. Migração preserva saves antigos e não persiste totais. Lint/typecheck/build PASS; 85 unitários, 24 E2E completos e E2E final desktop/mobile PASS.

## 2026-09-24 → TASK-0021 (DONE)

Botas do Viajante refinadas como dois overlays lógicos independentes sobre `leftFoot`/`rightFoot`, com registro na base, offsets por corpo, escala menor, rotações próprias e máscara mais baixa. Asset original, espada, elmo, layout e sistemas preservados. Prévia/Hero, desktop/mobile, zoom CSS 90/100/110%, resize e F5 validados; lint/typecheck/build, unitário e E2E dirigidos PASS.

## 2026-09-24 → TASK-0020 (DONE)

Calibração frontal dos equipamentos: âncoras corporais normalizadas por masculino/feminino, empunhadura da espada na palma, botas menores em cada pé, elmo e camadas ajustados. Voo conclui na geometria permanente sem deslocamento na troca. Classificação de qualidade diferencia recortes utilizáveis na pose atual de arte dedicada ainda necessária; nenhum asset precisa de mais resolução na tela atual. Lint/typecheck/build PASS; 80 unitários, 22 E2E completos e 4 dirigidos após ajuste PASS. Capturas desktop/mobile e zoom CSS 90/100/110% inspecionadas. Sem alteração de save, economia ou outras telas.

## 2026-09-24 → TASK-0019 (DONE)

Herói centralizado, sidebar verde única em desktop e drawer mobile. Manifesto central de assets e âncoras (512 × 768) alimenta overlays frontais persistentes para espada, escudo, elmo, couraça, botas e medalhão em corpos masculino/feminino; equipar voa até a âncora e desequipar remove camada com fade. Assets originais auditados e arte dedicada futura especificada em EQUIPMENT-OVERLAY-ASSETS. Lint/typecheck/build PASS; 79 unitários e 22 E2E desktop/mobile PASS; capturas visualmente inspecionadas. Sem mudança de save, economia ou Guilda. TASK-0018 segue REWORK para o playtest da Fuga.

## 2026-09-24 → TASK-0018 (REWORK)

Auditados 16 sistemas antes de editar; corrigidos links ocultos/incorretos e adicionadas rotas visíveis de Loja/Coleção. Compra local persistente, saldo/XP/level up visíveis, três ofertas, seis equipamentos catalogados, voo do ícone ao Avatar, lições/missões/desafios locais por Guilda, aprovação/recompensa idempotente e progresso coletivo. Overlays corporais e autoridade real de Líder continuam indisponíveis, explicitados na UI e no relatório. Lint/typecheck/build, 76 unitários e 18 E2E desktop/mobile passaram; capturas de Loja, Guilda e início da Fuga inspecionadas. Playtest completo da Fuga ainda pendente; tarefa permanece REWORK.

## 2026-09-23 → TASK-0013 (REWORK)

Passe incremental da Fase 1.1: collider e Avatar menores no minigame, clareiras, cenário orgânico em canvas com cache, feedback de coleta e ativação do portal; metadados bíblicos para três equipamentos, Medalhão migrado com ID estável, animação de equipar, Códice e validação defensiva de saves. Lint/typecheck/build, 70 unitários e 14 E2E desktop/mobile passaram. Capturas iniciais foram inspecionadas. Partida completa e avaliação subjetiva ainda exigem playtest; tarefa permanece REWORK.

## 2026-09-23 → TASK-0011

Concluído passe de qualidade da Fase 1.1: leitura externa obrigatória de Gênesis 2–3 com confirmação e checkpoint, Devocional privado interativo, três objetivos bíblicos na exploração, Quiz de 14 questões com shuffle determinístico e Fuga da Serpente com colisão e apresentação 2D/2.5D refinadas. Persistência/migração ampliadas sem alterar Avatar, sessão, equipamentos ou gate da Guilda. Parecer bíblico registra fontes, classificação e limites de licença. Lint/typecheck/build aprovados e 67 testes passaram; inspeção visual no navegador integrado ficou limitada por indisponibilidade ambiental.

## 2026-09-17 → TASK-0008

Implementado onboarding local com avatar personalizável, introdução, mapa acessível de oito atos, Ato I, apresentação da fase 1.1 e placeholder. Separados domínio, catálogo, estado, adapter e UI. Storage versionado/validado, atributos iguais de protótipo, sem conta/banco/Quiz/minigame. SVG/CSS originais e nenhum pacote novo. Testes de domínio/adapter/UI e E2E, revisão visual, QA/Security pelo mesmo autor; evidências no contrato. Documentados execução/reset/limites e atualizados README, projeto e memória. Próxima recomendação única TASK-0009 documental; não iniciada.

## 2026-09-17 → TASK-0007

Consolidados Viajante, ausência de classes, quatro atributos mecânicos, Quiz por fase com consulta bíblica livre, replay sem farming, contrato flexível e oito atos refináveis. Escolha inicial de classes e trecho conflitante da DEC-019 marcados SUPERSEDED; histórico preservado. Criada fonte QUIZ-SYSTEM e atualizadas fontes de personagem, loop, campanha, MVP, conteúdo bíblico, impacto técnico, projeto/roadmap e memória. Revisões pelo autor sob perfis locais, sem independência; evidências no contrato TASK-0007. Nenhum código/schema/dependência alterado. Única próxima recomendação: TASK-0008, especificar fase 1.1 incluindo Quiz; não iniciada.

## 2026-09-16 → TASK-0006

Consolidadas leis do jogo e fontes oficiais: visão, loop flexível, missões automáticas/comunitárias, liderança, progressão/economia/equipamentos, integridade bíblica, grandes desafios e Codex/replay. Gênesis 2–3, fase 1.1 O Jardim e a Escolha, torna-se CURRENT VERTICAL SLICE; Neemias SUPERSEDED como início, com quatro documentos históricos preservados. Combate passa a subsistema opcional; classes pendentes. Análise técnica registra revisões necessárias sem alterar modelo físico/schema/código; stack/bootstrap preservados. Atualizados projeto/roadmap, decisões e estado. Revisões e evidências no contrato TASK-0006; diversão, mobile e segurança executável não foram testados nesta tarefa documental. Única próxima recomendação: TASK-0007, especificar fase 1.1, não iniciada.

## 2026-09-16 → TASK-0005

Criado primeiro bootstrap executável autorizado: npm workspaces/lockfile, Next 16.3.5/React 19.3.0, TypeScript strict, ESLint/Prettier, Vitest e Playwright; packages database, game-engine, shared e ui. Página inicial responsiva com botão Iniciar Jornada desabilitado. Drizzle/node-postgres/Zod preparados sem schema completo, conexão ou credenciais. Build/lint/typecheck/formatação aprovados; 10 testes unitários e 2 E2E Edge aprovados, smoke dev HTTP 200 e revisão visual desktop/mobile. Servidores encerrados. Git inicializado localmente sem commit/push. Atualizados README, documentação técnica/segurança e memória. QA/SECURITY pelo próprio autor, sem independência. Auditoria produção 0; exceções locais documentadas para quatro avisos moderados da cadeia Drizzle Kit e manutenção ESLint 9. Próxima recomendação TASK-0006: políticas do piloto, não iniciada.

## 2026-09-16 → TASK-0004

Modelado banco do MVP em DATA-MODEL e DATABASE-RULES; ADR-0002 registra estado mínimo, snapshots, recibos e serialização por personagem. Separadas identidade/perfil/personagem, conteúdo/progresso, concessão econômica/idempotência de comandos; definidos ownership, cardinalidades, FKs compostas, constraints, índices, retomada, concorrência e metadados bíblicos sem texto protegido. Revisões DATABASE/ARCHITECT/BACKEND/SECURITY/QA realizadas documentalmente pelo mesmo autor, sem independência; links/codificação e diretórios reservados verificados. Atualizados contrato, roadmap, decisões e estado. Nenhum banco, schema, migration, dependência ou runtime criado. TASK-0005 recomendada somente para fechar políticas do piloto, retenção/contas e edição/licença; não iniciada.

## 2026-09-16 → TASK-0003

Definido MVP documental com três missões, níveis 1–3, personagem único, inventário de quatro espaços, turnos determinísticos, boss e progresso autoritativo persistente. Criados MVP, CORE-GAMEPLAY-LOOP, CHARACTER-SYSTEM, BATTLE-SYSTEM e CAMPAIGN-STRUCTURE em docs/game-design. Recorte Neemias 2:11–18 conferido na WEBP; paráfrases, interpretação e ficção separadas por unidade. Atualizados projeto, decisões, estado e contrato. Revisões GAME DESIGNER/BIBLICAL CONTENT/ARCHITECT/SECURITY pelo mesmo autor, sem independência; links locais verificados e exemplos revisados em mesa. Nenhum código, asset, dependência, banco ou serviço criado. TASK-0004 recomendada apenas para fechar políticas do piloto; não iniciada.

## 2026-09-16 → TASK-0002

Decidida arquitetura de monólito modular TypeScript com Next/React, PostgreSQL, Drizzle e Better Auth. Criados TECH-STACK e ADR-0001 aceito, com alternativas, fronteiras, autoridade do servidor, controles transacionais e evolução gráfica. Atualizados contrato, visão/roadmap, README, decisões e estado. Revisões documental/segurança pelo próprio autor, sem independência; evidências e limites no contrato. Nenhuma instalação, aplicação, schema ou serviço criado. TASK-0003 recomendada para público/MVP, sem execução.

## 2026-09-15 → TASK-0001

Criada fundação documental: entrada de agentes, orquestração, nove perfis, dez procedimentos, segurança, política de contexto, contrato de tarefa, memória, visão/roadmap, integridade bíblica e preparação RAG/MCP. Diretórios futuros reservados com `.gitkeep`. Validação e limitações registradas no contrato concluído.

