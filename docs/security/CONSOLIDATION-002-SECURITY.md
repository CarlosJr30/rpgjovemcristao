# Consolidação 002 — revisão de segurança pelo autor

Revisão pelo próprio autor nos perfis Database/QA/Security; não é auditoria independente. Escopo: pacote local, ensaio PostgreSQL e leitura autorizada de metadados Supabase/Vercel. Preparação local PASS; exposição da Preview **BLOCKED**.

## Evidência nova

- Fontes congeladas no lock: 13 SQL existentes e journal, sem alterar DDL, IDs, dados compatíveis ou economia. Manifesto/README/bytes verificados; recusas a fonte/manifesto/SQL adulterados, extra SQL, traversal e junction de saída exercitadas pelos três testes Node PASS.
- Instalação em PostgreSQL 17.6.1.166 descartável, imagem já armazenada, pull proibido, rede none, sem portas/binds, filesystem raiz read-only, usuário sem root e capabilities removidas. Cleanup confirma task label/rede antes de encerrar somente seu contêiner.
- Sete nós PostgreSQL PASS (pai + seis subtestes), defaults restritivos, isolamento conta/Guilda, convites pending, papéis/EXECUTE, missões/EBD sem crédito e Story sem recibo recusada. Nenhuma aula pronta no pacote; aula sintética só no banco descartável após instalação. Não houve teste em conta real.
- Catálogo estrutural completo, sem linhas de jogador/token bruto/chave/senha. RLS habilitada nas 32 tabelas é evidência de configuração local, não prova isolada de autorização correta. Testes verificam negativas de acesso além das flags.
- Leitura remota limitada a inventário de projetos/organização/plano/cotação e configuração/lista de deployments do Vercel de teste. Sem schema/Auth/log/linha de produção, chave, export de env ou alteração remota. A CLI usou sua autenticação existente e apenas GET; nenhuma credencial foi lida/impressa.

## Gates preservados

**ECON-LEGACY, P1:** baseline continua concedendo escrita própria em carteira/XP. A 001 reproduziu alteração em transação revertida; a 002 confirma a permissão sem conceder valores. Nenhum hardening/cutover 0078 autorizado ou realizado. RPCs antigas de concessão e outras superfícies de posse devem entrar na revisão própria antes de liberar economia. Botão oculto ou proteção do deployment não elimina chamadas diretas à API. `previewGo=false` permanece no lock e plano.

Onze mutations antigas de missões/aulas revogadas pelo SQL existente permanecem revogadas; não reabilitar para compatibilidade. Schemas guild_invite_private/story_private/guild_ops/ebd_ops não devem ser expostos em PostgREST. DEFINER exige identidade/ownership/grants/search_path, não somente SECURITY DEFINER; novas implementações privadas têm search_path vazio conferido. Não adicionar privilégios para resolver teste mal especificado.

Não foi identificado Supabase RPG de teste. Produção foi excluída pelo ref e os outros dois projetos não foram reaproveitados. A escolha da organização pelo usuário autorizou somente a cotação, que retornou zero mensal, sem criação/aceite de cobrança. Vercel de teste está protegido por SSO em todos os deployments e não tem deployments/env/Git vinculados. Não há origem HTTPS confirmada para Site URL/APP_BASE_URL/callback. O plano mantém campos nulos até confirmação, confirmação de e-mail ligada e Anonymous Sign-ins desligado no futuro alvo. Não copiar produção ou usar service_role no browser.

QA/Security remoto ainda exige projeto/ref/host isolados, defaults/ACL/RLS/REST/JWT reais, controle de caixas/e-mail, origem/callback/QR sob proteção, CI do SHA e autorizações separadas para criação, SQL, Auth/env e publicação. O método pinned-preview antigo não cobre este projectId/branch e não foi alterado ou contornado.

## Reworks e limites

Os logs iniciais foram conservados. Um check de contenção do diretório raiz do pacote foi corrigido no empacotador. Três expectativas do novo ensaio foram alinhadas ao contrato existente: iniciar missão antes de submeter, erro “Invite unavailable” para outra Guilda e gabarito permitido após resposta concluída (privacidade conferida antes). O SQL do produto não foi relaxado. A revisão acrescentou recusa de junction nos ancestrais da saída, com teste negativo PASS.

Lint focado PASS nos três MJS novos. TypeScript/build/browser reutilizados da 001 por ausência de mudança em app/TS/env/dependências; os seis cenários Guilda/EBD não foram repetidos. As negativas de concorrência/expiração/revisão dos testes históricos continuam evidência histórica específica, sem alegar nova execução. Não há teste end-to-end hospedado ou aceite físico.

As raízes/refs, arquivos pendentes, 001 e tarefas anteriores devem constar preservados no recibo final. Scan focado dos arquivos novos e diff/check conferem que não entram credenciais, .env, mídia, dependências, modificações de runtime ou SQL antigo. Aceite local não reclassifica publicação como concluída.
