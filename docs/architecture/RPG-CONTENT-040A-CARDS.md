# CONTENT-040A — proposta das 40 cartas

## Aprovação para implementação — 09/11/2026

O proprietário autorizou ativar em produção as 33 cartas descritas neste documento, incluindo IDs, raridades, níveis, custos e regras revisadas, com Investida Dupla resolvendo um único ataque e apresentando dois movimentos visuais. As sete cartas oficiais permanecem inalteradas. Esta aprovação **não** autoriza fontes de aquisição, preços, probabilidades, starter expandido, concessões ou recompensas; as 33 cartas novas ficam sem emissão até contrato econômico próprio.

08/11/2026. **Planejamento entregue para aprovação; 33 cartas novas somente propostas.** Base consultada: main `6c7b0c9fe08eb6cb991eba231acf344a764a10dd`, incluindo a Mochila da PR43. Branch documental `docs/content-040a`. Sem runtime, SQL, arte, aquisição, Preview ou publicação.

## Fontes e estado real

- [Catálogo](../../packages/game-engine/src/arena-card-catalog.ts), [deck](../../packages/game-engine/src/arena-deck.ts), [motor V2](../../packages/game-engine/src/arena-combat-v2.ts), [descrições](../../packages/game-engine/src/arena-descriptions.ts) e [fórmulas](../../packages/game-engine/src/index.ts).
- [Manifesto produtivo](../../packages/database/deployments/economy001a/production-catalog.json): aprovação `ECONOMY-001A:OWNER:2026-11-02`, versão `arena-cards-2026-11-02.1-economy-001a`; somente starter autorizado. O registro estático do motor ainda contém metadados de proposta: eles não anulam a homologação do manifesto nem autorizam fontes novas.
- [DeckEditor/BattleCards](../../apps/web/features/arena-deck/editor.tsx), [mapeamento de artes aprovado](../../apps/web/features/arena-deck/card-illustrations.ts) e [plano econômico anterior](ECONOMY-CONTENT-001-REPORT.md). A pendência histórica de artes nesse plano foi superada pela VISUAL-002; os sete WebPs/PNGs aprovados são preservados, apesar de `art.approved:false` no manifesto antigo.

## Sete oficiais — preservar integralmente

Todas comuns, uma utilização por combate, posse permanente. Custos abaixo são nominais; descontos existentes continuam sujeitos ao piso de 1 nos especiais. Ação básica Atacar/Defender continua disponível sem gastar uma carta; versões em carta consomem seu uso.

| ID canônico | Carta / categoria | Nível | Foco | Efeito real e duração |
| --- | --- | ---: | ---: | --- |
| arena-card-basic-attack | Ataque Simples / ataque | 1 | 0 | Ataque ×1; +1 Foco ao executar, teto3. Um ataque. |
| arena-card-basic-defense | Defesa / defesa | 1 | 0 | Próximo golpe não esquivado ×0,50; +1 Foco, teto3. Preparada antes da iniciativa; preserva guarda forte. |
| arena-card-path-strike | Golpe do Caminho / ataque | 2 | 2 | Ataque ×1,45, com reforços próprios da espada; não gera Foco. Um ataque. |
| arena-card-steadfast-guard | Guarda Perseverante / defesa | 4 | 2 | Próximo golpe não esquivado ×0,25; não soma com defesa básica. Sem prazo fixo em turnos. |
| arena-card-discernment | Discernimento / estratégia | 6 | 2 | Próximo ataque ×min(1,55;1,18+0,035×Sabedoria+reforço disponível do amuleto); intenção provável. Substitui vantagem anterior. |
| arena-card-pilgrim-step | Passo do Peregrino / estratégia | 8 | 3 | Evita um golpe, dano0; prioridade sobre botas. Não acumula esquivas; sem prazo fixo. |
| arena-card-measured-strike | Golpe Medido / ataque | 1 | 1 | Ataque ×1,15; sem geração de Foco nem reforço ativo exclusivo do Golpe do Caminho. Um ataque. |

Os sete IDs usam as respectivas ilustrações oficiais no mapeamento existente. Golpe Medido integra estas sete; não é uma oitava carta.

## Contrato numérico da proposta

**Distribuição:** comuns10 (7 existentes+3 novas), incomuns10, raras9, épicas7, lendárias4: total40. Categorias das novas: ataque9, defesa8, estratégia8, resistência/apoio8. Categorias editoriais não criam um novo enum no motor: apoio deverá mapear para TACTICAL numa extensão futura aprovada.

Fórmula existente: HP=round(20+6×Vida). Dano= max(1,round((3+2,2×Força+0,18×poder equipado−1,15×Defesa alvo)×multiplicadores)); guarda usa ceil em etapa posterior, armadura ×0,85 com novo ceil, mínimo1. Atributos/poder por item limitados a0–999. Sabedoria participa da iniciativa ×2; elmo soma1. Nível sozinho não aumenta atributos. Foco inicial0, máximo3; Atacar/Defender básicos geram1. Até30 rodadas.

**Convenções de TODAS as 33 fichas:**

- IDs abaixo são candidatos reservados apenas neste documento; prefixo `arena-card-`. Estado individual: **somente proposta**, sem homologação e sem posse concedida.
- Sete IDs distintos próprios por deck; uma utilização de cada por combate; carta permanece na coleção. Sem recarga de carta ou segunda vida. Nenhuma carta executa uma ação básica extra fora do turno.
- A carta ocupa a ação da rodada. Defesas são preparadas antes da iniciativa; ataques/apoio obedecem à iniciativa. Custos só se aplicam a comando válido; consumo e derrota antes de agir devem seguir o contrato oficial atual. Comandos inválidos não consomem.
- Foco nominal0 nas novas não recebe desconto; demais custos têm piso1 e desconto limitado1 **somente se um futuro equipamento tiver modificador explicitamente homologado para o novo ID**. Não herdar descontos/efeitos exclusivos de outra carta por categoria.
- `A×m`: um ataque com a fórmula existente e multiplicador m; não gera Foco, salvo indicação. Sem ignorar Defesa, sem dano puro, sem acerto adicional implícito. Ataques de duas parcelas arredondam separadamente e precisam de contrato próprio.
- `G×m`: próximo golpe não esquivado causa ceil(dano×m), mínimo1. Guardas não multiplicam entre si: vale a menor m; não enfraquecer uma guarda anterior. Armadura existente continua ×0,85. Guarda persiste até golpe ou fim da batalha, salvo duração menor explícita.
- `T×m`: próximo ataque executado recebe vantagem; substitui vantagem anterior, máximo1,55; não acumula vantagens táticas. Não somar duração ou acumular evasões.
- Cura `C(p,c)` = min(HP faltante, floor(HPmáx×p), c, orçamento de cura restante). **Proposta:** cura total por combatente limitada a min(floor(HPmáx×0,20),24) por combate, compartilhada entre todas as novas fontes. Sem cura fora da batalha, ressurreição ou alteração de HPmáx. Piso0, jamais mínimo1; cura zero impede comando sem gastar carta/Foco.
- Percentual de HP para condição usa estado autoritativo antes da ação; comparar inteiros, sem arredondar a porcentagem. Buffs expiram no fim da batalha. HPmáx/atributos vêm do snapshot congelado, incluindo equipamento autorizado, sem reaplicar bônus.
- Equipamentos: todas usam atributos/poder congelados existentes; guardas interagem apenas com a armadura já publicada. Só Discernimento oficial ativa reforço do amuleto e só Golpe do Caminho o reforço ativo da espada. Novos ataques mantêm bônus passivo ×1,20 da espada após Defender; cura não ativa efeitos de arma. Botas/elmo mantêm suas regras. Nenhum novo efeito aumenta atributos canônicos.

Essas convenções integram cada ficha, inclusive restrição, duração e interação com equipamentos. Os textos entre aspas na tabela são o resumo da interface; a regra completa ficará no detalhe opcional. Valores são sugestões de balanceamento para decisão, não preços ou regras oficiais.

## 33 fichas individuais

Dependências: **V** novo ID/ação e parâmetros validados; **G** guarda parametrizada; **T** vantagem/expiração/condição; **I** iniciativa temporária; **H** cura e orçamento comum; **F** geração de Foco dedicada; **M** dois impactos; **R** resistência com prazo. Todas precisam de V: o resolvedor atual aceita só sete ações e escolhe constantes próprias. Copiar uma action antiga não aplica estes números.

| Nº / ID proposto | Nome / categoria | Raridade | Nível | Foco | Efeito, duração e restrição específica / resumo de interface | Dependência | Cena individual sugerida |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| 08 / arena-card-traveler-charge | Investida do Viajante / ataque | comum | 1 | 0 | A×1,05; iniciativa+2 nesta rodada apenas; sem Foco gerado. “Avance antes do golpe.” | V,I | Viajante avançando por ponte de pedra, espada baixa. |
| 09 / arena-card-precise-cut | Corte Preciso / ataque | incomum | 3 | 1 | A×1,20 se alvo tiver guarda; ×1,05 caso contrário; guarda ainda reduz normalmente. “Encontre uma abertura na guarda.” | V,T | Corte técnico junto à borda de escudo. |
| 10 / arena-card-brave-advance | Avanço Corajoso / ataque | incomum | 4 | 2 | A×1,35 e G×0,80 para um golpe até fim da próxima rodada. “Ataque e proteja seu avanço.” | V,G | Avanço com escudo erguido sob chuva. |
| 11 / arena-card-perseverance-blow | Golpe da Perseverança / ataque | raro | 8 | 2 | A×1,50 se HP próprio≤35%; ×1,20 caso contrário. Um ataque. “Responda sob pressão.” | V,T | Guerreiro ferido firme diante do adversário. |
| 12 / arena-card-double-charge | Investida Dupla / ataque | raro | 10 | 3 | A×1,55 em uma única resolução de ataque, apresentada em dois movimentos visuais. Guarda/esquiva/botas e bônus processados uma única vez; sem Foco gerado. “Uma investida em dois movimentos.” | V; apresentação dupla futura, sem M | Dois arcos sequenciais da mesma espada, sem clone. |
| 13 / arena-card-guard-break | Ruptura de Guarda / ataque | raro | 11 | 2 | A×1,60 contra guarda; ×1,10 sem guarda. Redução da guarda continua; não remove proteção antecipadamente. “Pressione a defesa.” | V,T | Escudo pressionado por golpe pesado, sem quebrar item. |
| 14 / arena-card-decisive-blow | Golpe Decisivo / ataque | épico | 16 | 3 | A×1,65 se alvo≤35% HP; ×1,25 caso contrário. Sem execução automática. “Aproveite o momento.” | V,T | Um golpe concentrado no centro da arena. |
| 15 / arena-card-guardian-cut | Corte do Guardião / ataque | épico | 18 | 3 | A×1,40 e G×0,60 até fim da próxima rodada ou um golpe. “Ataque sem abandonar a guarda.” | V,G | Espada e escudo formando uma única linha defensiva. |
| 16 / arena-card-last-resistance | Última Resistência / ataque | lendário | 25 | 3 | Só HP≤25%: A×1,70; sem cura/invulnerabilidade. Um ataque, pode perder por iniciativa. “Um último contra-ataque.” | V,T | Viajante exausto se levantando entre poeira e luz. |
| 17 / arena-card-firm-block | Bloqueio Firme / defesa | comum | 1 | 0 | G×0,70 e +2 Foco até teto3; ocupa ação, não causa dano. “Proteja-se e prepare Foco.” | V,G,F | Escudo de madeira recebendo golpe oblíquo. |
| 18 / arena-card-prudent-posture | Postura Prudente / defesa | incomum | 3 | 1 | G×0,40 e T×1,08, cada efeito para um golpe/ataque; sem prazo fixo além da batalha. “Defenda e observe.” | V,G,T | Defesa baixa com olhar atento ao adversário. |
| 19 / arena-card-traveler-wall | Muralha do Viajante / defesa | incomum | 5 | 1 | G×0,35 para um golpe; sem Foco extra. “Resista ao próximo impacto.” | V,G | Escudo apoiado entre pedras de muralha. |
| 20 / arena-card-reinforced-guard | Guarda Reforçada / defesa | incomum | 9 | 2 | G×0,65 por até2 golpes não esquivados, até fim da próxima rodada; sem Foco gerado. Não soma cargas com outra guarda; requer ausência de guarda prévia. “Resista a uma sequência de golpes.” | V,G,R | Escudo reforçado por postura física firme. |
| 21 / arena-card-strategic-defense | Defesa Estratégica / defesa | raro | 11 | 2 | G×0,40 e iniciativa+2 na próxima rodada apenas. Guarda para um golpe. “Prepare sua resposta.” | V,G,I | Guerreiro recuando para terreno elevado. |
| 22 / arena-card-safe-shelter | Abrigo Seguro / defesa | épico | 15 | 3 | G×0,35 por até2 golpes não esquivados, expira fim da próxima rodada; não soma cargas com outra guarda, aplicação substitui só se melhora proteção. “Proteção breve contra pressão.” | V,G,R | Viajante protegido atrás de grande escudo sob arco de pedra. |
| 23 / arena-card-courage-bastion | Bastião da Coragem / defesa | épico | 18 | 3 | Só HP≤50%: G×0,20 para um golpe; não cura. “Segure um golpe decisivo.” | V,G | Escudo dourado diante de impacto e poeira. |
| 24 / arena-card-persevering-fortress | Fortaleza Perseverante / defesa | lendário | 26 | 3 | G×0,25 por até2 golpes não esquivados; expira fim da próxima rodada; sem Foco gerado. Política de substituição de Abrigo Seguro. “Sustente a linha por um instante.” | V,G,R | Guerreiro firme no portão de uma fortaleza. |
| 25 / arena-card-breathe-observe | Respirar e Observar / estratégia | comum | 1 | 0 | +1 Foco, teto3, e iniciativa+3 somente na próxima rodada; sem guarda/dano e sem revelar escolha secreta. Bônus não acumula com outro bônus temporário de iniciativa: vale o maior, sem renovar a duração anterior. “Prepare-se para agir primeiro.” | V,I,F | Viajante respirando com arena desfocada ao fundo. |
| 26 / arena-card-side-step | Passo Lateral / estratégia | incomum | 4 | 1 | Iniciativa+3 nesta rodada e G×0,70 para um golpe até fim da rodada; sem esquiva garantida. “Mude o ângulo do confronto.” | V,I,G | Deslocamento lateral com capa em movimento. |
| 27 / arena-card-opponent-reading | Leitura do Adversário / estratégia | incomum | 6 | 1 | T×1,12 para próximo ataque; mostra apenas intenção provável existente após resolver rodada. “Leia o ritmo do combate.” | V,T | Olhar atento à posição dos pés e da arma. |
| 28 / arena-card-careful-preparation | Preparação Cuidadosa / estratégia | incomum | 7 | 1 | T×1,18 para próximo ataque e iniciativa+1 na próxima rodada. “Prepare um golpe calculado.” | V,T,I | Viajante ajustando empunhadura, luz verde e dourada. |
| 29 / arena-card-reposition | Reposicionamento / estratégia | raro | 10 | 2 | G×0,55 para um golpe e iniciativa+4 na próxima rodada. Não movimenta personagem no mapa. “Conquiste uma posição melhor.” | V,G,I | Passo para uma plataforma de pedra lateral. |
| 30 / arena-card-tactical-planning | Planejamento Tático / estratégia | raro | 12 | 2 | T×1,30 para próximo ataque; +1 Foco após custo, teto3; sem bônus do amuleto. “Prepare a próxima ofensiva.” | V,T,F | Guerreiro observando marcas do confronto no chão. |
| 31 / arena-card-constant-watch | Vigilância Constante / estratégia | épico | 17 | 2 | Iniciativa+4 nas próximas2 rodadas; revela intenção provável após cada resolução nesse prazo; sem reagir à escolha secreta futura. “Mantenha a leitura do adversário.” | V,I,T | Sentinela atenta com adversário em silhueta. |
| 32 / arena-card-master-strategy | Estratégia do Mestre / estratégia | lendário | 28 | 3 | T×1,45 para próximo ataque e G×0,60 para um golpe até fim da próxima rodada; não multiplica outra vantagem. “Una preparo e proteção.” | V,T,G | Veterano sereno na arena, linhas de composição sugerindo estratégia. |
| 33 / arena-card-regather-strength | Recompor Forças / apoio | incomum | 3 | 1 | C(0,10;6), imediata na própria ação; requer HP faltante e orçamento. “Recupere um pouco de vida.” | V,H | Viajante descansando um joelho no chão, sem magia religiosa. |
| 34 / arena-card-renewed-courage | Coragem Renovada / apoio | incomum | 5 | 1 | C(0,08;4) e +1 Foco após custo; cura efetiva obrigatória. “Reúna coragem para continuar.” | V,H,F | Guerreiro retomando postura sob luz de amanhecer. |
| 35 / arena-card-prudent-recovery | Recuperação Prudente / apoio | raro | 9 | 2 | C(0,08;8) e G×0,75 para um golpe até fim da próxima rodada. “Recupere-se com cautela.” | V,H,G | Viajante cuidando de faixa no braço atrás de escudo. |
| 36 / arena-card-persevering-spirit | Ânimo Perseverante / apoio | raro | 12 | 2 | C(0,08;5) e T×1,12 para próximo ataque; cura efetiva obrigatória. “Retome o ritmo.” | V,H,T | Personagem levantando-se com determinação, sem aura de poder espiritual. |
| 37 / arena-card-second-wind | Segundo Fôlego / apoio | épico | 16 | 2 | Só HP≤50%: C(0,10;10), imediata; sem Foco extra. “Ganhe fôlego sob pressão.” | V,H | Viajante exausto respirando junto à muralha da arena. |
| 38 / arena-card-heroic-endurance | Resistência Heroica / apoio | épico | 20 | 3 | Sem cura: dano recebido ×0,70 por2 rodadas, incluindo atual; redução não multiplica guarda, aplica apenas a melhor proteção; armadura somente se houver guarda real. “Resista à pressão por duas rodadas.” | V,R | Guerreiro atravessando tempestade de poeira protegido pela capa. |
| 39 / arena-card-unwavering-resolve | Determinação Inabalável / apoio | raro | 14 | 2 | Só HP≤35%: C(0,10;7) e iniciativa+2 na próxima rodada. “Erga-se para responder.” | V,H,I | Guerreiro recompondo a postura ao lado da própria espada. |
| 40 / arena-card-firm-until-end | Firme Até o Fim / apoio | lendário | 30 | 3 | Só HP≤25%: C(0,08;8) e G×0,35 para um golpe até fim da próxima rodada. Sem impedir morte antes da ação. “Permaneça firme sob pressão.” | V,H,G | Viajante ferido segurando escudo, horizonte iluminado ao fundo. |

## Comparativo matemático e limites

Referências sem equipamento: perfil A atributos1/1/1/1 tem26HP e parcela líquida4,05; perfil B atributos10/10/10/10 tem80HP e parcela líquida13,50. São cenários de cálculo, não avatares ou testes de batalha. Nível de acesso e atributos são independentes.

| Ação / cenário | Dano A | Dano B | Custo / oportunidade |
| --- | ---: | ---: | --- |
| Ataque básico ×1 | 4 | 14 | 0; gera1 Foco |
| Golpe Medido ×1,15 | 5 | 16 | 1; sem geração |
| Golpe do Caminho ×1,45 | 6 | 20 | 2; reforço ativo da espada só nele |
| Investida ×1,05 | 4 | 14 | 0; troca geração por iniciativa temporária |
| Golpe Decisivo ×1,65 condicional | 7 | 22 | 3; requer alvo em≤35%HP |
| Última Resistência ×1,70 | 7 | 23 | 3; próprio HP≤25%; pode morrer antes |
| Investida Dupla ×1,55 | 6 | 21 | 3; uma resolução, dois movimentos apenas visuais |

Guarda básica contra14 causa7 (armadura:6); oficial forte causa4 (armadura:4). Nova G×0,35 causa5 (armadura:5). G×0,20 causa3 (armadura:3), limitada a uma carta,3Foco e condição. Em dano4, guarda0,25 e0,20 ambas causam1: raridade não garante ganho em todo cenário. Nenhuma redução produz imunidade.

Discernimento sem amuleto em Sabedoria1=1,215; Sabedoria10=1,53; teto1,55 alcançado a partir de11. O amuleto disponível acrescenta0,15, sujeito ao mesmo teto. Proposta T×1,45 lendária é inferior ao Discernimento em sabedoria alta, mas combina proteção; não muda o original. Reaplicar T menor não deve apagar benefício sem confirmação futura da política de substituição; recomendação: rejeitar comando que só piora efeito e não tem outro ganho.

Curas revisadas em26HP: Recompor2, Coragem2, Recuperação2, Ânimo2, Segundo2, Determinação2, Firme2; teto comum5. Em80HP:6/4/6/5/8/7/6, teto16. Mesmo escolhendo sete curas, soma efetiva não ultrapassa esse teto. Todos os custos e turnos permanecem; nenhuma cura é passiva. No máximo de Vida999 (6014HP), teto absoluto24 impede escalada percentual excessiva. Não se aplica piso de cura: com apenas1HP faltante ou1 de orçamento restante, recuperar1 continua correto. Os exemplos são por HPmáx, não por nível.

Foco gratuito: Bloqueio Firme gera2 uma vez e protege menos que Defender; Respirar gera1 uma vez, sem proteção, trocando a defesa por iniciativa+3 na próxima rodada. Não garante agir primeiro: diferenças de Sabedoria, elmo e variação continuam. Investida não gera; Coragem devolve1 após pagar1 e exige cura efetiva, sem ganho líquido de Foco. Não há ciclo infinito nem geração além3. Equipamento futuro não pode reduzir custo abaixo1, repetir uso ou conceder nova carta nesta proposta.

Potência ofensiva máxima proposta com T×1,55, modificador futuro homologado≤1,25 e bônus passivo da espada1,20:1,70×1,55×1,25×1,20=3,9525 antes de guarda/arredondamento. Oficial Golpe do Caminho pode chegar a1,45×1,55×1,25×1,20×1,28=4,3152 se todos os reforços próprios estiverem disponíveis. Comparação de teto algébrico, não prova de equilíbrio: novas cartas não herdam o reforço ativo1,28. Há risco de abate com atributos desiguais mesmo abaixo desses tetos; nenhuma promete vitória automática.

## Dependências e riscos para decisão

1. **Extensão tipada única:** ArenaSpecialId, whitelist de ações, catálogo/descrições, comando/validação, snapshot e apresentação devem reconhecer novos IDs; não criar segundo motor. As cinco raridades já são suportadas no catálogo; a raridade não fornece multiplicador automático.
2. **Estado novo:** cura não existe no V2; precisa de HP autoritativo, orçamento por combate, rollback e logs. Iniciativa temporária/guardas com cargas/expiração também não existem como estas fichas exigem. Investida Dupla foi revisada para uma resolução com dois movimentos visuais; não requer dois impactos reais nem mudança nas regras oficiais de guarda/esquiva. Ainda exige nova ação validada e apresentação, não um alias informal.
3. **Substituição:** não acumular G/T/cargas; comandos que só desperdiçam um efeito exigem regra de disponibilidade. Abrigo/Fortaleza preservam guarda mais forte já preparada e não acrescentam cargas; para substituir, o pacote novo deve melhorar proteção sem estender indevidamente a anterior. Revisar formalmente essa comparação antes de implementar.
4. **Utilidade após revisão:** Muralha protege um pico e Guarda Reforçada uma sequência, Respirar prepara iniciativa e as quatro curas pequenas passam a2HP no exemplo26HP. Não é garantia de utilidade em todos os confrontos: cura sofre teto/orçamento; iniciativa pode ser insuficiente; dano1 continua1. Corte Preciso e Ruptura mantêm papel próximo, fora desta revisão solicitada.
5. **Defesa prolongada:** limitar a2rodadas, nunca somar reduções; só7cartas e30rodadas restringem a duração, mas não provam diversão. Futuro aceite dirigido deve examinar deck com Abrigo+Fortaleza+Resistência, sem repetir homologação dos módulos antigos.
6. **Quarenta equipamentos futuros:** seus atributos, descontos e procs ainda não existem/aprovados. Nenhum balanceamento definitivo pode presumir seu poder. Congelar limites do snapshot, ausência de empilhamento, descontos por ID e cura total; reavaliar somente interações novas quando o catálogo de equipamentos existir.
7. **IA/Torre:** conservar IA e sete andares; não dar novas cartas aos adversários automaticamente. Interface reaproveita Meu Baralho, BattleCards, modal/animação6,5s, Pular, USADA e mobile/desktop aprovados. Coleção40 não altera tamanho7.

## Aquisição proposta — nenhuma fonte nova autorizada

| Raridade | Fonte candidata | Requisito / frequência proposta |
| --- | --- | --- |
| Comum nova | Jornada ou missão de Guilda validada | Nível da ficha; primeiro marco elegível, uma identidade de evento por conta; sem grant por login. |
| Incomum | Jornada, desafio autorizado ou missão validada | Nível da ficha; um primeiro crédito por marco específico, sem repetição do mesmo marco. |
| Rara | Desafio autorizado ou marco de Jornada | Nível da ficha; primeira conclusão validada; limite global entre avatares a definir antes de habilitar. |
| Épica | Marco especial autorizado / Guilda | Nível da ficha; evento previamente aprovado; frequência numérica pendente. |
| Lendária | Marco final específico, com aprovação editorial/econômica | Nível da ficha; uma aquisição por ID/conta como proposta; sem compra ou sorteio automático. |

Baús podem ser fonte futura por contrato próprio; não alterar tabelas comum/épico já aprovadas. Loja depende de preço/fonte/autoridade por carta; nenhum preço ou probabilidade é proposto como oficial aqui. Frequência acima descreve elegibilidade/idempotência, não nova quota produtiva. Quantidades por semana/mês para fontes recorrentes permanecem decisão pendente.

Reutilizar inventário/ledger e leitura autenticada atuais. Posse permanente por conta com vínculo de avatar conforme contrato existente; não transferir o starter entre avatares. Coleção atual exige quantidade1 e recibo `card-starter`; futura expansão deve reconhecer recibos de fonte/versionamento próprios na mesma autoridade, sem inventário paralelo. Desenhar essa compatibilidade antes de qualquer grant.

Duplicatas propostas: não aumentar quantidade jogável, não criar cópias no deck, moedas ou XP; no primeiro desenho, selecionar apenas IDs ainda não possuídos em uma concessão determinística aprovada. Se não houver elegíveis, nenhuma emissão/consumo de ingresso. Para sorteio pago/baú, regra de duplicata e compensação precisa ser aprovada **antes da cobrança**; não alterar resultado já confirmado. Replays retornam o mesmo recibo, não sorteiam novamente.

Recibos: chave por Auth/evento/fonte/ID, versão de catálogo e balanceamento, idempotência e transação existentes; revogação com motivo mínimo e referência auditável, sem apagar o recibo nem atingir outras cartas. Regras de reaquisição e tratamento de batalha em curso após revogação precisam de contrato explícito; não inventar poder de concessão/revogação para líderes.

## Arte e próximos aceites

Todas as33 cenas são **FICTIONAL**, fantasia medieval heroica realista, verdes profundos/dourado, mesma direção das sete aprovadas. Nenhuma cena representa episódio bíblico ou atribui poder espiritual. Uma imagem individual por carta; moldura de raridade no componente existente, texto curto sobreposto pela UI, sem números gravados na arte. Não gerar imagens nesta etapa.

Para aprovar: fichas revisadas abaixo, incluindo a opção de Investida Dupla com dois movimentos visuais e uma resolução. O teto compartilhado de cura20%/24 fica preservado até revisão explícita do proprietário. Fontes/frequências/duplicatas e eventual economia continuam pendentes em contrato separado. A aprovação deste planejamento não homologa implementação nem aquisição.

Revisão pelo autor: fontes e matemática inspecionadas, sem revisão independente ou simulação de partidas alegada. Testes de runtime/economia, CI, build e navegador não se aplicam a este incremento exclusivamente documental. Sem novos assets ou alterações funcionais; Mochila/Arena/Torre/Loja e dados preservados. Próximo passo é a revisão das fichas pelo proprietário.

## Revisão final — fichas e comparativo antes/depois

08/11/2026. **Revisão proposta para aprovação final.** IDs, raridades, níveis, custos e cenas permanecem os das fichas acima; somente os efeitos explicitados nesta seção foram revistos. Total40 e distribuição10/10/9/7/4 preservados. Sete oficiais sem alterações. As convenções de uso único, deck7, equipamentos e direção artística continuam aplicáveis a cada ficha.

| Ficha | Antes | Depois proposto / decisão |
| --- | --- | --- |
| Muralha do Viajante — incomum, nível5, Foco1 | G×0,35 para1 golpe | Mantida: proteção concentrada contra um pico, até um golpe não esquivado/fim da batalha. |
| Guarda Reforçada — incomum, nível9, Foco2 | G×0,30 para1 golpe e devolução1Foco | G×0,65 para até2 golpes, expira no fim da próxima rodada; sem devolução de Foco. Exige ausência de guarda prévia; não soma cargas ou reduz a guarda oficial. |
| Respirar e Observar — comum, nível1, Foco0 | +1Foco e G×0,85 nesta rodada | +1Foco e iniciativa+3 só na próxima rodada; sem guarda. Benefício temporário não acumula nem renova outro bônus. |
| Recompor Forças — incomum, nível3, Foco1 | C(6%;6):1/4HP nos perfis26/80HP | C(10%;6):2/6HP; mesmos teto individual6 e teto compartilhado. |
| Coragem Renovada — incomum, nível5, Foco1 | C(4%;4):1/3HP; devolve1Foco | C(8%;4):2/4HP; mantém devolução1Foco, exige cura efetiva. Uma ação, ganho líquido de Foco0. |
| Ânimo Perseverante — raro, nível12, Foco2 | C(5%;5):1/4HP; T×1,12 | C(8%;5):2/5HP; mesma vantagem para próximo ataque, sem acumular. |
| Determinação Inabalável — raro, nível14, Foco2 | C(7%;7):1/5HP; iniciativa+2; HP≤35% | C(10%;7):2/7HP; condição e iniciativa inalteradas. |
| Investida Dupla — raro, nível10, Foco3 | Dois impactos×0,60, com guarda/esquiva por impacto | Uma resolução×1,55 com dois movimentos visuais; um custo, um uso, um dano confirmado e uma aplicação de cada efeito. Recomendação para eliminar complexidade de dois impactos reais. |

**Defesas em números:** contra dois golpes de14, Muralha recebe5+14=19; Guarda Reforçada recebe10+10=20, cobrindo ambos. Contra apenas um golpe, Muralha recebe5 e Reforçada10. Contra dois golpes de4:2+4=6 e3+3=6. Sem armadura nos exemplos. Reforçada compra continuidade por maior custo, não mais proteção total garantida; continua arriscada se o adversário não atacar. A guarda básica ainda custa0, protege×0,50 e gera Foco; a forte oficial×0,25 permanece superior em um impacto. O limite temporal evita estoque de proteção.

**Curas pequenas:** mudar o arredondamento para ceil ou impor mínimo2 foi rejeitado, pois beneficiaria proporcionalmente todo o catálogo e poderia exceder parcelas pretendidas. Só quatro percentuais candidatos aumentaram; limites individuais6/4/5/7 e teto comum min(floor(HPmáx×0,20),24) não mudaram. Em26HP, duas curas de2 deixam apenas1 no orçamento5; uma terceira pode recuperar1, nunca2. Em80HP, Recompor6+Coragem4+Ânimo5 deixam1 do orçamento16. Nível baixo não implica HP baixo; equipamentos não geram cura adicional fora desses limites. Nenhuma cura concede moedas/XP ou é reaplicável por turno.

**Investida Dupla — viabilidade:** dois impactos reais criariam vantagem indevida contra Passo do Peregrino (primeiro esquivado, segundo acerta), consumiriam guarda no primeiro e deixariam o segundo livre, e poderiam usar duas vezes a mesma chave determinística da esquiva Ágil. Também multiplicariam mínimos/arredondamentos e exigiriam política inédita de bônus por impacto. A opção revisada mantém guarda/esquiva sobre o ataque inteiro, inclusive dano0 quando esquivado; botas, amuleto/espada, vantagem e USADA são processados uma vez. Contra parcela13,50: dano21, guarda básica11, guarda forte6; com armadura,10 e6. Sem vantagem de atravessar proteção. Os dois movimentos dividem apenas a apresentação dos6,5s existentes, sem novo comando/dano/consumo entre eles; Pular continua apenas visual. Dano confirmado não depende da conclusão da animação. É uma proposta explícita de identidade visual, não dois golpes mecânicos. Se o proprietário exigir impactos independentes, essa alternativa permanece pendente de contrato próprio M, sem liberação implícita.

### Lendárias — avaliação das quatro fichas, sem aumento de potência

| Ficha mantida | Estratégia especial | Limite e resposta disponível ao adversário |
| --- | --- | --- |
| Última Resistência — nível25, Foco3, A×1,70 só HP≤25% | Reservar Foco e uma das sete vagas para uma resposta ofensiva em situação crítica. | Não é golpe de execução; iniciativa inferior pode impedir agir. Guarda e esquiva reduzem/negam dano; não cura. |
| Fortaleza Perseverante — nível26, Foco3, G×0,25 para até2 golpes até fim da próxima rodada | Cobrir pressão contínua durante uma janela curta, em vez de um único pico. | Sem ataque, cura ou geração; adversário pode defender/observar e deixar a janela expirar. Não soma cargas; não pode substituir guarda forte prévia para prolongá-la. |
| Estratégia do Mestre — nível28, Foco3, T×1,45 e G×0,60 | Preparar ofensiva e proteção na mesma ação, em vez de ocupar duas ações/cartas. | Não causa dano na própria ação; gasta todo o Foco nominal, exige reconstruí-lo para outro especial. Guarda expira ao fim da próxima rodada; vantagem não soma com Discernimento nem garante superá-lo. |
| Firme Até o Fim — nível30, Foco3, HP≤25%, C(8%;8) e G×0,35 | Sobreviver a uma situação crítica sem abandonar totalmente a defesa. | Cura efetiva obrigatória; orçamento comum esgotado bloqueia uso. Apoio segue iniciativa: pode cair antes de agir; guarda só se prepara ao executar, não retroage. Sem ressurreição/invulnerabilidade. |

As quatro têm papéis distintos e escolhas condicionais, mas não mecânicas exclusivas adicionais. Isso é intencional nesta revisão: raridade não exige um novo subsistema. Nenhuma é obrigatória em todo deck; seu valor depende do confronto, atributos e Foco. Para Fortaleza/Abrigo, a comparação de guardas fica explicitada: ativar somente sem guarda prévia, impedindo renovar/substituir uma guarda oficial; proteção conjunta e renovação ficam indisponíveis. Essa restrição integra as fichas22/24 e substitui a comparação ambígua de pacotes da versão anterior.

### Extensões do motor claramente necessárias

| Fichas revisadas/avaliadas | Extensão futura necessária |
| --- | --- |
| Todas as33 novas, inclusive Muralha/Última Resistência | V: ID e ação validados com números próprios; não é permitido reaproveitar um ID oficial ou aceitar números do navegador. |
| Guarda Reforçada, Abrigo e Fortaleza | G/R: guarda parametrizada, até2 cargas, expiração e disponibilidade sem guarda prévia. |
| Respirar e Determinação | I: iniciativa temporária com prazo e regra de não acumulação; F na geração específica de Respirar. |
| Quatro curas revisadas e Firme | H: cura/condição/orçamento autoritativos; F/T/I/G conforme cada efeito complementar. Nenhuma cura existe hoje no V2. |
| Estratégia do Mestre | T/G: pacote de vantagem/proteção, prazo e execução pela iniciativa. |
| Investida Dupla revisada | V e apresentação de dois movimentos sobre um resultado; não requer M nem altera guarda/esquiva oficiais. |

Revisão aritmética e estrutural somente, sem partidas ou testes extensos. Aprovação final pendente destas fichas e da decisão explícita de manter Investida Dupla como dois movimentos visuais. Nenhuma alteração de aquisição, preço, probabilidades, código, banco ou assets.
