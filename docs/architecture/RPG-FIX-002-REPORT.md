# RPG-FIX-002 — Arena, Loja e interface

03/11/2026 — ACTIVE, main1220cdb preservada, incremento próprio. Nenhuma migration ou mudança econômica autorizada/necessária nesta preparação.

Inventário: seis equipamentos no catálogo atual e no catálogo da PR12: Botas, Elmo, Medalhão, Espada, Couraça e Escudo. Somente Espada35/Couraça65/Escudo115 possuem oferta produtiva homologada. Botas são iniciais, Elmo tem origem em loot aprovado e Medalhão depende de aquisição/progressão própria; não há autorização para vendê-los. Artes/overlays por corpo e gênero não representam produtos novos. PR12 não integrada.

Baús existentes têm artes e mecanismos reutilizáveis; compra autorizada somente comum40. Comum/épico possuem tabelas comunitárias aprovadas, mas épico não tem preço de venda aprovado; raro e demais tiers não têm contrato completo para venda. Nenhum produto/preço/probabilidade novo será inventado.

Menu: leitura no domínio oficial confirmou um sidebar/main; sequência Equipamentos→Arena→Loja manteve um de cada. Proprietário confirmou falha na Loja com treino QA ativo, sem sequência/navegador conhecidos; autorizou investigação focada das transições QA e manutenção como pendência se não reproduzida, sem bloquear outras correções. Nenhuma cópia ocultada com CSS ou menu refeito.

Cartas: onClick montava sete cartas, mas mantinha o foco no botão e inseria o painel abaixo das ações; o ensaio capturou essa geometria, sem demonstrar falha do motor. Componente existente agora leva foco/rolagem ao painel e oferece fechamento explícito; textos de Foco, nível, efeitos e uso único permanecem da autoridade original. Ensaio Chromium1365/390 emulado confirmou foco/título visível, efeito pelo motor, carta usada indisponível e foco restaurado, sem conceder carta. Fixtures locais não são prova hospedada.

Loja: mesmas quatro ofertas em grade responsiva, imagens existentes72px, raridade/efeito/preço/botão visíveis e explicações extensas recolhíveis; filtros Todos/Baús/Equipamentos não enviam compras. Login normal QA TEST no bundle local confirmou quatro produtos, imagens carregadas e larguras1365/320 sem overflow, sem comprar. Torre mantém 0/7/bloqueio e orienta o starter manual publicado.

Menu: transições QA concluídas (sair/ativar) também mantiveram um sidebar/main. Sem reprodução, **pendência registrada; navegação não alterada**, conforme orientação posterior do proprietário. Primeiro probe consultou estado antes da resposta assíncrona; repetido somente esse par esperando o rótulo confirmado.

Local:9unitários afetados PASS (incluem3novos); recheck dos2testes de Loja após correção de tipagem não soma casos. Lint direcionado/tipos/build TEST PASS; gate de protocolo pelo CI obrigatório. Falhas preservadas: import NextLink incompatível com harness Vite puro, removido em favor de link HTML no fallback; seletor de título amplo e opção exact indevida no teste corrigidos sem mudar limites/assertions/motor/Auth/RLS. Primeiro startup do coletor usou caminho relativo inadequado; corrigida somente preparação. CI/Preview/publicação pendentes; zero migrations ou concessões.
