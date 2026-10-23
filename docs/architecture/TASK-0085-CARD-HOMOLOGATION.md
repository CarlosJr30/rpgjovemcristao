# TASK-0085 — Contrato para homologação futura de cartas

Especificação, não catálogo aprovado. `APPROVED_ARENA_CARDS` continua vazio. Nenhuma carta, raridade, aquisição, probabilidade de baú ou conversão de equipamento é autorizada por este documento. A aprovação e a aquisição pertencem a tarefa própria coordenada com economia e atributos objetivos.

## Ficha obrigatória por carta

| Campo | Evidência necessária antes da aprovação |
| --- | --- |
| ID estável | Identificador único, não vazio, até100 caracteres; vínculo inequívoco com item_id do inventário existente; nunca reciclar ID com outro efeito |
| Nome | Nome aprovado, não vazio, até100 caracteres; revisão editorial/bíblica quando aplicável |
| Raridade | Valor aprovado do sistema econômico vigente; não deduzir do efeito, custo ou ilustração |
| Tipo | OFFENSIVE, DEFENSIVE ou TACTICAL, coerente com o efeito real |
| Efeito real | Ação implementada e testada; descrição vinculada ao cálculo e gatilho efetivos, sem promessas não executadas |
| Requisito de nível | Derivado do efeito e versão homologados; cumprir nível não concede posse |
| Custo de Foco | Custo base do efeito e modificadores existentes aplicáveis; custo exibido na batalha considera o snapshot de equipamentos |
| Fonte legítima de aquisição | Fluxo autorizado, origem/recibo verificável e vínculo conta→Traveler→inventory; não basta item local ou metadata autodeclarada |
| Versão de balanceamento | Revisão imutável de catálogo+regras e evidência de testes; pinada na futura sessão autoritativa |

Complementos: responsável/aprovação/data, descrição auditada, estado draft/approved/retired, licença/origem de eventual arte e referência à concessão econômica existente. Esses metadados ainda não são campos executáveis de ArenaCard; não introduzir overrides silenciosos de nível/custo. Hoje ID/nome/raridade/tipo/action são congelados; nível/custo vêm do motor e do snapshot. A persistência local não assegura pinagem de regras entre releases: mudança incompatível exige migração testada ou bloqueio preservando os dados.

## Capacidades existentes, sem representar cartas concedidas

| Efeito do motor | Nível mínimo atual | Custo base atual | Comportamento existente |
| --- | --- | --- | --- |
| attack | 1 | 0 | Ataque básico, gera1 Foco e usa atributos/equipamentos |
| defend | 1 | 0 | Defesa básica, gera1 Foco |
| special:path-strike | 2 | 2 | Golpe do Caminho, arma e multiplicadores existentes |
| special:steadfast-guard | 4 | 2 | Guarda Perseverante, redução do próximo golpe |
| special:discernment | 6 | 2 | Discernimento, próximo ataque e intenção provável |
| special:pilgrim-step | 8 | 3 | Passo do Peregrino, mobilidade para evitar um golpe |

Esta tabela lista efeitos, não seis cartas oficiais. Não há IDs de cartas novos aqui. Modificadores existentes reduzem custo em até1, mínimo1 nos especiais; potência do Golpe mantém limite atual. Foco0–3, básicos+1, sem cooldown de carta. A carta que referencia básico continua sendo de uso único; executar o básico pelo botão não consome carta.

## Gates de entrada no produto

1. Homologar ficha e versão, descrição real e aquisição autorizada; resolver autoridade de posse e de recompensa antes de habilitar prêmios.
2. Mapear para catálogo aprovado e inventory existente sem coleção paralela. Quantidade maior que1 não duplica o mesmo ID no baralho.
3. Validar sete IDs distintos, funcionais e possuídos para aquele Traveler. Congelar definições e snapshots no início.
4. No uso: validar identidade/rodada/combate aberto, pertinência ao deck, não usada, nível, Foco e modificadores. Somente aceite consome o ID.
5. Cobrir aquisição negada/duplicada/revogada, isolamento entre contas/Travelers, catálogo revisado, custos modificados, níveis, reload, concorrência e revanche.
6. Registrar aceite técnico/editorial/econômico e ambiente isolado autorizado; não promover fixtures, desbloqueios por nível ou equipamento visual a cartas.

Próxima tarefa deve decidir catálogo e fonte legítima com a economia existente, sem alterar a TASK-0078 por este documento. Descrições numéricas completas ficam para contexto06, sob pedido próprio.
