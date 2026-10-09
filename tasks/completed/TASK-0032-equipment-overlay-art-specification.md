# TASK-0032 → Especificação de arte de Equipment Overlays V1

ID: TASK-0032
TITLE: Preparar manifesto definitivo de produção de overlays corporais
OBJECTIVE: Especificar arquivos isolados de arte corporal para os oito IDs NEEDS_NEW_OVERLAY, compatíveis com o renderer da TASK-0031.
PRIORITY: P1 High
STATUS: DONE
SCOPE: `docs/architecture/EQUIPMENT-OVERLAY-ASSET-MANIFEST-V1.md`, referência mínima no documento de arquitetura existente, contrato e memória. Auditoria somente de leitura de assets, catálogo, anchors, camadas e medidas de exibição.
OUT_OF_SCOPE: Gerar arte, spritesheets/posters/grids, alterar runtime/gameplay, stats, inventário, Auth, Supabase, Guilda, economia, dependências ou serviços. Nenhum item será marcado READY nesta tarefa.
DEPENDENCIES: TASK-0031 concluída.
ASSIGNED_AGENT: Perfil architect para especificação documental; perfil biblical-content para classificação/coerência das instruções editoriais, exercidos localmente pelo autor sem revisão independente.
REQUIRED_CONTEXT: GLOBAL_CONTEXT, CURRENT_STATE, WORKFLOW, RULES, SECURITY; documento de overlays, equipamento visual/catálogo, bodyAnchors, dimensões das sprites runtime e tamanhos de composição no CSS.
SECURITY_CONSIDERATIONS: N/A para gates técnicos — somente documentação e leitura local, sem credenciais, dados pessoais, permissões, serviços ou configuração de ambiente. NO SECRETS obrigatório.
ACCEPTANCE_CRITERIA:

- Oito IDs pendentes mapeados para arquivos finais únicos, com nome, slot, raridade, compatibilidade, anchor, orientação, alpha, bounding box, proporção, resolução, zIndex, oclusão e destino por asset.
- Prioridade preservada: Couraça incomum, Couraça rara, espada comum, espada rara, elmo, botas, escudo, medalhão.
- Decisões male/female versus arte compartilhada justificadas por geometria/anatomia e posicionamento suportado pelo renderer.
- Resolução derivada das dimensões reais dos 54 avatares; envelopes de produção distinguidos de medidas verificadas e de calibração aprovada.
- Uma imagem transparente por asset, sem corpo/mãos embutidos ou reaproveitamento automático dos ícones.
- Limitações de oclusão da base indivisível e checklist futuro nas três viewports explícitos.
- Estilo e natureza fictícia/temática preservados, sem criar relíquias históricas, símbolos mágicos ou alegações espirituais.
- Documento pronto para orientar produção posterior; nenhum runtime, asset existente ou estado READY modificado.
  TEST_PLAN:
- Revisão documental pelo autor: oito IDs cobertos, nomes sem duplicação, count, compatibilidade, anchors/camadas e destinos consistentes com o renderer.
- Auditoria de dimensões via System.Drawing; conferir cálculos de crop, densidade 2×, proporção e registration.
- Inspeção do diff/documentação, links locais e preservação por hashes dos arquivos preexistentes fora das edições documentais autorizadas.
- Build/lint/typecheck/testes runtime N/A, pois não há mudança executável.
  DEFINITION_OF_DONE: Manifesto cobre todos os campos e prioridades, revisão estrutural/editorial registrada, checks documentais aprovados e memória atualizada.

## Entrega e validação — 2026-10-01

- Criado `docs/architecture/EQUIPMENT-OVERLAY-ASSET-MANIFEST-V1.md`; documento anterior recebeu somente referência à especificação de produção.
- Cobertura: oito IDs NEEDS_NEW_OVERLAY → 14 arquivos PNG únicos. Dez arquivos específicos de corpo: Couraças incomum/rara female/male (4), elmo female/male (2), botas por pé female/male (4). Quatro compartilhados: espadas comum/rara, escudo e medalhão.
- Auditoria real via System.Drawing: 54 sprites runtime, 27 por corpo, todas 512×768/32 bits com alpha. Dimensões de exibição conferidas no CSS; densidade padrão 2× do canvas lógico, com peças recortadas em vez de exportações cheias de vazio.
- Resoluções recomendadas de 88×144 a 96×480, conforme geometria da peça; referência de trabalho 1024×1536. Total dos crops: 1.362.576 pixels. As caixas são envelopes de produção, não medidas de arte já aprovada.
- Manifesto apresenta, para cada arquivo, ID/peça, nome, slot, raridade, corpo, anchor, bbox, proporção, resolução, registro/rotação, alpha, zIndex, oclusão e destino/URL. Briefs de família e regras comuns integram cada registro.
- Nomes/raridades de duas variantes raras legadas são rótulos de produção claramente identificados, sem inventar Equipment ou stats ausentes no catálogo.
- Priorização preservada e female primeiro onde houver anatomia própria. Capa/cachecol/cabelo/mãos já pintados na base têm limites explicitados; o manifesto não presume que zIndex possa intercalar planos de uma imagem indivisível.
- Revisor editorial local, pelo próprio autor: todas as peças FICTIONAL com inspiração temática, sem citação bíblica, narrativa ou alegação histórica/espiritual nova. Sem magia/neon/runas e sem tratar o Medalhão como relíquia. Aplicadas as regras de `docs/biblical/README.md`; não houve conteúdo CANONICAL a validar externamente.
- Nenhuma arte, pasta runtime ou TypeScript novo criado; nenhuma alteração de status READY, gameplay, banco, inventário, stats ou Auth. Documentação estruturada evita manifesto runtime duplicado.

## Gates e aceite

| Check                                         | Resultado / evidência                                                                                                                                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SELF VALIDATE documental                      | PASS — três tabelas de 14 registros (42 linhas A01–A14); oito IDs e 14 nomes/destinos únicos; densidade 2× e registration dentro de [0,1] conferidos.                                                                                        |
| Consistência geométrica                       | PASS — registro das caixas anatômicas reprojeta nos anchors existentes com erro menor que 0,001 pixel lógico; peças compartilhadas têm caixa por corpo, mesma fonte e orientação. Não equivale à aprovação visual de arte ainda inexistente. |
| Formatação / links                            | PASS — Prettier no novo manifesto/contrato e checagem estrutural; referências locais e destino por arquivo conferidos.                                                                                                                       |
| Preservação                                   | PASS — SHA256 de 86 arquivos preexistentes fora das edições documentais autorizadas comparado antes/depois, sem mudança. Documento base recebeu link por patch localizado; memória somente acrescida do estado desta entrega.                |
| QA                                            | Revisão estrutural pelo autor, não independente — documentação sem alteração executável. Aceite visual futuro permanece no checklist por asset.                                                                                              |
| Security                                      | N/A — sem mudança em credenciais, ambiente, permissões técnicas, auth, rede ou dependências. NO SECRETS: PASS na documentação.                                                                                                               |
| BUILD / LINT / TYPECHECK / UNIT / INTEGRATION | N/A — somente Markdown; runtime preservado e nenhuma dependência instalada. Não reutilizar checks da TASK-0031 como se fossem execução desta tarefa.                                                                                         |
| ACCEPTANCE / DOCUMENTATION                    | PASS — todos os campos, prioridades, compatibilidades, arquivos e checklist cobertos; memória atualizada.                                                                                                                                    |

DONE encerra a especificação. A produção/aprovação de 14 imagens é trabalho posterior; os oito IDs permanecem NEEDS_NEW_OVERLAY.
