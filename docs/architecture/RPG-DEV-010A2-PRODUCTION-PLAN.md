# 010A.2 — preparação produtiva e recuperação

28/10/2026. **Plano, não migration aprovada. PROD preservada em008C.** A homologação TEST com dois logins distintos não foi concluída. O usuário designou Administração Geral somente TEST; nenhum UID PROD foi designado. Esses gates impedem preparar/aplicar DDL produtiva definitiva ou integrar a PR19. Não reutilizar migrations TEST-only alterando apenas o guard de ambiente.

## Antes de qualquer DDL produtiva

1. Concluir os fluxos positivos e negativos hospedados com duas identidades Auth TEST distintas: múltiplas Guildas, membros/professores, convites/revogação, saída/remoção, seleção/recarga, concorrência/idempotência e regressões. Preservar também todas as falhas e baselines anteriores.
2. Confirmar designação administrativa produtiva explícita e identidade por login normal, além das operações produtivas legítimas autorizadas para conferência. A autorização histórica de consulta de Teste Chat A não concede gestão administrativa ou criação de comunidades para fabricar testes.
3. Conferir main/PR19/SHA e CI, projeto/raiz/ambiente Vercel, backend PROD, migrations e compatibilidade com a aplicação publicada. Renovar snapshot de funções/ACLs/RLS/policies/defaults/índices e dados, com hashes/contagens antes de executar qualquer alteração.
4. Somente após homologação completa, gerar migrations produtivas próprias e versionadas pela CLI: fundação protegida compatível com o baseline PROD real, sem grant inicial inferido; depois compatibilidade multiguild com guardas específicas, permissões mínimas e escrita inicialmente contida. Ensaiar esse pacote e sua recuperação sobre PostgreSQL isolado correspondente ao baseline PROD.
5. Não importar SQL009/Equipamentos/PR12/18 ou migrations remotas TEST não pertencentes ao pacote. Não remover o índice de uma Guilda isoladamente. Não conceder DML geral, poderes econômicos ou contorno de RLS.

## Implantação futura, condicionada aos gates

Manter o domínio no artefato008C durante DDL compatível e build Git retido. A escrita nova permanece contida até a versão que entende Guilda explícita estar READY e os testes autorizados de Auth/RLS/consulta/configuração aprovados. A ativação deve ser explícita, auditada e posterior aos gates, sem fabricar Guildas, membros, aulas ou recompensas produtivos.

Conferir o mesmo artefato após promoção: READY/SHA/backend/alias, Guilda e EBD próprias, troca/recarga de contexto, negações entre usuários, regressões dos módulos publicados, hashes de dados e estruturas. Conferência de abertura posterior ao deploy não substitui a homologação positiva obrigatória em TEST nem a configuração administrativa autorizada antes da implantação.

## Recuperação sem perda de vínculos

- **Estado ainda compatível com unicidade:** compensação específica pode restaurar definições/ACLs/índice anteriores somente depois de provar ausência de múltiplos vínculos e de registros novos que seriam descartados. Preservar fundação, grants, convites e auditorias emitidas. Não apagar histórico de migrations.
- **Estado com múltiplos vínculos ou auditoria nova:** recusar rollback destrutivo. Conter comandos pelo controle privado após o mesmo lock usado pelas escritas; conservar leituras/seleção e usar aplicação compatível com múltiplos vínculos. Não excluir participações ou reativar cegamente a unicidade para acomodar uma aplicação antiga.
- **Falha de segurança/compatibilidade:** interromper promoção. Registrar estado real, compensação rastreável e nova verificação. Restaurar dados de jogadores ou apagar progresso não é procedimento de teste.

Os ensaios TEST/isolados de recuperação vazia e contenção estão aprovados, mas não provam este futuro pacote produtivo ainda não gerado. Não declarar PROD_READY, DONE ou DEPLOY_COMPLETE. Não há novo recurso pago, DDL, merge, deploy, concessão ou alteração produtiva neste plano.
