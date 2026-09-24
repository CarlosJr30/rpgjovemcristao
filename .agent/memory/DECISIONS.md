# Decisões

| ID | DATE | DECISION | REASON | IMPACT |
| --- | --- | --- | --- | --- |
| DEC-001 | 2026-09-15 | Fundação exclusivamente documental | Limite explícito da missão | Sem runtime, dependências, serviços ou jogo |
| DEC-002 | 2026-09-15 | Preferência inicial por monólito modular | Simplicidade e separação evolutiva | Pastas não implicam microserviços; stack pendente |
| DEC-003 | 2026-09-15 | Contexto seletivo e especialistas sob demanda | Economia de tokens e menor privilégio | Perfis locais não ativam agentes automaticamente |
| DEC-004 | 2026-09-15 | Classificação narrativa e proveniência obrigatórias | Integridade bíblica | Revisão antes de aceitar conteúdo |
| DEC-005 | 2026-09-15 | RAG/MCP apenas preparados | Evitar infraestrutura prematura | Sem ingestão, índices reais ou conexões |

| DEC-006 | 2026-09-16 | [ADR-0001 aceito](../../docs/adr/ADR-0001-technical-stack.md): monólito modular TS, Next/React, PostgreSQL, Drizzle, Better Auth | Um deploy, integridade transacional e regras isoladas | Concretiza DEC-002; sem instalação ou implementação |
| DEC-007 | 2026-09-16 | UI React e núcleo de regras TypeScript; engine gráfica adiada | Sem requisito comprovado de cena contínua | Servidor autoritativo; futura renderização híbrida não altera regras |
| DEC-008 | 2026-09-16 | Definir público/MVP antes da modelagem detalhada | Privacidade, gameplay e conteúdo afetam dados e aceite | TASK-0003 recomendada, não iniciada; documentação apenas |

| DEC-009 | 2026-09-16 | [MVP documental](../../docs/game-design/MVP.md) com três missões lineares, combate 1 contra 1 por turnos e níveis 1–3 | Jornada pequena completa, mobile e compatível com ADR-0001 | TASK-0003 conclui definição de gameplay prevista em DEC-008; sem implementação |
| DEC-010 | 2026-09-16 | Neemias 2:11–18 como recorte; paráfrases canônicas, leitura temática e treinos ficcionais separados | Preservar integridade sem transformar personagens bíblicos em bosses | Proveniência/revisão em CAMPAIGN-STRUCTURE; não amplia aprovação a roteiros futuros |
| DEC-011 | 2026-09-16 | XP/loot fixos e únicos, autosave por transição e rodada, servidor autoritativo | Simplicidade, retomada e prevenção de duplicação | Sem farming, offline ou serviço adicional; transações ainda a modelar |
| DEC-012 | 2026-09-16 | Público de design jovem iniciante; hipótese de primeiro piloto restrito a adultos | Delimitar design enquanto políticas operacionais são fechadas | TASK-0004 recomendada para políticas do piloto; sem cadastro real ou afirmação de conformidade |

| DEC-013 | 2026-09-16 | Pedido atual contrata TASK-0004 para modelagem; políticas passam a recomendação TASK-0005 | A recomendação anterior não era tarefa contratada; gameplay permite modelar sem abrir contas | Complementa DEC-008/012; idade, privacidade, retenção e licença continuam bloqueando cadastro/publicação |
| DEC-014 | 2026-09-16 | [ADR-0002](../../docs/adr/ADR-0002-progress-persistence.md): estado mínimo, snapshots, grant único e recibo de operação; serialização por Character | Evitar cópias de stats/desbloqueios, duplicação econômica e corridas entre módulos | TASK-0004; conteúdo referenciado imutável; decisões aceitas documentalmente, implementação/testes pendentes |

| DEC-015 | 2026-09-16 | Pedido explícito contrata TASK-0005 para primeiro bootstrap executável; políticas passam à recomendação TASK-0006 | Autorização local de código/dependências substitui o limite documental somente neste escopo | npm workspaces, Next/React, database/game-engine/shared/ui; sem gameplay, schema completo, contas ou serviços |
| DEC-016 | 2026-09-16 | Packages conceituais do ADR são materializados minimamente nos quatro packages solicitados; database marcado server-only | Evitar abstrações vazias e manter fronteiras | Sem alteração de stack; detalhes em docs/architecture/BOOTSTRAP.md |
| DEC-017 | 2026-09-16 | Versões compatíveis fixadas; exceções locais para cadeia dev Drizzle Kit/esbuild moderada e manutenção ESLint 9 | Zero achados altos/críticos; produção sem avisos; não forçar downgrade ou peers incompatíveis | ORCHESTRATOR aceita risco residual local; DEVOPS/SECURITY acompanham antes de ferramentas de banco/publicação; docs/security/BOOTSTRAP-REVIEW.md |

Decisões significativas futuras seguem [ADR](../../docs/adr/README.md). Não armazenar conversas completas.

## 2026-09-16 — TASK-0006: precedência vigente

DEC-009 e DEC-010: SUPERSEDED quanto ao MVP inicial, três missões obrigatórias de combate e Neemias como começo. DEC-011 preservada em autoridade do servidor, atomicidade e concessão única; exclusão de replay e limites econômicos anteriores não regem a dinâmica atual. Documentos históricos continuam evidência do que foi aprovado na época, não fonte vigente de produto.

| ID | DATE | DECISION | REASON | IMPACT |
| --- | --- | --- | --- | --- |
| DEC-018 | 2026-09-16 | NEHEMIAH VERTICAL SLICE -> SUPERSEDED; GENESIS 2-3 / O JARDIM E A ESCOLHA -> CURRENT VERTICAL SLICE | Redefinição explícita de produto pelo usuário | Fase 1.1 de Gênesis — As Origens; histórico preservado, roteiro ainda pendente |
| DEC-019 | 2026-09-16 | [Fontes oficiais de dinâmica](../../docs/game-design/MVP.md): RPG narrativo, exploração, desafio significativo em cada fase e combate contextual | Evitar combate obrigatório, quiz e pontuação espiritual | Loop flexível, replay e Codex; classes PENDENTE DE GAME DESIGN |
| DEC-020 | 2026-09-16 | **SUPERSEDED pela DEC-033 quanto ao gate** — missões in-game e comunitárias separadas; PLAYER/LEADER/ADMIN conceituais | Regra histórica: comunidade opcional com confirmação objetiva | Limites de líder permanecem; a regra “pendência não bloqueia” não é mais vigente |
| DEC-021 | 2026-09-16 | XP/level para evolução de jogo; moeda interna, equipamento útil e colecionáveis sem pay-to-win | Progressão não mede fé, santidade ou qualidade de oração | Economia e curvas pendentes; sem monetização, prêmio principal único e descobertas opcionais |
| DEC-022 | 2026-09-16 | Stack/bootstrap e invariantes técnicas compatíveis preservados; [impacto](../../docs/architecture/CENTRAL-DYNAMICS-IMPACT.md) exige revisão parcial do modelo | RewardGrant/Battle, etapas e autorização antiga não cobrem nova dinâmica | Sem código/schema; futura revisão antes de gameplay |
| DEC-023 | 2026-09-16 | Pedido contrata TASK-0006 para leis do jogo; única próxima recomendação TASK-0007: especificar documentalmente fase 1.1 | Recomendação anterior de políticas não era contratação | Políticas do piloto/licença continuam pendentes antes de cadastro/publicação; próxima tarefa não iniciada |

## 2026-09-17 — TASK-0007: precedência vigente

A escolha inicial de Guerreiro/Sacerdote/Profeta/Arqueiro está **SUPERSEDED**, e a pendência de classes da DEC-019 está encerrada. DEC-019 está **SUPERSEDED parcialmente** na justificativa de evitar Quiz e no loop sem esse componente; exploração e desafio significativo continuam vigentes. DEC-023 fica superada somente quanto à recomendação do ID seguinte: TASK-0007 agora contrata esta consolidação; detalhamento do slice passa a TASK-0008. Entradas anteriores são histórico, não instrução vigente conflitante.

| ID | DATE | DECISION | REASON | IMPACT |
| --- | --- | --- | --- | --- |
| DEC-024 | 2026-09-17 | [Viajante e atributos](../../docs/game-design/CHARACTER-SYSTEM.md) como fonte oficial | Decisão explícita pós-TASK-0006 | Sem classes iniciais; diferenciação pela jornada; Sabedoria estritamente mecânica |
| DEC-025 | 2026-09-17 | [Quiz](../../docs/game-design/QUIZ-SYSTEM.md) obrigatório por fase | Conhecimento objetivo separado de reflexão | Consulta livre, capacidades futuras e replay limitado; valores e integração pendentes |
| DEC-026 | 2026-09-17 | [Contrato de fase](../../docs/game-design/CORE-GAMEPLAY-LOOP.md) flexível e [oito atos](../../docs/game-design/CAMPAIGN-STRUCTURE.md) refináveis | Consolidar direção de produto | Slice Gênesis 2–3 mantido; não detalha campanha inteira |
| DEC-027 | 2026-09-17 | TASK-0007 exclusivamente documental; próxima recomendação única TASK-0008 para fase 1.1 incluindo Quiz | Pedido atual não autoriza implementação | [Impactos](../../docs/architecture/CENTRAL-DYNAMICS-IMPACT.md) orientam revisão futura; código/schema preservados |

## 2026-09-17 — TASK-0008: autorização de implementação local

| ID | DATE | DECISION | REASON | IMPACT |
| --- | --- | --- | --- | --- |
| DEC-028 | 2026-09-17 | Pedido contrata TASK-0008 para onboarding visual executável; substitui somente recomendação de escopo da DEC-027 | Validar experiência antes de infraestrutura | Home, Viajante, introdução, mapa, Ato I e apresentação; sem fase/Quiz/minigame/banco/auth |
| DEC-029 | 2026-09-17 | [Persistência local temporária](../../docs/architecture/LOCAL-JOURNEY.md) por JourneyRepository | Exceção explícita do usuário para protótipo | Sem conta ou credencial; storage validado, falha visível, reset de chave isolada; não é estado confiável para futuro backend |
| DEC-030 | 2026-09-17 | Quatro atributos com valor 1 somente em PROTOTYPE_BASE_STATS; 27 combinações cosméticas independentes | Números oficiais ainda pendentes; aparência não dá vantagem | Sem balanceamento definitivo, árvore, prêmio ou avanço de nível; arte SVG/CSS original provisória |
| DEC-031 | 2026-09-17 | Única próxima recomendação TASK-0009: especificar documentalmente fase 1.1, incluindo Quiz/desafio | Conteúdo e critérios ainda precisam de contrato | Não contratada/iniciada; nenhuma nova implementação autorizada por esta recomendação |

| DEC-032 | 2026-09-17 | TASK-0009 implementa o primeiro slice jogável em React/DOM e localStorage; recompensa da fase é concedida uma única vez e replay não faz farming | Validar gameplay antes de backend/engine | XP 120, moedas 30 e descoberta opcional de protótipo; valores sujeitos a balanceamento futuro |
| DEC-033 | 2026-09-23 | Desafio final da Célula/Guilda passa a ser gate obrigatório entre fases; desafios especiais permanecem opcionais | Atualização estrutural explícita de produto, substituindo a regra comunitária opcional da DEC-020 | Sem Guilda não há fallback solo; líder valida apenas realização objetiva; recompensa e desbloqueio são idempotentes; protótipo local não substitui auth/RBAC reais |
| DEC-034 | 2026-09-24 | Atributos vigentes são Vida, Força, Defesa e Sabedoria; total é derivado de base + equipamento + progressão configurada + efeito temporário | Equipar precisa alterar gameplay sem corromper a base ou acumular bônus | Substitui os nomes provisórios Vigor/Percepção/Destreza da DEC-024/030; saves legados são migrados; total não é persistido |
