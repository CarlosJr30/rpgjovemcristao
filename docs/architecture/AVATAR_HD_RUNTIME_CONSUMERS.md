# AVATAR_HD_RUNTIME_CONSUMERS — TASK-0050

Auditoria antes de mudar comportamento: avatarRuntime.ts chama avatarHDPack.ts; catálogo só contém pilotos HD_READY e exige development + reviewPilot/NEXT_PUBLIC_AVATAR_HD_LAB. Produção/normal usa legado. AvatarRuntime já implementa HD→legado→procedural e valida dimensões no load. Retrato resolve identidade central, mas loader Canvas não tenta legado e usa cor de fallback. Nenhum consumidor de jogo usa path legado hardcoded fora do adapter/fixtures/tests.

| Tela/componente | Modo | Origem anterior | Origem desejada | Fallback |
|---|---|---|---|---|
| Create / Avatar wrapper | full | resolver legado | resolver HD aprovado | legado → procedural |
| Intro | card | resolver legado | resolver HD aprovado | legado → procedural |
| Home seleção / jornada | card / thumbnail | resolver legado | resolver HD aprovado | legado → procedural |
| Shell (Guilda/Diário inclusos) | thumbnail | resolver legado | resolver HD aprovado | legado → procedural |
| Hero / EquippedAvatar | full | resolver legado | resolver HD aprovado | legado → procedural |
| Equipment Portal / EquippedAvatar | full | resolver legado | resolver HD aprovado | legado → procedural |
| Garden exploration | full | resolver legado | resolver HD aprovado | legado → procedural |
| Arena FighterPortrait | arena | resolver legado | resolver HD aprovado | legado → procedural |
| Snake/minigame | portrait Canvas | resolver legado; head crop normalizado | mesma identidade HD; crop 2× | legado com crop proporcional → desenho existente |
| DEV avatar lab | thumbnail/card/full/hero/arena | normal legado + pilotos opt-in | mesmo resolver aprovado; lab preservado | legado → procedural |

Body-Fit: composição existente usa canvas lógico512×768 e placement normalizado. Sem mudança de overlays/anchors/manifests/READY. Guilda/Diário não têm identidade própria; recebem avatar do Shell. Face IDs1/2/3 são preservados em save, mas arte precomposta não muda por face ID. Cabelo visual vem de appearance, IDs legados permanecem intactos.

## Estado após TASK-0050 — DONE

Todos os consumidores acima agora usam HD aprovado pelo resolver central no runtime normal e build local de produção. Fallback legado preservado; portrait ganhou fallback com crop proporcional. Lab continua somente DEV e conserva comparação com legacySource; endpoints DEV são 404 na produção. Nenhuma tela de jogo recebeu lógica própria de HD/legacy.
