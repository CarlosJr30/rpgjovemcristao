# Avatar Runtime HD V1 — TASK-0047

## CURRENT_AVATAR_PIPELINE (auditoria antes da alteração)

- Save Traveler: appearance.hair/outfit/skin em IDs portugueses; avatar.gender male/female, face/hair numéricos, cores/configuração legada e equippedItems. Equipped vigente vem de traveler.equipped + inventory. Não mudar IDs/modelo/persistência.
- Create oferece dois corpos, três cabelos, três roupas, três tons (54 combinações). Não existe seletor de face atualmente. IDs face/hair numéricos permanecem no save, mas o runtime antigo não os usava para composição; o cabelo visual vem de appearance.hair.
- avatarAssets cria URL por aliases; avatarRuntimeAssets.json descreve 54 PNGs pré-compostos 512x768. Avatar usa img nativo (sem Next optimizer), corpo/roupa/rosto/cabelo indivisíveis, SVG procedural no erro. Fragilidade: assetFailed permanece true mesmo quando muda a identidade/fonte.
- EquippedAvatar compõe Avatar + equippedOverlayLayers. Ordem única EQUIPMENT_COMPOSITION_LAYERS em equipmentAssets: back 0/body1/armor2/boots3/medallion4/hands5/weapon6/shield7/helmet8/frontDetails9/effects10. Gate READY + APPROVED_BY_USER por corpo, inventory/slot válidos. Nenhum overlay de produção aprovado; fixtures somente testes.
- Body-Fit V2: lógico512x768, fonte1024x1536, inset0/100%, sem x/y manual. Cropped preservado somente quando aprovado; V1 jamais inferido do ícone. Manifests/anchors/resolver intocados.
- Herói/Equipment/FighterPortrait Arena usam EquippedAvatar; Shell/Home/Create/Intro/Garden usam Avatar sem overlays. Guilda/Diário recebem avatar pelo Shell; símbolos de liderança não são avatares do viajante. Separação podia causar equipamento ausente nas miniaturas/Jornada.
- GameplayAvatarPortrait duplica URL e coordenadas head (150,0,212,205). Snake canvas mantém cache Image por URL e usa drawImage; não mudar engine/desenho, apenas resolver central e coordenadas derivadas da fonte.
- CSS 2:3 no composto; pequenas caixas podem ter outra proporção e contain. Auto interpolation já correto; não trocar por pixelated/upscale. Memo somente base/equipped; sem preload global/cache customizado. Canvas existe apenas no minigame.
- Auditoria física sharp local: 82 PNGs (54 runtime,2 base,6 face,6hair,4masks,10states), dimensões/decode/alpha/hash em build/task-0047-evidence/avatar-assets.json. Todos runtime512x768. Bases1024x1536 têm fundo pintado/enquadramento distinto: não são substituições diretas HD compatíveis. Face/hair aproximadamente130–216px, recortes com área pintada, não layers full-canvas alinhadas. Estados femininos116–165x290; masculinos tamanhos1024x1536/1086x1448 e framing diferente. Mascaras1024x1536 não criam, sozinhas, opções de cabelo/rosto independentes. Alpha presente não comprova fundo limpo/compatibilidade.

## Decisão

Consolidar AvatarRuntime e resolver de identidade/fonte/portrait/layers. Adapters Avatar/EquippedAvatar mantêm API/seletores e geometria existentes; mover composição ao componente único, ampliar miniaturas/Jornada quando recebem Traveler real. Nenhuma substituição HD falsa nem sobreposição de recortes legados sobre rosto/cabelo pintados. Fonte ativa classificada USABLE_BUT_LOW_RES; arte legada não vinculada classificada LEGACY_ONLY. Alvo HD1024x1536 explícito, sem afirmar fontes READY_HD.

Face IDs1/2/3 e hair IDs1/2/3 preservados e visíveis na auditoria/lab, com indicação de que face independente não é suportada pela arte atual. Todos cabelos efetivamente selecionáveis (curto/longo/cacheado) continuam renderizando a mesma combinação existente. Inventário de substituição física separado da prontidão arquitetural.

## Pipeline consolidado

`Traveler/preview → resolveAvatarIdentity → resolveAvatarRuntime + equippedOverlayLayers → AvatarRuntime → canvas CSS 2:3 + img nativo + overlays aprovados`.

- `data/avatarRuntime.ts` centraliza identidade/IDs, tamanho físico auditado, qualidade real, alvo HD, ordem referenciada do Body-Fit e recorte normalizado de cabeça. Lógico vem de AVATAR_CANVAS; HD vem de FULL_CANVAS_OVERLAY_SOURCE. Futuras fontes HD precisam preservar identidade/canvas/silhueta e registrar dimensões no resolver central, sem refatorar cada tela. Nenhum binding HD existe agora.
- `components/avatar-runtime.tsx` compõe a base e os overlays. Modos thumbnail/card/full/hero/arena compartilham fonte; tamanho se adapta por CSS. Avatar e EquippedAvatar ficam como adapters de compatibilidade. Herói e Arsenal preservam suas APIs/layout; FighterPortrait Arena recebe runtime arena sem tocar motor/motion/facing. Shell/Home/Intro/Garden usam runtime central; Guilda/Diário usam a miniatura do Shell.
- data-body-type legado identifica composição full; data-avatar-body-type identifica todas variantes. Isso evita alterar os alvos do cinematic e os seletores de geometria existentes. Camada do corpo e geometria de equipamento full-canvas/cropped permanecem os contratos originais.
- GameplayAvatarPortrait agora deriva URL e região da cabeça da mesma identidade e dimensões físicas. SnakeChaseGame/cache Image/drawImage continuam intactos. A área usada permanece (150,0,212,205) para a fonte atual.
- Fallback procedural preserva tom/roupa/cabelo, canvas2:3 e personagem visível. Fonte mudou: tenta novamente. Base falhou: camadas são ocultadas para não fingir encaixe aprovado sobre outro corpo; mecânica continua. Overlay falhou: remove somente a imagem da camada; avatar não quebra. Troca/equipamento mantém nó da base quando URL não muda.
- Memo no runtime/adapters, uma URL estável por identidade e cache nativo do browser. Não gera novas variantes pequenas nem solicita fontes legadas 1024. img nativo evita recodificação/interpolação do optimizer sobre alpha/alinhamento. decoding async; prioridade opcional high, padrão auto, sem preload global. Miniatura reutiliza arquivo atual512x768; não existe derivada menor aprovada. Futuro HD pode precisar de derivadas legítimas para reduzir bytes, sem trocar identidade.
- Acessibilidade: miniaturas junto ao nome e avatar decorativo da Arena/Garden com alt vazio/aria-hidden; editor/Herói/Arsenal com nome acessível. Contain/proporção mantidos, sem crop extra; animações/cinematic/reduced motion existentes intocados.

## Assets e pendências físicas

`avatar-runtime-hd-v1-assets.json` contém os 82 arquivos auditados, hash/dimensões/transparência/classificação e cada solicitação com nome/categoria/gênero/resolução/alpha/finalidade/prioridade/referência/motivo.

- 54 ativos USABLE_BUT_LOW_RES; 54 substituições nativas 1024x1536 HIGH, nunca upscale, mesma identidade/silhueta para Body-Fit.
- 28 LEGACY_ONLY; nenhum READY_HD/NEEDS_HD_REPLACEMENT ativo. Quatorze layers independentes condicionais (2 corpos neutros,6 faces,6 cabelos), MEDIUM, somente se contrato futuro escolher composição modular. Não são pré-requisito deste runtime pré-composto e não há binding/aprovação.
- Trocar face IDs independentemente continua impossível com a arte atual; não adicionar seletor/relabelar nem transformar recorte legado em layer sobre um rosto já pintado. Nenhuma opção realmente selecionável desapareceu.
- Não há Body-Fit de produção aprovado. QA de encaixe real, cabelo+capacete e múltiplas peças reais aguarda fontes/aprovação por corpo nas tarefas próprias. Unit usa fixtures sintéticas para provar render/gate, não aprovação humana ou arquivo físico.
- Runtime HD-ready não significa pack HD entregue. Geração/upscale/mudança de arte está fora desta tarefa. Saves/IDs/schema permanecem intactos.

## Validação e evidências

Evidências em build/task-0047-evidence: audit físico, baseline SHA-256, logs, screenshots de Equipamentos/Arena/fallback e lab/matriz por viewport. REWORK de CSS detectado pelo E2E DPR foi corrigido; testes pertinentes repetidos. Lab existente estendido, loopback/Vite DEV, sem store/Auth e dados de teste em memória; nenhuma página Next nova. Produção precisa responder404 para lab/endpoints.

Resultados finais: unit12 arquivos/93 PASS; E2E49 produção +1 DEV=50 PASS/19 skips de duplicação/projeto móvel do audit DPR. Lint/typecheck/build PASS/20 rotas, next-env restaurado e tsc web/raiz revalidado. Rota Herói no dev3000 HTTP200. DPR1/2/3 em ambos corpos, fonte nativa/contain/auto/proporção/sem transform extra; cinematic cinco raridades, combate/ataque/hit/esquiva/especial/reduced/persistência PASS.

QA visual pelos seis viewports solicitados, matriz/Equipment/Arena/fallback: personagens completos sem crop adicional e identidade consistente; opções atuais preservadas. Runtime fallback recupera; testefull-canvasREADY nos dois corpos usa fixture sintética, não mídia aprovada. Novos testes comparam save inteiro antes/depois da visualização.

Preservação SHA-256 baseline578 arquivos,163 mídias e82 avatarPNG intactos, zero perda/mudança inesperada (metadados finais preservation.json). Dois arquivos de config Playwright na raiz revisados separadamente para extensão do lab DEV. Lab/endpoints404 em produção e marca do painel ausente em bundles JS.

QA/Security pelo autor, não independentes. Não foi gerada/editada mídia, instalado pacote, publicado/deployado projeto nem acessado Supabase real.
