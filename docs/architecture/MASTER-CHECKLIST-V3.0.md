# Checklist Mestre V3.0 — RPG Jovem Cristão

Atualização da TASK-0076. Complementa o [checklist histórico](PROJECT-VALIDATION-CHECKLIST.md) e o [checklist de equipamentos](EQUIPMENT-MASTER-CHECKLIST-V1.md), sem apagar decisões anteriores. Estado de implantação não é inferido do código local.

| Área | Estado atual | Evidência / condição |
| --- | --- | --- |
| Produção publicada anterior | READY, SHA `0df878764f26f0501959031dd4aec4a77fb9308a` | Último deployment confirmado antes desta mudança; não contém a Arena por cartas |
| Motor de cartas V1 | PASS local | 20 instâncias, 15 tipos, mão5, Energia3, Foco, Bloqueio, efeitos, IA e replay; 13 testes puros, incluindo Contra-ataque letal |
| Persistência e recompensa | Implementado localmente | 8 testes de integração; revisão, isolamento, reserva antes do crédito, quota comum com a Arena clássica |
| Apresentação e animações | PASS local | Movimento 2D procedural sobre assets elegíveis; entrada, idle, cartas, ataque, defesa, reação, especiais, Energia, vitória/derrota; sem novas artes externas ou medição física de FPS |
| Avatar fixo e equipamentos em cartas | Implementado na nova Arena | `showEquipment=false` somente nesta apresentação; seis itens existentes e nove categorias como metadados futuros |
| Body-Fit legado | Preservado | Quatro bindings aprovados e 54 Avatares; sem nova ativação ou PNG alterado |
| Mobile, landscape, texto200%, teclado e reduced motion | PASS emulado | Nove dimensões nos três navegadores; personagens inteiros, mão legível, toque/preview, teclado, foco e ausência de overflow lateral; capturas privadas revisadas |
| Arena clássica | Preservada e testada separadamente | `/journey/arena/legacy`; expectativas antigas direcionadas explicitamente ao legado, cobertura nova independente |
| Unitários | PASS | 473 testes em 70 arquivos; 21 novos de motor/integração |
| Lint / typecheck / build | PASS final, exit0 | `local-release-gates.json`; patches de segurança e Next16.4.2 para o defeito de socket, versões exatas no lockfile |
| E2E da Arena e regressões | PASS local | 226PASS/0FAIL/2skips em228casos; 12/12 repetidos no build final, sem retries/flaky/erros globais. Diagnóstico165PASS/19FAIL/2skips preservado |
| Home, equipamentos, loja, inventário, Jornada e minigame | PASS nas regressões | Quinze arquivos E2E selecionados; câmera/swipe e quatro bindings Body-Fit preservados |
| Guilda e chat | Código preservado | Testes locais de UI/repositórios; novo aceite Realtime com duas contas reais não realizado nesta tarefa |
| Câmera / swipe TASK-0066 | Preservados | Nenhum arquivo de regras/controle da Serpente alterado |
| Mídia, DEV e arquivos privados | PASS no artefato final | 44 chunks sem secret/service-role detectados; 23 traces sem privados; 14 URLs locais404, incluindo oito áudios restritos; baseline público anterior também8/8áudios404 |
| Dependências de produção | PASS no audit | Next16.4.2, Sharp0.35.5 e source-map-js1.2.2; zero vulnerabilidades em `npm audit --omit=dev`;6/6probes de aborto de imagem recuperam200 |
| Dependências DEV | OPEN | Nove ocorrências transitivas: cinco altas por braces sem patch e quatro moderadas por esbuild antigo na cadeia Drizzle; sem risco aceito presumido |
| Integridade econômica remota | BLOCKED / P1 preexistente | SEC-ECONOMY-001: cliente pode alterar os próprios recursos; auditoria SELECT reconfirmou risco; correção remota fora da autorização |
| GitHub / novo deployment | NÃO EXECUTADO | Gate de segurança impede commit/push/merge/publicação desta entrega |
| POCO X7 físico | PHYSICAL_QA_PENDING | Emulação não é aprovação física; nova Arena ainda não publicada |

Regras e limites: [COMBAT-CARD-SYSTEM-V1.md](COMBAT-CARD-SYSTEM-V1.md). Segurança: [TASK-0076-COMBAT-CARD-SECURITY.md](../security/TASK-0076-COMBAT-CARD-SECURITY.md). [Relatório final](TASK-0076-COMBAT-CARD-REPORT.md). Status global: **BLOCKED**, sem novo commit/push/deploy; não DONE.

A operação de recursos do Chat A é separada. Ela foi identificada provisoriamente como0076 antes do anexo de combate e corrigida para TASK-0077, preservando os recibos privados anteriores. Não é dependência, flag, privilégio ou fixture real desta Arena.
