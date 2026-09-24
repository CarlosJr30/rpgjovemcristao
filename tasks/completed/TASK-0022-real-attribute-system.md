# TASK-0022 → Sistema real de atributos

ID: TASK-0022
TITLE: Derivar atributos totais de base, equipamentos, progressão e efeitos temporários
OBJECTIVE: Fazer equipar, desequipar e trocar itens alterar atributos reais e explicáveis, sem persistir valores derivados.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Modelo/validação/migração local de atributos e stats de equipamento; cálculo central; Hero, Equipamentos, Loja e feedback; documentação e testes.
OUT_OF_SCOPE: Redesign da Hero, novos níveis/talentos, efeitos temporários ativos, mudança de XP/economia, resolução automática de puzzles ou novos equipamentos.
DEPENDENCIES: TASK-0021 concluída.
ASSIGNED_AGENT: Orquestrador com atuação explícita de domínio, Frontend, Game Design e QA.
REQUIRED_CONTEXT: Pedido anexado; domínio Traveler; catálogo; estado; persistência; Hero/Equipamentos/Loja; testes existentes.
SECURITY_CONSIDERATIONS: Validar stats persistidos e limites numéricos; total sempre derivado de item possuído/equipado; nenhum dado externo ou permissão nova.
ACCEPTANCE_CRITERIA:
- Base 1/1/1/1 permanece separada; total soma base + equipamento + progressão configurada + temporários fornecidos.
- Elmo +1 Defesa, Espada +2 Força e Botas +1 Vida produzem 2/3/2/1; remover espada produz 2/1/2/1.
- Troca substitui bônus do slot e ciclos repetidos não acumulam.
- Hero mostra total e origem; Equipamentos e Loja mostram bônus; equipar/desequipar dá feedback curto.
- Reload, logout/login e múltiplos Viajantes preservam equipamento e recalculam totais independentemente.
TEST_PLAN:
- Unitários de base, fontes, múltiplos itens, troca, remoção, temporário/progressão vazia, repetição e migração.
- E2E do caso concreto, reload, logout/login e isolamento; regressão completa lint/typecheck/test/build/E2E.
DEFINITION_OF_DONE:
- Critérios observados, gates aplicáveis PASS, documentação e memória atualizadas.

RESULTADO:
- Causa confirmada: `Traveler.attributes` era base fixa validada em 1; `Equipment` não tinha stats; Hero lia a base diretamente; equipar só alterava IDs.
- `data/attributes.ts` deriva base + equipamentos possuídos/equipados + configuração de nível + temporários. Nenhum total é persistido.
- Bônus iniciais: Botas +1 Vida, Espada +2 Força, Elmo +1 Defesa; demais itens também têm combinações individuais no catálogo. Progressão de atributos permanece configurada e vazia.
- Hero mostra total e origem; Loja, Mochila e Equipamentos mostram bônus; troca mostra diferença e equipar/desequipar produz feedback curto.
- Saves antigos migram nomes `vigor/dexterity/perception/wisdom` e hidratam stats canônicos. Base adulterada é rejeitada; item precisa estar possuído e no slot equipado para contribuir.
- QA: lint/typecheck/build de 17 rotas PASS; 85 unitários PASS; 24 E2E completos PASS; 2 E2E finais desktop/mobile com reload, logout/login, dois Viajantes e desequipar PASS. Capturas Hero desktop/mobile inspecionadas.
- Security revisado pelo autor: limites numéricos e chaves de stats validados, base fixa validada e stats conhecidos canonizados na migração. Persistência continua local e não autoritativa, conforme limite já documentado.
- Browser integrado não iniciou por erro de metadados do conector; Playwright local forneceu a evidência visual e funcional necessária.
