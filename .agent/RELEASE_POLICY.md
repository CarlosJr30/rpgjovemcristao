# Publicação automática das alterações aprovadas

Regra permanente de Carlos, atualizada em 23/10/2026. Substitui o procedimento anterior da TASK-0066 a partir desta atualização; não altera retroativamente os resultados de entregas anteriores.

**Corrigir → Testar → GitHub → Supabase (se necessário) → Vercel Preview → Validar → Produção → Conferir.**

Ao concluir cada tarefa com alterações publicáveis aprovadas, executar automaticamente o fluxo completo quando todos os requisitos estiverem atendidos, sem aguardar nova solicitação ou confirmação rotineira. O contrato delimita o escopo funcional autorizado; esta regra autoriza as etapas necessárias à publicação desse escopo, inclusive migrations pendentes e aprovadas, e não autoriza funcionalidades adicionais.

## Desenvolvimento e validação

1. Implementar as correções solicitadas e executar testes unitários e de integração, lint, TypeScript e build.
2. Validar autenticação, RLS, permissões e controles econômicos. Verificar a preservação dos dados dos jogadores com evidências adequadas à mudança.
3. Registrar os checks obrigatórios e seus resultados no contrato. Teste obrigatório não executado ou sem evidência não pode ser tratado como PASS ou dispensado como N/A.
4. Identificar bloqueios antes de modificar produção. Falha crítica impede publicação; corrigir em REWORK ou registrar BLOCKED com causa e condição de desbloqueio.

## GitHub

1. Conferir branch, worktrees, alterações existentes e divergências; preservar todo trabalho não relacionado.
2. Revisar diff e ausência de secrets; criar commits somente com arquivos validados e enviar a branch ao GitHub.
3. Confirmar aprovação do CI para o commit candidato. Respeitar proteção de branches e fluxo de PR/merge normal, sem bypass ou push forçado.

## Supabase — quando houver mudanças no banco

1. Confirmar explicitamente projeto e ambiente de destino; nunca usar o Supabase de testes como banco de produção.
2. Comparar migrations locais e remotas e revisar compatibilidade da aplicação, ordem de aplicação e dados existentes.
3. Preparar plano de recuperação e backup adequado à alteração, com restauração verificada quando necessária. Aplicar somente migrations pendentes e aprovadas; nunca reaplicar automaticamente migrations já registradas.
4. Validar RLS, Auth, permissões de RPCs e integridade/preservação dos dados após a aplicação.
5. Nunca executar reset, apagar contas ou recriar tabelas de produção. Migration incompatível ou recuperação insuficiente bloqueia a publicação.

## Vercel

1. Confirmar projeto e variáveis de ambiente sem expor seus valores sensíveis. Validar a correspondência entre aplicação, backend e ambiente.
2. Publicar o candidato em Preview, aguardar READY e conferir o commit correspondente.
3. Executar testes reais de autenticação e dos fluxos críticos exigidos pela tarefa. Mocks, emulação e assertions SQL não substituem os testes reais obrigatórios. Usar contas de teste autorizadas; não modificar dados reais para testar nem conceder recompensas artificiais.
4. Somente após todos os testes obrigatórios aprovados, publicar em produção pelo fluxo normal. Acompanhar o deploy automático existente, sem duplicá-lo.
5. Confirmar remotamente READY, URL/aliases e correspondência entre o commit aprovado e a versão publicada, inclusive após merge.
6. Testar as rotas principais e os fluxos críticos aplicáveis após a publicação; registrar resultado e limitações reais.

## Proteções e bloqueios

- Nunca desativar Auth, RLS, permissões ou controles econômicos para forçar publicação.
- Não conceder cartas, XP, moedas ou privilégios administrativos sem autorização válida; não modificar dados reais apenas para testes.
- Não publicar com falha crítica, bloqueio de acesso, migration incompatível ou teste obrigatório não executado. Manter produção inalterada enquanto houver esses bloqueios e informar o motivo.
- Se uma falha for detectada após uma etapa remota já executada, interromper as etapas seguintes, registrar o estado real e aplicar o plano de recuperação compatível. Não alegar produção inalterada ou sucesso sem evidência.
- Não declarar DEPLOY_COMPLETE sem confirmação do ambiente remoto. Um resultado somente local não conclui uma entrega que exige publicação.
- Teste físico não pode ser inferido de emulação: se obrigatório para publicação, sua ausência bloqueia a promoção. Homologações de conteúdo, mídia e economia também não são substituídas pelo deploy.
- Registro isolado de governança/documentação, sem alteração de artefato publicável, exige revisão documental e persistência; não exige deploy artificial da aplicação nem nova migration. Não realizar deploy adicional apenas para documentação de encerramento.
- Esta regra não instala um serviço de automação em segundo plano: o agente deve executar o processo nas tarefas autorizadas, usando os acessos e ferramentas disponíveis.

## Entrega obrigatória

Informar funcionalidades corrigidas, testes aprovados, commit publicado no GitHub, migrations aplicadas (ou ausência delas), URL e status do Vercel, resultado dos testes em produção, pendências e bloqueios. Distinguir implementação, publicação e homologação. Atualizar contrato, evidências e memória; não solicitar novamente autorização de publicação já concedida.
