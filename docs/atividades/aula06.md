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
| 1 | 3 decisões que o caso exige, 2 alternativas cada | ✅ feito (Decisões 1, 2 e 3) | ver §1 |
| 2 | Tabela de trade-offs para uma decisão | ✅ feito (Decisão 1) | ver §2 |
| 3 | Ligar cada decisão a um requisito/risco da Análise | ✅ feito (Decisões 1, 2 e 3) | ver §3 |

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
**Responsável: Leonardo Lotério de Lima (@leonardosth) — ✅ completa**

- **Origem:** regra de negócio "uma doação aceita não fica disponível para outra" + risco
  "duas ONGs aceitam a mesma doação ao mesmo tempo" (`docs/analise.md`, seção Riscos).
- **Alternativa 1 — Manter o lock otimista atual:** `UPDATE ... WHERE status = 'disponivel'` em
  `src/repositorio.js` (já implementado e testado; quem clica primeiro leva, quem clica depois recebe erro).
- **Alternativa 2 — Fila de reserva com prazo:** a ONG "reserva" a doação por alguns minutos (ex.: 15 a 30 min)
  antes de confirmar, dando tempo para organizar a retirada antes de assumir o compromisso final.

**Decisão escolhida: Alternativa 2 — Fila de reserva com prazo.**
No cenário real de operação das ONGs, dificilmente uma instituição tem motorista ou voluntário pronto para sair no instante exato em que a notificação surge. Se o aceite for imediato e definitivo (Alternativa 1), a ONG é empurrada para um dilema perigoso: ou aceita "no escuro" para não perder a doação e corre alto risco de não conseguir retirar (frustrando o doador e gerando comida estragada), ou hesita para verificar quem pode buscar e perde a doação por segundos para outra instituição.
Com a reserva temporária, a ONG ganha uma janela de exclusividade (ex.: 15 a 30 minutos) para checar internamente se possui voluntário/transporte disponível. Confirmada a capacidade de busca, a ONG conclui o aceite formal; caso contrário, se desistir ou o prazo estourar sem confirmação, o item é liberado de volta para a lista de disponíveis sem prejuízo ao alimento.

**O que isso implica no código (para quem for implementar na Unidade 2):**
1. **Novo status no ciclo de vida:** inclusão do status `'reservada'` entre `'disponivel'` e `'aceita'`.
2. **Schema do banco (`src/db.js`):** adição de colunas `reservada_em` e `reservada_por` na tabela `doacoes`.
3. **Novas rotas / operações:**
   - `POST /api/doacoes/:id/reservar`: executa `UPDATE doacoes SET status = 'reservada', reservada_por = ?, reservada_em = ... WHERE id = ? AND status = 'disponivel'`. O lock otimista continua sendo usado aqui para garantir a exclusividade no ato de reservar (quem tentar reservar uma doação já reservada ou aceita recebe erro 400).
   - `POST /api/doacoes/:id/confirmar`: valida se a reserva ainda está no prazo e pertence à mesma ONG, alterando o status para `'aceita'`.
4. **Tratamento de timeout:** assim como na Decisão 1, a expiração da reserva pode ser checada de forma "preguiçosa" (*lazy*) ao listar doações disponíveis (`WHERE status = 'disponivel' OR (status = 'reservada' AND datetime('now') > datetime(reservada_em, '+20 minutes'))`), liberando-a sem necessidade de agendador paralelo.

### Decisão 3 — Onde/como o PostgreSQL da Unidade 3 vai rodar
**Responsável: Leonardo Lotério de Lima (@leonardosth) — ✅ completa**

- **Origem:** restrição "orçamento ~zero" + a troca de banco já anunciada no `README.md`
  ("Como o PostgreSQL vai subir é decisão do grupo").
- **Alternativa 1 — Container Docker local:** rodar o PostgreSQL localmente via Docker / `docker-compose` — grátis, sem limites de provedores de nuvem e independente de conexão de internet.
- **Alternativa 2 — Serviço gerenciado gratuito na nuvem (Neon, Supabase, Render):** banco hospedado acessível via internet por qualquer integrante via `DATABASE_URL`.

**Decisão escolhida: Alternativa 1 — Container Docker local (revisitando para N3 ou se solicitado pelo professor).**
Para as etapas de N1 e N2, manter a execução local via container Docker atende integralmente à restrição de orçamento zero e remove atritos comuns de tiers gratuitos de nuvem (como pausa da instância por inatividade / *cold start* de 30–50s, limites de requisições simultâneas ou falha de rede/internet durante execução de testes automatizados locais).
O desacoplamento arquitetural já é assegurado pelo formato agnóstico de `DATABASE_URL` (seja `postgres://localhost:5432/...` local ou uma URL remota), mantendo o código de negócio intocado. O time revisitará a possibilidade de migrar para nuvem gerenciada para a N3 ou caso haja solicitação expressa do professor na avaliação da disciplina.

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

**Decisão 2 (completa):** a decisão ataca simultaneamente o risco de "duas ONGs aceitam a mesma doação ao mesmo tempo (condição de corrida)" e a incerteza prática levantada em `docs/analise.md` sobre a dinâmica real de atendimento das ONGs. No modelo de aceite direto, a concorrência técnica é resolvida, mas cria-se uma fricção operacional grave: a instituição é forçada a aceitar sem saber se tem capacidade de buscar a tempo ou hesita e perde o alimento. Ao adotar a fila de reserva com prazo, a exclusividade passa a ser garantida no ato da reserva (também via lock otimista atômico na transição para `reservada`), mas confere à ONG o tempo necessário para coordenar voluntários/veículos. Caso a ONG perceba que não poderá retirar ou o prazo expire, o item retorna ao estado `disponivel` antes do perecimento, equilibrando a regra de exclusividade com a eficiência logística do mundo real.

**Decisão 3 (completa):** a decisão conecta-se diretamente à restrição de "orçamento ~zero" (`docs/analise.md`, seção Stakeholders e Hipótese). Optar por rodar o PostgreSQL em container Docker localmente durante a N1 e N2 garante autonomia máxima ao grupo de desenvolvimento, eliminando instabilidades externas (latência, limites de conexões simultâneas ou adormecimento de instâncias gratuitas em nuvem como Render/Neon) e permitindo rodar testes e migrações mesmo offline. O acoplamento com o banco é evitado pelo uso da variável `DATABASE_URL` em `src/db.js`, de modo que a decisão de migrar para nuvem poderá ser revisitada na N3 sem retrabalho de código, caso o escopo de produção ou a avaliação da disciplina exijam.

## Divisão do trabalho

| Item | Responsável | Status |
|---|---|---|
| Decisão 1 completa (§1, §2, parte de §3) | Miguel Angel Balladares Huertas | ✅ feito |
| Decisão 2 (§1, §3) | Leonardo Lotério de Lima | ✅ feito |
| Decisão 3 (§1, §3) | Leonardo Lotério de Lima | ✅ feito |
| Revisão e aprovação do PR | _a definir_ (outro integrante, não quem escreveu) | TODO |

## Uso de IA

Nível declarado desta aula: IA para consulta.

- **Decisão 1:** Miguel Balladares usou o Claude para comparar as duas alternativas da Decisão 1, montar os critérios e a tabela de trade-offs, e organizar a redação. A escolha da alternativa (expiração automática, via checagem na consulta) e a identificação da coluna `aceita_em` no schema real foram feitas pelo integrante.
- **Decisões 2 e 3:** Leonardo Lotério usou a IA para analisar a situação técnica do projeto (inexistência de carrinho e natureza atômica do aceite atual), mapear os riscos de negócio para o doador e para a ONG, e levantar as implicações no schema (`src/db.js`) e endpoints da Unidade 2. As decisões de adotar a reserva temporária com prazo (priorizando a viabilidade logística da ONG de organizar a coleta sem aceitar "no escuro") e de manter o PostgreSQL em Docker local para N1/N2 (com revisão na N3) foram decididas pelo integrante, assim como as justificativas baseadas nos requisitos de `docs/analise.md`.
