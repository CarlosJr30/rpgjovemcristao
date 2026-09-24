# TASK-0020 → Calibração visual dos overlays

ID: TASK-0020
TITLE: Calibrar encaixe frontal de espada, botas e demais equipamentos no Avatar
OBJECTIVE: Ajustar posições, escala, rotação e ponto de chegada da animação para que os itens pareçam vestidos ou segurados na pose frontal, mantendo os sistemas atuais.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Auditoria da imagem base e capturas; âncoras corporais normalizadas por body type; ajustes no manifesto de overlays e no destino do voo; classificação de qualidade; E2E visual em larguras e zoom, testes e documentação.
OUT_OF_SCOPE: Redesenho do Herói, novos itens/rotas/economia/progressão/Guilda, alteração do Avatar base ou do save, produção de bitmap novo sem necessidade comprovada.
DEPENDENCIES: TASK-0019 concluída; manter TASK-0018 independente.
ASSIGNED_AGENT: Orquestrador no perfil Frontend/QA, revisão Security pelo próprio autor.
REQUIRED_CONTEXT: Pedido anexado, `equipmentAssets.ts`, `equipped-avatar.tsx`, `equipment.tsx`, sprites frontais e capturas desktop/mobile.
SECURITY_CONSIDERATIONS: URLs fechadas do manifesto; não montar paths de input/saves; calibração somente visual, sem dados ou permissões novos.
ACCEPTANCE_CRITERIA:
- Body anchors normalizados por sexo e ponto de registro próprio da espada; a empunhadura coincide com a palma.
- Botas menores e mais baixas, cada uma alinhada a um pé; elmo centrado sem tapar rosto; armadura/escudo/medalhão revisados.
- Destino do voo deriva do mesmo anchor final, sem salto visual; resize e zoom mantêm alinhamento.
- Reload e troca de Viajante preservam resultado; assets inadequados são classificados com honestidade.
TEST_PLAN:
- Capturas antes/depois e inspeção em desktop/mobile, larguras alternativas e 90/100/110% zoom; masculino e feminino.
- Testes do resolver/âncoras; fluxo E2E de equipar, reload, desequipar; lint/typecheck/build e E2E relevante.
DEFINITION_OF_DONE:
- Aceite visual com evidência, QA/Security aplicáveis e memória atualizada; REWORK se asset impedir encaixe convincente.

RESULTADO:
- Canvas 512 × 768 e caixas alpha dos sprites auditados; âncoras normalizadas por corpo em `bodyAnchors.ts` e registro de empunhadura/pés em `equipmentAssets.ts`.
- Capturas frontais masculina/feminina inspecionadas: cabo sobre palma, botas menores e baixas em cada pé, elmo centrado com rosto visível; couraça, escudo e medalhão ajustados sem mover o Avatar base.
- Voo calcula retângulo e rotação finais da camada no container do Avatar, completa 620 ms antes da troca aos 660 ms; chegada sem deslocamento adicional.
- Qualidade classificada por item no manifesto e em `docs/architecture/EQUIPMENT-OVERLAY-ASSETS.md`: arte rara da espada READY na pose atual; variante comum e os demais recortes exigem overlay dedicado para acabamento final. Não há falta de resolução na tela atual.
- QA: lint, typecheck, build de 17 rotas, 80 unitários, 22 E2E completos e 4 E2E dirigidos após o ajuste final PASS. Playwright cobriu desktop/mobile, 360/390/1024 px, zoom CSS 90/100/110%, reload, troca de Viajante e desequipar.
- Security: URLs locais fechadas no manifesto; nenhum input vira path, nenhum save, permissão, serviço ou economia foi alterado. Revisão feita pelo próprio autor, sem independência.
- Limite do aceite: a pose frontal atual foi calibrada; sprites dedicados continuam necessários para plano da mão/cabelo e demais poses. O zoom CSS não substitui teste do controle de zoom do navegador.
