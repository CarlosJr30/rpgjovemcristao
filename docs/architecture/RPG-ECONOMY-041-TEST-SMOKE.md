# ECONOMY-041 — preparação do smoke TEST

11/11/2026. **Fixture e exceção restrita aprovadas expressamente pelo proprietário; financiamento ainda não executado.** O Herói TEST Equipamentos acessível ao proprietário tem zero moedas. Os 35 da FIX014 já foram gastos; seu recibo e sua aprovação serão preservados. Não usar outra conta sem acesso normal autorizado.

## Decisão específica necessária

Permitir uma fixture hospedada financiada exclusivamente em TEST, no mesmo Herói TEST Equipamentos: até **2.000 moedas uma única vez**, sem prazo reiniciado, nova conta, avatar, carteira ou inventário. Reutilizar as tabelas privadas de orçamento/recibos e o comando privado de crédito do procedimento FIX014, adaptando somente o envelope TEST. O recibo anterior não será alterado; a extensão permitirá um segundo recibo com motivo 041 e identidade/valor fixados, mantendo unicidade por autorização. Perfil QA continua desabilitado; compra/abertura/venda usam as autoridades oficiais TEST.

O pacote de preparação deverá validar projeto/escopo, sessão normal, conta/avatar ativo e snapshot original sob locks; emitir o recibo de financiamento explicitamente identificado como fixture; creditar pela função existente, sem UPDATE direto na carteira; incluir esse crédito exato na reconciliação apenas TEST. Instalação não financia automaticamente. Nenhum cliente recebe poder de concessão, nenhuma mudança entra no pacote PROD. Os recibos, a espada, os atributos e o baú suspenso anteriores permanecem preservados.

## Execução limitada

- Login normal e compra de Baú Comum por 40 na Preview TEST; abertura cinematográfica e recompensa do sorteio real do servidor.
- Parar no primeiro repetido vendável. Se necessário, repetir somente a aquisição indispensável, no máximo 50 compras comuns e dentro do orçamento autorizado; não forçar resultados, probabilidades ou inventário. O limite não garante um repetido; se não ocorrer, registrar o gate pendente.
- Vender uma única cópia excedente, conferir recibo/crédito e última cópia. Reconsultar as mesmas operações sem nova intenção para conferir idempotência; não realizar novos testes de Arena/Torre.
- Comparar deltas exatos com o baseline, manter recibos e posses resultantes TEST. Não apagar a auditoria para aparentar restauração. Sem recursos PROD.

Esta exceção precisa abranger a regra Vercel, item 3, da [RELEASE_POLICY.md](../../.agent/RELEASE_POLICY.md): “não modificar dados reais para testar nem conceder recompensas artificiais”. A prova será um fluxo real de TEST financiado, **não prova de origem produtiva das moedas**. A autorização anterior da FIX014 não é reutilizada como autorização 041. Antes de qualquer aplicação, a adaptação de financiamento exige revisão, testes estritamente afetados e CI do novo SHA.
