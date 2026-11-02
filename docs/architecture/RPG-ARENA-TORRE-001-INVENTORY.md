# RPG-ARENA-TORRE-001 — inventário antes da implementação

01/11/2026. Base publicada `c853d9b`; branch independente `codex/rpg-arena-torre-001`. Nenhuma carta/arte criada, dado concedido ou alteraçãoPROD.

| Encontrado | Fonte reutilizável | Estado real |
| --- | --- | --- |
|Arena original/V2|`packages/game-engine/src/arena-combat-v2.ts`, `apps/web/features/journey/screens/arena.tsx`|Motor determinístico,4perfisIA, Foco, atributos/equipamentos, palco/animações e adversáriosDavi/Elias/Mara/Noemi existentes. Não reconstruir.|
|Baralho|`arena-deck.ts`, `features/arena-deck`|Sete IDs distintos, snapshot congelado, uma utilização por carta/batalha, níveis/custos e editor existentes. Uso não remove posse.|
|Torre|`features/arena-tower/config.ts`, `screen.tsx`, `storage.ts`|**Já implementada:** sete andares, IA/dificuldade crescente, checkpoint/derrota/retomada e **Campeão da Torre** final. Reutiliza ArenaExperience/engine; não criar outra Torre.|
|Posse consultável|`lib/supabase/owned-cards-read.ts`/RPC007 `get_owned_cards`|Leitura própria existente, com recibo e sessão; não concede cartas.|
|Regras/cartasTEST|Manifesto `packages/database/deployments/fixprod003/test-catalog.json` e catálogo remotoTEST|Sete fichas ativas homologadas **somenteTEST**, referência `FIX-PROD-003:TEST-ONLY:2026-10-23`. Não são aprovaçãoPROD ou direito de aquisição novo.|
|ArteArena|Manifesto/approvals audiovisuais e catálogo gerado existentes|**6arquivos presentes/aprovados e hashes exatos:** cenário1920×1080+960×540 e4personagens. Nenhum desses arquivos falta.|
|Arte das cartas|Campo `art` das sete fichas e busca dos assets|As sete fichas têm `approved:false/reference:null`; não localizada ilustração individual vinculada. Editor/cartas textuais existentes não dependem dessas imagens. Não gerar novas sem decisão específica.|
|Retratos exclusivosTorre|Configuração/palco existentes|IDs `tower-floor-*` usam o fallback existente; não há mapeamento aprovado exclusivo. Personalização visual futura, não ausência de motor/personagem que justifique reconstrução.|

## Sete cartas existentes — nenhuma carta funcional ausente

| Carta | Efeito implementado | Nível/Foco base | Regra/artes |
| --- | --- | --- | --- |
|Ataque Simples|`attack`|1/0|RegraTEST aprovada; arte individual não aprovada.|
|Defesa|`defend`|1/0|Idem.|
|Golpe do Caminho|`special:path-strike`|2/2|Idem.|
|Guarda Perseverante|`special:steadfast-guard`|4/2|Idem.|
|Discernimento|`special:discernment`|6/2|Idem.|
|Passo do Peregrino|`special:pilgrim-step`|8/3|Idem.|
|Golpe Medido|`special:measured-strike`|1/1|Idem; multiplicador1,15 já implementado.|

O documento003 antigo menciona seis efeitos e uma proposta de sétimo; foi superado nesse ponto por003A/FIX-PROD003 e pelo código/catálogoTEST atuais. O registro público continua sem aprovaçãoPROD; não copiar o estadoTEST para aprovar produção. A posse não ignora nível/Foco.

## Lacuna comprovada e recuperação mínima

Rotas/menuArena permanecem bloqueados no lançamento; `/api/authority` devolve403 e abrange autoridades econômicas que **não serão reabertas**. O antigo `ArenaExperience.settle` contém concessão local deXP/moedas e atualização de Viajante: reativar a tela sem isolamento violaria o pedido. A Torre local já evita concessão, mas a entrada autenticada atual escolhe a autoridade bloqueada.

Recuperar somente a fronteiraTEST: reutilizar coleção real de leitura007, Arena/palco/Torre existentes, isolar treinamento sem recompensa ou atualização de jogador e manter PRODe autoridade econômica fechados. Não substituir posse por fixtures, starter, cartas emprestadas ou itens fictícios. LeituraTEST encontrou14linhas de cartas em dois viajantes históricos; isso não comprova sessão normal autorizada para esses titulares. Positivos hospedados exigirão identidade com sete cartas já existentes; não conceder cartas para fabricar o teste.

Não faltam cartas/efeitos/cenário da Arena ou lógica de sete andares. Faltam a integraçãoTEST segura e a comprovação de acesso legítimo com posse; artes individuais/exclusivas permanecem pendências visuais explicitamente separadas. Inventário técnico/hash privado em `build/rpg-arena-torre-001/inventory.json`. Somente leituraTEST; nenhum acesso de escrita ou produção.
