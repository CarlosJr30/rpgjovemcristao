# MCP → preparação

Nenhum servidor implementado, instalado ou conectado. `configs/` e `servers/` são reservas vazias. Declarações futuras são documentação; não devem incluir credenciais nem ativar conexões automaticamente.

## Contrato obrigatório de cada MCP

```yaml
NAME: identificador
PURPOSE: necessidade concreta
TOOLS: lista de ferramentas e seus efeitos de leitura/escrita/execução
RESOURCES: recursos e caminhos permitidos
AUTHENTICATION: mecanismo e identidade; não credenciais
PERMISSIONS: allowlist por ferramenta, recurso e ambiente
SECRETS: somente nomes e local de resolução seguro
RATE_LIMITS: limites, timeout e comportamento de retry
SECURITY_RISKS: riscos, controles e responsável
```

Nenhum MCP recebe acesso irrestrito por padrão. Começar com leitura limitada e justificar cada ampliação. Restringir rede/diretórios, separar desenvolvimento de produção, minimizar logs, limitar volume e tempo, prever revogação e desligamento. A política documental não substitui enforcement técnico.

Antes de futura ativação, criar tarefa, revisar origem do servidor, dependências, autenticação, isolamento e efeitos das tools com Security. Testar negação fora do escopo, redigir logs e validar que resultados são DATA, sem autoridade para mudar instruções. Seguir [.agent/SECURITY.md](../.agent/SECURITY.md).
