# FIX-PROD-002 — homologação e operação pendentes

Este documento prepara decisões e verificações; **não homologa cartas, concede itens ou modifica permissões**. Base examinada: produção `5edc93f`, protocolo econômico 3. Carlos confirmou que FIX-PROD-001 era apenas um plano não executado; não há dependência dessa entrega.

## Cartas: BLOCKED para uso oficial

O catálogo privado de produção possui zero entradas ativas. As sete definições de `packages/game-engine/src/arena-card-catalog.ts` continuam propostas, versão `arena-cards-2026-10-20.2`, regras `arena-v2-measured-strike-003a.1`:

| ID | Nome | Ação |
| --- | --- | --- |
| arena-card-basic-attack | Ataque Simples | attack |
| arena-card-basic-defense | Defesa | defend |
| arena-card-path-strike | Golpe do Caminho | special:path-strike |
| arena-card-steadfast-guard | Guarda Perseverante | special:steadfast-guard |
| arena-card-discernment | Discernimento | special:discernment |
| arena-card-pilgrim-step | Passo do Peregrino | special:pilgrim-step |
| arena-card-measured-strike | Golpe Medido | special:measured-strike |

Antes de publicar qualquer entrada: preencher a ficha de [TASK-0085-CARD-HOMOLOGATION.md](TASK-0085-CARD-HOMOLOGATION.md), com responsável, referência e data de aprovação técnica/editorial/econômica, parâmetros derivados do motor, nível/Foco e origem autorizada. A versão posterior à 0085 inclui Golpe Medido; consultar também `docs/game-design/CONSOLIDATION-003-CARDS-AND-SEVENTH-EFFECT.md` e o catálogo atual. Não deduzir aprovação de uma proposta ou de testes sintéticos.

Uma aprovação deve definir separadamente a aquisição. O contrato v3 existente oferece starter uma vez por conta, com recibo, sete IDs distintos e sete ações distintas, proveniência no inventário e revogação auditável. **Não chamar starter nem semear catálogo/inventário para destravar testes de produção.** Catálogo, obtenção autorizada e posse são gates diferentes. A existência de equipamentos no inventário não prova posse de cartas.

Depois de homologar, executar os positivos reais: obtenção autorizada, replay da obtenção sem duplicação, sete seleções distintas, carta usada uma vez, nível/Foco, ataque/defesa/habilidades, vitória/derrota, reload e duas sessões/contas, isolamento e recibos únicos. Os testes TypeScript/PostgreSQL usam somente catálogo sintético no clone offline e não satisfazem esse gate hospedado.

## Torre: BLOCKED para homologação oficial completa

O código já define sete andares em `apps/web/features/arena-tower/config.ts`, versão `permanent-v1`; o sétimo é Campeão da Torre. A seleção vem da mesma coleção oficial da Arena; a autoridade determina a próxima etapa pelas vitórias liquidadas e não pelo save local. Não reimplementar esses comportamentos sem defeito reproduzido.

Validar positivos reais somente com posse/catalogação autorizadas: ordem 1–7, derrota sem avanço, retomada após perda da resposta/conexão, comando repetido, campeão final, reload e encerramento. A recompensa da Torre continua explicitamente `tower-economy-unapproved`; sua tabela e fonte precisam de aprovação econômica independente. Vitória técnica não autoriza XP, moedas ou cartas. Preservar esse bloqueio.

## Aparência dos equipamentos: BLOCKED para o avatar alvo

Teste Chat A nível50 usa corpo feminino, pele escura, cabelo longo e roupa azul. As quatro camadas Body-Fit já aprovadas atendem somente espada/couraça nos corpos masculino/feminino de cabelo curto, roupa musgo e pele média. O resolver exige correspondência exata do corpo aprovado; não encaixar essas camadas no corpo divergente ou ativar overlays arquivados para aparentar sucesso.

O pedido atual permite avaliar a aparência deste escopo, sem retomar automaticamente todos os ajustes Body-Fit cancelados em 18/10. Próximo passo visual: capturar o corpo efetivo em sessão, preparar/revisar cada camada necessária para esse corpo e obter aprovação visual correspondente. Não há novas artes, licenças ou ativações nesta correção. A seleção e os atributos dos equipamentos podem ser confirmados independentemente da disponibilidade da camada corporal.

## Liderança do Teste Chat A: BLOCKED por sessão não verificável

A consulta de produção identifica a mesma conta como dona dos dois avatares homônimos: o ativo nível50 é membro; o antigo nível1 é líder da mesma guilda. O criador da guilda também é essa conta. UID autenticado por navegador ainda não foi comprovado: o usuário informou sessão aberta no Chrome, mas ambas as ferramentas locais de controle falham com `failed to write kernel assets`. Não ler tokens de perfis nem aceitar nome/nível como autenticação.

`is_guild_leader(guild_id)` verifica a conta proprietária de um membro líder, enquanto os comandos Guilda/EBD recebem um Traveler ator e verificam a associação específica. Isso explica por que possuir um avatar líder não transforma automaticamente o avatar ativo em líder. Não conceder privilégios globais, `service_role` ou papel por metadata editável.

Processo administrativo preparado, ainda sem execução:

1. Confirmar o UID por `auth.getUser()` em uma sessão acessível e conferir o Traveler ativo nível50 pelo ID, não pelo nome; registrar evidência sem token.
2. Confirmar o destino solicitado: acesso de líder ao avatar ativo da mesma conta/guilda, sem ampliar a outras guildas. Definir o tratamento da liderança antiga conforme constraints e processo administrativo; não presumir autorização para remover responsabilidades do avatar antigo.
3. Obter backup atual/restauração verificada e snapshot das duas associações e de `guilds.leader_traveler_id`, incluindo timestamps. Conferir constraints e políticas atuais antes de preparar SQL administrativo parametrizado.
4. Em transação administrativa, bloquear as linhas em ordem estável; verificar dono, guilda, estados e líder esperado; atualizar a referência da guilda e as duas associações de forma coerente. Qualquer divergência deve abortar a operação.
5. Registrar operador, pedido FIX-PROD-002, antes/depois, data e justificativa em trilha administrativa aprovada. O trigger atual `guild_activity_capture` não registra mudança apenas de role: não presumir auditoria automática existente.
6. Revalidar via JWT real as funções de Guilda e EBD do novo ator e as negativas do antigo/membro de outra conta. Não criar missões/aulas reais só para testar; usar ambiente e dados de teste autorizados.

Nenhuma associação, nível, XP, inventário ou permissão real foi alterada por este documento.

## Equipamentos — aplicação e recuperação da candidata

`packages/database/proposals/fix-prod-002-equipment.sql` é uma proposta incremental, não uma migration hospedada. Antes de aplicar: comparar journal e assinaturas remotas, confirmar protocolo3, validar os gates de publicação, gerar migration oficial pela CLI, congelar hash, ter backup/restauração atualizados e ensaiar em clone do estado atual. Não reaplicar a DEPLOY-005.

A operação nova muda somente `equipped_items`, com owner derivado de Auth, locks conta→Traveler→inventário, catálogo/slot fixos, posse positiva, CAS por item esperado e bloqueio durante combate. Não verifica nem promove a legitimidade econômica do inventário legado: `economic_verified_at` permanece intacto, e o combate oficial legado continua negado. Ela não aceita XP, preço, bônus, role ou quantidade do cliente.

Recuperação compatível: pausar o uso da funcionalidade; retornar o aplicativo à versão anterior e revogar EXECUTE da nova API/helper em transação, após conferir referências e ausência de operações ativas. Não resetar tabelas nem alterar quantidades, XP ou carteiras; a seleção válida permanece preservada. Remoção posterior das duas funções exige revisão de dependências. Não confundir rollback da aplicação com rollback de dados. Nenhum comando de recuperação é executado automaticamente por este documento.

Produção só pode ser promovida após Preview READY, CI do SHA exato, testes reais obrigatórios e confirmação da compatibilidade. Gates pendentes impedem a migration de produção e a promoção do código candidato.
