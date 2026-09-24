# TASK-0003 → Design do MVP jogável

ID: TASK-0003
TITLE: Definir vertical slice e regras principais
OBJECTIVE: Especificar uma jornada completa e pequena, sem implementar software.
PRIORITY: P1 High
STATUS: DONE
SCOPE: docs/game-design/{MVP,CORE-GAMEPLAY-LOOP,CHARACTER-SYSTEM,BATTLE-SYSTEM,CAMPAIGN-STRUCTURE}.md; projects/RPG-JOVEM-CRISTAO.md; memória e este contrato.
OUT_OF_SCOPE: Código, dependências, banco/schema, frontend/backend, assets, serviços, integrações, publicação e execução da próxima tarefa.
DEPENDENCIES: TASK-0002 concluída; ADR-0001 aceito.
ASSIGNED_AGENT: ORCHESTRATOR; perfis GAME DESIGNER, ARCHITECT, BIBLICAL CONTENT e SECURITY assumidos localmente pelo mesmo autor.
REQUIRED_CONTEXT: AGENTS; GLOBAL_CONTEXT; CURRENT_STATE; WORKFLOW; ORCHESTRATOR; TOKEN_POLICY; RULES; SECURITY; projeto; TECH-STACK; ADR-0001; quatro perfis e respectivos procedimentos; docs/biblical/README.
SECURITY_CONSIDERATIONS: Cadastro/dados pessoais, autorização por dono, cliente não confiável, persistência, repetição e concorrência exigem revisão documental Security.

## Autorização e método

Pedido anexado autoriza exclusivamente design. Orquestrador autoriza os quatro perfis a registrar seus pareceres neste contrato e contribuir nos cinco documentos de design; projeto/memória ficam sob responsabilidade do orquestrador. Não há subagentes nem revisão independente. Consulta pública de fonte bíblica para verificar proveniência, sem integração ao produto.

ACCEPTANCE_CRITERIA:
- Cinco documentos vinculados, com IN MVP / OUT OF MVP e jornada de cadastro até próxima missão.
- Personagem, atributos, XP, equipamentos e inventário simples com exemplos consistentes.
- Combate por turnos com iniciativa, ações, dano, boss, vitória, derrota e autoridade do servidor.
- Campanha limitada com unidades CANONICAL / INTERPRETATIVE / FICTIONAL e referências verificadas.
- Viabilidade mobile/arquitetural, autosave, retomada e prevenção de recompensas duplicadas definidos.
- Pareceres dos quatro perfis, limites da validação e memória atualizada.

TEST_PLAN:
- Inspecionar os cinco documentos e cruzar tabelas de XP, itens, inimigos e desbloqueios.
- Percorrer manualmente vitória, derrota, habilidade, defesa, reconexão e duas abas.
- Verificar links locais, classificação por unidade e fonte bíblica.
- Revisar escopo de arquivos e ausência de secrets; registrar limites sem alegar testes executáveis.

DEFINITION_OF_DONE:
- Critérios atendidos; gates documentais aprovados; memória atualizada; contrato movido para completed.
- Build/lint/typecheck/unit/integration N/A quando não há artefato executável.

## Evidências

2026-09-16: contrato registrado em backlog e movido para active; cinco especificações produzidas e revisão documental iniciada. Git CLI segue indisponível (`Get-Command git` não retornou executável); validação por inspeção dos arquivos, sem alegar diff Git ou status do índice.

### Revisões por perfil — mesmo autor, sem independência

- GAME DESIGNER: revisão de mesa das tabelas e percursos. M1 soma 100 XP (nível 2), M2 soma 200 (nível 2), M3 soma 300 (nível 3). Inventário máximo de três itens em quatro espaços. M1 permite vitória em três ataques, M2 em três; boss vencível no nível 2 mesmo sem proteção usando a habilidade. Defesa tem custo de prolongar combate; uso repetido não é dominante. Duração/diversão/balanceamento fino não foram medidos.
- BIBLICAL CONTENT: conferiu Ne 2:11–18 na WEBP, https://ebible.org/engwebp/NEH02.htm, e identificação/domínio público em https://worldenglish.bible/ (2026-09-16). N1–N3 são paráfrases diretas, T1 leitura pedagógica, F1–F5 invenções sinalizadas. Nenhuma citação literal ou tradução portuguesa comercial reproduzida. Aprovação restrita às unidades registradas; edição portuguesa e roteiros ampliados pendentes para publicação, sem bloquear este design.
- ARCHITECT: compatível com ADR-0001: UI DOM, intenções HTTP, regras puras no servidor e transação coordenada na aplicação/persistência. Sem movimento contínuo, microserviço, fila, engine gráfica ou alteração de stack. Versão da tentativa e concessão única especificadas conceitualmente; schema/contratos técnicos ainda não implementados.
- SECURITY: revisão documental exigida por auth/dados pessoais/entrada não confiável. Risco alto de fraude ou duplicação tratado no design por autorização por dono, rejeição de valores do cliente, versão esperada, operação idempotente e concessão transacional única. Não é prova de proteção implementada. Risco de coleta excessiva tratado por pseudônimo privado e minimização. Sem achado crítico/alto aberto no documento. Risco residual médio: políticas operacionais de idade/retenção/recuperação e controles precisam ser fechados/verificados antes do piloto; responsável futuro é o responsável do produto com revisão SECURITY, acompanhamento na recomendação TASK-0004. Não há cadastro real autorizado.

### QA e limites

QA executável N/A: somente documentação, sem comportamento executável ou integração alterada. Revisão estrutural e cruzada realizada pelo autor em lugar de QA independente, conforme workflow. Não executar build, instalar ferramentas ou criar testes que apenas repitam estas tabelas. Cenários em MVP/Loop são critérios futuros, não testes aprovados de software.

### Correção durante elaboração

Balanceamento inicial do boss não sustentava o percurso sem equipamento; corrigido antes da validação final para 32 de vida. Exemplos finais recalculados: quatro ações ofensivas (11+7+7+7) vencem, com vida 12 sem I2; sete rodadas alternando defesa com I2 deixam vida 3. Não houve entrega rejeitada após gate; revisão de elaboração antes do aceite.

### SELF VALIDATE e acceptance check

- Inspeção cruzada dos cinco documentos: todos os componentes exigidos constam do escopo/tabelas; regras completas de criação, ação, derrota, recompensa, retomada e epílogo. Treze passos da visão cobertos entre MVP e Loop.
- PowerShell `Test-Path` sobre destinos Markdown dos cinco documentos, projeto e contrato: `LOCAL_LINKS: PASS`; nenhum caractere de substituição de encoding encontrado. Sete arquivos presentes e não vazios.
- `rg` com padrões de chaves privadas e tokens comuns sobre arquivos de entrega: nenhuma ocorrência (exit 1 significa ausência de matches). Complementado por inspeção de conteúdo: não foram introduzidos credentials, tokens, dados pessoais reais ou connection strings. Não é auditoria do histórico Git.
- Percursos de mesa registrados em BATTLE-SYSTEM e CHARACTER-SYSTEM; cenários de falha/repetição/concorrência em CORE-GAMEPLAY-LOOP. Sem alegação de execução de engine ou de testes reais de concorrência.

| Definition of Done | Resultado / evidência |
| --- | --- |
| BUILD PASS | N/A — sem aplicação/build alterado |
| LINT PASS | N/A — sem código/linter configurado nesta tarefa |
| TYPECHECK PASS | N/A — stack decidida, nenhum artefato tipado implementado |
| UNIT TEST PASS | N/A — regras especificadas, sem lógica executável alterada |
| INTEGRATION TEST PASS | N/A — sem integração implementada; cenários futuros documentados |
| ACCEPTANCE CRITERIA PASS | PASS — seis critérios cobertos pelos cinco documentos e pareceres acima |
| SECURITY REVIEW PASS | PASS documental — revisão do próprio autor; controles reais e políticas do piloto pendentes antes da operação |
| DOCUMENTATION UPDATED | PASS — projeto e três memórias atualizados com decisão, limites e próximo passo |
| NO SECRETS | PASS no escopo documental inspecionado; busca sem achados |
| NO KNOWN CRITICAL REGRESSIONS | PASS documental — nenhum código/configuração alterado; ADR-0001 preservado |

Aceite: documentação completa e coerente após revisão. Única próxima tarefa recomendada: TASK-0004, fechar políticas do piloto (público operacional, privacidade/contas e edição/licença portuguesa), sem execução ou contrato criado agora.
