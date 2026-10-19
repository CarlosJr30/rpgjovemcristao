# TASK-0079 — Menu do perfil no celular

STATUS: ACTIVE
AUTHORIZATION: Carlos em 19/10/2026 solicitou corrigir o deslocamento mostrado na captura e publicar na Vercel.
OBJECTIVE: Manter o menu do perfil inteiramente visível em telas móveis.
SCOPE: CSS do popover, validação responsiva e publicação isolada a partir da main af6fd41; autor assume Frontend/QA/DevOps/Security, sem subagentes.
OUT_OF_SCOPE: Economia, banco, dados de jogadores e encaixe visual de equipamentos.
ACCEPTANCE_CRITERIA: Menu sem recorte horizontal em 320/360/390/412/768/1024px; desktop preservado; build/lint/tipos pertinentes aprovados; publicação READY e versão pública verificadas.
TEST_PLAN: Inspeção de geometria do menu com fixture local, rolagem e ações; checks de qualidade e confirmação do deployment.
RELEASE_EXCEPTION: Carlos em19/10/2026 autorizou expressamente “Pode subir mesmo assim para o Vercell”, após informado do bloqueio da validação visual. Publicar o ajuste CSS isolado com QA visual pendente registrado; preservar CI/proteções e verificar deployment público. Não registrar teste visual PASS nem estender a exceção à implantação econômica.
SECURITY: Alteração exclusivamente CSS, sem segredos, rede adicional ou alteração de autorização. Revisão pelo autor.
DEFINITION_OF_DONE: Evidências registradas, publicação verificada e memória atualizada; teste físico do usuário pendente até relato.

RESULTADO_2026_10_19: CSS corrigido: ancoragem à esquerda até 1024px, largura limitada à viewport e rolagem vertical. npm ci reproduzível concluído pelo cache após limitações do sandbox. Lint, typecheck, build Production e dois testes existentes de shell PASS. next-env gerado pelo build restaurado. Teste E2E específico adicionado com oito tamanhos; execução Edge falhou antes do jogo carregar (página do navegador “This page couldn’t load”), sem comprovar layout. Tentativa Chromium não executada: revisão automática expirou e a única repetição autorizada também expirou. Não contornar revisão. QA visual pendente, publicação não iniciada, sem commit/push/merge/deploy. Desbloqueio: revisão automática funcional para executar teste local no Chromium; depois revisar resultado, publicar por PR/checks e verificar produção. Segurança revisada pelo autor: CSS apenas, nenhum segredo ou alteração de dados/autorização. Não DONE.
