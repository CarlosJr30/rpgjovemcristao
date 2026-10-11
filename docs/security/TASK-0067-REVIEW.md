# TASK-0067 — revisão de segurança

Autor: agente executor; não independente.

- Identidade/sessão: Supabase Auth e validação getUser/getSession antes de criar avatar; nenhuma verificação fictícia, token administrativo ou senha persistida.
- Metadata display_name: apenas apresentação, nunca decisão de autorização. Validação de formato de e-mail/nome e tamanho de senha na UI; backend Supabase continua responsável por validar identidade e senha.
- Banco: nova coluna nullable JSONB, objeto até 128 KiB; políticas de propriedade RLS intactas com USING e WITH CHECK. Nenhum novo SECURITY DEFINER ou grant. Progresso é checkpoint do jogador; autoridades de Guilda/recompensas existentes não usam esse campo para conceder permissões.
- Parser valida progresso remoto antes de incorporá-lo. NULL legado preserva cache do proprietário; isolamento de contas e seletor mantidos. Migração não reescreve saves existentes.
- Testes reais usam somente chave pública e sessão do novo usuário; secrets não são impressos/versionados. Sem traces reais. Acesso anônimo à linha de teste negado; leitura sob role authenticated não expôs outro proprietário.
- Preservação: 7 avatares originais e fingerprint anterior iguais depois de migração e QA; duas contas novas de QA mantidas, nenhuma exclusão.
- Advisors pré-existentes: 25 avisos de funções SECURITY DEFINER executáveis por authenticated e um de proteção de senha vazada desativada. Nenhuma dessas funções/configurações foi alterada nesta tarefa; avisos não equivalem a exploração comprovada. Revisão deste diff não encontrou novo achado crítico/alto.
- Artefatos de mídia/licenças isolados: gates prebuild e build PASS. Não publicar build/QA/.env, logs brutos, credenciais ou trabalho anterior alheio no release.

Resultado: PASS para o escopo alterado. Emulação não comprova teste físico em aparelho ou revisão independente.
