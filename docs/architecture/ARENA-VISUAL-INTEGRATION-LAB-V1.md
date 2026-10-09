# Arena Visual Integration Lab V1 — TASK-0041

Preparação local da apresentação da Arena, independente da aprovação das seis artes reais. A TASK-0040 continua sendo a fonte de verdade para motor, IA, dano, níveis, custos, XP e moedas. A TASK-0039 continua BLOCKED. Nenhuma mídia, receipt, hash de aprovação ou catálogo foi criado/aprovado nesta entrega.

## 1. Visual Lab criado

Servidor DEV independente, usando o Vite **já instalado**, React e os componentes da Arena normal. Não monta Next Providers, Auth, Shell, Journey store, Supabase ou os repositórios de persistência. Fixtures efêmeras fornecem snapshots e eventos de apresentação; não executam `resolveArenaRound` nem settlement. Valores de dano, intenção e recompensas ilustrativas têm identificação DEV FIXTURE. Os resultados ilustram um último golpe com HP do perdedor zerado; não concedem nada.

O isolamento fora do App Router é intencional: uma rota Next comum também montaria o provider global de Auth. Não houve alteração no Auth ou no root layout. A entrada DEV não é importada pela aplicação e não existe em seu build. `NODE_ENV=production node scripts/arena-lab.mjs` é recusado. O serviço escuta somente `127.0.0.1:3109`, sem abrir janela automaticamente.

## 2. Como acessar localmente

Na raiz `D:\rpg-jovem-cristao`:

```powershell
node scripts/arena-lab.mjs
```

Abra `http://127.0.0.1:3109/tools/arena-lab/`. Encerre com Ctrl+C. O processo é separado do Next, não precisa de login ou Viajante salvo, e não altera modo de autenticação. Não existe item de menu do Lab na aplicação.

Seletores: Davi/Elias/Mara/Noemi; idle/ataque/defesa/esquiva/especial/recebendo dano/vitória/derrota/unlock/buffs empilhados; básico e quatro habilidades; jogador/oponente; Foco 0/1/2/3; viewport real/mobile portrait/mobile landscape/tablet/desktop; NORMAL/REDUCED MOTION; quatro fases congeladas. Reproduzir trava ações durante a sequência; Parar cancela timers. Selecionar outro estado/ator/oponente/habilidade também cancela a sequência anterior.

O preset de viewport ativa a configuração de composição correspondente e limita a largura ao espaço disponível. Não emula DPR, sistema operacional, Safari ou um dispositivo físico. Para medir exatamente 390×844, 412×915, 768×1024, 1440×900 e 1920×1080, usar viewport real do navegador/Playwright.

## 3. Tokens de composição, escala, facing e grounding

Fonte: `apps/web/features/journey/data/arenaPresentation.ts`; consumidor compartilhado: `components/arena-stage.tsx` e seu CSS Module.

| Token | Mobile | Tablet | Desktop |
| --- | --- | --- | --- |
| PLAYER_POSITION | 25%, 91% | 26%, 91% | 27%, 91% |
| OPPONENT_POSITION | 75%, 91% | 74%, 91% | 73%, 91% |
| GROUND_LINE | 91% | 91% | 91% |
| HUD_SAFE_AREA | 176 px | 176 px | 200 px |
| ATTACK_CENTER | 50%, 63% | 50%, 62% | 50%, 62% |
| IMPACT_CENTER | 50%, 62% | 50%, 61% | 50%, 60% |
| SPECIAL_FOCUS_CENTER | 50%, 47% | 50%, 46% | 50%, 45% |
| Envelope mínimo/máximo de altura | 150–220 px | 210–300 px | 240–330 px |
| Altura do palco | 390 px | 460 px | 520 px |
| Fator de deslocamento | 0,4 | 0,7 | 1 |

As coordenadas são percentuais do palco. O envelope respeita também largura disponível e área do HUD; não força upscale para preencher todo o palco. O ator mantém proporção 2:3, imagem `contain` e `object-position: center bottom`. PNG futuro 1024×1536 transparente não é deformado. A margem transparente da arte precisa respeitar a baseline de produção; conferência humana dos bytes recebidos ainda é necessária.

`ARENA_FACING`: jogador +1, oponente −1. A convenção esperada é arte fonte orientada para a direita; o flip do lado oponente é único e central, sem offsets ou regras por adversário. O monograma é compensado para não inverter letras. O Avatar/equipamentos atuais continuam sendo os mesmos componentes e dados; não houve edição de sua arte ou resolver.

Baseline comum, contact shadow por gradiente, iluminação quente discreta e sombra de 1 px integram os personagens ao cenário. Sem blur pesado. Os backgrounds reais ocuparão a camada de fundo do palco com cover; o cenário CSS já existente continua como fallback da Arena.

## 4. Layers

`ARENA_LAYERS`: background 0; environment 1; ground 2; fighters 3; weapon/effect 4; floating combat text 5; HUD 6; cinematic 7. CSS usa custom properties emitidas pela configuração. O palco é isolado; fighters contêm seus efeitos/HUD, e o overlay cinemático começa abaixo da área segura. Efeitos, sombras, cenário e texto flutuante são decorativos, `aria-hidden` e `pointer-events: none`.

Os status/buffs ficam em rodapé no fluxo, fora da faixa recortada de grounding; altura automática e quebra de linha preservam as cinco badges empilhadas em 390 px.

## 5. FX disponíveis

`ArenaFx`: hit flash, slash claro/dourado, block impact abstrato, dodge trail curto, focus pulse, special reveal, victory glow, defeat fade e level-up burst. Somente CSS/gradientes/bordas leves; sem biblioteca adicional, imagem, símbolo ocultista ou arquivo fictício. FX são montados por evento/fase e removidos ao terminar/cancelar; não existem partículas globais ou loops indefinidos.

Golpe do Caminho: preparação, título, avanço, slash, impacto e texto de dano, recuperação. Guarda: postura/contorno abstrato quente e indicação de defesa/dano reduzido. Discernimento: linhas de atenção e highlight do alvo, intenção provável real no runtime e exemplo DEV marcado no Lab. Passo: deslocamento curto e rastro duplo discreto; ESQUIVOU no golpe evitado. O título central aparece durante preparação/execução; no impacto cede espaço ao feedback junto ao alvo.

## 6. Timing e personalidade por adversário

| Perfil | Antecipação | Execução | Impacto | Recuperação | Total básico | Viagem | Reação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jogador | 70 | 50 | 330 | 200 | 650 ms | 18 px | 9 px |
| Davi / ágil | 70 | 50 | 200 | 200 | 520 ms | 12 px | 6 px |
| Elias / ofensivo | 70 | 50 | 360 | 200 | 680 ms | 24 px | 10 px |
| Mara / guardiã | 70 | 50 | 440 | 200 | 760 ms | 10 px | 5 px |
| Noemi / tática | 70 | 50 | 300 | 200 | 620 ms | 15 px | 7 px |

Tempos em ms, deslocamentos multiplicados pelo fator de viewport. Totais e instante do impacto básico em 120 ms preservam a TASK-0040. CameraZoom/cameraPan/shakeStrength/fighterTravel/hitReaction estão no mesmo objeto por perfil. Não foi alterada a seleção de ações da IA.

`ARENA_CINEMATIC`: 350/350/600/200 ms, total 1500; impacto em 700 ms; overlay 0,14; título 700 ms; escala 1,024 ponderada pelo viewport; intensidade 0,8; impacto 1,25; retorno 200 ms. `ARENA_REDUCED`: 50/50/150/200 ms, total 450; sem avanço/shake/zoom. HP e recursos continuam aplicados no impacto. Pausa do último golpe: 300 ms.

## 7. Feedback de turno

SEU TURNO quando disponível; AGUARDE durante ação do oponente; SUA AÇÃO durante apresentação do jogador. Mantém anúncio acessível com ator/alvo/ação reais. Trava de rodada original preservada; três ações ficam disabled durante a sequência. Sem modal novo.

## 8. Foco

Medidor 0–3 nos dois HUDs; texto ≥12 px. Ganho pulsa brevemente, gasto muda os pips com animação curta e cancelável; máximo mostra FOCO CHEIO inline. Não há popup ou bônus novo. A animação reflete alteração do estado apresentado, não antecipa a atualização do motor. `focusDelta` evita mostrar +1 quando o ganho foi limitado pelo máximo.

## 9. Especiais

Painel de quatro opções/custos/locks mantém o catálogo da TASK-0040. Destaque discreto do botão principal quando existe habilidade disponível; opções indisponíveis explicam lock/Foco insuficiente sem executar ação. Sem piscar continuamente. Escape fecha e devolve foco ao botão; Tab e Enter/Space continuam nativos. Botões ≥48 px.

## 10. Vitória

Último impacto, pausa, pose/glow, VITÓRIA, XP, moedas, level-up e unlock. A Arena normal usa o settlement e valores reais existentes; nenhum drop inventado. Duração e delays da revelação usam tokens. O Lab usa exemplos claramente identificados e jamais chama o settlement.

## 11. Derrota e desbloqueio

TREINO ENCERRADO, fade discreto e TENTAR NOVAMENTE. Mantém mensagem respeitosa. `ArenaUnlockNotice` é compartilhado, com nome/tipo/custo/descrição e Ver habilidade; no runtime recebe apenas o before/after real da concessão de nível. Não bloqueia o jogo por timer ou modal.

## 12. Asset status e hot-swap

`dev/arena-asset-status.ts` lê os arquivos existentes `audiovisual-pack-v1.json`, `audiovisual-pack-approvals.json`, o mesmo `auditPack` da CLI e o catálogo gerado. A variante mobile é auditada independentemente para não desaparecer do painel quando o background principal estiver ausente. Não há outro manifesto ou algoritmo de aprovação.

| Status | Significado |
| --- | --- |
| MISSING | Arquivo físico ausente |
| REJECTED | Arquivo presente sem receipt válida, hash/licença/revisão incorretos ou mídia inválida |
| APPROVED | Auditor validou o arquivo e receipt; catálogo ainda não corresponde |
| READY | Auditor validou e caminho/licença correspondem ao catálogo gerado |

O painel mostra os seis slots e suas dimensões. Estado final desta entrega: **6 REJECTED**, zero approvals. Os seis arquivos chegaram externamente durante a validação; foram somente medidos e preservados. WebP: 1920×1080 e 960×540; quatro PNG: 1024×1536 com canal alpha. Essas medidas não constituem aprovação visual ou comprovação de licença. SHA-256 e metadados: `build/task-0041-evidence/incoming-assets.json`. Receipts continuam vazias e catálogos continuam vazios; a CLI audit permanece FAIL por rejeição, como gate obrigatório da integração. Não há botão para alterar reviewedBy/reviewedAt/license/hash/presentationApproved ou escrever catálogos. Não foi implementado bypass de mídia não aprovada, nem mesmo no Lab.

O Lab só habilita assets READY; background requer ambas as variantes READY. Atualizar status repete a leitura/auditoria; Recarregar catálogo / hot-swap recarrega a página após `--write`. Vite acompanha mudanças no catálogo. A Arena normal continua usando exclusivamente o catálogo validado existente. Alterar bytes de mídia já aprovada exige novo hash/revisão/audit antes de reutilizar/compilar o catálogo; copiar um arquivo sozinho não o aprova.

## 13. Áudio DEV

O mesmo hook de apresentação aceita callback DEV de eventos attack/defense/focus/dodge/special/impact/victory/defeat. O Lab registra os eventos da sequência e oferece botões de inspeção sem chamar AudioManager/playback. Nenhum Audio ou path fictício. A Arena normal mantém seu singleton e bindings anteriores.

## 14–16. Mobile, desktop e reduced motion

Cinco viewports reais na matriz, portrait e conferência landscape 844×390. Layout mobile e painel inline; controles ≥48 px; nenhum FX intercepta toque; nomes quebram linha sem overflow horizontal; atores/HP/Foco separados. Desktop usa envelope maior, sem CSS por personagem. Verificações geométricas medem HUD/atores contra palco e largura do documento contra viewport. Páginas podem rolar verticalmente para painel/resultados; não existe clipping de controles por fullscreen forçado.

Runtime obedece preferência real. Lab permite forçar NORMAL ou REDUCED, inclusive NORMAL quando o sistema prefere reduzir. Reduced mantém textos/recursos/timing lógico e remove movimento decorativo, transitions e revelações longas. Cancelar/trocar estado/desmontar limpa callbacks e efeitos pendentes.

## 17. Arquivos alterados/criados

- `components/arena-stage.tsx`, `arena-stage.module.css`, `arena-unlock-notice.tsx`: palco, facing, FX e unlock compartilhados.
- `data/arenaPresentation.ts`: composição, layers, motion, cinematic e feedback.
- `data/battlePresentation.ts`, `hooks/use-battle-presentation.ts`: consumo dos tokens, delta de Foco, callback DEV, cancelamento e replay de fixtures.
- `components/arena-specials.tsx`, `components/pack-artwork.tsx`, `screens/arena.tsx`, `journey.module.css`: medidor, teclado, gate DEV de mídia, palco/turnos/CTA e remoção de 45 blocos antigos de motion exclusivos da Arena.
- `dev/arena-lab-entry.tsx`, `arena-visual-lab.tsx`, `arena-visual-lab.module.css`, `arena-lab-fixtures.ts`, `arena-asset-status.ts`, `vite-env.d.ts`; `tools/arena-lab/index.html`; `scripts/arena-lab.mjs`, `audiovisual-pack.d.mts`.
- `arena-lab.test.tsx`, `arena-asset-status.test.ts`; `tests/e2e/arena-lab.spec.ts`, `arena-lab-production.spec.ts`; CTA de derrota e assertions derivadas do catálogo aprovado em `arena-v2.spec.ts`; gate `enabled=false` em `pack-artwork.test.tsx`; `audiovisual-pack.test.ts` verifica equivalência do catálogo auditado e ausência de caminhos REJECTED no runtime, sem exigir indevidamente audit PASS para arquivos recebidos sem aprovação.
- `playwright.arena-lab.config.ts`, exclusão do teste DEV no `playwright.config.ts`, inclusão da config DEV no `tsconfig.json`.
- Este documento, revisão Security, contrato e CURRENT_STATE. Evidências/scratch ignorados em `build/task-0041-*`.

Nenhum arquivo do motor/IA/custos/NPCs/atributos/equipamentos/saves/rewards/Auth/Supabase foi editado nesta tarefa. Mudanças anteriores do usuário foram preservadas. `next-env.d.ts` é restaurado aos bytes da baseline após os gates.

## 18–21. Gates e evidências

| Gate final | Resultado |
| --- | --- |
| Unit | PASS — 53 arquivos, 324 testes |
| ESLint / typecheck / build | PASS — 20 rotas estáticas; nenhuma rota Lab |
| E2E Lab | PASS — 2 testes, 55 casos visuais + captura de buffs |
| E2E Arena/produção | PASS — 25 testes, 1 skip preexistente |
| QA visual / Security pelo autor | PASS no escopo de preparação e fallback |
| Preservação | `build/task-0041-evidence/preservation.json` |

Logs: `unit-final.log`, `lab-final.log`, `production-final.log` em `build/task-0041-evidence`; resultado estruturado do Lab: `lab-results.json`. Lint/typecheck/build foram repetidos após o último ajuste e concluíram com exit 0. O audit de assets reais não é PASS: continua bloqueando sua ativação, sem impedir o aceite desta preparação.

```powershell
npm test -- --maxWorkers=2
npm run lint
npm run typecheck
npm run build
npm run test:e2e -- --config playwright.arena-lab.config.ts
npm run test:e2e -- tests/e2e/arena-v2.spec.ts tests/e2e/arena.spec.ts tests/e2e/arena-lab-production.spec.ts tests/e2e/immersion-sprint.spec.ts tests/e2e/audit-corrections.spec.ts --grep 'V2|Arena|reduced motion' --output build/task-0041-evidence/production-test-results --reporter=list
```

Capturas: `build/task-0041-evidence/screenshots` (11 combinações ×5 resoluções =55, mais `390-stacked-buffs.png`: 56 capturas); traces DEV separados em `lab-test-results`; regressão normal em `production-test-results`. Unit novos cobrem cancelamento/reduced/cleanup, nenhuma escrita/playback no Lab, Escape, Foco e limites/totais de timing; status físico/mobile/receipt/catálogo com fixture sintética **somente em build**, nunca arte de produção ou aprovação humana real.

QA/Security pelo próprio autor, sem alegar independência. Primeiras execuções identificaram área segura insuficiente no mobile/desktop, corrigida nos tokens e line-height do HUD. A concorrência inicial entre suítes Playwright no mesmo outputDir causou ENOENT ao fechar traces, corrigido separando diretórios; não se contou essa execução como gate PASS. O sandbox bloqueou subprocessos esbuild/TypeScript/Edge com EPERM; checks pertinentes foram reexecutados com a permissão técnica do ambiente. Não houve download ou instalação.

REWORK adicional: badges saíram da faixa recortada para rodapé fluido; fixture sem eventos usa o snapshot correto. A chegada de mídia sem receipts expôs uma premissa antiga do teste global (audit sempre PASS); o teste agora comprova que nenhuma mídia rejeitada entra nos catálogos, mantendo a CLI FAIL e todos os testes negativos.

Limites: as artes recebidas ainda não tiveram aprovação humana de margens alpha, pose/facing, pixels, detalhe, iluminação, crop e licença; nem arquivo de áudio para audição. Evidência é de composição/fallback/eventos e Chromium/Edge local, não de dispositivos físicos. A TASK-0039 permanece BLOCKED por essa dependência.

## 22. QUANDO OS ASSETS CHEGAREM — handoff TASK-0039

1. **Conferir os seis arquivos já recebidos externamente**, preservando seus bytes e hashes. Em futura substituição autorizada, colocar somente os seis arquivos reais em `apps/web/public/assets/`:

   | Arquivo relativo | Dimensões |
   | --- | --- |
   | `world/arena/arena_training_courtyard.webp` | 1920×1080 |
   | `world/arena/arena_training_courtyard_960.webp` | 960×540 |
   | `characters/arena/arena_davi.png` | 1024×1536, transparência real |
   | `characters/arena/arena_elias.png` | 1024×1536, transparência real |
   | `characters/arena/arena_mara.png` | 1024×1536, transparência real |
   | `characters/arena/arena_noemi.png` | 1024×1536, transparência real |

2. **Medir** dimensões, formato, alpha e envelope visual com o Sharp já instalado. Conferir 2:3, pés/baseline, facing fonte à direita, margens transparentes e nenhuma sombra/cenário opaco no PNG. Exemplo de leitura, repetido por arquivo (não altera bytes):

   ```powershell
   node -e "import('sharp').then(async ({default:s})=>{const i=s('apps/web/public/assets/characters/arena/arena_davi.png');console.log(await i.metadata());console.log(await i.stats());})"
   ```

3. **Gerar hash** SHA-256 dos bytes finais. Exemplo:

   ```powershell
   Get-FileHash -Algorithm SHA256 -LiteralPath 'apps/web/public/assets/characters/arena/arena_davi.png'
   ```

4. **Preencher receipt somente após revisão humana real**, em `docs/architecture/audiovisual-pack-approvals.json`, `files[arquivo relativo]`. Campos existentes: `sha256`, `licenseId` (`original`, `CC0-1.0` ou `CC-BY-4.0`), `licenseSource`, `author`, `reviewedBy` real, `reviewedAt` ISO e `presentationApproved: true` apenas após aceite. Repetir para todos os seis arquivos, sem copiar hashes/metadados de outra arte. Não inventar aprovação ou licença.
5. **Executar audit**: `node scripts/audiovisual-pack.mjs`. Conferir seis arquivos VALIDATED e nenhuma rejeição. MISSING de outros pacotes continua pendência desses pacotes; não aprovar nem inventar mídia para fazê-los desaparecer. O auditor gera evidência em `build/task-0038-evidence/asset-audit.json`.
6. **Executar --write** somente após audit PASS e revisão humana: `node scripts/audiovisual-pack.mjs --write`. Ativa os slots arenaBackground/arenaDavi/arenaElias/arenaMara/arenaNoemi; a variante mobile pertence a arenaBackground. O script existente também regenera catálogos de áudio com os bindings realmente validados, mantendo vazios os ausentes. Conferir o diff e preservar artefatos anteriores.
7. **Abrir Visual Lab** com `node scripts/arena-lab.mjs`; Atualizar status e Recarregar catálogo / hot-swap. Exigir 6 READY. Se REJECTED/APPROVED persistir, resolver receipt/audit/catálogo antes da inspeção runtime. O Lab não altera esses gates.
8. **Conferir cinco viewports** reais e as 11 combinações. Usar `npm run test:e2e -- --config playwright.arena-lab.config.ts`. Os testes já consultam o status real e o catálogo aprovado: REJECTED permanece em fallback e READY permite a arte, sem reescrever expectativas para inventar aceite. Medir HUD/contato/escala/alpha/facing/textos e inspecionar capturas; incluir reduced motion.
9. **Aprovar composição humana** dos pixels finais, registrando evidência verdadeira no contrato TASK-0039. Ajustes finos ficam nos tokens/FX compartilhados; evitar offsets específicos por NPC, novas fórmulas ou mudanças no motor.
10. **Rodar testes** unitários/E2E/lint/typecheck/build e revisão de Arena normal. Os testes de fallback/status já acompanham os catálogos efetivamente aprovados; preservar cenários negativos de ausência/rejeição em fixtures isoladas. Nenhum falso PASS por reutilizar números desta tarefa.
11. **Fechar TASK-0039** apenas com mídia, aprovação humana, audit/catálogo, inspeção visual e gates comprovados; atualizar memória e mover o mesmo contrato para completed. A TASK-0041 entrega a preparação, não antecipa esse aceite.

Preservação final comprovada: baseline 192 arquivos, 180 intactos e 12 alterações autorizadas; zero divergências inesperadas. Os seis arquivos recebidos mantêm os hashes medidos. next-env restaurado byte a byte.
