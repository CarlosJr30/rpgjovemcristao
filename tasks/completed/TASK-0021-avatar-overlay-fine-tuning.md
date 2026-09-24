# TASK-0021 → Acabamento visual das botas do Avatar

ID: TASK-0021
TITLE: Ajuste fino independente das Botas do Viajante
OBJECTIVE: Fazer cada bota acompanhar exatamente seu pé na prévia e na Hero Screen, preservando todo o restante.
PRIORITY: P2 Normal
STATUS: DONE
SCOPE: Posição, escala, rotação, recorte e camada dos dois overlays existentes das botas; validação visual desktop/mobile de Hero e Equipamentos.
OUT_OF_SCOPE: Espada, elmo, outros equipamentos, layout, card, nome, XP, sistemas de jogo, Avatar base e novos assets.
DEPENDENCIES: TASK-0020 concluída.
ASSIGNED_AGENT: Orquestrador no perfil Frontend/QA.
REQUIRED_CONTEXT: Pedido vigente, `equipmentAssets.ts`, `bodyAnchors.ts`, `EquippedAvatar`, asset das botas e capturas Hero/Equipamentos.
SECURITY_CONSIDERATIONS: Somente números de geometria e CSS local; nenhum dado, URL ou permissão nova.
ACCEPTANCE_CRITERIA:
- `leftBoot` e `rightBoot` têm âncoras, offsets, escala e rotação independentes.
- Cada recorte cobre o pé correspondente sem flutuar, sair para fora ou subir excessivamente na canela.
- Hero e prévia usam o mesmo encaixe relativo; resize e zoom CSS preservam as posições.
TEST_PLAN:
- Capturas das botas em ambos os contextos e inspeção visual em desktop/mobile e zoom CSS 90/100/110%.
- Lint, typecheck, build e E2E dos overlays/Equipamentos; revisar diff.
DEFINITION_OF_DONE:
- Aceite observado, testes pertinentes aprovados e memória atualizada.

RESULTADO:
- O par original permaneceu intacto e foi mantido como dois overlays lógicos: `leftBoot` usa a metade esquerda e `rightBoot` a metade direita.
- Masculino: offsets `(-18, +28)` e `(+12, +28)`, escala `0.84`, rotações `-2°/+2°`. Feminino: offsets `(-5, +31)` e `(+14, +31)`, escala `0.82`, rotações `-1.5°/+1.5°`.
- Registro de base em `(0.25, 0.88)` e `(0.75, 0.88)`, máscara iniciada mais abaixo para não cobrir a canela e `zIndex 6` preservado.
- Capturas masculina/feminina e preview/Hero inspecionadas em desktop/mobile; zoom CSS 90/100/110%, resize e F5 aprovados.
- QA: lint, typecheck, build, 4 testes unitários dirigidos e E2E visual dirigido PASS. Security N/A: somente geometria local de assets já registrados.
