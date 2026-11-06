# RPG-ARENA-VISUAL-003 — apresentação cinematográfica das cartas

06/11/2026. **Implementado localmente; CI, Preview e publicação pendentes.** A Arena e a Torre reutilizam o seletor compacto e o pop-up acessível de cartas. A confirmação envia uma única ação pelo motor existente; a animação de 6,5 s pode ser pulada e respeita movimento reduzido. A carta usada e o resultado continuam vindo do estado real da batalha.

- Reutilizados `BattleCards`, `ArenaBattleActions`, ilustrações oficiais e `useBattlePresentation`; nenhuma regra, atributo, IA, economia, Auth/RLS, dado ou migration alterados.
- Testes focados: **17 PASS** em dois arquivos; ESLint, TypeScript, build, Prettier e `git diff --check` PASS. Nenhum combate completo ou fluxo econômico repetido.
- Próximos gates: CI obrigatório no SHA final, Preview visual mínima na Arena/Torre e larguras 320/390/desktop; depois merge/publicação e conferência oficial.

Ainda não publicado. Homologação visual hospedada e estado final de produção serão registrados após os gates.
