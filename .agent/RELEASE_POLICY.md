# Publicação das alterações aprovadas

Regra permanente autorizada por Carlos na TASK-0066:

**Implementar → Testar → Validar Segurança → Commit → Push → Deploy Vercel → Verificar Produção → Teste Físico do Usuário.**

Toda alteração funcional ou visual aprovada do RPG inclui esse fluxo completo de publicação no projeto Vercel existente, salvo instrução explícita em contrário ou bloqueio de segurança. O contrato ativo delimita a alteração autorizada; esta regra não autoriza novas funcionalidades, banco, migrations, materiais sem licença ou Git destrutivo.

Um resultado somente local não conclui a tarefa. Gate obrigatório falhou: REWORK, sem publicar. Deploy bloqueado: registrar o motivo e preservar trabalho. Após gates, revisar staging seletivo e ausência de segredos, fetch/ausência de divergência, commit e push normal origin/main; acompanhar o automático, sem duplicá-lo, verificar READY/hash/URL/rotas/UI/mídia restrita e atualizar memória/checklist.

DEPLOY_COMPLETE exige publicação e validação pública comprovadas. O teste físico cabe ao usuário e permanece explicitamente pendente até seu resultado; emulação não equivale a aparelho real. Não realizar deploy adicional apenas para documentação de encerramento. Não alterar Supabase, saves ou licenças sem autorização específica.
