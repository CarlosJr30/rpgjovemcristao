# RPG-EQUIPMENT-FIX-014 — posse e autorização de equipamentos

## Checkpoint atual — fixture TEST autorizada, 10/11/2026

Exceção de financiamento da fixture TEST aprovada expressamente; não dispensa login/smoke real nem se aplica a PROD. Preparado input único35, privado e auditado no orçamento existente, exclusivo do Herói/conta fixados, sem habilitar a rota alternativa de compras QA. A compra e Equipar usam RPCs oficiais; a prova será de mecânica com financiamento TEST, não de obtenção econômica produtiva. Instalação não credita recursos.

**6 cenários PG novos PASS:** instalação sem emissão/ACL/recuperação vazia exata, identidade/escopo/snapshot, rollback após falha no crédito, único35/replay/isolamento/rotaQA negada, compra oficial+equipar/desequipar/reequipar com invariantes, contenção com auditoria preservada. Lint/Prettier/diffcheck PASS; evidências anteriores reutilizadas. Falhas iniciais de sintaxe na fixture JS e quoting do renderer foram corrigidas apenas na preparação; não são PASS. CLI2.122.0 fixada usada para gerar os nomes dos arquivos, sem alterar dependências/lockfile da aplicação.

**TEST:** migration `20261110201227_rpg_equipment_fix_014_read_test` aplicada uma vez, conteúdo de leitura já aprovado no CI60867836. Sete conjuntos canônicos estritamente idênticos ao baseline; helper/ACL inalterados, reader INVOKER/authenticated, anon/service_role negados. Financiamento novo ainda não instalado nem emitido: aguarda novo CI da adaptação. Baú suspenso preservado. Pacotes produtivos de leitura/reconhecimento preparados, sem financiamento TEST no pacote PROD; nenhuma migration/ativação PROD.

Próximos gates: CI do novo commit → instalar suporte TEST de financiamento → Preview do novo SHA → login normal da conta habitual no Herói acessível → emissão privada35/compra e smoke autorizados → publicação normal. PR51 preservada; não pedir novamente recursos/compra ou aprovação individual. Registros abaixo são históricos.

10/11/2026. **BLOCKED para homologação/publicação; implementação e CI aprovados.** [PR51 draft](https://github.com/CarlosJr30/rpgjovemcristao/pull/51), candidato `60867836dcb61ae3c8e32439ad02996ad4120416`, base `97e4abb`. Worktree013/alterações anteriores e backup Arena `cdd4dcf` preservados.

**Causa:** inventário era apresentado como autorização, e o cliente ocultava a recusa de proveniência. Elmo/Medalhão têm 3/5 drops administrativos antigos sem vínculo de conta/identidade; Couraça/Escudo constam da alocação administrativa documentada. Botas e Espada já têm fontes aceitas. O gate publicado não reconhecia a origem administrativa desses quatro tipos.

**Preparado:** leitura autenticada pelo mesmo predicado de Equipar; grade/prévia distinguem posse e origem, desabilitam a confirmação pendente e informam recusas conhecidas. Treino/desequipar preservados; helper, whitelist40 e regras intactos. Reconhecimento aprovado: **Couraça1/Escudo1/Elmo4/Medalhão6**, somente ativo/conta exatos. Comando privado reutiliza snapshot FIX010, revalida inventário/oito referências sob locks e emite quatro reconhecimentos atuais imutáveis, de valor zero, no ledger existente. Instalação não emite registros. Contenção preserva auditoria e retira só essa origem. [Aprovação/mecanismo](RPG-EQUIPMENT-FIX-014-ADMIN-PROPOSAL.md) · [evidências](RPG-EQUIPMENT-FIX-014-EVIDENCE.json).

**Validação:** 23unit novos/30afetados PASS; 9 cenários SQL de leitura +12 de reconhecimento nos dois envelopes sintéticos (21 distintos). Incluem isolamento, equipar/desequipar/re-equipar, concorrência/replay, rollback integral, imutabilidade e contenção. Lint/tipos/Prettier/build e gates de artefato PASS; nenhuma suíte geral local repetida. [CI42883693818](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/42883693818) success/SHA exato: **1197unit PASS/74SKIP**, qualidade/build/PG/RSC/móvel obrigatórios PASS; Preview condicional SKIP. CI anterior e03dc574 também aprovado, sem converter fixtures em smoke real.

**Limite atual:** smoke autenticado hospedado **BLOCKED por login Supabase TEST elegível indisponível**. Playwright/Chromium locais existentes foram recuperados e abertos sem instalação; Preview `dpl_7PTS8oggquzLMDvyMRFdm4PVcvGG` READY no candidato, com configuração de branch TEST confirmada. `/auth` abriu no navegador com HTTP200, formulário vazio e zero erros de página. SSO preservado, acesso temporário oficial restrito ao deployment; nenhum cookie/sessão foi extraído. Migration TEST ainda não aplicada; sua instalação e posterior smoke continuam pendentes. Nenhuma migration PROD, reconhecimento ou operação em jogador. Os quatro tipos permanecem sem reconhecimento em PROD. Não DONE/DEPLOY_COMPLETE.

Falhas locais preservadas: dependência apontava a workspace antigo, JSDOM sem `showModal` e rótulo de nível alterado. Corrigidos links/preparação/rótulo; repetidas somente partes afetadas. Configuração temporária restaurada, dependências reutilizadas sem instalação. QA/React/Security pelo autor, sem independência. Checkpoint documental local final sem novo CI artificial.

## Finalização solicitada — 10/11/2026

Retomada sem alterar implementação: branch local/remota no mesmo `60867836`; CI42883693818 reconfirmado `completed/success`, sem reexecução. Backup remoto `cdd4dcf` intacto. Não há ferramenta de navegador conectada, endpoint local CDP disponível, credenciais de login TEST nas variáveis configuradas ou configuração de login automatizado no workflow consultado; `.env.example` não contém credenciais. Não foram procuradas senhas em perfis pessoais, extraídas sessões ou usados acessos administrativos como login de jogador.

**Separação da interface avaliada:** o estado antecipado de autorização depende da nova RPC `get_equipment_access`, ainda ausente em PROD. Publicar a tela isoladamente faria a consulta falhar e bloquearia a confirmação de itens legítimos. Apenas o tradutor de erros pode ser separado sem essa RPC, mas não resolve o reconhecimento nem a distinção antecipada; ele ainda precisaria dos gates aplicáveis. Não foi criada outra PR ou publicada uma correção incompleta.

**Única alternativa para o gate:** um operador que já controle uma conta TEST elegível realizar o login normal e o smoke único na Preview, depois de instalar o pacote TEST aprovado e confirmar READY. Não exige que o proprietário obtenha acesso a outra conta; não autoriza copiar sessão, criar posse ou usar PROD como teste. Sem esse operador/credencial de automação legitimamente disponibilizada por ele em armazenamento seguro, o gate permanece BLOCKED. Não solicitado novo login ao proprietário.

Situação dos **12 exemplares em quatro reconhecimentos**: aprovados, preparados e não emitidos. Migrations FIX014 TEST/PROD: nenhuma aplicada. Equipar/Desequipar real: não comprovado. PR51 preservada draft; nenhuma publicação ou escrita PROD nesta retomada.

Conferência adicional de ambiente solicitada: a orientação `cloud-desktop` foi consultada; este executor é Windows local e não oferece `cua_repl.js`, `cloud_environment.environment_status` ou `open_in_codex`. Não é possível iniciar/controlar um navegador ChatGPT Work/Cloud por esta sessão. O smoke exige primeiro pacote TEST instalado e Preview READY, mas essas etapas não criam acesso legítimo a um avatar elegível. Permanecem pendentes, sem nova instalação, teste, CI, reconhecimento ou escrita remota. Condição específica de desbloqueio: disponibilização de sessão de navegador controlável com login normal de uma conta TEST existente que já possua equipamento autorizado; não solicitado ao proprietário acesso a outra conta.

## Navegador local recuperado — 10/11/2026

A ausência de CDP previamente conectado não provava incapacidade de abrir navegador. Reutilizados Playwright1.63/Chromium1243 já instalados, em janela visível e contexto novo, sem importar perfil/sessão. Preview criada uma única vez para SHA60867836: `dpl_7PTS8oggquzLMDvyMRFdm4PVcvGG`, READY, [auth](https://rpgjovemcristao-bxmy4u2fw-carlos-junior-s-projects.vercel.app/auth). URL pública de backend da branch confirmada TEST; proteção `all_except_custom_domains` mantida. Link oficial temporário de uma hora usado somente para acesso Vercel, sem registrar bearer/cookies; não equivale a login Supabase. Captura privada `build/equipment014-resume/test-auth.png` inspecionada: formulário de e-mail/senha vazio, HTTP200 e zero pageerrors.

Pré-instalação TEST somente leitura: 54migrations, FIX014 ausente, escopo/protocolo3, wrapper7d3105f4/helper3a43a955 e ACLs correspondem às guardas aprovadas. Recuperação já ensaiada reutilizada, sem repetir PG/CI. Sem login legitimamente disponibilizado de avatar TEST elegível, não foi aplicado DDL nem executado Equipar. O impedimento agora comprovado é **login Supabase elegível**, não navegador, rota ou SSO. Nenhum pedido repetido de conta ao proprietário; PROD intacta. Registros anteriores de indisponibilidade do navegador são históricos e ficam corrigidos por esta observação. A busca literal das duas URLs nos scripts da página de login não encontrou nenhuma; não prova backend runtime. A confirmação TEST desta rodada é da variável pública vinculada à branch, não de uma operação autenticada.

## Aquisição nos três avatares acessíveis — 10/11/2026

Consulta exclusivamente TEST/SELECT: os três pertencem à mesma conta confirmada pelos fingerprints, têm marcador econômico e carteira canônica zero válida, sem hold da Loja. Herói TEST Equipamentos está ativo; Carlos Teste e QA Arena Torre estão inativos. Nenhum possui equipamento no inventário; as sete linhas do QA Arena Torre são cartas e não foram confundidas com equipamento. A conta não tem perfil/orçamento `shop_qa_private` nem perfil de treino `economy_qa_private`. Herói tem dois recibos anteriores (starter e grant comunitário), portanto saldo zero não foi tratado como ausência de histórico.

| Avatar acessível | Moedas canônicas | Equipamentos | Fonte QA da conta |
| --- | ---: | ---: | --- |
| Herói TEST Equipamentos | 0 | 0 | Nenhuma |
| Carlos Teste | 0 | 0 | Nenhuma |
| QA Arena Torre | 0 | 0 | Nenhuma |

Herói possui um comum fechado, com hold `validator-unavailable`; não foi aberto, revalidado artificialmente nem liberado. O orçamento antigo de outro avatar/conta não pode ser transferido para financiar este gate, e compras QA não devem ser convertidas em prova da autoridade oficial.

**Aquisição pela Loja indisponível no estado atual:** menor oferta existente de equipamento é Espada do Caminho35. Condição mínima concreta: Herói TEST Equipamentos dispor de **35 moedas canônicas provenientes de fonte publicada e legitimamente validada**, sem crédito manual, transferência QA ou criação de recibos. Só então solicitar autorização específica de uma compra35 pela interface normal; após ela, conservar posse/recibo e restaurar somente os slots do smoke. Não foi solicitada autorização de compra inexequível nem concedido saldo. PR/SHA/CI preservados; nenhuma migration, transação ou alteração PROD nesta consulta.

## Autorização de recursos TEST recebida — procedimento pendente

Proprietário autorizou até35moedas TEST e uma compra Espada35 para Herói TEST Equipamentos, sem UPDATE direto, concessão a terceiros ou inferência de legitimidade produtiva. Essa autorização de recursos/compra não será solicitada novamente. Introspecção TEST confirmou: `grant_budget`/constraint exigem255 e QA Loja; `coin_balance` oficial não contabiliza esse orçamento, e `shop_private.actor` rejeita recibos QA. Não chamar o grant incompatível, renomear avatar, reduzir guardas ou inserir saldo/compra manualmente.

A RELEASE_POLICY.md, Vercel3, exige teste real e diz “não modificar dados reais para testar nem conceder recompensas artificiais”. O pedido atual condicionou o preparo ao respeito dessa política. **Proposta mínima para decisão formal**, ainda sem SQL implementado/aplicado:

1. Exceção restrita ao financiamento da fixture hospedada TEST do Herói (fingerprint4bb1b1327a55e4f47ed7b23cee610210), uma única emissão35, conta vinculada e aprovação nominal. Não dispensa login normal, posse validada, smoke, CI ou integridade; não se aplica a PROD.
2. Adaptar somente o orçamento privado existente e sua contabilização TEST para esse input explicitamente identificado como fixture; não usar a carteira isolada de treino nem sua rota de equipar, pois não exercitam o wrapper corrigido. Sem segunda carteira, UPDATE direto, recibo de compra fabricado, nova autoridade pública ou mudança no wrapper/helper de Equipar. A compra35 deve continuar sendo executada pela UI/RPC oficial e criar seu próprio recibo.
3. Guardas de projeto TEST/conta/avatar, limite35/único, execução privada, origem e auditoria explícitas; pacote próprio TEST, recuperação preservadora e checks direcionados antes da instalação. Nova revisão/CI necessários somente por essa mudança; evidências anteriores reutilizadas. A recuperação cessa novas emissões e conserva a contabilidade dos recibos já emitidos, sem apagar crédito/compra para fingir restauração.
4. O resultado prova operação autenticada de equipamentos com financiamento de fixture, **não** aquisição de moedas por atividade, legitimidade econômica produtiva ou o reconhecimento individual PROD. Baú suspenso intacto. Slots restaurados pelo fluxo normal; compra/item/recibos TEST autorizados permanecem auditáveis.

Sem aprovação dessa exceção de procedimento/adaptação TEST, nenhum crédito é permitido para este gate pelas regras atuais. Nenhum SQL de financiamento, migration FIX014 ou operação em jogador foi executado. PROD e quatro reconhecimentos continuam pendentes.
