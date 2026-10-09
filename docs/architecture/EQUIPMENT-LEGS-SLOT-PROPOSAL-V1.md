# Pernas / Calças — proposta V1, TASK-0059

**PROPOSTA NÃO ATIVADA.** Nenhum slot, item, bônus, schema, save, catálogo ou fórmula foi alterado. Viabilidade condicionada a arte de substituição corporal e contrato runtime futuro.

## Estado real e função

Existem seis slots reais: helmet, armor, weapon, shield, boots, amulet. Proposta futura de sétimo slot `legs`, rótulo Pernas / Calças, cobrindo quadril/coxa/joelho até o encontro com a bota, sem cobrir pés. Função visual: substituir a calça incorporada; armadura continua a proteger/apresentar torso, botas apresentam calçado. Função mecânica proposta: proteção das pernas, reutilizando atributos existentes quando um item e seu balanceamento forem aprovados. Não introduzir atributo, regra, bônus, preço ou número nesta proposta; evitar que o mesmo conjunto conte duas vezes como Corpo e Pernas.

HD aprovado é uma imagem pré-composta: inclui túnica, cinto, bolsa, calças, faixas, botas, mãos, cabelo e capa. Não existe atualmente um layer limpo de pernas ou base despida. Nas referências musgo/medium: feminino, calças aproximadamente y770–1125 e botas/faixas a partir de1090; masculino exige landmarks próprios. Túnica/cinto/bolsa ocultam parte das coxas; não é uma região retangular livre. Os54HD variam pele/roupa/cabelo; não extrapolar a máscara da referência piloto.

## Estratégia de composição

Arquitetura mantida: canvas físico1024×1536, lógico512×768, PNG RGBA full-canvas e bake offline uniforme, render sem corretivo. Uma nova calça pintada por cima da original não basta se deixar bordas antigas. Método futuro recomendado: mapa de oclusão/substituição específico da pose, derivado não destrutivo DEV, com contorno anterior e novo contorno aprovados. Se surgir área que antes pertencia ao calçado/calça e agora precisa ser capa/fundo, ela exige arte de fundo legítima; apagar alpha não reconstrói conteúdo oculto.

Planejamento de profundidade (não implementado): background/back/capa → base corporal → legs → armor/saia da túnica → boots/caneleiras → medalhão → mãos → arma/bainha → escudo → capacete → detalhes/efeitos. Hoje constants reais são body1/armor2/boots3/medallion4/hands5/weapon6/shield7/helmet8; inserir legs exige contrato separado para ordem, não renumerar constantes silenciosamente. A túnica pré-composta precisa permanecer na frente da calça por máscara localizada, sem copiar pixels HD para equipamento ou removê-los permanentemente do original.

| Encontro | Risco | Gate futuro |
|---|---|---|
| Calças × botas | Cuff duplicado, vazio no tornozelo, pé coberto | Máscara anatômica e overlap documentados; ambos os pés na mesma baseline, sem cropping da sola |
| Calças × armadura | Saia metálica e túnica atravessadas | Painéis front/back ou exclusão local de equipamento; nenhuma deformação da anatomia |
| Calças × bolsa/cinto | Correia desconectada ou bolsa escondida | Manter acessórios em primeiro plano e cintura contínua |
| Calças × capa | Fundo desconhecido atrás da calça | Base/layer de substituição legítimo antes de remover contorno; não inventar preenchimento |
| Feminino × masculino | Poses e pernas diferentes | Fontes, landmarks, transforms, máscaras, evidências e aceite por gênero/identidade |

## Inventário, atributos e persistência

Pontos de extensão futuros: `traveler.ts` (union EquipmentSlot e whitelist interna EQUIPMENT_SLOTS, validação isEquipment/parseTraveler), equipped e avatar.equippedItems, catálogo/loja se houver item aprovado, ícones/manifests/anchors/layers, slots/filtros/comparação do Portal, equip/unequip/atributos/cinematic e acessibilidade. Investigar mapas Record<EquipmentSlot> em `equipmentAssets.ts`, `equipmentBible.ts` e componentes: uma union nova quebra exaustividade. Não atribuir inspiração bíblica nova sem revisão de conteúdo; nenhuma referência existente descreve um item Calças deste jogo.

Persistência atual `rpg-jovem-cristao:journey:v1`: loader aceita envelopes1/2 e writer usa version2/travelers. Parser exige slot conhecido e item correspondente no inventário; inserir `legs` em um save aberto por cliente antigo pode tornar o viajante inválido. Plano futuro: fixtures de envelopes1/2 e equipamentos existentes, backup não destrutivo, novo leitor que aceite versões antigas e inicialize legs ausente/sem item; versão de envelope posterior explicitamente definida pelo contrato, com estratégia de compatibilidade para clientes antigos. Não presumir que adicionar campo optional resolve a rejeição de slot desconhecido. Preservar todos os IDs, inventário, equipados, moedas, XP, progressão e atributos; nenhuma migração agora, nenhum item/bônus concedido por migração. Testar idempotência, saves corrompidos, duplo mapa equipped/equippedItems e reload.

Economia e atributos: atualmente life/strength/defense/wisdom com bônus no equipamento e agregação existente. Um sétimo slot aumenta combinações e potencial de bônus; exige balanceamento futuro aprovado, sem alterar fórmulas vigentes nesta task. Definir aquisição/preço/raridade/IDs oficiais separadamente; não popular raridades vazias. A galeria apresenta proposta Calças como proposta, sem imagem ou card de item fictício.

## Plano de implementação futura

1. Aprovar design de peça, função mecânica sem duplicar Corpo e tratamento da calça/túnica pré-composta.
2. Contratar um piloto feminino e um masculino com fonte legítima, camada/máscara registrada; primeiro provar continuidade quadril/joelho/tornozelo.
3. Validar substituição real, contornos e pares Calças+Botas/Calças+Armadura, independentemente de PNG válido. Não afirmar teste visual dessas combinações nesta TASK: não há fonte de calças separada disponível.
4. Contrato runtime posterior delimita slot union/whitelists/catálogos/Portal/cinematic/persistência e revisão de segurança/QA; só então editar domínio e saves.
5. Testes de regressão, compatibilidade envelopes1/2, equip/reload/unequip/atributos sem acumulação, fallback, teclado/reduced motion e seis viewports. Aprovação humana por source/Avatar/hash antesREADY.

**Conclusão de viabilidade:** viável como evolução com trabalho de arte/composição e persistência; não viável como simples novo overlay sobre o HD existente. Bloqueios de arte e contrato runtime devem ser resolvidos antes da implementação. Proposta concluída nesta tarefa, slot ativo0, itens/bônus inventados0.
