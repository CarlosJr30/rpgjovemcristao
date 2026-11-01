# RELEASE-EARLY-002 — desbloqueio mínimo

01/11/2026. **ACTIVE; abertura8+ BLOCKED.** ProduçãoUI-ADMIN/c853d9b preservada. Público pretendido8+, Carlos Faustino — RPG Jovem Cristão e contato `carlosrf1302@hotmail.com` informados pelo proprietário; política e procedimento de autorização/vínculo do responsável ainda não existem/aprovados.

| Gate | Resultado atual |
| --- | --- |
|Recuperação PR24|Continuidade na mesma branch; merge8aa4301 incorpora mainc853d9b e registroUIed4cce1. Único conflito documental em CURRENT_STATE resolvido preservando históricos. Código/contratos/Admin integrais preservados; avisoEarly não será inserido na telaAdmin.|
|WebKit afetado|Causa comprovada no artefato9b3: `vercel.live/login/validate`, pilha `feedback.js`, cancelada por navegação antecipada. Contraste rápido→concluído→rápido:2→0→1erros; quatro validações200 na parte concluída. Sem filtro de erros/Auth/RLS alterado. Novo candidato recebe recheck apenas desse formulário.|
|Diagnósticos adicionais|Tentativas de incluir login/logout pararam por navegação RSC concorrente, seletor corrompido pelo shell e, depois, critério diagnóstico extra de zero requests cancelados (dois chunks). Três passos funcionais/zero pageerrors na última parte não tornam essas rodadas integralmente PASS. Preservadas; não repetir módulos inteiros ou enfraquecer asserts.|
|Auth atual|TEST exige confirmação; PROD ainda `mailer_autoconfirm=true`, signupemail ativo, telefone/anônimo inativos. Configuração não alterada. LoginCLI administrativo indisponível; MCP não expõe SMTP/SiteURL.|
|Entrega segurança PROD|Uma recuperação normal para a conta aprovada existente retornou200; mensagem recebida com remetente padrãoSupabase e retorno oficial `/auth/recover` correto. Nenhuma senha alterada, token retido, conta/avatar criado ou convite por e-mail enviado. Não é cadastro/recuperação completos nem prova de entrega pública.|
|Dependência Auth pública|Proprietário não conhece SMTP próprio/remetente verificado. Serviço padrão é restrito à equipe; falta envio de segurança adequado ao público, configuração/retornos TEST/PROD e fluxo completo legítimo. [Plano mínimo](../security/RELEASE-EARLY-002-AUTH-CONFIG.md). Não contratar serviço ou improvisar SMTP pessoal.|
|Privacidade8+|[Minuta separada v0.1](../security/RELEASE-EARLY-002-PRIVACY-PROPOSAL.md), sem aceite presumido. Não há mecanismo real de idade/autorização/vínculo/supervisão; proprietário confirmou inexistência. Consentimento por checkbox/convite não será fabricado. Gate permanece BLOCKED.|
|Qualidade/local|10unitários direcionados PASS, lint pertinente/tipos/build/protocolo25 PASS. Provas010A/B/C/UI-ADMIN reutilizadas; sem nova grande suíte local. CI e Preview do candidato reconciliado ainda PENDING neste checkpoint.|
|Supabase/dados|Baseline renovado:75TEST/201funções/40migrations;70PROD/193funções/17migrations,39policies cada. Sem migration, DML de jogador ou mudança de Auth/RLS nesta tarefa. Preservação final em conferência.|
|Vercel/acesso público|Aplicação existente públicaUI-ADMIN; não se declara cadastro fechado ou acesso ampliado seguro. Conferir READY/SHA/backend/alias no fechamento. PR24 permanece draft, sem merge/publicação002.|

Falta aprovar o texto e um procedimento mínimo real para menores, viabilizar e-mails de segurança/retornos e comprovar cadastro/recuperação completos. Até lá, **não liberar a entrada de novos jogadores8+ como lançamento homologado**. Não substituir a idade escolhida por18+ por conta própria.

Convites automáticos por e-mail cancelados nesta fase. Preservados link/QR/WhatsApp, entrada automática comum válida e papéis publicados. Economia/XP/moedas/baús/equipamentos/Loja/Arena/Torre/progressão pendente/chat/DM/eventosC3 continuam fechados. Nenhum recurso pago/dependência nova ou jogador fictício permanentePROD. Artefatos privados em `build/release-early-002`; anteriores intactos. QA/Security pelo autor, sem independência; mobile emulado, não físico. NãoDONE/DEPLOY_COMPLETE.
