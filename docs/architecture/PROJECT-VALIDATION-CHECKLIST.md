# Checklist de validação do projeto

Atualização específica da TASK-0073. Registros antigos permanecem nas tarefas e relatórios correspondentes; esta lista não aprova gates humanos ou remotos anteriores.

| Critério | Estado / evidência |
| --- | --- |
| Mobile como prioridade; leitura sem truncamento | PASS técnico/visual no build de produção local, inclusive texto200% |
| Intro curta da Serpente e tutorial opcional de duas etapas | PASS; introdução/HUD separados e instruções disponíveis na pausa |
| Pontos numerados e painel contextual acessível | PASS; foco, Escape, Tab, respostas parciais e recompensa idempotente |
| Câmera, swipe e buffer da TASK-0066 | PASS; fontes/loop idênticos, regressão swipe/touch/colisões/vitória/derrota |
| Matriz de onze dimensões / Android e WebKit | PASS emulado;352capturas antes/depois, sem teste físico |
| Lint / typecheck / build | PASS no build final da TASK-0073 |
| Unitários / E2E |443unit PASS;108E2E distintos PASS,12rechecks adicionais PASS;1skip desktop do caso exclusivo mobile Arena |
| Segurança, assets, saves, Auth e banco | Sem alterações de domínio/banco; integridade protegida PASS |
| Avatar HD / Body-Fit | 54 identidades preservadas; nenhum gate Body-Fit humano/runtime promovido |
| Chat | Integrado externamente pelo PR#1; regressão UI com fixtures, aceite real de duas contas da TASK-0072B permanece pendente |
| Oito áudios restritos / DEV | Build bloqueia distribuição; confirmar oito 404 e rotas DEV em produção |
| Commit / push / SHA remoto / Vercel READY | Pendente dos gates finais; usar projeto existente e um deployment automático |
| Produção / POCO X7 | Validação pública após deploy; teste físico cabe ao usuário |

Decisões: privilegiar área útil do gameplay; manter informações críticas completas; usar seleção por toque e leitura em painel dedicado para enigmas; publicar após gates; distinguir emulação, DEPLOY_COMPLETE e PHYSICAL_QA_APPROVED.
