# TASK-0050 — Avatar HD Runtime Activation V1 — DONE

HD aprovado ativo no runtime normal e no build local de produção: 52 candidatos +2 pilotos, todos HUMAN_VISUAL_APPROVED. Fallback legado preservado; Body-Fit pendente. Sem geração, alteração de saves, push, deploy ou serviço remoto. QA pelo autor, não independente.

## 1. Arquitetura antes

AvatarRuntime e gameplayAvatarPortrait já resolviam identidade central em avatarRuntime.ts. avatarHDPack.ts continha somente dois pilotos HD_READY, limitados a DEV/review. As demais52 artes aprovadas existiam somente em QA. [Mapa prévio de consumidores](AVATAR_HD_RUNTIME_CONSUMERS.md).

## 2. Mudança no resolver

Catálogo avatarHDApproved.json com54 identidades, SHA e approval real. selectAvatarHDAsset exige HUMAN_VISUAL_APPROVED, hash registrado, reviewer/timestamp, dimensões e paths allowlisted. O bloqueio DEV deixa de impedir os aprovados; preview HD_READY permanece isolado em DEV, sem aceitar REJECTED. O catálogo importa somente24.519 bytes de metadata, sem carregar PNG s.

## 3. Regra HD → legado

Identidade aprovada → PNG HD1024 ×1536. Entrada ausente/não aprovada → legado512 ×768. ErroHTTP/PNG corrompido/dimensão errada no renderer → legado; falha também do legado → procedural já existente. Retrato Canvas agora tenta próprio legado, com crop correspondente. Um único resolver define paths; telas não duplicam HD/legacy.

## 4. Arquivos alterados

Runtime: data/avatarHDPack.ts, avatarRuntime.ts, gameplayAvatarPortrait.ts; components/avatar-runtime.tsx, snake-chase-game.tsx; dev/avatar-runtime-panel.tsx. Novo data/avatarHDApproved.json e52 PNG s byte-exatos em public/assets/avatar/hd/{male,female}/. Dois pilotos existentes intactos. apps/web/package.json passa a executar scripts/avatar-hd-runtime-audit.mjs antes de next build (comando explícito, pois ignore-scripts=true impede lifecycle hooks). Sem dependências alteradas.

Testes: avatar-hd-pack, avatar-runtime, progression, equipment-overlays, snake-chase-game; E2 E avatar-runtime, avatar-runtime-lab e novo avatar-hd-activation. Documentos: mapa, manifest de ativação, arquivo durável da aprovação original dos pilotos, este relatório, FINAL-CHECKS, fila e memória. next-env.d.ts regenerado pelo Next; nenhuma alteração manual de suas regras.

## 5. Consumidores migrados

Todos já usavam a fonte central, direta ou via Avatar/EquippedAvatar. Ativação central alcança Create, Intro, Home/Jornada, Shell, Hero, Equipment, Garden, Arena e minigame. Guilda/Diário recebem thumbnail do Shell. Sem path legado hardcoded em telas normais; paths legados ficam no adapter, fallback e fixtures/QA.

## 6. Home/Jornada

Seleção/card e thumbnail ativo em HD; criação, Intro, reload e troca de Viajante cobertos. Sem mudança de UX/progressão. Frames/imagens com proporção2:3 preservada.

## 7. Equipamentos

Base HD no Portal e Hero. Cinematic equip, comparação, slots, filtros, stats e itens equipáveis mantidos; testes de Portal e fixtures READY passam. Overlays reais atuais não receberam novos READY; gating por corpo/aprovação continua igual.

## 8. Arena

Jogador usa mesmo HD no modo arena; combate completo/recompensa/histórico e mobile PASS. Engine, ataques, hit/dodge/specials e animações não alterados; unit existentes PASS e reduced motion exercitado. Cabeça/pés e escala do canvas preservados. Layout apertado da ficha em landscape915 ×412 também aparece com legado, conforme screenshots pareadas; nenhuma correção de UX nessa task.

## 9. Minigame

Mesma identidade HD, crop300/0/424/410; legado150/0/212/205. Novo fallback de carregamento/crop proporcional, sem modificar engine/regras. Canvas desenha HD real1024 ×1536; E2 E comPNG inválido confirmou retrato legado e recuperação paraHD no reload. Usa mesmaURL/cache do avatar, sem asset de cabeça gerado.

## 10. Guilda

Thumbnail HD pelo Shell; ações, aprovação/recompensas/histórico, teclado, imagens faltantes e seis tamanhos PASS. Regras/UX não alteradas.

## 11. Diário

Thumbnail HD pelo Shell; empty/records/reflexão/privacidade e fluxo devocional existente PASS. Regras e conteúdo não alterados.

## 12. Save compatibility

Adapter mantém gender/face/hair/traveler/equipment IDs; sem nova propriedade persistida ou migração. Caller antigo sem avatar usa default existente. Todas54 combinações de aparência e IDs de rosto/cabelo1/2/3 passam. E2 E compara saves antes/depois de navegação e troca. Face continua precomposta: preservar faceID não significa gerar rostos adicionais.

## 13. Body-Fit

Canvas lógico512 ×768, físicoHD1024 ×1536. Nenhuma alteração de Body-Fit, anchors, manifests, equipamento ou promoção READY. Auditoria preservou800/815 arquivos da baseline;15 alterações autorizadas de runtime/testes/build/generated types estão enumeradas no audit. Todos os PNG s/fontes aprovadas,163 legados,2 pilotos e arquivos Body-Fit permanecem intactos. Hash dos54 públicos corresponde ao aceite humano e fonte nativa disponível.

## 14. Performance

Pack54:117.434.147 bytes (~112 MiB) estáticos; não embutidos no JS e sem preload global. Por avatar amostrado, ~2,16–2,26 MB frio; decodificaçãoRGBA estimada6 MiB versus1,5 MiB legado, sem medir heap/GPU total. Metadata24.519 bytes. Thumbnail/card lazy; full/hero/arena eager; prioridade alta só quando solicitada. Página normal solicita uma identidade, URLs compartilhadas reutilizam cache.

48 amostras pareadas em seis tamanhos/4 rotas, cache desativado: HD LCP120–408 ms no hardware local; zero diferenças nas dimensões finais do canvas entreHD/legado. Não é benchmark de celular físico/rede limitada. CacheHTTP public,max-age=0, ETag presente; HEAD200 e GET condicional200 na inspeção, sem alegar immutable/304. Navegações quentes de E2 E registraram300 bytes transferidos por imagem.

CLS global chegou0,956 emHD e0,878 emlegado; fontes das mudanças são Shell/appLayout/footer/header na hidratação, também reproduzidas com legado. Frequência varia com o primeiro paint; não foi isolado um efeito causal do HD. O canvas do avatar conserva espaço/proporção. Impacto local de carregamento e geometria aceito neste escopo; estabilidade global do Shell exige otimização separada, sem alegar CLS geral saudável.

## 15. Screenshots/viewports

390 ×844,412 ×915,844 ×390,915 ×412,1440 ×900,1920 ×1080.249 screenshots: páginas, fallback, comparação HD/legado, lab e DPR1/2/3. [Índice local](../../build/task-0050-evidence/index.html). Representativos male/female, short/curly/long e light/medium/dark; comparação pareada sem rever52 artes. Autor inspecionou mobile/landscape/desktop, retrato e par Arena915 ×412; sem alegar de QA independente.

## 16. Fallback tests

Unit: aprovado, missing entry, sem proof/invalid path/shape, rejeição inclusive DEV, save antigo, dimensão errada, HD→legado→procedural e retry por identidade. Portrait: decode error/dimensão errada/cleanup. E2 E: abortHTTP, PNG inválido, ambos corpos, recovery/reload, fallback duplo emlab, sem blank/crash. Retrato legado crop medido pela instrumentação drawImage real.

## 17. Bugs encontrados

Catálogo obsoleto não representava52 aprovados. Portrait loader não tentava legado. Preview antigo podia aceitar REJECTED emDEV. Comparação lab passaria a mostrarHD sob labelLegado após ativação. .npmrc desativa lifecycle hooks. CLS de hidratação e ficha Arena landscape estreita também existem emlegado; limites registrados, sem mascarar.

## 18. Bugs corrigidos

Catálogo completo/aprovação real epaths públicos; fallback retrato com crop correto e lifecycle estável; rejeição deREJECTED; ladoLegado do lab usa legacySource central; auditoria explícita no comando build, sem mudar políticaignore-scripts. Nenhuma imagem editada/redesenhada. Rollback central possível retornando legado no selector, mantendo imagens e saves; exige checks da mudança, sem apagar legado.

## 19. Unit

62 arquivos/393 testes PASS com2 workers; após dois casos novos, arquivo alterado14/14 PASS (395 testes únicos cobertos na combinação). Primeira execução global paralela teve4 timeouts emtestes não alterados; nenhuma extensão de timeout, correção por limitarworkers. [Logs](../../build/task-0050-evidence/unit.log), [revalidação14](../../build/task-0050-evidence/unit-final.log).

## 20. E2 E

Produção44 PASS,16 skips previstos por projeto/viewport com cobertura correspondente. Após build final,6/6 PASS. Lab3/3 PASS:54 identidades,5 modos,6 tamanhos,DPR1/2/3 e fallback. [Produção](../../build/task-0050-evidence/e2 e.log), [final](../../build/task-0050-evidence/production-final.log), [lab](../../build/task-0050-evidence/lab.log), [DPR/fallback](../../build/task-0050-evidence/lab-details.log).

## 21. Lint

npm run lint PASS; ESLint final também cobre auditor/teste modificados após a suíte global. Diff whitespacePASS, apenas avisosLF/CRLF normais do git. [Log](../../build/task-0050-evidence/lint-final.log).

## 22. Typecheck

npm run typecheck PASS, todos workspaces e raiz. [Log](../../build/task-0050-evidence/typecheck.log).

## 23. Build

npm run build PASS: auditoria de aprovação/hash54 antes do Next,20 rotas geradas, sem dependências novas. Build pode ser executado sem originais QA em build/; os PNG s públicos devem sempre bater com receipts duráveis. Preservação específica da baseline só roda quando baseline local existe. [Logfinal](../../build/task-0050-evidence/build-final.log), [audit](../../build/task-0050-evidence/asset-audit.json).

## 24. Produção local

Next start local: HD servido com tamanho/hash certo e fallback funcionando; lab/endpoint DEV404, sem link na UI. /assets/avatar/hd/ são pathsnormais, sem build/QA/DEV-source na UI. Servidores de validação encerrados; nenhum serviço existente do usuário encerrado. Sem deploy/push/remotos.

## 25. Pendências

Body-Fit continua pendente, sem READY. Otimizar CLS global de hidratação e layout estreito da Arena em etapa própria; existentes também no legado. Performance em celular real/rede limitada não coberta por emulação local. Nenhuma pendência funcional bloqueante do runtimeHD neste escopo; publicação externa não foi autorizada.

## 26. Status final

TASK-0050 DONE. HD aprovado preferido em runtime normal e build local deprodução. Legado preservado como fallback;52 aprovados dafila+2 pilotos,0 pendências visuais/geométricas ativas. Aprovação técnica de runtime não promove Body-Fit nem autoriza deploy. [Checks finais](TASK-0050-FINAL-CHECKS.json) e [manifest/proveniência](AVATAR-HD-RUNTIME-ACTIVATION-MANIFEST.json).
