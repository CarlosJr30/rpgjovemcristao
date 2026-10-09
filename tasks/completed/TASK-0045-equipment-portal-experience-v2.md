# TASK-0045 → Equipment Portal Experience V2
ID: TASK-0045
TITLE: Equipment Portal Experience V2
OBJECTIVE: Refinar o Arsenal existente com avatar, slots, inventário e comparação reais.
PRIORITY: P2 Normal
STATUS: DONE
SCOPE: UI local de equipamentos, CSS, componentes auxiliares, testes e documentação. Autorização explícita no pedido TASK-0045 de Carlos Faustino.
OUT_OF_SCOPE: Novos itens/mídia, Body-Fit approvals, fórmulas/economia/save/Auth/Supabase/migrations, demais telas, dependências, push e deploy.
DEPENDENCIES: TASK-0043 e TASK-0044 concluídas localmente; equipamentos e cinematic existentes.
ASSIGNED_AGENT: Frontend; QA e revisão de segurança pelo próprio autor, sem subagentes.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY, TOKEN_POLICY; screen equipment, avatar, cinematic, atributos e testes pertinentes.
SECURITY_CONSIDERATIONS: Dados do viajante renderizados como texto React; links bíblicos existentes; filtros somente locais; nenhuma fronteira de autorização alterada.
ACCEPTANCE_CRITERIA:
- Avatar completo, seis slots com item/raridade/bônus/estado vazio e seleção acessível.
- Inventário com filtros locais e comparação de atributos/poder pelo modelo central.
- Equipar/desequipar, Body-Fit e tempos/reduced motion preservados.
- Seis viewports sem overflow, QA visual e fallback; checks aplicáveis PASS.
TEST_PLAN:
- Unit dos modelos/overlays/cinematic e comparação; E2E equipamentos/regressão e seis screenshots.
- Lint, typecheck e build; preservação de código fora do escopo e assets.
DEFINITION_OF_DONE:
- Aceite comprovado, checks PASS, evidências e documentação/memória atualizadas.

## SELF VALIDATE / REWORK
- Inspeção confirmou stores/helpers centrais e arquitetura Body-Fit existentes. Apresentação isolada, sem alteração em fórmulas, save, catalog, manifes​​ts, áudio ou outras telas.
- Defeitos de apresentação corrigidos: card disponível rotulado Vazio, comparação sem valores atual/novo, feedback sem antes/depois, slots sem resumo real; ícones quebrados passam a ocultar decoração sem remover ações.
- QA detectou overflow do painel de recompensa em 844×390 (bottom 427 > altura 390). Ajuste CSS somente para texto em landscape baixo, preservando ícone/voo/tempos/commit/reduced. Matriz nova verifica bounds do painel e targets.
- Primeiro E2E: REWORK por seletor de teste getByLabel exato e fixture inicial de Botas já equipada. Seletores agora combobox semântico; fixture isolada limpa slots antes do fallback. Não foi mudança no domínio.
- Interrupção do ambiente deixou CSS cinematic e teste novo com bytes nulos. CSS original recuperado de source map local com SHA-256 exatamente igual ao baseline (9f1c8ef8d7a73825280da6ed74c961a0e56fefc3f133c7c95f3ca6c758422fe2); aplicada apenas regra landscape. Teste reconstituído; backups válidos e checks repetidos.
- Unit final 8 arquivos/83 PASS; E2E portal final 9 PASS/5 duplicações mobile ignoradas. Build exit 0/20 rotas; typecheck exit 0. Regressões, lint e aceite final em fechamento; não contar rodada interrompida como PASS.

## Aceite final — 2026-10-06
- BUILD PASS: npm run build exit 0, 20 rotas, após recuperação verificada. Evidência build-result.json e execução 26993.
- LINT PASS: npm run lint exit 0; verified-lint.json/log.
- TYPECHECK PASS: npm run typecheck exit 0; verified-typecheck.json/log. next-env.d.ts restaurado byte a byte ao baseline; tsc web/root novamente exit 0, sem nova geração.
- UNIT PASS: oito arquivos/83 testes em unit-final.log, comparações positivas/negativas/zero e regressões dos modelos, anchors, assets/renderer, bíblia e cinematic.
- INTEGRATION/E2E PASS: portal 9 PASS + regressões 23 PASS, total 32 PASS/18 skipped (duplicações mobile e previews V1 históricos já desabilitados). verified-regression.json exit 0; não mascarar tentativas anteriores.
- ACCEPTANCE PASS: seis tamanhos solicitados com capturas finais em screenshots/, alvo >=44px, foco/keyboard, tabela com sinal, poder/equip/remove/persistência, reduced e bounds landscape. Fallback com todas as imagens bloqueadas preserva avatar procedural, comparação e equipar. Links bíblicos existentes mantêm href/target/rel, sem inventar conteúdo ou navegação externa.
- SELF VALIDATE/QA visual e SECURITY REVIEW PASS pelo autor, não independentes. NO SECRETS, documentação atualizada e nenhuma regressão crítica conhecida. Revisão narrativa N/A: referências/textos bíblicos existentes não foram alterados.
- Preservação SHA-256: baseline 564 arquivos, 163 mídias intactas; nenhuma alteração inesperada ou perda. Fórmulas/save/Auth/Supabase/catalogs/Body-Fit/Guilda/Arena preservados. Evidência preservation.json; contrato movido ao completed após aceite.
- Dev local retomado (a interrupção havia encerrado o servidor), hidden/127.0.0.1:3000; GET /journey/equipment HTTP 200. Nenhuma instalação, geração de mídia, push/deploy, mudança remota ou operação Git destrutiva.
- NEEDS_NEW_ASSET: somente dois fundos arquitetônicos opcionais documentados, sem registro READY ou asset novo. Pendências preexistentes Body-Fit/áudio comercial não são resolvidas nesta tarefa; nenhuma pendência bloqueante da UI local. DONE local.
