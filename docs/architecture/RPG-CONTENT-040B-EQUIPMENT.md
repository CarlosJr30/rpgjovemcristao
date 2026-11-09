# CONTENT-040B — proposta dos 40 equipamentos

## Aprovação para implementação — 09/11/2026

O proprietário autorizou ativar em produção as 34 fichas descritas neste documento, incluindo IDs, slots, raridades, níveis mínimos, atributos, poder e mappings EA/EH/EM/EP. Os seis equipamentos existentes e suas origens permanecem inalterados. Esta aprovação **não** autoriza Loja, preços, baús/loot, missões, grants, conversão ou qualquer outra aquisição; as 34 peças novas ficam sem emissão até contrato econômico próprio.

08/11/2026. **Planejamento para aprovação, sem implementação/publicação.** Main remota consultada: `6c7b0c9fe08eb6cb991eba231acf344a764a10dd`, Mochila PR43. Branch própria `docs/content-040b`. Planejamento de cartas utilizado: `docs/architecture/RPG-CONTENT-040A-CARDS.md` no commit `2dda423` da branch `docs/content-040a`, incluindo a revisão final; não integrado automaticamente a esta branch.

## Contratos reutilizados

[Catálogo](../../apps/web/features/journey/data/equipmentCatalog.ts), [domínio](../../apps/web/features/journey/domain/traveler.ts), [atributos](../../apps/web/features/journey/data/attributes.ts), [snapshot/mapeamento de efeitos](../../apps/web/features/journey/data/arena.ts), [fórmulas](../../packages/game-engine/src/index.ts), [Arena V2](../../packages/game-engine/src/arena-combat-v2.ts), [descrições reais](../../packages/game-engine/src/arena-descriptions.ts), [plano econômico](ECONOMY-CONTENT-001-REPORT.md) e [contrato de Loja/equipar](../../packages/database/proposals/economy-001c-shop-release.sql.in).

A proposta/template SQL consultada não constitui nova auditoria de configuração remota. A ponte existente trabalha com ator/sessão/posse/recibo, IDs e slots permitidos; não aceita um catálogo arbitrário do navegador. O template possui uma lista restrita de quatro itens equipáveis pela Loja, não uma autorização genérica para40. O histórico da abertura cinematográfica e demais trabalhos é preservado, sem revalidar ou reexecutar transações. O relatório antigo da011 contém checkpoints anteriores à main; ele não será usado para inferir o estado remoto atual.

## Seis existentes — definições preservadas

V=Vida; F=Força; D=Defesa; S=Sabedoria. Valores omitidos são0. Poder é campo separado e entra na parcela ofensiva de **todos os slots**, não só da arma. Efeitos descritos conforme o V2, não pelo texto simplificado do protótipo.

| Nº / ID existente | Nome | Slot | Raridade | Atributos | Poder | Efeito existente / origem atual |
| --- | --- | --- | --- | --- | ---: | --- |
| 01 / traveler-boots | Botas do Viajante | boots | comum | V1 | 1 | Evita1 golpe quando HP projetado≤35%; inicial, não vender. |
| 02 / traveler-sword-common | Espada do Caminho | weapon | comum | F2 | 1 | Golpe do Caminho recebe×1,28 uma vez; ataque após Defender×1,20. Venda35/loot comum aprovados. |
| 03 / traveler-armor-uncommon | Couraça do Viajante | armor | incomum | V1 D1 | 2 | Dano sob guarda×0,85 adicional, ceil/mínimo1. Venda65; loot incomum não homologado. |
| 04 / traveler-shield-rare | Escudo da Perseverança | shield | raro | V1 D2 | 3 | Registra uso da Guarda Perseverante; **sem redução adicional** sobre×0,25. Venda115/recibo aprovado. |
| 05 / traveler-helmet-rare | Elmo do Viajante | helmet | raro | D1 | 2 | Iniciativa+1 por rodada. Loot épico aprovado, sem preço de venda. |
| 06 / wisdom-amulet | Medalhão do Caminho | amulet | raro | S2 | 2 | Discernimento+0,15 antes do teto1,55; até2 usos/cooldown2. Aquisição produtiva própria ainda pendente. |

Nenhum nível mínimo novo é atribuído retroativamente a estes seis. Suas regras/origens não se expandem pela presença neste planejamento. A meta40 não cria um starter de equipamentos ou direito a aquisições futuras.

## Convenções das 34 fichas

**Todas SOMENTE PROPOSTA.** Cada linha é uma ficha completa em conjunto com estas regras compartilhadas. IDs propostos não são IDs homologados. Preservar os seis slots, um item equipado por slot; itens do mesmo slot são alternativas, nunca acumuláveis. Deck7, uso único por carta, animação6,5s e posse permanente continuam os contratos existentes.

- Nível é requisito proposto para equipar, validado futuramente no servidor; não aumenta atributos por si. Atributos listados são bônus ao snapshot congelado, sem reaplicar no motor. Não curam ao equipar; trocas durante combate permanecem indisponíveis. Aquisição abaixo do nível só poderá guardar o item se o contrato futuro permitir.
- Poder1–3 neste catálogo, independente da raridade. Cada1 poder acrescenta0,18 à parcela ofensiva antes da Defesa/multiplicadores, em qualquer slot. Cada F acrescenta2,2; cada D retira1,15 da parcela recebida; cada V acrescenta6HP; cada S acrescenta2 iniciativa e0,035 a Discernimento, teto1,55. Aplicam-se normalização/arredondamentos canônicos.
- **E0:** sem efeito especial. Atributos e poder continuam úteis. **EA:** reutilizar `traveler-armor`, ×0,85 somente sob guarda; **EH:** `traveler-helmet`, iniciativa+1; **EM:** `prudence-amulet`, +0,15 ao Discernimento oficial, teto1,55,2usos/cooldown2. Esses efeitos já existem, mas seus novos IDs ainda precisam de mapeamento homologado; não herdar por nome/raridade. Não multiplicar duas instâncias do mesmo efeito.
- **EP (único modificador novo proposto):** desconto de1Foco exclusivamente na carta Passo do Peregrino,3→2, piso1; sem desconto em outras cartas, sem acumular descontos, sem gerar Foco, sem repetir uso. Duração: enquanto item estiver equipado no snapshot daquela batalha. Não herda EM. A estrutura `specialModifiers.focusDiscount` já existe; falta derivação autoritativa deste ID, validação e apresentação. Permanece desativado até aprovação.
- Interação padrão de cada ficha: bônus aplicam-se às fórmulas de todas as cartas; nenhum reforço ativo da Espada do Caminho é herdado por arma nova. EA somente em guarda, EH somente iniciativa, EM somente Discernimento, EP somente Passo. Investida Dupla usa **uma resolução×1,55 e dois movimentos visuais**, conforme revisão040A; não duplica bônus/procs.
- Cura total proposta **min(floor(HPmáx×20%),24) por combate**, compartilhada. Equipamentos de Vida aumentam o HPmáx dentro dessa fórmula; não concedem cura automática, piso de cura ou orçamento separado. Permanecem os tetos individuais6/4/8/5/10/7/8 das sete cartas de cura propostas.
- Origens candidatas: **L** Loja; **B** baú com futura tabela aprovada; **J** Jornada; **G** missão validada de Guilda; **D** desafio autorizado. Nenhuma é habilitada aqui. Arena/Torre econômicas futuras ficam dependência, não origem ativa. Preços/probabilidades serão tratados no contexto05/05.
- Direção comum: objetos FICTIONAL de fantasia medieval heroica realista, verdes profundos/dourados, arte individual detalhada e legível, sem texto/números gravados, sem poderes espirituais. Recorte transparente quando adequado; moldura de raridade no componente, não duplicada na imagem. Não é necessário overlay vestido no avatar.

## Catálogo proposto — 34 novas fichas

Distribuição nova8comuns/9incomuns/7raros/7épicos/3lendários; com os seis existentes: **10/10/10/7/3=40**. A soma de bônus cresce moderadamente; efeitos, distribuição e disponibilidade criam escolhas, não garantia de melhor item para todo confronto.

| Nº / ID proposto | Nome / slot | Raridade | Nível | Bônus V/F/D/S | Poder | Efeito / interação específica | Origem candidata | Descrição curta / cena individual |
| --- | --- | --- | ---: | --- | ---: | --- | --- | --- |
| 07 / equipment-apprentice-sword | Espada do Aprendiz / weapon | comum | 1 | 0/1/0/0 | 1 | E0; dano pelas fórmulas | L,J | “Uma lâmina para começar.” Espada curta de aço simples sobre couro verde. |
| 08 / equipment-pilgrim-blade | Lâmina do Peregrino / weapon | incomum | 4 | 0/2/0/1 | 2 | E0; força e iniciativa, sem reforço da espada oficial | L,J | “Força com atenção ao caminho.” Lâmina estreita, empunhadura de couro e mapa ao fundo. |
| 09 / equipment-guardian-sword | Espada do Guardião / weapon | incomum | 6 | 0/2/1/0 | 2 | E0; troca Sabedoria da Lâmina por Defesa | L,G | “Ataque sem abandonar a defesa.” Espada larga apoiada junto a parapeito de pedra. |
| 10 / equipment-courage-blade | Lâmina da Coragem / weapon | raro | 10 | 1/3/0/0 | 2 | E0; +6HP, sem cura | B,D | “Avance com firmeza.” Lâmina bronzeada com guarda em arco, luz de amanhecer. |
| 11 / equipment-perseverance-sword | Espada da Perseverança / weapon | épico | 18 | 0/3/0/1 | 3 | E0; sem multiplicador exclusivo ou redução de custo | J,D | “Precisão após uma longa jornada.” Aço marcado pelo uso, detalhes verdes e dourados. |
| 12 / equipment-victory-blade | Lâmina da Vitória / weapon | lendário | 28 | 0/3/0/2 | 3 | E0; foco estratégico em dano/iniciativa; nenhum golpe garantido | D,J | “Uma conquista, não uma vitória garantida.” Lâmina refinada numa base de pedra, luz cinematográfica sem aura mágica. |
| 13 / equipment-reinforced-tunic | Túnica Reforçada / armor | comum | 1 | 1/0/0/0 | 1 | E0; HP sem EA | L,J | “Proteção leve para viajar.” Tecido musgo com costuras reforçadas em exposição. |
| 14 / equipment-traveler-vest | Colete do Viajante / armor | comum | 2 | 0/0/1/0 | 1 | E0; alternativa de Defesa à túnica | L,G | “Resista sem carregar peso.” Colete de couro castanho sobre madeira escura. |
| 15 / equipment-vigilance-cuirass | Couraça da Vigilância / armor | incomum | 5 | 1/0/0/2 | 2 | E0; iniciativa em troca da proteção EA oficial | L,G | “Atenção também protege.” Couro verde e placas discretas com fechos de bronze. |
| 16 / equipment-guardian-armor | Armadura do Guardião / armor | raro | 11 | 1/0/2/0 | 2 | EA; sem reduzir dano fora de guarda | B,D | “Uma defesa preparada.” Placas de aço com ombreiras contidas, sem brasões religiosos. |
| 17 / equipment-perseverance-armor | Armadura da Perseverança / armor | épico | 19 | 2/0/1/1 | 3 | EA; troca Defesa por HP/iniciativa frente à Guardião | J,D | “Resistência para continuar.” Metal escurecido, tecido verde e detalhes de ouro envelhecido. |
| 18 / equipment-fortress-armor | Armadura da Fortaleza / armor | lendário | 30 | 3/0/2/0 | 3 | EA; +18HP, sem cura/passivo novo | D,J | “Firmeza diante da pressão.” Armadura pesada em pedestal baixo, muralha desfocada. |
| 19 / equipment-wooden-shield | Escudo de Madeira / shield | comum | 1 | 0/0/1/0 | 1 | E0; não concede guarda automática | L,J | “Proteção simples e confiável.” Tábuas de carvalho e aro de ferro. |
| 20 / equipment-apprentice-shield | Escudo do Aprendiz / shield | comum | 2 | 1/0/0/0 | 1 | E0; alternativa de HP | L,G | “Mais fôlego para aprender.” Escudo redondo de couro verde, rebites discretos. |
| 21 / equipment-vigilance-shield | Escudo da Vigilância / shield | incomum | 4 | 0/0/1/1 | 2 | E0; Defesa e iniciativa | L,G | “Observe e proteja.” Escudo oval com faixas douradas finas. |
| 22 / equipment-pilgrim-shield | Escudo do Peregrino / shield | incomum | 6 | 1/0/1/0 | 2 | E0; HP e Defesa, sem efeito de Guarda oficial | L,J | “Companhia para o caminho.” Escudo de viagem gasto por poeira e chuva. |
| 23 / equipment-courage-shield | Escudo da Coragem / shield | raro | 12 | 0/1/2/0 | 2 | E0; força em troca da Vida/poder do escudo oficial | B,D | “Proteja e responda.” Escudo angular com bordas de bronze e marcas de combate. |
| 24 / equipment-fortress-shield | Escudo da Fortaleza / shield | épico | 20 | 2/0/3/0 | 3 | E0; não acrescenta redução percentual à Guarda Reforçada | D,G | “Uma linha difícil de romper.” Escudo alto verde-escuro com armação de aço. |
| 25 / equipment-leather-helmet | Elmo de Couro / helmet | comum | 1 | 0/0/1/0 | 1 | E0; sem EH | L,J | “Proteção para os primeiros passos.” Elmo leve de couro sobre banco de oficina. |
| 26 / equipment-journey-helmet | Elmo da Jornada / helmet | incomum | 5 | 1/0/0/1 | 2 | E0; HP/Sabedoria em vez do EH oficial | L,J | “Atenção ao horizonte.” Capacete aberto com aba e tira musgo. |
| 27 / equipment-vigilance-helmet | Elmo da Vigilância / helmet | raro | 10 | 0/0/1/2 | 2 | EH; iniciativa adicional1, sem Foco | B,G | “Perceba o momento certo.” Elmo aberto de aço com linhas de bronze. |
| 28 / equipment-guardian-helmet | Elmo do Guardião / helmet | raro | 13 | 1/1/1/0 | 2 | E0; alternativa física ao Elmo da Vigilância | B,D | “Pronto para o confronto.” Elmo robusto sem viseira fechada, luz lateral. |
| 29 / equipment-perseverance-helmet | Elmo da Perseverança / helmet | épico | 21 | 2/0/1/1 | 3 | EH; não duplica efeito do elmo anterior ao trocar | J,D | “Mantenha a cabeça erguida.” Aço envelhecido com faixa verde, detalhe dourado contido. |
| 30 / equipment-reinforced-sandals | Sandálias Reforçadas / boots | comum | 1 | 0/0/0/1 | 1 | E0; sem esquiva das botas oficiais | L,J | “Passos atentos.” Sandálias de couro grosso, tiras e fivelas de bronze. |
| 31 / equipment-explorer-boots | Botas do Explorador / boots | incomum | 4 | 1/0/0/1 | 2 | E0; HP/iniciativa, sem esquiva | L,J | “Explore com cuidado.” Botas altas com poeira e pequenas costuras verdes. |
| 32 / equipment-journey-boots | Botas da Jornada / boots | incomum | 7 | 1/0/1/0 | 2 | E0; proteção em vez de iniciativa | L,G | “Prepare-se para um caminho longo.” Botas de viagem com caneleiras discretas. |
| 33 / equipment-pilgrim-boots | Botas do Peregrino / boots | raro | 12 | 1/0/0/2 | 2 | E0; não confundir com ID de efeito `pilgrim-boots` das Botas do Viajante | B,D | “Encontre seu ritmo.” Botas leves verde-escuras com fechos de latão. |
| 34 / equipment-perseverance-boots | Botas da Perseverança / boots | épico | 22 | 2/1/1/0 | 3 | E0; maior resistência sem esquiva garantida | J,D | “Continue mesmo sob pressão.” Botas reforçadas sobre pedra molhada. |
| 35 / equipment-simple-pendant | Pingente Simples / amulet | comum | 1 | 0/0/0/1 | 1 | E0; sem EM | L,J | “Um lembrete do caminho.” Peça de bronze simples em cordão, sem símbolo religioso. |
| 36 / equipment-journey-medal | Medalha da Jornada / amulet | incomum | 6 | 1/0/0/1 | 2 | E0; HP/iniciativa | L,J | “Marcas de uma jornada.” Medalha com motivo abstrato de estrada e colinas. |
| 37 / equipment-prudence-amulet | Amuleto da Prudência / amulet | raro | 14 | 0/0/1/2 | 2 | EM; mesmo limite do Medalhão oficial, sem gerar Foco | B,G | “Observe antes de agir.” Bronze e pedra verde opaca, sem emissão de poder mágico. |
| 38 / equipment-vigilance-medallion | Medalhão da Vigilância / amulet | épico | 20 | 0/0/0/4 | 2 | E0; iniciativa/Sabedoria em vez de EM | J,D | “Atenção em cada decisão.” Medalhão facetado, desenho de horizonte em metal dourado. |
| 39 / equipment-guardian-medallion | Medalhão do Guardião / amulet | épico | 23 | 2/0/2/0 | 3 | E0; sobrevivência em vez de Sabedoria | D,G | “Firmeza sem ostentação.” Pingente largo com desenho de escudo e tecido verde. |
| 40 / equipment-perseverance-medallion | Medalhão da Perseverança / amulet | lendário | 30 | 1/0/0/3 | 2 | EP; Passo custa2, sem EM e sem desconto nas cartas novas | D,J | “Reserve forças para o próximo passo.” Medalhão de aço e ouro envelhecido com motivo de caminho sinuoso. |

## Comparativo matemático

Referência aritmética: atributos base1/1/1/1, adversário Defesa1, sem bônus de carta. **Não é avatar criado, batalha simulada ou previsão por nível.** Dano= max(1,round((3+2,2F+0,18×poder total−1,15D_alvo)×multiplicadores)). Guarda arredonda depois para cima; EA novamente ceil×0,85, mínimo1. Sabedoria não aumenta dano básico diretamente. Poder de combate/matchmaking é outra medida; não confundir com dano ou `power` do item.

| Equipamento/loadout de referência | Bônus V/F/D/S; poder | HP | Ataque básico contra D1 | Iniciativa fixa sem variação |
| --- | --- | ---: | ---: | ---: |
| Sem equipamento | 0/0/0/0;0 | 26 | 4 | 2 |
| Seis existentes equipados, apenas comparação de definições | 3/2/4/2;11 | 44 | 10 | 7, incluindo EH |
| Apenas Espada do Caminho | 0/2/0/0;1 | 26 | 9 | 2 |
| Apenas Espada do Guardião | 0/2/1/0;2 | 26 | 9 | 2 |
| Apenas Lâmina da Vitória | 0/3/0/2;3 | 26 | 11 | 6 |
| Loadout A: Vitória/Fortaleza armadura/Fortaleza escudo/Perseverança elmo/Perseverança botas/Perseverança medalhão | 10/4/7/6;17 | 86 | 16 | 15, incluindo EH |
| Loadout B: mesma composição, Medalhão do Guardião no lugar de Perseverança | 11/4/9/3;18 | 92 | 16 | 9, incluindo EH |

O loadout com seis existentes é apenas conta matemática: não presume posse, aquisição ou equipagem produtiva de todos. O requisito máximo dos loadouts A/B é nível30; seus atributos base continuam1 neste exemplo para isolar equipamento.

**Armas e cartas:** só a Espada do Caminho mantém reforço ativo×1,28 do Golpe do Caminho e passivo×1,20 após Defender. Apenas com essa espada: parcela8,63, Golpe sem reforço13; com reforço16; se também após Defender19. Apenas Vitória: parcela11,19, Golpe16, sem ativar esses reforços. Investida Dupla revisada:13 com espada oficial (16 após Defender),17 com Vitória. É uma resolução, nunca dois reforços. A lendária aumenta força/iniciativa estáveis, enquanto a arma comum mantém resposta condicional competitiva.

**Armadura e Fortaleza Perseverante:** um dano já calculado14 passa por guarda×0,25→4 e EA×0,85→4; não é×0,25 duas vezes. Para dano40:40→10→9. As cargas/prazo de Fortaleza exigem extensão040A; não existem por equipar uma armadura. Contra1, mínimo continua1. Escudo da Fortaleza acrescenta Defesa3/Vida2, mas não reduz o multiplicador da Guarda Reforçada; contra14, guarda×0,65 recebe10, com EA9. Defesa por atributo já foi subtraída antes desta etapa; não subtrair novamente.

**Acessórios e Discernimento:** com Sabedoria base1, Medalhão do Caminho dá S3 e multiplicador1,435 com EM disponível; Amuleto da Prudência também S3/1,435, acrescentando Defesa1. Vigilância dá S5:1,355 sem EM; melhor iniciativa, menor vantagem tática nesse cenário. Perseverança dá S4:1,32, com desconto no Passo, sem EM. Guardião mantém S1:1,215, em troca de HP/Defesa. Sabedoria11 sem EM já alcança teto1,55: bônus extra não eleva o teto. EM não afeta Estratégia do Mestre nem outras cartas propostas.

**Vida e cura:** no conjunto existente44HP, orçamento compartilhado8; loadout A86HP,17; B92HP,18. Um aumento de HP não recupera vida na batalha. Em A, Recompor=min(floor(86×0,10),6)=6; Coragem=min(floor(86×0,08),4)=4; Segundo Fôlego=min(floor(86×0,10),10)=8, mas após6+4 só restam7 do orçamento17. Os requisitos de HP, cura efetiva, custo e turno continuam. A partir de120HP o orçamento para em24; nenhuma ficha concede novo teto. Não há incompatibilidade que justifique alterar20%/24.

## Limites de combinações e decisões de balanceamento

- Por slot, no máximo uma peça. Limite superior independente dos bônus deste catálogo (somando o maior valor de cada atributo por slot, incluindo os seis existentes): **V12/F6/D10/S13; poder total≤18**. Os máximos de atributos exigem conjuntos diferentes; não tratá-los como um loadout possível. Com Vida base1, o máximo de Vida equipado resulta em98HP e orçamento de cura19; não equivale ao conjunto A/B. O aumento máximo de72HP é expressivo frente aos26 iniciais: requer progressão de nível/fonte e não deve ser disponibilizado todo no começo.
- Evitar escalada por raridade: nenhum item tem bônus de dano percentual novo; poder não excede3; nenhuma cura/evasão automática nova. Acessório lendário muda custo de uma carta existente, sem ativá-la de graça. Só armadura/elmo/acessório selecionados reutilizam EA/EH/EM. Duplicatas não somam atributos ou efeitos.
- Novos itens sem efeitos podem superar numericamente peças antigas em alguns cenários, por exemplo Amuleto da Prudência frente ao Medalhão do Caminho. É progressão proposta de nível14, não mudança retroativa do antigo. Não há exigência de que toda peça continue ótima no nível30; preços/aquisição deverão refletir progressão sem inventar valores agora.
- Defesa alta pode reduzir ataques de personagens iniciantes a1; iniciativa alta pode tornar bônus temporários menos decisivos. O clamp999 é proteção de entrada, não meta de balanceamento. Pareamento/poder deve considerar o snapshot equipado; não prometer confrontos equilibrados com diferenças arbitrárias de atributos.
- A raridade lendária não autoriza vitória automática: Vitória é dano/iniciativa sem proc; Fortaleza é HP/Defesa sob guarda; Perseverança é mobilidade com Foco2. Continuam sujeitos a posse, nível, turno e cartas7. Não reduzir Foco abaixo1 nem dar dois usos ao Passo.

## Dependências técnicas identificadas

| Área reutilizada | Dependência antes de qualquer implementação |
| --- | --- |
| Catálogo/inventário/recibos existentes | Registrar definições versionadas e aprovação das34 peças; fonte precisa de recibo legítimo reconhecido, não inserção local no inventário. Sem segunda carteira/inventário. |
| Equipar/desequipar existente | Ampliar de forma restrita a lista de IDs/slots autorizados e validar níveis no servidor; boots/amulet existem no domínio, mas a ponte consultada de Loja não os libera genericamente. Preservar itens antigos e comparação de item esperado. |
| Snapshot/atributos | Reutilizar soma e limites; mapear EA/EH/EM apenas aos IDs aprovados. Ausência de mapping hoje significa nenhum efeito especial, não homologação tácita. |
| EP/Passo | Derivar desconto do item e validá-lo no snapshot autoritativo; suporte de custo já existe no motor, não está ligado a este ID. Não aceitar specialModifiers fornecidos pelo cliente. |
| Cartas040A | Curas, guarda com cargas/prazo, iniciativa temporária e novos IDs ainda são propostas que exigem extensão; equipamento não implementa essas ações por associação. |
| Mochila/Equipamentos/Loja | Reaproveitar abas/grade/filtro/contagem e ações existentes; comparação exibe deltas V/F/D/S e poder, e efeito ganho/perdido. Sem componente paralelo ou obrigação de vestir a arte no avatar. |
| Arte/apresentação |34 imagens individuais futuras aprovadas e mapeadas; animação/revelação existentes. Manter arquivos/overlays atuais; ícone não concede posse. |

## Aquisição candidata — decisão no contexto05/05

| Raridade | Recomendação de fonte/frequência | Controle necessário |
| --- | --- | --- |
| Comum | Loja/Jornada/Guilda, primeira concessão por marco; recorrência não definida | Requisito por ficha; sem grant no login; preço pendente. |
| Incomum | Loja ou marco validado; baú só após tabela própria | Uma identidade por conta/evento; cotas recorrentes pendentes. |
| Raro | Baú/desafio/missão autorizada; eventual Loja por contrato | Requisitos, frequência, tabela/probabilidade e preço ainda não aprovados. |
| Épico | Marco específico/desafio/Guilda; sem venda automática | Autorização de evento antes da emissão, cotas a definir. |
| Lendário | Marco individual de Jornada ou desafio final autorizado | Proposta de primeira aquisição por ID/conta, sem emissão por replay; não é prêmio Arena/Torre já liberado. |

Duplicatas: quantidade nunca amplia número de slots nem acumula o mesmo item equipado. Até aprovar regra econômica, nenhuma venda/desmontagem/conversão em moedas/XP, fusão ou sorteio substituto. Para fonte gratuita de primeira aquisição, recomendar apenas ID ainda não possuído ou não conceder/consumir ingresso se catálogo elegível vazio; fonte paga/baú precisa de regra de duplicata explícita antes do débito. Recibo confirmado não pode ser refeito para mudar resultado.

Reutilizar idempotência e transação existentes: Auth/evento/fonte/operação/ID/versão fixos, posse e saldo validados no servidor. Revogação mantém recibo e motivo mínimo, preserva histórico; tratamento de item equipado e snapshot de batalha em andamento exige contrato futuro explícito, sem excluir recibos para contornar replay. Não atribuir poderes novos a líderes por esta proposta. Recompensas Arena/Torre continuam futuras e condicionadas; nada altera loot comum/épico atual.

## Revisão e aprovação pendente

Para aprovar:34fichas (níveis/bônus/poder), distribuição10/10/10/7/3, mapping EA/EH/EM e desconto EP restrito, progressão entre peças e direção artística individual. Aquisição/preço/probabilidades/duplicatas ficam para05/05. O pedido recebido reconhece040A para planejamento; esta referência não habilita cartas no runtime.

Revisão pelo autor, sem independência. Contagem local com Node existente confirmou34 IDs distintos, distribuição8/9/7/7/3 e slots6/6/6/5/5/6 novos; seis existentes completam40. Recalculados dano dos exemplos, máximos por slot, HP e cura. Conferência estrutural/diff sem código ou assets novos. Isso é revisão aritmética, não prova de equilíbrio em partidas. Sem compra, batalha, operação econômica, SQL, Preview ou deploy. Build/CI/testes de runtime não se aplicam a documentação isolada. Backup remoto da Arena preservado em `cdd4dcf06319e9cdadccdd818c78caaa7e96014b`; branches/cartas040A e alterações alheias não integradas. Próximo passo: aprovação das fichas pelo proprietário.
