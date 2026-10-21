# DEPLOY-001 — checklist e encaminhamento

Escopo atual: código consolidado em branch isolada GitHub, CI por SHA. Supabase/Vercel/produção não configurados nesta tarefa. Os 21E2E/111unitários006 e build locais não são resultados do novo Actions.

| Gate DEPLOY-001 | Situação inicial verificável |
| --- | --- |
| Recibo006 e ancestralidade | Conferidos sobre8a470d20558c993f5f954bbc6a67776c9f583823; main remota ancestral, sem commit exclusivo |
| Branch isolada/pendências | codex/deploy-consolidated-001 criada em novo checkout;32worktrees prévios preservados |
| Segurança/prepush | Auditoria455blobs/335paths, nenhum segredo/novo asset; parecer próprio; protocolo25PASS/eligible=false |
| Teste completo local do workflow |687PASS/28PGopt-in não executados; sem mudança de testes/gatilhos |
| Deploy automático | Workflow/CLOUD-007 intactos; branch negada no pinned-preview e na configuração Git Vercel |
| Push/SHA/Actions | Primeiro SHAe6b0508852f0b5d10db0570538129fcb4259066e publicado e CI_APPROVED no run39534510529; fechamento documental exige CI próprio, resultado final por SHA no recibo local build/deploy-001/final-receipt.json e relatórioDEPLOY-001 |
| Main/serviços | Nenhuma mudança autorizada; verificar refs ao fechar |

Novo Actions inicial confirmou687PASS/28PGopt-in não executados,25protocolosPASS, lint/tipos/buildsuccess e pinned-previewskipped. Nenhum status/deployment associado ao SHA. A execução do SHA de fechamento deve confirmar seus próprios gates antes da entrega, sem usar esse primeiro resultado como aprovação automática.

## DEPLOY-002 — Supabase de testes, ainda não executar

- [ ] Confirmar alvo informado pelo usuário: rpgjovemcristao-test, refwkdvdzfkbwvhyjmamrsg, sa-east-1; novo inventário/identidade/isolamento antes de qualquer escrita. Produção RPGJOVEMCRISTAO/wspafhlbtlpabypzymjo excluída.
- [ ] Revisar pacote002 e proposta004: journal0000–0008→QR0080→Story0081/missões0082/EBD0083→EXPAND0078 importado→CONTRACT004. CONTRACT004 é alternativa a0010, não cumulativo. Aprovar registro/hashes, backup/recuperação/janela/reconciliação; manter TASK0078 intacta.
- [ ] Após autorização específica, migrations/Auth/ACL/RLS/PostgREST/roles e RPCs econômicas: negar writes diretos/legado, testar JWTs reais entre contas/Guildas, protocolo3/posse/CAS/recibo. Não preencher economic_verified_at dos legados sem revisão.
- [ ] Configurar cadastro/e-mail/confirmacão/callback/next restrito sem anônimo ou bypass; não pedir secrets na conversa. Nenhuma migration remota executadaDEPLOY-001.

## DEPLOY-003 — Vercel de testes, ainda não executar

- [ ] Reconfirmar projeto rpgjovemcristao-test/prj_qKzjXMVXwiVpGlU66SoTA71mStXX e equipe autorizada; nunca projeto de produção rpgjovemcristao-web nem pinned-preview histórico de outro projeto.
- [ ] Aprovar env exclusiva do teste, APP_BASE_URL/HTTPS/origem Auth/QR reais; credencialservice_role somente servidor, não NEXT_PUBLIC/Git/log. Build local fixture.invalid não é artefato de deploy.
- [ ] Selecionar SHA com CI_APPROVED, método de deploy e proteção. Só então publicar/verificarREADY/deploymentId/projectId/SHA/URL/rotas; sem alterar CLOUD-007 para contornar elegibilidade.

## DEPLOY-004 — aparelhos físicos, ainda não executar

- [ ] Login/cadastro/confirmação/logout, Avatar próprio/retomada e cache entre contas; AndroidChrome/iOSSafari reais, teclado/scroll/touch.
- [ ] Duas contas/dois aparelhos, Guilda/QR/câmera/pedido/aprovação/escopo e EBD/professor/aluno/presença/histórico; nenhuma aprovação paga automaticamente.
- [ ] Story candidata e mídia pendente claramente rotuladas; só completar após revisão/vídeo/prova autorizados. Arena/Torre só com cartas/posse/backend homologados; pausas e gates preservados.
- [ ] Sincronização/timeout/concorrência/reload sem duplicar recurso, performance/rede/background e mídia audível somente após licença. Seguir [matriz006](CONSOLIDATION-006-HOSTED-PHYSICAL-MATRIX.md), sem chamar emulação de físico.

## DEPLOY-005 — produção, ainda não executar

- [ ] Contrato e autorização próprios, backup/restauração comprovados, plano de migração/recuperação/janela e reconciliação.
- [ ] SHA exato/CI/gates de segurança/aceite testados, aprovação explícita e método de publicação para alvo correto.
- [ ] Smoke real pós-publicação, conferência de economia/identidade/recibos e recuperação sem restaurar grants inseguros. Nenhum merge/main/deploy/SQL de produção antecipado.

Próxima etapa após CI aprovado: revisão do escopoDEPLOY-002. A existência informada do banco vazio não autoriza configurar serviços nestaDEPLOY-001; demais bloqueios de homologação/performance/físico permanecem no [consolidado006](CONSOLIDATION-006-BLOCKERS.md).
