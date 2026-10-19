# TASK-0078 — integração das melhorias pendentes

Pedido de18/10/2026: concluir o checklist existente. O usuário informou que já validou o chat e testou a Arena; não solicitar repetição genérica desses aceites. Nenhuma medição física/FPS ou cobertura detalhada não relatada é inferida.

Integração preparada em `codex/pending-game-integration` a partir de mainaf6fd41 e fontes38b766c da migração verificada. CI oficial e política Git **false/maintrue preservados. Proxy e seus dois testes adicionais preservam a correção já revisada em9e501ea: legado GET/HEAD redirecionado antes de inicializar Auth. Os seis blobs da fronteira da demo coincidem com os revisados; não foi relaxado o gate.

## Evidências locais

- npmci reproduzível; lint/tipos PASS.
- Unitários:559PASS/14skips preexistentes, depois os7casos do proxy PASS, incluindo2casos adicionais preservados. Não somar os5repetidos como cobertura nova.
- ProtocoloCI:25PASS.
- Build Production e build Demo separados PASS; gates de áudio/54Avatares/quatro bindings Body-Fit PASS, zero arte pendente publicada.
- Demo integrada:16E2E Chromium/WebKit PASS, sem retries, mesmas asserções de rede externa/storage/IndexedDB/turnos/retorno/legado/API403.
- Primeira execução unitária no sandbox falhou por caminhos temporários ENOENT, build pormkdirEPERM; logs preservados, reexecução autorizada fora do sandbox PASS. Primeira rodada E2E interrompida com falhas: artefato Production usado indevidamente para a demo. Build comRPG_ARENA_DEMO=1 em cache separado corrigiu a preparação; nenhuma asserção/timeout foi relaxada.
- Auditoria DEV atual:5altas/4moderadas. Registro npm confirmou braces3.0.3 e eslint-config-next16.4.2 como atuais; Drizzle0.31.11 mantém a mesma cadeia afetada de0.31.10. Não aplicar downgrade automático do audit nem alegar resolução. Sem alteração adicional de dependências para mascarar avisos.

Recibos privados na raiz `build/task-0078-integration/`: logs unit/permitted, proxy, lint, types, build/permitted, build-demo, e2e-preview/demo e dependency-audit.json. Resultados Playwright em build/task-0076e-integrated-preview/task0078-demo-build-tests.json deste checkout. Revisão QA/Security pelo autor, não independente.

## Gates de produção ainda abertos

Este PR é preparação de integração, não autorização para ignorar a segurança econômica. Projeto Supabase confirmado saudável, mas não há backup acessível/restore comprovado nem serviço libpq configurado nesta sessão. Somente metadados Vercel (nomes/alvos, sem valores) confirmaram ausência deSUPABASE_SERVICE_ROLE_KEY. Foram solicitados referência de backup e configuração direta dessa chave sensível somenteProduction, sem valor no chat. A autorização atual cobre o trabalho; estes são pré-requisitos de acesso e recuperação.

Manter EXPAND0009 → backend compatível/manutenção → CONTRACT0010/protocolo2 e smoke de duas contas conforme o plano0076A, após backup/ensaio e revisão dos gates. Não executar SQL cegamente nem servir a demo isolada como substituto do backend real. Não promover este PR a main antes desses gates. Nenhum dado remoto/migration/deploy foi alterado nesta preparação.

Equipamentos fora dos quatro bindings já aprovados continuam sujeitos a encaixe e evidências específicas. Aprovação genérica de execução não será rotulada como aprovação visual por hash nem como arte concluída. Contrato ativo principal na raiz: tasks/active/TASK-0078-pending-game-improvements.md.
