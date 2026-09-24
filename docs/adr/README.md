# Decisões arquiteturais

Criar `ADR-XXXX-title.md` somente para decisão significativa com alternativas e consequências duradouras. Ajustes rotineiros ficam em `.agent/memory/DECISIONS.md`.

## Modelo

```markdown
# ADR-XXXX → título
STATUS: proposed | accepted | superseded
CONTEXT: problema e restrições
DECISION: escolha e limites
ALTERNATIVES: opções avaliadas e motivos de descarte
CONSEQUENCES: benefícios, custos e riscos
```

Registrar data e vínculo da tarefa. Para substituir decisão aceita, criar outro ADR e referenciar ambos. A orientação inicial de monólito modular vem da missão; a seleção futura de stack deve avaliar alternativas em um ADR, sem criar decisões especulativas agora.
