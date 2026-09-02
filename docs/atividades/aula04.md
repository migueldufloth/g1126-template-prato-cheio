# Atividade 4 — Critérios de aceite, hipóteses e riscos e esqueleto rodando

*Atividade de aula (0,25 pt) · entrega 9 de setembro de 2026, 23:59*

> Este documento é o **esqueleto** da entrega. Ele organiza o que a atividade pede, aponta o
> que já está coberto em outros documentos do repositório (e onde) e marca com `TODO` o que
> ainda precisa ser escrito — de propósito, para que outro integrante do grupo complete e
> registre a própria contribuição (commit) nesta atividade.

## Status geral

| # | Item pedido na atividade | Situação | Onde |
|---|---|---|---|
| 1 | Critérios de aceite (Dado/Quando/Então) para 3 histórias | ✅ feito | ver §1 |
| 2 | Suposição → hipótese testável + desenho de experimento | ✅ feito | ver §2 |
| 3 | 2 riscos do caso + mitigação concreta | ✅ feito | ver §3 |
| 4 | Código rodando (walking skeleton) passando nos testes | ✅ feito, na `main` | ver §4 |
| 5 | Tudo documentado | ✅ feito | ver §5 |
| 6 | Material de consulta para a prova (à mão) | fora deste PR — pessoal, sem IA | ver §6 |

## 1. Critérios de aceite (Dado/Quando/Então) — 3 histórias do caso

Responsável: Miguel Angelo Dufloth Filho (@migueldufloth)

Os critérios das 3 histórias do walking skeleton (doador publica, ONG vê a lista, ONG
aceita) já existem em `docs/analise.md`, seção "Critérios de aceite", e já batem com o
comportamento real da API. Copiar de novo aqui não ia agregar nada. Preferi usar a outra
opção que o esqueleto deixou em aberto: escrever critério de aceite para 3 histórias que
ainda não tinham nenhum, tiradas de `user-stories.md` (Aula 03). Isso ajuda mais o Trabalho
2, porque essas histórias vão precisar desse critério assim que entrarem em desenvolvimento.

Nenhuma das três faz parte do walking skeleton atual, são candidatas a incremento na
Unidade 2. Escolhi a de cancelamento porque é uma lacuna que incomoda de verdade — hoje uma
doação publicada errado ou que estragou antes da ONG aceitar fica presa como `disponível`
sem jeito de corrigir. A de filtro por tipo porque é o próximo passo óbvio assim que a
listagem crescer além de caber numa tela. E a de observação de retirada porque resolve boa
parte do problema de coordenação da entrega sem precisar de chat, que é escopo bem maior.

### História A — Doador cancela uma doação disponível

```
Dado que o doador tem uma doação publicada com status `disponivel`
Quando ele cancela essa doação
Então ela passa para status `cancelada` e some da lista de disponíveis

Dado que uma doação já foi aceita por uma ONG (status `aceita`)
Quando o doador tenta cancelá-la
Então o cancelamento é recusado com erro 400, porque a ONG já conta com ela

Dado que o id informado não corresponde a nenhuma doação
Quando o doador tenta cancelá-la
Então o pedido é recusado com erro 404
```

### História B — ONG filtra doações disponíveis por tipo de alimento

```
Dado que existem doações disponíveis de tipos diferentes (ex.: "Sopa" e "Pão")
Quando uma ONG consulta a lista filtrando por tipo "Sopa"
Então apenas as doações do tipo "Sopa" aparecem no resultado

Dado que não existe nenhuma doação disponível do tipo filtrado
Quando uma ONG consulta a lista com esse filtro
Então o resultado é uma lista vazia (não um erro)

Dado que a ONG não informa nenhum filtro de tipo
Quando ela consulta a lista
Então o comportamento é o mesmo da História 2 do walking skeleton (lista completa)
```

### História C — Doador adiciona observações de retirada ao publicar

```
Dado que o doador informa tipo, quantidade, validade e uma observação de retirada
  (ex.: "retirar na portaria B")
Quando ele publica a doação
Então a doação aparece na lista de disponíveis com a observação visível para a ONG

Dado que o doador não informa nenhuma observação
Quando ele publica a doação
Então a publicação é aceita normalmente (observação é opcional, não é um dos 3 campos
  obrigatórios definidos em docs/analise.md)

Dado que o doador informa uma observação muito longa (acima do limite definido, ex. 280
  caracteres)
Quando ele tenta publicar
Então a publicação é recusada com erro 400, para não virar um campo de texto livre sem limite
```

Formato usado (Gherkin simplificado):
```
Dado que <contexto>
Quando <ação>
Então <resultado esperado>
```

## 2. Suposição do caso → hipótese testável + experimento

Responsável: Miguel Angelo Dufloth Filho (@migueldufloth)

A suposição vem de `docs/analise.md`, seção "Incertezas": doadores vão de fato lembrar de
publicar a doação no momento em que o excedente surge, ou o atrito de mais um passo manual
inviabiliza o uso?

Hipótese: acreditamos que um formulário de publicação com só os 3 campos obrigatórios do
walking skeleton (tipo, quantidade, validade), sem cadastro e acessível em no máximo 2
toques a partir da tela inicial, faz o doador publicar o excedente no mesmo dia em que ele
surge — em vez de deixar para depois ou esquecer, como acontece hoje pelo WhatsApp/telefone.
A métrica é a proporção de doações publicadas no mesmo dia em que o excedente apareceu.

Experimento: rodar um piloto de 2 semanas com uns 5 a 8 estabelecimentos parceiros
(restaurante, padaria, cozinha — o que topar usar o formulário de verdade). Não precisa ser
amostra representativa, o objetivo aqui é ter um sinal direcional, não significância
estatística. Para cada doação publicada no período, o doador informa em que dia o excedente
surgiu de fato (uma pergunta rápida no fim do formulário, ou por contato de acompanhamento);
esse dia é comparado com o timestamp real de publicação que o sistema já grava em
`criarDoacao`. Antes de rodar, definimos o critério: 70% ou mais publicado no mesmo dia
confirma a hipótese, e o atrito atual já é baixo o suficiente para não ser prioridade da
Unidade 2. Abaixo de 70%, ou atraso médio acima de 24h, a hipótese cai por terra e reduzir
atrito (lembrete automático, atalho fora do navegador) entra no backlog da Unidade 2 com
prioridade alta.

## 3. Dois riscos do caso + mitigação concreta

Responsável: Miguel Angelo Dufloth Filho (@migueldufloth)

Peguei 2 dos 4 riscos já listados em `docs/analise.md`, seção "Riscos" — os que pesam mais
sobre a regra central do produto e sobre a hipótese que estamos tentando validar nesta
unidade.

| Risco | Probabilidade | Impacto | Mitigação concreta (ação + responsável + prazo) |
|---|---|---|---|
| Duas ONGs aceitam a mesma doação ao mesmo tempo (condição de corrida) | Média | Alto — quebra a regra central do produto | A mitigação estrutural já está em produção (`UPDATE ... WHERE status = 'disponivel'` em `src/repositorio.js`, coberta pelo teste "recusa aceitar uma doação que já foi aceita por outra ONG" em `tests/doacoes.test.js`). O que falta é um teste que dispare 2 requisições de aceite em paralelo (`Promise.all`) contra a mesma doação e confira que só uma volta com 200 — hoje só testamos sequencial. Responsável: a confirmar em reunião do grupo, quem tocou `src/repositorio.js` no Trabalho 1 é o candidato natural. Prazo: antes da entrega do Trabalho 2. |
| Doador esquece de publicar e o alimento se perde do mesmo jeito | Alta | Alto — o produto não cumpre o objetivo mesmo com o resto funcionando | Rodar o experimento do §2 (piloto de 2 semanas) e registrar o resultado real. Se o critério de falha se confirmar, entra no backlog da Unidade 2 uma história de lembrete de publicação com prioridade alta, em vez de ficar como incremento opcional. Responsável: Miguel Angelo Dufloth Filho. Prazo: experimento concluído e resultado registrado até o início da Unidade 2. |

## 4. Código executando — walking skeleton passando nos testes

✅ Já implementado e mesclado na `main` (Trabalho 1 / PRs #1 e #2).

Evidência (rodada em 02/09/2026, no momento desta atividade):
```
$ npm test
✓ tests/doacoes.test.js (6 tests) 134ms
Test Files  1 passed (1)
     Tests  6 passed (6)
```

## 5. Tudo documentado

Revisão final (Miguel Angelo Dufloth Filho, 02/09/2026): os critérios das 3 histórias do
walking skeleton continuam batendo com a API real (`npm test`, 6/6, evidência em §4); as
3 histórias novas de §1 são critério de design para a Unidade 2, não código já implementado,
e isso está dito explicitamente no texto para não confundir. A hipótese e o experimento de
§2 cabem no escopo do walking skeleton — não dependem de nada que ainda não existe, só do
fluxo de publicação já implementado. Os riscos e mitigações de §3 são específicos do Prato
Cheio (citam arquivo e teste reais), não "adicionar mais testes" genérico. A seção "Uso de
IA" abaixo está preenchida.

## 6. Material de consulta para a prova

Fora do escopo deste PR — é individual, escrito à mão, sem uso de IA (contrato pedagógico da
disciplina). Cada integrante organiza a própria cola a partir do que entender do repositório.

## Divisão do trabalho

| Item | Responsável | Status |
|---|---|---|
| §1 Critérios de aceite | Miguel Angelo Dufloth Filho | ✅ feito |
| §2 Hipótese + experimento | Miguel Angelo Dufloth Filho | ✅ feito |
| §3 Riscos + mitigação | Miguel Angelo Dufloth Filho | ✅ feito |
| §4 Evidência dos testes | Miguel Angelo Dufloth Filho | ✅ feito |
| §5 Revisão final | Miguel Angelo Dufloth Filho | ✅ feito |
| Revisão e aprovação do PR | _a definir_ (outro integrante, não quem escreveu) | TODO |

## Uso de IA

Usamos o Claude para montar o **esqueleto** deste documento: mapear os 6 itens pedidos pela
atividade contra o que já existe em `docs/analise.md` e `user-stories.md`, e organizar o que
falta em seções com `TODO` claros. Nenhum conteúdo final (critérios, hipótese, riscos) foi
gerado pela IA — cada integrante preenche e registra abaixo o que usou ao completar sua parte:

- Miguel Angelo Dufloth Filho: usei o Claude Code para ler `docs/analise.md` e
  `user-stories.md` inteiros, mapear quais histórias ainda não tinham critério de aceite
  formal e montar uma primeira versão dos critérios de §1, da hipótese/experimento de §2 e
  das mitigações de §3; também rodei `npm test` de novo para atualizar a evidência de §4.
  Decidi eu mesmo quais 3 histórias usar em §1 (pra não repetir o que já tinha em
  `docs/analise.md`) e qual suposição puxar em §2; conferi se a hipótese fazia sentido com o
  fluxo real de `criarDoacao()`; e mudei o responsável da primeira mitigação de §3 pra "a
  confirmar em reunião do grupo", porque a sugestão original jogava a tarefa pra um colega
  sem perguntar antes.
