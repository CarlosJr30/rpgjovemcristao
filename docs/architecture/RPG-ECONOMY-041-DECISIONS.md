# RPG-ECONOMY-041 — contratos aprovados

11/11/2026. **APROVADO PARA IMPLEMENTAÇÃO** pelo pedido anexado “RPG-ECONOMY-041 — IMPLEMENTAÇÃO E PUBLICAÇÃO”. Preços, probabilidades, valores de venda, recompensas, limites e recuperação foram expressamente aprovados. Base: `3cfa561ab4cd76d86e89e9757d31ad3e11d504e1`; tag de rollback anotada confirmada nesse SHA. A aprovação autoriza publicar automaticamente após os gates; não significa que a implementação já esteja ativa.

## Baús comprados — tabela aprovada `economy041-chest-v1`

Cada abertura sorteia no servidor um resultado da linha do baú. A categoria de item sorteia uniformemente entre as definições novas ativas da mesma raridade; duplicatas são permitidas. Tabelas comunitárias históricas comum/épico permanecem byte a byte e semanticamente inalteradas.

| Baú / preço aprovado | Moedas | Carta da raridade do baú | Equipamento da raridade do baú | Moedas no resultado de moedas (proposta) |
| -------------------- | -----: | -----------------------: | -----------------------------: | ---------------------------------------: |
| Comum / 40           |    70% |                15% comum |                      15% comum |                                       25 |
| Incomum / 80         |    60% |              20% incomum |                    20% incomum |                                       55 |
| Raro / 150           |    50% |                 25% raro |                       25% raro |                                      105 |
| Épico / 250          |    40% |                30% épico |                      30% épico |                                      190 |
| Extraordinário / 400 |    30% |             35% lendário |                   35% lendário |                                      360 |

Pools das 33 cartas novas: **3/10/9/7/4**; dos 34 equipamentos novos: 8/9/7/7/3 (comum/incomum/raro/épico/lendário). As sete comuns do starter somadas às três novas completam as dez comuns e o total de 40 cartas. O proprietário corrigiu expressamente o erro de contagem da proposta inicial. Requisitos de nível continuam limitando uso/equipar; não alteram a distribuição do sorteio. Os 7 cards oficiais, 6 equipamentos existentes, Botas iniciais e aquisições anteriores não são substituídos nem incluídos nesta pool.

## Duplicatas e resgate — aprovado

Valores por cópia excedente, iguais para carta/equipamento da mesma raridade: comum 10, incomum 20, raro 35, épico 70, lendário 120 moedas. Venda exige confirmação no servidor, quantidade possuída maior que 1, não vender cópia equipada, lock/compare-and-set, crédito e recibo idempotentes na mesma transação. A última cópia nunca pode ser vendida. Nenhuma compensação automática por duplicata; o jogador escolhe Guardar ou Vender repetido. Os valores não são preços de compra e não alteram registros antigos.

## Missões e História — aprovado

Guilda: normal 25/comum; grande 100/incomum; épico 220/raro; extraordinário 360/épico, sem habilitar XP legado. Verificação do contrato atual: as RPCs legadas `save/review_guild_mission_v2` estão fechadas; utilizar `guild_activity_command`, sua revisão, tentativa e histórico de validação existentes. Somente atividade nova explicitamente configurada com política 041, publicada após ativação e aprovada pelo líder atual independente da conta participante, é elegível. A seleção 041 não pode coexistir com uma categoria comunitária antiga. Filhos de um encontro compartilham a identidade econômica; um crédito por Auth/evento, vinculado ao avatar original. Nenhum retroativo.

História: recompensa única por mundo concluído, somente após conteúdo e vídeo/etapas server-side estarem publicados e elegíveis. Proposta progressiva de moedas + baú: Origens 30 + comum; Patriarcas 45 + comum; Libertação 60 + incomum; Terra Prometida 80 + incomum; Reinos 100 + raro; Exílio e Retorno 125 + raro; Jesus 150 + épico; Igreja 180 + épico; Nova Criação 220 + extraordinário. Não emitir retroativamente por progresso antigo; mundos sem conteúdo elegível permanecem sem claim. Não alterar XP neste incremento.

## Limites e falhas de pool — aprovado

- Compras: sem teto arbitrário por quantidade além do saldo/eligibilidade canônicos; débito, recibo e baú atômicos, nonce idempotente, rate limit operacional e nenhuma transferência entre avatares/contas.
- Missões/História: no máximo um recibo por Auth + identidade imutável de evento (missão ou marco); replays devolvem o mesmo resultado. Preservar quotas comunitárias existentes (7 comuns/Auth/semana, 4 épicos/Auth/mês, 2 eventos épicos/Auth-líder/mês); não convertê-las em quotas de compra.
- Se o catálogo/pool necessário estiver vazio ou inválido, não iniciar uma compra daquele baú. Para baú já pago, manter posse/recibo e falhar fechado na abertura, sem novo sorteio, downgrade, débito ou consumo; permitir retry da mesma operação quando o pool/versionamento estiver restaurado.
- Sorteio criptograficamente seguro e exclusivo do servidor; versionar tabela e persistir o resultado antes de apresentar a animação. Pular animação altera somente a apresentação.

## Versionamento e limites reais

Não promover as tabelas legadas não homologadas de incomum/raro/extraordinário. O loot comunitário comum (80% 25 moedas; 20% 10 + Espada) e épico (55% 190; 45% 70 + Elmo) permanece intacto e não é aplicado a compras novas 041. Recibos/fontes antigos continuam usando a versão histórica. Não recalcular ou sortear novamente resultados anteriores.

**Gates atuais:** implementação e checks direcionados; CI do candidato; pacote TEST/recuperação; Preview e fluxos autenticados obrigatórios; pacote PROD próprio e preservação. A leitura PROD encontrou os cinco capítulos de Origens com `content_ready/video_ready/reward_ready=false`, e nenhum capítulo dos mundos avançados. A configuração econômica não publica conteúdos ou vídeos: seus claims devem permanecer bloqueados até que as autoridades de conteúdo e prova real estejam disponíveis. Nenhum progresso legado vira prova de vídeo ou direito retroativo.
