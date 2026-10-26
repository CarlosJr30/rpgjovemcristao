# UI-RESTORE-002 — Preview para aprovação visual

**Atualização26/10: interface visual explicitamente aprovada pelo usuário.** A continuação de merge/publicação está registrada em [UI-RESTORE-002-RELEASE-REPORT.md](UI-RESTORE-002-RELEASE-REPORT.md), sujeita aos gates. O estadoPENDING abaixo documenta a entrega anterior à aprovação.

Data:26/10/2026. PR [#11](https://github.com/CarlosJr30/rpgjovemcristao/pull/11), rascunho. **PREVIEW_READY / PENDING_VISUAL_APPROVAL**. Autorização explícita somente para Preview; sem merge ou publicação em produção.

## Deployment confirmado

- URL do candidato: https://rpgjovemcristao-i5a7yhlzq-carlos-junior-s-projects.vercel.app . Acesso Vercel protegido; o link temporário de revisão foi entregue no chat.
- Deployment:`dpl_A4MWCmTPepU4HKzJn8X3SRcRXqJg`, **READY**, ambientePreview (`target:null`, não production).
- SHA exato:`caa682c2b19d3f95f7d4d584e7036dd82369266d`, criado da fonteGit imutável da branch`codex/rpg-dev-001`, sem substituir pelo último commit automaticamente.
- Projeto:`prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`, equipe`team_FWD8MfZ9vARK8EBovoyTn9Ox`, root`apps/web`.
- CI do runtime:[push40268360249](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40268360249) e [PR40268364558](https://github.com/CarlosJr30/rpgjovemcristao/actions/runs/40268364558), completed/success. A atualização documental posterior não altera o runtime; seus checks ficam registrados naPR11. Não houve novo deploy apenas para documentação.

O conectorVercel retornou403 de escopo. Foi usada a CLI64.0.2 já autenticada na mesma equipe, com IDs explícitos; nenhum projeto/plano/integração novo. Build remoto confirmou aplicação do patchRSC005 e gates de assets aprovados.

## Ambiente e preservação

**Exclusivamente SupabaseTEST `wkdvdzfkbwvhyjmamrsg`**, URL`https://wkdvdzfkbwvhyjmamrsg.supabase.co`. VariáveisPreview da branch verificadas em processo, sem imprimir valores sensíveis; chave pública corresponde à conexãoTEST autorizada, sem variáveis públicas privilegiadas ou service-role no ambientePreview. Tráfego real dos seis fluxos confirmou somente esse hostSupabase.

Proteção do projetoVercel permanece `all_except_custom_domains`. Foi criado um link oficial compartilhável restrito ao deployment, TTL604800s/7dias, expirando`2026-11-02T04:33:19Z`. A capacidade não está neste relatório/Git; permanece protegida localmente porDPAPI e foi entregue ao usuário no chat. O link abre a aplicação em navegador comum desktop eWebKitmóvel sem cabeçalhoOIDC, mantém o login doRPG e retorna403 paraArena. Não desativaAuth/RLS nem proteção global do projeto. Para automação foi usada autenticaçãoOIDC limitada à origem daPreview; não encaminhada ao Supabase.

Sem alteração deAuth/CORS/RLS/economia/allowlist/proxy/APIs/RPCs/configuração remota de ambiente; sem migrations, contas ou grants novos, reset ou recompensas. Login/logout normais das contasTEST existentes atualizam sessões/metadadosAuth deTEST; nenhum teste usou contas de jogadores de produção. Nenhuma chamada de gameplay/economia foi habilitada. Consulta agregada somente de leitura emTEST confirmou **37tabelas comRLS ativa**.

## Validação hospedada real

| Navegador / perfilTEST        | Checks | Resultado |
| ----------------------------- | -----: | --------- |
| Chromium1440×1000 / líder     |     25 | PASS      |
| Chromium1440×1000 / professor |     23 | PASS      |
| Chromium1440×1000 / aluno     |     23 | PASS      |
| WebKit390×844 / líder         |     28 | PASS      |
| WebKit390×844 / professor     |     26 | PASS      |
| WebKit390×844 / aluno         |     26 | PASS      |

**151/151checks**, zero erros de página, DOM/unhandled rejection ou console. Inclui login real, Viajante ativo original, onze itens na ordem original, oito módulos inertes “Em desenvolvimento”, abertura/fechamento/foco/scroll do menu móvel, Herói/avatar, Guilda/salão medieval, painel de gestão do líder e EBD com permissões existentes. Logout real e ausência de overflow horizontal verificados. Mobile também validado em paisagem844×390; emulaçãoWebKit não equivale a homologação física deSafari.

As onze opções são **Herói, Jornada, Missões, Equipamentos, Mochila, Loja, Coleção, Diário, Guilda, Arena e EBD**. Herói/Guilda/EBD usam rotas homologadas; os outros oito itens não têm links ou botões de operação. NegativasHTTP reais mantiveram403 emArena, ambas asTorre, equipamentos, loja, mochila, coleção, diário, mundos e autoridade econômica starter. Nenhuma negativa substituiu o documento ativo daEBD para mascarar erros.

**12/12checks adicionais deAuth/RLS PASS:** UID autenticado, workspace próprio e negação deViajante estrangeiro/atorEBD de outraGuilda, nos três perfis. Ator estrangeiro negado com403/SQLSTATE42501. São chamadas reais com contasTEST, sem mocks ou alterações nas políticas.

**12/12hashes remotos PASS:** novePNGs aprovados de equipamento e três corpos de avatar correspondem ao fonte. Dez composições aprovadas preservadas. Screenshots reais desktop/móvel e paisagem permanecem em`build/ui-restore-002/preview/` (privado), sem publicar sessões ou conteúdo das contasTEST noGit.

[Evidência consolidada sem secrets](UI-RESTORE-002-PREVIEW-EVIDENCE.json). QA/Security/DevOps pelo próprio autor, sem alegar revisão independente. Nenhuma mudança de runtime foi necessária nesta etapa.

## Produção e pendências

Alias oficial `rpgjovemcristao-web-inky.vercel.app` conferido antes/depois: mesmo deployment`dpl_H8VCqQx2vT8sqVzjDbpFYKnE1mSA`, SHA`808433a780e96a048c4a3f2d7e419351ab85e5a3`, targetproduction, READY. Nenhuma promoção ou merge. Não houve acesso ao SupabasePROD nesta etapa.

A Preview está disponível para revisão humana. **Aprovação visual ainda pendente; interface não liberada em produção.** Bloqueios anteriores de gameplay/reconciliação e os requisitos restantes daRELEASE_POLICY continuam vigentes. Esta entrega conclui a disponibilização daPreview, não declara DEPLOY_COMPLETE produtivo nem DONE para a homologação visual deUI-RESTORE-002.
