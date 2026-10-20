# TASK-0086 — Atributos e descrições objetivas da Arena
ID: TASK-0086
TITLE: Números, durações, condições e comparações fiéis ao motor (contexto06/09)
OBJECTIVE: Jogador compreende cartas/equipamentos/efeitos sem confundir atributo, parcela ofensiva e dano confirmado.
PRIORITY: P2 Normal
STATUS: BLOCKED
SCOPE: Apresentação pura/tipada no game-engine, extração sem alteração de constantes numéricas existentes; UI de cartas/equipamentos/inventário/Arena e comparações, histórico confirmado, testes/docs/memória próprios.
OUT_OF_SCOPE: Balanceamento/fórmulas/IA/economia/atributos base/raridades/custos/níveis/usos, aquisição/catálogo fictício, Auth/inventário novos, SQL/dependências/assets/overlays, contratos anteriores, main/merge/push/deploy/remoto/dados reais, Torre/PvP/contexto07.
DEPENDENCIES: Base0085 limpa26d394a, runtime validado cc419c61fe5b2856d113637ccde5b707789df968; catálogo/aquisição e backend autoritativo pendentes.
ASSIGNED_AGENT: Autor assume Architect, Game Designer, Frontend, Backend, QA e Security nos caminhos do SCOPE, sem subagentes ou revisão independente.
REQUIRED_CONTEXT: AGENTS/GLOBAL/CURRENT/WORKFLOW/RULES/SECURITY/perfis/skills pertinentes já lidos; pedido06, contratos/relatórios0084/0085; index/ArenaV2, atributos/snapshot/catálogo, editor/equipamentos/comparação/histórico.
SECURITY_CONSIDERATIONS: Nenhuma informação privada/ação futura da IA em descrição; somente snapshot próprio/regras e resultado confirmado. Catálogo vazio e uso único preservados. Estado local não prova prêmio; P1 legado de autoridade continua aberto.
ACCEPTANCE_CRITERIA:
- Descrições derivadas de constantes e funções reais, números/duração/condição/custo/nível/usos e estados claros; sem estimativa não comprovada.
- Equipamentos exibem atributos e contribuição real; comparação usa snapshots/cálculo existente e explicita efeitos condicionais sem prometer dano final fixo.
- Três ações/sete cartas/uso único/posse/lock/reload e gate vazio mantidos; feedback só de resultado confirmado, histórico recente consultável.
- Provar equivalência numérica do motor/IA/economia e testes com arredondamentos/condições; lint/tipos/build/desktop/mobile, docs/checklist/memória.
TEST_PLAN: Descrições versus resolução real para ataque/defesa/armadura/escudo/amuleto/botas/Foco/nível/duração; comparação e UI; regressões0084/0085; browser produto vazio + harness isolado sem concessões. Baseline de trajetórias e diff matemático. PostgreSQL N/A sem SQL.
DEFINITION_OF_DONE: Checks locais comprovados; integral BLOCKED se catálogo/backend/autoridade impedir aceite real.

## Auditoria prévia / decisões
- HP=round(20+6Vida); parcela ofensiva=3+2,2Força+0,18soma(poder dos itens); Defesa subtrai1,15por ponto antes de multiplicar/arredondar. Atributos/poder por item limitados0–999 no motor. Dano mínimo1, esquiva0, dano aplicado limitado ao HP restante.
- Defesa×0,5 e Guarda×0,25 sobre dano arredondado, ceil/piso1; armadura×0,85 adicional somente com guarda, novo ceil/piso1. Não prometer percentual exato após arredondamento.
- Espada:×1,2 ao atacar imediatamente após Defender; reforço×1,28 do Golpe uma vez. Escudo registra uso de Guarda, sem redução adicional real; corrigir texto, não fórmula. Amuleto acrescenta0,15 ao multiplicador de Discernimento antes do teto1,55,2usos/cooldown2. Botas esquivam1golpe no limiar projetado≤35%, sem chance; elmo+1iniciativa. Cura não existe na ArenaV2.
- Comparação atual já usa Poder do snapshot da Arena; ampliar com HP/parcela ofensiva/Defesa normalizada, sem chamar Poder de dano ou Força de Ataque fixo.
- Extrair literais já existentes para constantes compartilhadas só quando necessário; nenhuma alteração dos valores/ordem/arredondamentos. Sem prever intenção oculta da IA ou dano futuro definitivo.

## Checklist
- [x] Pedido/base/auditoria/contrato
- [x] Fonte compartilhada e descrições
- [x] UI e comparação/histórico
- [x] Testes/QA/Security executados, P1 legado continua bloqueado
- [x] Relatório/checklist; memória no controle final
- [ ] Catálogo/aquisição/backend autoritativo

## SELF VALIDATE / QA / SECURITY / ACCEPTANCE

Implementação local validada; integral BLOCKED pelas dependências herdadas de catálogo/aquisição/autoridade econômica. QA/Security pelo autor, não independentes. Escudo sem bônus além da Guarda é pendência de design específica, agora descrita corretamente; não rebalanceado.

| Gate | Resultado / evidência |
| --- | --- |
| UNIT/integração/regressões | PASS89/15arquivos, unit-final.log;13novos em2arquivos, calculadores/efeitos versus descrição;9UI rechecks em unit-ui-final.log |
| Browser | PASS6/0FAIL/0SKIP/retry0, e2e-final.log.3produto autenticado: personagem numérico+catálogo vazio;3harness positivo isolado: comparação/itens/cartas/custo/uso/reload/histórico; Chromium1440/320 e WebKit390 |
| Lint | PASS lint-final.log; alteração posterior somente remoção de opção inválida no teste, tipos/build e teste do seletor verificados |
| TypeScript/build | PASS typecheck-final.log / build-final.log, app e workspaces; rotas/gates herdados preservados |
| Matemática/economia | PASS math-audit.json: index só extração dos mesmos literais/exports; resolvedor numericamente idêntico, settle idêntico; atributos/catálogos/progressão/inventário/SQL/contratos anteriores protegidos |
| UI/acessibilidade | Capturas finais desktop320/390inspecionadas; sem overflow testado, contraste claro em fundo escuro, detalhes nativos/summary44px/foco, cabeçalhos de tabela e palavra/número legíveis |
| Security | Revisão concluída; sem novo achado alto no diff, sem secrets/dependências/remoto. P1 legado de confiança em combate/recompensa local OPEN, impede DONE integral |
| Fixtures | PASS production-fixture-scan.log após build final, sem marcadores sintéticos no JS de produção; harness sem rota/flag de produto |
| SQL/bíblico | N/A: sem SQL/schema/RLS/migration ou narrativa bíblica nova |
| Documentação | Relatório12itens e parecer próprios, memória de controle e recibo no fechamento |

REWORK registrado: primeira rodada89teve85PASS/4FAIL pelo seletor regex antigo (Vida/Vida máxima); seletor passou a cabeçalho exato, mantendo cada comparação numérica. E2Einicial3PASS/3FAIL por texto de regra de Vida presente em diversos detalhes; busca ancorada, rework6PASS. Build final detectou opção exact indevida no Testing Library, corrigida só no teste; tentativa de browser sem BUILD_ID não iniciou. Tipos/build/browser finais PASS após correção, falhas e traces iniciais preservados. Nove testes de comparação/componentes PASS após ajuste visual; não se repetiu auditoria de dependências ou suíte extensa imutável.

Aceite local: números e condições reais, sem nova cura/carta/efeito, previsão de dano definitivo ou informação oculta da IA. Três ações/sete/consumo/Foco/lock/persistência intactos; cópia da apresentação não altera transcrição nem grant. Catálogo vazio mantém início de produto bloqueado; autoridade/recibos/Auth real/dispositivos pendentes. Sem main/merge/push/deploy/Supabase/SQL remoto/dado real; contexto07 não iniciado.

Relatório: [TASK-0086-ARENA-NUMERIC-DESCRIPTIONS](../../docs/architecture/TASK-0086-ARENA-NUMERIC-DESCRIPTIONS.md). [Parecer Security](../../docs/security/TASK-0086-ARENA-DESCRIPTIONS-SECURITY.md). Próximo: catálogo/aquisição e autoridade sob tarefa própria; decidir reforço do escudo separadamente.
