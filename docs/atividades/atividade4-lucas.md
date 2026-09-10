# Atividade 4 — versão individual (Lucas)

*Baseada em `docs/analise.md` e `user-stories.md` do repositório do grupo (Prato Cheio).
Itens escolhidos de propósito diferentes dos que o Miguel já cobriu em
`docs/atividades/aula04.md`, pra ser contribuição própria e não repetição.*

---

## 1. Critérios de aceite (Dado/Quando/Então) — 3 histórias do caso

Peguei 3 histórias de `user-stories.md` que ainda não tinham critério de aceite nem no
walking skeleton nem na versão do Miguel.

### História D — ONG informa nome, telefone e horário ao aceitar uma doação

```
Dado que a ONG está aceitando uma doação disponível
Quando ela informa nome do responsável, telefone e horário previsto de retirada
Então a doação passa para status `aceita` com esses três dados registrados junto

Dado que a ONG tenta aceitar sem informar o telefone
Quando ela envia o pedido de aceite
Então o pedido é recusado com erro 400, porque o doador precisa desse contato

Dado que uma doação já foi aceita
Quando outra ONG tenta aceitá-la (mesmo informando os três campos corretamente)
Então o pedido é recusado com erro 400 — a regra de exclusividade do walking skeleton
  continua valendo aqui
```

### História E — ONG confirma recebimento com foto ao finalizar a retirada

```
Dado que uma doação está com status `aceita` pela ONG que vai retirá-la
Quando essa ONG envia uma foto confirmando o recebimento
Então a doação passa para status `concluida` e a foto fica associada a ela

Dado que a doação ainda está `disponivel` (ninguém aceitou)
Quando alguém tenta enviar a confirmação de recebimento
Então o pedido é recusado com erro 400 — não existe recebimento sem aceite antes

Dado que o arquivo enviado não é uma imagem (ex.: pdf, texto)
Quando a ONG tenta confirmar o recebimento
Então o pedido é recusado com erro 400, para não guardar lixo no lugar da comprovação
```

### História F — ONG ordena as doações disponíveis pela validade mais próxima

```
Dado que existem doações disponíveis com validades diferentes
Quando uma ONG consulta a lista ordenando por validade
Então a doação que vence primeiro aparece no topo da lista

Dado que duas doações têm exatamente a mesma validade
Quando a ONG consulta a lista ordenada
Então a ordem entre elas pode ser qualquer uma (não é regra de negócio, é só desempate
  de exibição — não precisa de critério adicional)

Dado que a ONG não pede nenhuma ordenação
Quando ela consulta a lista
Então o comportamento é o mesmo da História 2 do walking skeleton (ordem de inserção)
```

Formato usado (o mesmo do walking skeleton):
```
Dado que <contexto>
Quando <ação>
Então <resultado esperado>
```

---

## 2. Suposição do caso → hipótese testável + experimento

**Suposição** (de `docs/analise.md`, seção "Incertezas"): *"Uma doação pode ser reivindicada
por mais de uma ONG ao mesmo tempo — qual critério de desempate é aceitável pra quem doa e
pra quem recebe?"* O walking skeleton já resolve isso tecnicamente por **ordem de chegada**
(quem aceita primeiro leva, garantido na camada de dados). A suposição não testada é: será
que "ordem de chegada" é um critério que as ONGs de fato aceitam como justo, sem sentir que
proximidade ou urgência de validade deveriam pesar mais?

**Hipótese:** se o sistema usar ordem de chegada como critério de desempate quando duas ONGs
tentam aceitar a mesma doação quase ao mesmo tempo, pelo menos 80% das ONGs que perderem a
disputa não vão considerar o critério injusto — medido por uma pergunta de sim/não enviada
logo depois do evento.

**Experimento:** rodar o piloto junto com o mesmo grupo de ONGs parceiras do experimento de
publicação (§2 da versão do Miguel), por 2 semanas. Toda vez que o log do backend registrar
duas tentativas de aceite pra mesma doação em um intervalo curto (ex.: menos de 5 segundos
entre elas), a ONG que perdeu recebe uma pergunta rápida: "Você considerou justo perder essa
doação pra outra instituição que confirmou primeiro?". Critério definido antes de rodar: se
menos de 80% responder "sim", ou se o volume de disputas for alto o bastante pra virar
reclamação recorrente, um critério de desempate mais sofisticado (proximidade, urgência da
validade) entra no backlog da Unidade 2 com prioridade alta. Se passar de 80%, ordem de
chegada continua como está — não vale complicar o que já funciona.

---

## 3. Dois riscos do caso + mitigação concreta

Peguei os outros 2 riscos que já estavam listados em `docs/analise.md` (o Miguel usou os
outros dois — condição de corrida e doador esquecer de publicar).

| Risco | Probabilidade | Impacto | Mitigação concreta |
|---|---|---|---|
| Falta de confiança entre desconhecidos — doador não sabe se a ONG é legítima, e vice-versa | Média | Médio | Sem criar autenticação completa (fora do escopo do walking skeleton, decisão já registrada em `docs/analise.md`), a ação de baixo custo pra U2 é exibir o nome da ONG já registrado no campo `ong` (que já existe desde o aceite) de forma visível pro doador assim que a doação é aceita — hoje esse dado é gravado mas não é mostrado em lugar nenhum da interface. Responsável: a definir em reunião do grupo. Prazo: início da Unidade 2, antes de qualquer autenticação formal entrar em pauta. |
| Volume de dados cresce e a listagem simples (sem paginação) não escala | Baixa nesta unidade | Baixo | Definir agora um limite prático de referência: se a listagem passar de ~50 doações disponíveis simultâneas, `repositorio.js` ganha paginação simples (`LIMIT`/`OFFSET` na query de `listarDisponiveis`), sem mudar o contrato da função pro resto do código. Não implementar antes disso ser um problema real — é decisão de "anular o eixo" cedo demais, o que atrasaria a validação da hipótese central sem necessidade. Responsável: quem mexer em `repositorio.js` na U2. Prazo: só entra em ação se o limite for atingido. |

---

## 4. Código executando — walking skeleton passando nos testes

Já está na `main` (implementado no Trabalho 1, mesma evidência do Miguel — não é código
novo, é o mesmo walking skeleton que sustenta as 3 histórias do caso):

```
$ npm test
✓ tests/doacoes.test.js (6 tests) 96ms
Test Files  1 passed (1)
     Tests  6 passed (6)
```

Rodei de novo agora (09/09/2026) pra confirmar que continua passando sem nenhuma mudança de
código — só as histórias D, E e F acima ainda não têm implementação, são candidatas pra U2,
igual as do Miguel.

---

## 5. Tudo documentado

As histórias D, E e F vêm de `user-stories.md` (Aula 03) e ainda não tinham critério de
aceite formal — não fazem parte do walking skeleton atual, são incremento pra Unidade 2. A
hipótese e o experimento do item 2 partem de uma incerteza diferente da que o Miguel usou
(critério de desempate, não o hábito de publicar), mas usam o mesmo piloto de 2 semanas já
planejado, pra não duplicar esforço de validação. Os riscos do item 3 são os 2 que sobraram
da tabela de `docs/analise.md`, com mitigação específica pro código real (`repositorio.js`,
campo `ong`), não sugestão genérica. O item 4 reusa a evidência real dos testes, rodada de
novo por mim antes de entregar.

## Uso de IA

Usei o Claude para: (1) ler `docs/analise.md`, `user-stories.md` e a versão do Miguel em
`docs/atividades/aula04.md` pra identificar quais histórias, qual incerteza e quais riscos
ainda não tinham sido usados; (2) montar uma primeira versão dos critérios de aceite, da
hipótese/experimento e das mitigações. Escolhi eu mesmo as 3 histórias (D, E, F) pra não
repetir as do Miguel, revisei os critérios contra as regras que já conhecia do caso (a
exclusividade de aceite, os campos obrigatórios) e rodei `npm test` de novo pra confirmar a
evidência do item 4 antes de entregar.
