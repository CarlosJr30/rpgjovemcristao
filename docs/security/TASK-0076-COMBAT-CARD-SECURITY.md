# TASK-0076 — Segurança da Arena por cartas

Revisão pelo próprio autor; não há alegação de QA ou Security independente.

## Controles locais implementados

- Motor puro: turnos, revisão esperada, instância presente na mão, Energia e Foco validados antes da resolução. Comandos rejeitados não causam dano, consumo ou nova animação de ataque.
- Persistência versionada por identidade da conta/modo local e UUID do Viajante. Transcrição reproduzida pelo motor, sem aceitar Vida/Energia/vencedor calculados de campos fornecidos pelo storage. Limites de tamanho e número de comandos.
- Web Locks serializa ações e liquidação entre abas. Guarda síncrona impede duplo toque; uma revisão antiga não se torna novo comando.
- Reserva persistida antes do crédito, seguida de histórico conservador e confirmação de resultado. Recarga e callbacks repetidos não repetem a recompensa. Uma reserva interrompida é tratada como incerta; não como crédito retryable.
- Recompensa e quota existentes preservadas, inclusive quota compartilhada com vitórias da Arena clássica. Não há endpoint novo, privilégio por nome, QA em produção ou recurso concedido ao Chat A por este motor.
- Sem alteração de RLS, Auth, variáveis remotas, esquema, dados reais ou políticas de segurança. Único acesso remoto desta tarefa: auditoria SELECT de metadados, sem exploração.
- Segredos e identidade de jogadores não entram em fixtures, screenshots ou relatórios. Testes usam UUIDs e nomes sintéticos, modo local e bloqueio de tráfego externo; nenhum recurso real é consumido.
- Configuração local contém somente as duas variáveis públicas Supabase já existentes; tipo publishable/anon conferido sem imprimir valores. Arquivo ignorado e não versionado. Dependências existentes atualizadas no lockfile: Next e eslint-config-next 16.4.2; overrides de Sharp 0.35.5 e source-map-js 1.2.2. Nenhuma biblioteca funcional nova.
- Arte HD, recibos Body-Fit e os oito áudios restritos permanecem preservados. A nova Arena desliga camadas apenas na apresentação, usando a opção existente do AvatarRuntime. Não publica artes pendentes nem mídia de licença incompatível.

## SEC-ECONOMY-001 — P1 High / OPEN / preexistente

Alias histórico: SEC-0076-01 da operação administrativa Chat A, cujo contrato provisório foi corrigido para TASK-0077 quando o usuário reservou explicitamente TASK-0076 para combate.

**Reprodução não destrutiva:** consulta de metadados em produção voltou a confirmar UPDATE de `wallets.coins`, `travelers.xp` e `inventory.quantity` para authenticated, e execução de `add_coins(uuid,integer)`. A política de carteira confere propriedade; o trigger apenas atualiza timestamp. A função de crédito verifica valor positivo e incrementa o registro visível sob RLS, sem comprovar ação/recompensa de origem.

**Resultado:** RLS limita acesso aos próprios registros, mas não torna a economia autoritativa no servidor. O cliente pode alterar os próprios recursos por caminhos preexistentes. Não foi tentada exploração nem foram alterados dados para demonstrar a falha. Evidência privada: `build/task-0076-combat-card-system/production-security-reaudit.json`.

O replay, a quota e os locks desta Arena protegem consistência do fluxo normal no navegador; não substituem autorização e integridade no banco. Não são apresentados como mecanismo antifraude ou garantia entre dispositivos. A sincronização online herdada não prova confirmação do servidor apenas pelo retorno do save local.

**Correção necessária:** desenho autoritativo de recompensas, ledger idempotente de eventos e contratos de escrita específicos; retirada coordenada de crédito arbitrário e escrita direta dos campos econômicos, sem quebrar criação, compras, baús, progressão, Guilda e sincronização. Exige migração/revisão remota e autorização específica. Esconder botões ou validar só no React não fecha o acesso direto existente.

## Gate de publicação

A [política do projeto](../../.agent/SECURITY.md) estabelece: “Problemas críticos ou altos de segurança impedem DONE”. O anexo da TASK-0076 proíbe modificar RLS/Auth/variáveis remotas e condiciona publicação aos gates de segurança.

**SECURITY REVIEW: BLOCKED** pelo achado alto acima. A implementação e validação local prosseguem; não realizar commit/push/merge/deploy para contornar o gate. Nenhuma alteração de proteção Vercel ou Supabase foi feita. O deployment público anterior não se torna falha de aplicativo por esse bloqueio, e não se afirma que a Arena nova foi publicada.

## Dependências — produção e desenvolvimento separados

O audit inicial de produção encontrou Next 16.3.5 crítico, Sharp 0.35.4 alto e source-map-js 1.2.1 alto. As atualizações locais removem esses achados: `npm audit --omit=dev` retorna zero vulnerabilidades. Next 16.3.8 corrigia advisories, mas ainda continha o defeito de socket do otimizador; a correção está presente no código instalado 16.4.2. A mudança foi validada com seis abortos TCP locais seguidos de respostas 200 na mesma URL, sem alterar assets/configuração.

O audit incluindo ferramentas DEV ainda registra nove ocorrências transitivas: cinco altas na cadeia eslint-config-next → fast-glob → micromatch → braces e quatro moderadas na cadeia drizzle-kit → esm-loader → esbuild antigo. O [advisory de braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) informa ausência de versão corrigida. Trata-se de esgotamento de pilha por padrões profundamente aninhados; o lint usa padrões do repositório e não entradas de jogadores. Esses pacotes não são dependências de produção auditadas, mas os avisos continuam abertos e não recebem falso PASS, waiver ou downgrade destrutivo para ocultá-los. O contrato remoto de economia continua sendo o bloqueio alto diretamente aplicável à recompensa do jogo.

Evidências privadas: `dependency-audit-before-utf8.json`, `dependency-audit-final-utf8.json`, `dependency-audit-production-utf8.json` e `image-abort-probe.json`, em `build/task-0076-combat-card-system/`. Nenhum `npm audit fix --force`, alteração de política ou exploração foi executado.

## Limitações residuais explícitas

- Transcrições e histórico locais podem ser apagados ou adulterados pelo proprietário do navegador; a proteção contra fraude exige o contrato remoto indicado.
- Reserva interrompida pode exigir recuperação manual, em vez de repetir crédito de confirmação incerta.
- Sem medição física de performance no POCO X7 e sem aceite físico desta Arena. `PHYSICAL_QA_PENDING`.
- Regressão de chat usa fixtures e testes existentes; não equivale a novo aceite Realtime com duas contas reais.
