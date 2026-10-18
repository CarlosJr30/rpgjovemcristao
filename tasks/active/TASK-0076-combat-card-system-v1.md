# TASK-0076 — COMBAT CARD SYSTEM V1

ID: TASK-0076
TITLE: Nova Arena de cartas mobile-first
OBJECTIVE: Entregar combate por cartas jogável, determinístico, acessível e reversível, com apresentação cinematográfica e validação completa.
PRIORITY: P1 High
STATUS: ACTIVE
SCOPE: packages/game-engine/src (motor puro tipado e testes), apps/web/features/journey (Arena por cartas, persistência local de batalha e liquidação idempotente sem novo privilégio, apresentação e animações), tests/e2e, scripts locais de QA, docs/architecture/COMBAT-CARD-SYSTEM-V1.md, checklist, segurança, memória e contrato. Orquestrador assume Game Designer, Frontend, QA, Security, Biblical Content e DevOps; extensão explícita desses perfis para os caminhos runtime acima conforme autorização do anexo.
OUT_OF_SCOPE: Migrations/dados reais, RLS/Auth/variáveis remotas, alterações da economia/XP globais, novas artes Body-Fit/itens/slots persistentes, chefões multiusuário, monetização, controles/câmera/swipe TASK-0066. Chat A separado desta tarefa.
DEPENDENCIES: HEAD main confirmado 0df878764f26f0501959031dd4aec4a77fb9308a; arte HD e retratos de treino existentes e elegíveis.
ASSIGNED_AGENT: Agente principal assumindo os perfis; revisões próprias, sem independência alegada.
REQUIRED_CONTEXT: Anexo 5448e4f9; GLOBAL_CONTEXT/CURRENT_STATE/WORKFLOW/RULES/SECURITY; Arena, atributos, histórico e contratos atuais; skills dos perfis selecionados.
SECURITY_CONSIDERATIONS: Nenhum novo endpoint de concessão. Idempotência de ações, revisão esperada, isolamento por sessão/Viajante, liquidação reservada antes de conceder; valores atuais de recompensa preservados. Achado anterior SEC-0076-01 da operação Chat A (contrato corrigido TASK-0077) sobre integridade econômica remota preexistente permanece aberto; sem autorização para alterar RLS/contratos remotos. Implementar e validar localmente; gate de segurança para publicação não pode ser presumido.
ACCEPTANCE_CRITERIA:
- Baralho de20cópias/mão5/energia3, custos, descarte/reembaralhamento e turnos alternados; cartas não usadas permanecem na mão e reposição somente até5.
- Ataque/defesa/foco/cura/efeitos/equipamentos e IA com intenção; vitória/derrota reais; novas batalhas sem duplicar recompensa.
- Visual HD fixo somente na nova experiência, equipamentos em cartas com IDs/atributos preservados; legado Body-Fit intacto.
- Animações de personagens/cartas/impactos com reduced motion, controles por toque/teclado e portrait/landscape.
- Motor, UI e regressões com evidências; lint/types/build/mídia/segurança; documentação e memória.
- Publicação autorizada apenas com gates obrigatórios aprovados, no projeto Vercel existente; READY/SHA e smoke público. PHYSICAL_QA_PENDING até usuário testar POCO X7.
TEST_PLAN:
- Unitários puros das regras e transições, custos, invariantes, determinismo, efeitos e limites.
- Integração de persistência, revisão concorrente e reserva/liquidação/reload sem duplicação.
- E2E mobile/desktop: duelo completo, derrota, equipamentos, energia, preview, repetição, teclado, reduced motion, reload/saída e regressões relevantes.
- Produção local otimizada, screenshots e inspeção visual; gates existentes de mídia e assets; inventário de limitações.
DEFINITION_OF_DONE:
- Todos os critérios e gates comprovados; publicação verificada ou bloqueio reproduzível registrado sem declarar DONE.

## Estado inicial
- Worktree isolada D:/rpg-jovem-cristao-combat-0076; branch feat/combat-card-system-v1-0076.
- Trabalhos anteriores preservados; TASK-0077 da operação Chat A é separada e não concede privilégios ao combate.
- Contrato de20cartas por cópias e retenção da mão será especificado antes do motor.

## Extensão mínima de implementação para os gates encontrados
- Autorizados pelo orquestrador, dentro do pedido de corrigir regressões e segurança: manifests/lockfile e configuração local de QA para atualizar patches das dependências existentes afetadas, sem mudança de versão major, instalação de nova funcionalidade ou variável remota.
- Diagnóstico reproduziu chave WebP do otimizador local presa: mesma imagem32px/WebP não responde, PNG32px e WebP64/128px respondem; encoder Sharp isolado35ms. Código instalado amarra a requisição interna ao socket do primeiro cliente; mecanismo documentado em vercel/next.js#96538/#98168. Não atribuir genericamente falha de Chrome, não desativar otimização nem mascarar com timeout/retry.
- Auditoria npm de produção: Next16.3.5 crítico, Sharp0.35.4 alto e source-map-js1.2.1 alto. Corrigir com patches exatos e repetir suíte completa. Diagnósticos anteriores permanecem arquivados.
- Suíte pré-correção:165PASS/19FAIL/2skips em186casos; três falhas são geometria do retrato novo e as demais atingem otimização/navegação desktop. Correlação com cache confirmado; extensão histórica às14falhas antigas da TASK75 não pode ser afirmada sem suas próprias evidências.

## Fechamento local e condição de desbloqueio

- SELF VALIDATE / QA pelo autor: PASS funcional local. 473unit/70arquivos, lint/typecheck/build exit0. E2E ampliado226PASS/0FAIL/2skips em228casos;12/12 repetidos no artefato final, sem retries/flaky/erros globais. Três navegadores, nove dimensões, texto200%, teclado, reduced motion, vitória/derrota/recarga/abas/recompensa única/fallback. Contra-ataque exige sobrevivência; seis efeitos de equipamento verificados. Retrato isolado e Next16.4.2 corrigem os defeitos observados; diagnósticos permanecem privados.
- Mídia/artefato: PASS.54HD/4bindings/8fontes preservados;44chunks sem credenciais,23traces sem arquivos privados;14URLs404 locais, oito áudios404 no baseline público anterior. Dependências de produção sem advisories após os patches exatos; cinco altas e quatro moderadas transitivas DEV permanecem abertas.
- Biblical Content pelo autor: FICTIONAL, treinadores e atitudes de treino; sem versículo/milagre controlável ou chefe bíblico inventado. Não alegar revisão independente.
- SECURITY REVIEW: BLOCKED por SEC-ECONOMY-001 HIGH: permissões remotas de escrita/crédito não validam origem econômica. Correção exige contrato autoritativo/ledger e revisão remota, proibida sem autorização específica pelo anexo. Avisos DEV também registrados sem waiver presumido. Nenhuma alteração remota foi feita.
- ACCEPTANCE CHECK: parcial local, não DONE; GitHub/novo READY/SHA/aceite público e POCO físico ainda não atendidos. Sem commit/push/merge/deploy. Produção anterior reconfirmadaREADY/SHA0df878764f26f0501959031dd4aec4a77fb9308a/dpl_CHxbJAphNzND5f8ZbFoR86fT98Yt; ela não contém a Arena nova.
- Memória, arquitetura, Checklist MestreV3.0 e relatório atualizados. Evidências: `build/task-0076-combat-card-system/review/`; relatório `docs/architecture/TASK-0076-COMBAT-CARD-REPORT.md`. Revisão jogável loopback em3176, sem acesso de rede pública.
- Desbloqueio: autorização e correção revisada da integridade econômica remota, resolução/revisão dos avisos DEV e repetição dos gates aplicáveis; depois fluxo normal de publicação existente. Não trocar esse pré-requisito por validação apenas na UI, risco aceito implícito ou desativação de proteções.

## Continuação autorizada — Security Gate, Rewards & Release

Pedido explícito do usuário em16/10: investigar todos os caminhos, implementar localmente autoridade de recompensas, preparar SQL e validar em ambiente isolado, mantendo esta TASK-0076. O orquestrador amplia Backend/Database/Security/QA para `apps/web/lib/economy`, rotas API Next, adaptadores Supabase e fluxos de gameplay afetados, migrations privadas, scripts, testes e documentação. Dependências/ferramentas de teste locais estritamente necessárias estão no escopo. Nenhuma mudança remota está autorizada: parar antes de SQL/RLS/dados/configuração em produção e apresentar projeto, diagnóstico, arquivos SQL, impacto, backup/rollback e resultados para aprovação explícita.

Pré-imagem preservada:30arquivos modificados/novos da Arena e documentação, com SHA256 em `build/task-0076-security-gate/before-SHA256.json`. Banco isolado Postgres17 via Docker local, apenas fixtures sintéticas, sem copiar registros reais. Docker Desktop existente iniciado como serviço local oculto. Auditoria remota permitida somente SELECT de metadados no projetoRPGJOVEMCRISTAO/refwspafhlbtlpabypzymjo; nenhum teste ofensivo em produção. Nova revisão e autorização remota serão registradas separadamente do aceite funcional anterior; release continua condicionado a elas.
