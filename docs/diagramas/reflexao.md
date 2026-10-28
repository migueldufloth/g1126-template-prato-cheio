# Reflexão Final — Atividade de Diagramas (N2)

> **Autor:** Leonardo Lotério de Lima (@leonardosth)  
> **Data:** 24/10/2026  
> **Contexto:** Pergunta final da avaliação N2 — Atividade 1 (Diagramas com IA).

---

### Pergunta Avaliativa

> **Qual dos dois diagramas foi mais útil para compreender ou questionar uma decisão do projeto? Por quê?**

### Resposta e Reflexão

O **Diagrama de Sequência do aceite de uma doação** foi o mais útil para compreender e questionar criticamente as decisões de projeto do Prato Cheio.

#### Por que o Diagrama de Sequência se destacou:

1. **Evidenciou onde reside a verdadeira garantia de concorrência:**  
   Em uma análise puramente superficial ou de casos de uso, parece que basta fazer um `GET` para verificar se a doação está disponível antes de efetuar o aceite. O Diagrama de Sequência deixou explícito que uma simples verificação prévia (*check-then-act*) abre uma **condição de corrida crítica**: se duas ONGs consultarem a API no mesmo segundo, ambas receberão `status = 'disponivel'` e tentarão gravar o aceite. O diagrama forçou a equipe a mapear exatamente como a concorrência é tratada no banco de dados através da instrução atômica condicional:
   ```sql
   UPDATE doacoes SET status = 'aceita', ong = ? WHERE id = ? AND status = 'disponivel'
   ```
   Apenas ao modelar a troca de mensagens entre API, regras de negócio e banco ficou evidente o papel do retorno de **linhas alteradas (`changes / rowCount`)**: se o retorno for `1`, a ONG venceu a corrida; se for `0`, outra instituição confirmou milissegundos antes, devendo o sistema recusar imediatamente com erro de concorrência.

2. **Questionou e justificou a necessidade da Reserva Temporária (Decisão 2 da Aula 6):**  
   Ao visualizar o fluxo de ponta a ponta na sequência, fica evidente a rigidez da operação de aceite direto: a ONG precisa assumir o compromisso no ato do clique para não perder a doação para outra instituição. Essa compreensão serviu de base direta para sustentar a **Decisão 2 da Aula 6** (introdução da fila de reserva com prazo de 15 a 30 minutos), permitindo que a instituição garanta a exclusividade momentânea para organizar a logística de busca sem o risco de aceitar no escuro ou perder o alimento.

3. **Complementaridade com o Diagrama de Estados:**  
   Enquanto o Diagrama de Estados foi excelente para enxergar o ciclo de vida macro e identificar que faltava um tratamento para doações aceitas que não chegam a ser retiradas (expiração por timeout), foi o Diagrama de Sequência que esclareceu a mecânica interna, os pontos de falha e a necessidade de padronização dos códigos de status HTTP da API (`404` para inexistente vs. `400/409` para conflito de concorrência).
