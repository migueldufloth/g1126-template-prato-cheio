# Atividade — Trade-offs de Projeto (Aula 06)

*Atividade de aula (0,25 pt) · entrega hoje, 23:59 · Nível de IA desta aula: **IA para
consulta** — a IA pode comparar alternativas e ajudar a organizar o raciocínio, mas a decisão
e a justificativa de cada item são de quem completa.*

> Este documento é o **esqueleto** da entrega, no mesmo formato da Atividade 4: a **Decisão 1**
> já está completa — é a que o Miguel Balladares vai defender na apresentação de hoje — e as
> **Decisões 2 e 3** estão com `TODO`, já com a origem (requisito/risco) e duas alternativas de
> partida apontadas, para quem completar decidir, justificar e registrar o próprio commit
> (contribuição individual conta pra nota do trabalho).

## Status geral

| # | Item pedido na atividade | Situação | Onde |
|---|---|---|---|
| 1 | 3 decisões que o caso exige, 2 alternativas cada | Decisão 1 ✅ feito · Decisões 2 e 3 `TODO` | ver §1 |
| 2 | Tabela de trade-offs para uma decisão | ✅ feito (Decisão 1) | ver §2 |
| 3 | Ligar cada decisão a um requisito/risco da Análise | Decisão 1 ✅ · Decisões 2 e 3 `TODO` (origem já apontada) | ver §3 |

## 1. Três decisões de projeto e suas alternativas

### Decisão 1 — O que fazer com uma doação aceita e não retirada
**Responsável: Miguel Angel Balladares Huertas (@miguettohuertas) — ✅ completa**

Hoje, quando uma ONG aceita uma doação (`POST /api/doacoes/:id/aceitar`), ela passa para
`status = 'aceita'` e não existe nenhum mecanismo de retorno: se a ONG não retirar, a doação
fica presa nesse status para sempre. Essa é a "regra ausente" que eu mesmo registrei em
`docs/analise.md` na Aula 2.

- **Alternativa 1 — Manter sem expiração automática nesta unidade.** O comportamento atual
  continua: uma vez aceita, só uma ação manual (que ainda não existe) muda o status de novo.
- **Alternativa 2 — Expiração automática por tempo.** Depois de um prazo razoável sem
  confirmação de retirada, a doação volta sozinha para `disponivel`, liberando-a de novo para
  outras ONGs.

**Decisão escolhida: Alternativa 2 — expiração automática por tempo**, implementada como
**checagem "preguiçosa" na consulta** (comparar o prazo contra o horário atual sempre que a
doação for lida/listada), e não como um serviço/job agendado rodando em paralelo. Isso resolve
o risco sem exigir infraestrutura nova (scheduler, fila) — o que importa dado o orçamento ~zero
e o prazo curto do piloto.

**O que isso implica no código (para quem for implementar depois):** hoje `src/db.js` só grava
`criada_em` (quando a doação foi publicada) — **não existe uma coluna `aceita_em`**. Sem saber
quando a doação foi aceita, não dá para calcular se o prazo estourou. Então a decisão pressupõe
uma mudança pequena de schema (adicionar `aceita_em`, preenchida em `repositorio.aceitar`) antes
de a expiração em si poder ser implementada — é um bom próximo incremento para a Unidade 2, fora
do escopo desta atividade (que é só registrar a decisão, não implementá-la).

### Decisão 2 — Condição de corrida entre duas ONGs ao aceitar a mesma doação
**Responsável: _a definir (sugestão: quem mexeu em `src/repositorio.js` no Trabalho 1)_ — `TODO`**

- **Origem:** regra de negócio "uma doação aceita não fica disponível para outra" + risco
  "duas ONGs aceitam a mesma doação ao mesmo tempo" (`docs/analise.md`, seção Riscos).
- Alternativa 1: manter o lock otimista atual — `UPDATE ... WHERE status = 'disponivel'` em
  `src/repositorio.js` (já implementado e testado; zero linhas mudam se a corrida for perdida).
- Alternativa 2: fila de reserva com prazo — a ONG "reserva" a doação por alguns minutos antes
  de confirmar, em vez de aceitar direto.

`TODO`: escolher uma das duas (ou justificar por que manter a atual já é a decisão certa — não
precisa trocar só por trocar), montar a justificativa e, se quiser, uma tabela de trade-offs
própria (a atividade só exige uma tabela no total, então isso é opcional).

### Decisão 3 — Onde/como o PostgreSQL da Unidade 3 vai rodar
**Responsável: _a definir_ — `TODO`**

- **Origem:** restrição "orçamento ~zero" + a troca de banco já anunciada no `README.md`
  ("Como o PostgreSQL vai subir é decisão do grupo").
- Alternativa 1: instalar/rodar localmente ou em container Docker — grátis, mas cada integrante
  precisa configurar o próprio ambiente.
- Alternativa 2: serviço gerenciado gratuito (Neon, Supabase, Render) — acessível por qualquer
  integrante via `DATABASE_URL`, mas depende de internet e da política de um terceiro.

`TODO`: escolher, justificar, e isso já pode virar a base do ADR da Unidade 2 sobre a migração
de banco (que a disciplina pede de qualquer forma).

## 2. Tabela de trade-offs — Decisão 1

Critérios escolhidos antes de comparar (para não só confirmar a alternativa que eu já queria):

| Critério | Alternativa 1 — sem expiração | Alternativa 2 — expiração automática (lazy) |
|---|---|---|
| Resolve o risco (doação presa, comida perdida) | Não — o problema continua existindo | Sim — a doação volta pra lista sozinha após o prazo |
| Complexidade de implementação | Nenhuma — já é o comportamento atual | Média — precisa da coluna `aceita_em` + checagem por tempo na consulta |
| Infraestrutura nova exigida | Nenhuma | Nenhuma, **se** implementada como checagem na consulta (sem job/scheduler separado) |
| Risco de efeito colateral | Nenhum novo | Pode devolver à lista uma doação que já está a caminho de ser retirada de verdade — prazo precisa ser calibrado com o grupo |

## 3. Justificativa das decisões (ligação com a Análise)

**Decisão 1 (completa):** a regra ausente já estava documentada em `docs/analise.md`
("o que acontece se uma ONG aceita uma doação e não retira dentro de um prazo razoável...
fica registrado como lacuna a decidir em unidade futura"). Deixar essa lacuna sem decisão
compromete diretamente dois dos três objetivos de impacto do produto — "aumentar refeições que
chegam a quem precisa" e "reduzir o tempo entre disponível e coletado" — porque uma doação
presa em `aceita` não ajuda ninguém e também não pode ser resgatada por outra ONG. A expiração
automática ataca isso sem violar a restrição de orçamento/infraestrutura do piloto (não exige
serviço novo, só um campo a mais no schema).

**Decisão 2 (`TODO`):** justificar citando o risco "condição de corrida" e explicar por que a
alternativa escolhida (manter o lock atual, ou trocar pela fila de reserva) atende melhor a
regra de exclusividade de aceite.

**Decisão 3 (`TODO`):** justificar citando a restrição de orçamento ~zero e explicar o
trade-off entre controle total (rodar localmente) e simplicidade de acesso para o grupo inteiro
(serviço gerenciado).

## Divisão do trabalho

| Item | Responsável | Status |
|---|---|---|
| Decisão 1 completa (§1, §2, parte de §3) | Miguel Angel Balladares Huertas | ✅ feito |
| Decisão 2 (§1, §3) | _a definir_ | TODO |
| Decisão 3 (§1, §3) | _a definir_ | TODO |
| Revisão e aprovação do PR | _a definir_ (outro integrante, não quem escreveu) | TODO |

## Uso de IA

Nível declarado desta aula: IA para consulta. Usei o Claude para comparar as duas alternativas
da Decisão 1, montar os critérios e a tabela de trade-offs, e organizar a redação. A escolha da
alternativa (expiração automática, via checagem na consulta em vez de um scheduler) e o
raciocínio de que ela resolve a lacuna que eu mesmo registrei na Aula 2 são meus — conferi
contra o schema real em `src/db.js` e `src/repositorio.js` antes de fechar a decisão, o que
revelou que falta a coluna `aceita_em` (ponto que também registrei acima como implicação para
quem for implementar depois). Não usei a IA para decidir nem justificar as Decisões 2 e 3 —
essas ficam em aberto para os colegas completarem com o próprio raciocínio.
