# Consolidação001 — revisão de fronteiras

2026-10-20. Autor assume QA/Security, sem revisão independente. Inspeção local e testes sintéticos; nenhuma exploração de serviço real, leitura de dados reais, advisor remoto ou nova auditoria de dependências. **Preparação local validada; disponibilização da Preview BLOCKED.**

## Evidências e limites

| Fronteira | Evidência nesta consolidação / reutilizada | Conclusão |
| --- | --- | --- |
| Auth/identidade | AuthProvider verifica getUser nos eventos; server de convite valida sessão e origem configurada; testes selecionados de Auth/retorno/QR | Fronteira cliente/servidor preservada localmente; JWT/RLS hospedados continuam sem aceite |
| Conta anônima | QR/missão/EBD negam; baseline antigo de Avatar não verifica is_anonymous | Gate de Anonymous Sign-ins/configuração e autorização servidor obrigatório antes da Preview autenticada |
| Guilda/EBD | PostgreSQL cumulativo nega ator de outra conta, anônimo e membro sem papel; módulos compartilham mesmo actor/guild após cutover | Não foi criado papel, identidade ou carteira paralelos. Propostas dependem de aplicação/ACL real |
| Recompensa duplicada | Testes de intent/receipt/idempotência e E2E de revelação/reload; histórico0082/83 sem payout | Apresentação/decisão não concede. Idempotência econômica remota não demonstrada nesta tarefa |
| Especiais/uso de carta | Testes de battle-actions/storage existentes e catálogo aprovado vazio | Produto não habilita batalha sem sete cartas possuídas; replay local não é antifraude |
| Estado econômico legado | Novo diagnóstico offline alterou XP/saldo próprios em transação e reverteu; auth.users sintéticos e zero dado real | **P1 herdado reproduzido, não corrigido.** Bloqueia habilitar estado econômico; esconder UI não fecha API |
| Convites/tokens | API sem Bearer retorna401/no-store/no-referrer; geração local de QR/origem validada em unitários | Sem log de token completo. Não efetuar envio, compartilhamento ou leitura remota por esta tarefa |
| Fixtures/áudio | Build com catálogos oficiais vazios; gate protótipo948 artefatos/8 hashes; scan de JS por marcadores de harness | Nenhuma mídia não licenciada ou carta sintética promovida |
| CI/Vercel |25 testes locais do protocolo e eligible=false; projectId fixo antigo diverge do alvo autorizado de teste | Não executar hook/pinned-preview antigo nem atualizar hashes para tornar a branch elegível |

## Achados e ação necessária

**ECON-LEGACY/P1:** políticas/grants baseline permitem que a conta escreva o próprio XP e wallet. O teste registra a reprodução e restaura a fixture por ROLLBACK; isso não corrige nem aceita o risco. Revisar no contrato0078 a autoridade e todos os canais de escrita/concessão, incluindo stats/inventory/equipped/chests/RPCs, e demonstrar negação com JWT real. Não alterar a economia nesta consolidação. Para Preview mínima sem economia, retirar a superfície da API e impedir/avisar os fluxos dependentes mediante implementação revisada específica; atualmente esse perfil não está aplicado.

**PIPELINE-TARGET/P1:** código do publicador fixa `prj_mG2ZSDaSc5i2Pz2uqKSlCzSGiVmG`; o projeto de teste autorizado registrado é `prj_qKzjXMVXwiVpGlU66SoTA71mStXX`. Não inferir equivalência, nome atual ou produção pelo ID. Além disso, a revisão de demonstração exige arquivos/branch diferentes. Gate preserved e não elegível é o resultado correto. Publicação futura exige método/projeto/SHA/CI/proteção explicitamente revisados.

**ENV/AUTH/P0:** sem identidade do alvo de teste e configuração comprovadas, não há Preview conectada segura. Ausência de backend de teste foi observação histórica0080; estado externo atual desconhecido. Nenhuma criação/config/secret foi tentada. Não substituir por URL/chave de fixture ou endpoint de produção.

Bloqueios de mídia, catálogo e conteúdo podem ficar P2 quando as capacidades correspondentes permanecem indisponíveis e claras. Eles não impedem por si sós testar módulos não econômicos seguros. Nenhuma dependência DEV foi atualizada/auditada novamente; decisão e riscos históricos0080 permanecem, sem novo aceite implícito.

## Preservação e publicação

SQL/manifestos/lockfile/contratos anteriores íntegros em relação à base consolidada. Runtime alterado somente no CSS do hero Guilda, após reprodução da sobreposição dos links de membros/EBD; seis E2E posteriores verificaram funcionalidade e geometria nos três navegadores. Sem mudança de JSX/ações/permissões/economia. Correções do ensaio: fixture de lista vazia, porta de execução herdada, propriedade guildId, espera de consulta e navegação por links para não descarregar frame com prefetch WebKit pendente. Nenhum erro coletado foi filtrado para passar.

Sem push/deploy/fetch/merge/main/remoto/Supabase/produção/dados reais. O checklist operacional descreve futuras autorizações e testes hospedados; não constitui autorização nem GO. Banco offline usou imagem local existente com `--pull=never`, rede none, filesystem read-only, sem portas/bind e com cleanup verificado por label. Logs e recibos devem conter apenas hashes, nomes de variáveis, contagens e identidades sintéticas, nunca credenciais.
