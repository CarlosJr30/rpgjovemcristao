# UI-RESTORE-002 — recuperação da identidade completa

ID: UI-RESTORE-002
TITLE: Restaurar identidade e menu completo sem liberar gameplay
OBJECTIVE: Reutilizar componentes/aparência de5edc93f; menuHerói/Jornada/Missões/Equipamentos/Mochila/Loja/Coleção/Diário/Guilda/Arena + EBD, itens não homologados visíveis Em desenvolvimento e sem operações protegidas.
PRIORITY: P1 High
STATUS: VALIDATING
SCOPE: PR11 branchcodex/rpg-dev-001 basef0abffa, shell/apresentação CSS e releasehome/avatar, testes/capturas/inventário/relatório/memória/CI. Autor assume Frontend/QA/Security/DevOps sem delegação. Autorização runtime explícita do usuário; escopo documental ampliado para evidências.
OUT_OF_SCOPE: Merge/deploy antes de aprovação; alterar Auth/CORS/RLS/proxy/allowlist/API/RPC/economia/migrations/dados/artes aprovadas; recursos pagos/dependências; reverter integralmente commits. UI-MOBILE-001 NÃO aprovada.
DEPENDENCIES: Referência principal5edc93f confirmada pelo usuário; imagem14/10 citada noChatGPT não disponível neste turno, não inventar comparação pixel a pixel. Captura renderizada do commit deve ser identificada como reconstrução.
REQUIRED_CONTEXT: GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY/RELEASE_POLICY/ORCHESTRATOR/TOKEN_POLICY; perfisFrontend/QA/Security e skillslocais; Nextlinkingdocs; fontesoriginais.
SECURITY_CONSIDERATIONS: Módulos bloqueados semhref/prefetch/handlers de autoridade; guardasserver intactas; somente conta sintética local, zero escrita de jogadores ouDBremoto.
ACCEPTANCE_CRITERIA:

- Inventário rastreável de todos os módulos/código/dados de catálogo/artes/migrations, com hashes e limites da auditoria remota explícitos.
- Menu único original completo+EBD, paleta/cabeçalho/cenário/avatar/componentesoriginais; nenhuma grade administrativa substitui oRPG.
- Móvel scroll/touch/foco/fechamento/320px/paisagem; funções não homologadas visíveis Em desenvolvimento, sem acesso protegido.
- Cadastro/Auth/Guilda/EBD/patchRSC/trabalhosanteriores preservados; testes/lint/types/build/CI e capturasdesktop/móvel.
- Comparação principal com5edc93f identificada corretamente; aprovação visual humana pendente, semmerge/deploy.
  TEST_PLAN: Unitários do menu11itens/8bloqueados/allowlist; regressão browser aplicação completa com backendHTTPsintético/negativas403/RSC/touch/foco; screenshots; suítetotal/lint/types/build/protocolo/CI. QA/Security peloautor.
  DEFINITION_OF_DONE: Homologação visual explícita e gates aplicáveis completos. Entrega para aprovação permanece VALIDATING/PENDING_VISUAL_APPROVAL; não declararDONE/DEPLOY_COMPLETE.

SELF_VALIDATION: 801unitPASS74SKIP,lint/types/build/protocolo25PASS,24RSCappPASS e138checksdesktop/WebKit320/390/paisagemPASS. 21capturas comparadas com5edc93f reconstruído. Inventário602/602caminhoshistóricospreservados/249mídias/10features.35tabelasPRODcomRLS/hashiguais;Auth12contas/hashidentificadoresigualem2leituras,hashlinhaAuthvariousemcausadeterminada/sem escrita. Relatório/evidências docs/architecture/UI-RESTORE-002* e docs/reviews/UI-RESTORE-002.

QA_SECURITY: Revisões pelo próprio autor, sem independência. SomenteUI/tests/docs;Auth/CORS/RLS/proxy/allowlist/APIs/RPCs/economia/migrations/assets/patchRSC intactos. Backend dos ensaios somenteHTTPsintético3199/3202; consultasPRODsomenteSELECTagregado. Sem alterações produtivas/recursospagos.

ACCEPTANCE: PENDING_VISUAL_APPROVAL; proposta anteriornãoaprovada. CI final doSHA exato registrado naPR11/Checks antes da entrega. Preservar gates/bloqueiosanteriores e proibiçãoexplícita de merge/deploy até aprovação. NãoDONE/DEPLOY_COMPLETE.

REFERENCE_RECEIVED: Continuação após imagem anexada pelo usuário: Guilda/manejo em dois navegadores, salão medieval, banner, mesa do líder, cabeçalho e menu originais. A imagem agora está disponível no turno; corrige a limitação anterior. Recuperar GuildHall/GuildHero/GuildArtwork na apresentação atual; distinguir papel de líder no layout sem alterar autorização. Repetir capturas positivas de membro/líder em backend sintético, sem copiar nomes/IDs da imagem para fixtures nem inventar contadores de missões não carregados. Aprovação continua pendente, sem merge/deploy.

REFERENCE_VALIDATION: Componentes originais reconectados àGuilda/EBD.804unitPASS74SKIP,lint/types/build/protocolo25PASS;24appRSC/138UIgeraisPASS,4positivos×12=48checksGuildaPASS,10PNGsadicionais. Primeirarodada23/24semerro com1fetchguild_memberscanceladoWebKitpreservadaFAIL;matrizseguinte24/24PASS,semAuthCORSoupatchalterado/semalegarcorreçãodefinitivaAPI. Ensaio positivoaguardabootstrap e decodedasartes;falhasanteriorespreservadas. Repo/Auth/RLS/economia/DB/artesinalterados,semconsultaremotadestacontinuação. Galeriaatualdocs/reviews/UI-RESTORE-002/guild-reference/index.html;CI porSHA exato naPR11. VALIDATING/PENDING_VISUAL_APPROVAL.
