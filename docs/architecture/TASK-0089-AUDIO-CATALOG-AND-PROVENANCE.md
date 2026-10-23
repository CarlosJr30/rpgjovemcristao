# TASK-0089 — Catálogo e proveniência

20 slots pendentes em `apps/web/features/journey/audio/audio-catalog.ts`: menu, garden, exploration, snake, arena, tower, boss, devotional, reward, guild, ebd e `world:{origins,patriarchs,liberation,promised-land,kings,return,jesus,church,new-creation}`. Guilda/EBD representam separadamente o décimo ambiente solicitado. Todos: `approval:pending`, `path:null`, `durationSeconds:null`, `rights:null`, versão 1. Loop desativado apenas para a assinatura reward. Volumes são orientação de mix, sem aferição de uma gravação. Contextos legados journey/quiz mantidos no manager, sem inventar novas faixas.

Os três títulos Forged for the Journey, Banners of the Dawn e Courage of the Young Hero são referências pendentes, sem path. Os75 s do último são duração desejada, nunca duração medida. Não foi identificado vínculo verificável entre títulos e arquivos. Não houve busca/download externo.

## Fontes locais auditadas

| Arquivo relativo a `assets-source/arena-audio-prototype/audio/` | SHA256 |
| --- | --- |
| music/arena_training.ogg | `9fd927742b21cbfc397a4b4b9fa85a988a07777d60b7d6b932b67aa949fab8bf` |
| effects/arena_attack.ogg | `c0d9c0b7e6816704622ec70211d1d3c82b0b0a9efd0b5fa947218d647a38b484` |
| effects/arena_defense.ogg | `12bffebca55bbfef7333534206c71e373270bc5de85970553f2bd63161b1027f` |
| effects/arena_dodge.ogg | `5f32b1b09a21c72ac89de150b65a3503554174440cff2033d5b36c959af4ffb8` |
| effects/arena_focus.ogg | `e186d41474f14690af308c197c734ecaf1d7bee7912b7e325cf3baeac8030203` |
| effects/defeat.ogg | `90ade25672796deab35fde94cbf824a1b3f7cb9b2f69cb7308e8dec2914718ff` |
| effects/player_hit.ogg | `f95d37ed16d56f278a5d592317c6539efa9a0dc08441e5a830d46f80b97e892b` |
| effects/victory.ogg | `7c18cc1013e887e37980f6c9c199fda1626a7f1cca0e688ff621c3330ef0d945` |

Lista completa dos oito arquivos, tamanhos e hashes no recibo local `build/task-0089-dynamic-audio/audio-provenance-audit.json`. Conferidos com `docs/architecture/audiovisual-pack-approvals.json` e `PROTOTYPE-AUDIO-ISOLATION-V1.json` existentes, assinatura OggS e ausência de cópias públicas. Esses artefatos de aprovação e todos os áudios foram preservados.

Fonte declarada histórica: confirmação explícita de Carlos para protótipo/desenvolvimento não comercial Suno Free. Autoria declarada: geração por Suno Free, atribuição de proveniência sem exclusividade presumida. Licença registrada: `SUNO_FREE_NON_COMMERCIAL`. Permissão comercial: **false**. Revisão histórica de 2026-10-05 não equivale a nova homologação para produção. Não houve nova aprovação, validação jurídica ou mudança de termos.

## Fronteira de aprovação

O slot não controla o player. Somente os catálogos auditados existentes `APPROVED_MUSIC` e `APPROVED_EFFECTS` fornecem bindings de produção; ambos continuam vazios. `isApprovedAudioAsset` valida formato de path/licença declarada, e não verifica direitos por conta própria. A cadeia de revisão/build existente é a fronteira de aprovação: não substituir evidência por uma string de licença.

Quando houver autorização futura para mídia, preencher e revisar fonte/autoria/licença/permissões/revisor/evidência/hash, conferir arquivo, duração, direitos de redistribuição, loop e mix antes de incluir no catálogo auditado. Metadados pendentes permanecem inertes. Bindings sintéticos existem apenas em testes e FakeMedia, sem arquivos e sem inclusão no build de produção.

## Raridades e disponibilidade

Comum→chest_common; Incomum→chest_uncommon; Raro→chest_rare; Épico→chest_epic; Extraordinário (ID legado lendário)→chest_extraordinary. Todos pendentes. Sem fallback para sons aleatórios ou protótipos da Arena.

Cache4/preload none e isolamento de produção foram verificados. Tamanho, compressão, encaixe de loop e volume percebido de futuras faixas são pendências de mídia; testes com elementos simulados não comprovam qualidade audível.
