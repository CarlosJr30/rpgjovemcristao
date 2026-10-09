# TASK-0044 — Guild Visual Pack Integration V1
ID: TASK-0044
TITLE: Integração dos seis assets reais da Guilda
OBJECTIVE: Arte real integrada na apresentação existente com fallback, acessibilidade e gates físicos/humanos válidos.
PRIORITY: P1 High
STATUS: DONE
SCOPE: Autorização explícita TASK-0044: componentes/CSS Guilda, pipeline/manifests/receipts/catálogo visual, testes, hashes/inspeção, evidências/docs/memória. Autor assume Frontend/QA/Security sem subagentes. Extensão do pipeline limitada a slots Guilda e escrita somente visual auditada, preservando gate e catálogos de áudio.
OUT_OF_SCOPE: Arquivos de mídia/novas conversões/geração, domínio/filtros/economia/workflow/saves/Auth/Supabase/migrations/Arena/combate/equipamentos, instalação/push/deploy/publicação/Git destrutivo.
DEPENDENCIES: TASK-0043; seis arquivos físicos e aprovação fornecida pelo usuário.
REQUIRED_CONTEXT: contexto/estado/regras/workflow/security; perfis Frontend/QA/Security já aplicados; GuildHero/CSS/GuildRewardDetails/PackArtwork/pipeline/testes.
SECURITY_CONSIDERATIONS: Hash, realpath, decode, formato/dimensões/alpha e aprovação real. Não enfraquecer licenças; Suno Free permanece bloqueado para produção comercial. Nenhum dado privado novo.
ACCEPTANCE_CRITERIA:
- Seis arquivos íntegros, hash e metadados corretos, receipts reais Carlos Faustino/OpenAI/original conforme pedido.
- Salão responsivo cover com fallback CSS; banner/decoração/mesa/baú somente contextual; sem texto em imagem ou prêmio inventado.
- Seis viewports, keyboard/reduced/fallback/performance e checks afetados PASS; bytes e regras preservados.
TEST_PLAN: Sharp metadata/stats/full decode, auditor visual e global distintos, unit e E2E Guilda, screenshots/inspeção nos seis viewports, lint/typecheck/build, preservação.
DEFINITION_OF_DONE: Aceite local comprovado, QA/Security pelo autor explicitados, docs/memória atualizadas, nenhuma falsa licença/asset aprovado.

## Aceite — 2026-10-06
- Seis arquivos físicos: Sharp metadata/stats/decode failOn=warning PASS, formatos/dimensões exatos, três PNG alpha real/três WebP opacos, SHA-256 real em physical-validation.json. Usuário fornece aprovação Carlos Faustino/OpenAI/original; seis receipts completas, reviewedAt real 2026-10-06T04:13:54.861Z.
- Cinco slots tipados Guilda, seis arquivos incluindo responsive mobile. Auditor visual-only usa os gates originais: PASS/12 visuais VALIDATED/3 portais anteriores MISSING; --write somente visual executado. Global exit 1 por oito Suno Free; allowlist e catálogos de áudio intactos. Não conceder produção comercial aos áudios Arena.
- Salão em picture <=760px/cover, banner contain, pergaminho decorativo 0,14, mesa do líder contextual, baú apenas quando chestQuantity>0 e contexto aprovado/concluído/especial. Next Image decorativo unoptimized, lazy; CSS fallback e conteúdo/actions preservados em erro.
- SELF VALIDATE/QA: unit 7 arquivos/26 PASS; E2E 12 PASS +2 nomes longos/fora da Guilda PASS. Seis viewports Player/Leader com keyboard/reduced/overflow/mobile source/naturalWidth; falha de todas imagens permite envio/aprovação; recompensas únicas/histórico/regressão preservados. Lint/typecheck/build PASS, 20 rotas. Inspeção visual dos seis tamanhos, sem editar imagens.
- REWORK: img decorativo/aria-hidden no picture corrigidos sem suprimir lint; expectativa unit normaliza pathname de URL Next Image. next-env alterado pela geração Next foi restaurado byte a byte do baseline e tipos web rechecados. Nenhuma falha intermediária contada PASS.
- Security/QA pelo autor, não independentes; sem achado alto/crítico local. Nenhum Supabase/RLS/sessão online real acessado. Logs/capturas/preservação em build/task-0044-evidence. Originais e source fora do escopo preservados.
- Relatório: docs/architecture/GUILD-VISUAL-PACK-INTEGRATION-V1.md; Security: docs/security/GUILD-VISUAL-PACK-INTEGRATION-V1-REVIEW.md. Memória atualizada. DONE para integração técnica local; nenhuma pendência bloqueante dos visuais. Validação remota prévia Guilda/bloqueio comercial Suno Free continuam, sem push/deploy/publicação/instalação/Git destrutivo.
