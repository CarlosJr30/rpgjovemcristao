# Revisão de segurança — Painel do Líder V2

- A tabela `guild_lessons` habilita RLS e concede ao browser somente `SELECT`. A política exige membership ativa na mesma Guilda; rascunho e cancelamento ficam restritos ao líder.
- Escritas usam funções `SECURITY DEFINER` com `search_path` vazio, identidade conferida por `owns_traveler` e papel ativo de líder conferido no banco. Missão relacionada deve pertencer à mesma Guilda. Publicação requer conteúdo e data.
- O perfil público verifica que solicitante e alvo pertencem à mesma Guilda ativa. Retorna apenas nível e contagem de missões concluídas; não consulta dados privados do membro.
- Recompensas continuam calculadas pela lógica preexistente no banco. Aulas e progresso coletivo não concedem XP, moedas ou Baús extras.
- URLs bíblicas são limitadas a `https://www.bible.com/`; texto e listas possuem limites. O histórico de aulas grava somente tipo, ator e ID, sem conteúdo devocional.

Revisão estática local concluída sem achado crítico conhecido. Falta executar 0005 em ambiente remoto e comprovar as políticas com contas distintas.
