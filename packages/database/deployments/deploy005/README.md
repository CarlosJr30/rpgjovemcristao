# DEPLOY-005 — migração incremental de produção

Autorização do usuário em 2026-10-23 para migrar Supabase de produção com backup/validação e publicar na Vercel. Alvo exclusivo: `wspafhlbtlpabypzymjo`; nenhum dado ou credencial do projeto de testes é importado.

O banco existente já contém a base0000–0004 e0006–0008. A comparação do catálogo com um snapshot restaurado confirmou funções, colunas, políticas e triggers. A receita seleciona somente0005, convitesQR, Story, missões, EBD, EXPAND e autoridade3, verificando os hashes congelados dos contratos002/004. Não aplica0000 novamente nem CONTRACT0010 alternativo, não semeia cartas/vídeos/prêmios e não reconcilia automaticamente valores legados.

`recipe.mjs` gera o corpo de **uma transação**. O chamador deve fornecer guarda revisada da estrutura de produção e executar o corpo com a fronteira transacional do aplicador de migrations. Não executar como SQL solto em autocommit. O corpo define timeouts, verifica a base, aplica defaults restritivos, os sete SQL revisados e o gate de liberação de protocolo3. A revogação provisória de acesso não é visível fora da transação; erros revertem o conjunto.

Pré-requisitos para aplicação remota: snapshot atualizado com restauração comprovada; ensaio da receita sobre cópia representativa; fonte/env/CI de produção preparados; coordenação da promoção e validações de Auth/ACL/RLS. O backup anterior serve ao ensaio, não comprova frescor de dados atuais. Metadados, hashes e resultados ficam em evidências; dados, hashes de senha e credenciais permanecem privados fora do Git.

O rollback de erro dentro da transação é testável. Após commit, voltar o site anterior não reverte o contrato do banco e não é uma recuperação suficiente: usar roteiro compatível ou recuperação do backup sob manutenção. Não restaurar sobre produção como teste.
