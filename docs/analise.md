# Documento de Análise — Prato Cheio

*Trabalho 1 · máximo 4 páginas · entrega na Aula 5*

## Problema central

Estabelecimentos que produzem ou vendem alimentos (restaurantes, padarias,
mercados, cozinhas industriais, produtores) geram excedentes com frequência —
sobras de produção, produtos próximos do vencimento, lotes que não foram
vendidos. Grande parte desse excedente ainda está em condições de consumo,
mas acaba descartado porque não existe um canal simples e rápido para
conectar quem tem o alimento sobrando a quem pode redistribuí-lo antes que
estrague.

ONGs e instituições que atendem populações em insegurança alimentar
precisariam desse alimento, mas hoje dependem de contatos informais
(telefone, WhatsApp, redes de conhecidos) para saber que uma doação existe —
o que é lento, não escala e frequentemente chega tarde demais, quando o
alimento já não pode mais ser aproveitado.

O **Prato Cheio** existe para reduzir essa janela de tempo: dar ao doador um
jeito imediato de publicar o que tem disponível, e à ONG um lugar único para
ver, em tempo real, o que está disponível perto do vencimento e reservar
antes que outra instituição o faça ou que o alimento se perca.

## Incertezas

- Doadores vão de fato lembrar de publicar a doação no momento em que o
  excedente surge, ou o atrito de mais um passo manual inviabiliza o uso?
- Uma doação pode ser reivindicada por mais de uma ONG ao mesmo tempo —
  qual critério de desempate é aceitável para quem doa e para quem recebe
  (ordem de chegada, proximidade, urgência da validade)?
- Não há, nesta unidade, verificação de identidade de doador nem de ONG —
  o valor do walking skeleton é validar o fluxo, não a confiança entre as
  partes. Isso precisa ficar explícito para não ser confundido com um
  requisito ausente.
- Qual o volume real de doações simultâneas? Isso define se a listagem por
  status simples (`disponível` / `aceita`) resolve ou se será preciso
  paginação e filtros já na próxima unidade.

## Stakeholders

| Stakeholder | Interesse | Influência | O que espera | Consequência para a iteração 1 |
|---|---|---|---|---|
| Doador (restaurante, mercado, produtor) | Descartar menos, cumprir responsabilidade social a baixo esforço | Alta | Publicar uma doação em poucos cliques, sem cadastro complexo | Formulário de publicação com só 3 campos obrigatórios |
| ONG / instituição receptora | Conseguir alimento confiável e a tempo de distribuir | Alta | Ver doações disponíveis rapidamente e garantir a reserva antes de outra ONG | Listagem em tempo real + exclusividade de aceite garantida pelo backend |
| Beneficiário final (pessoa atendida pela ONG) | Receber alimento em condição de consumo | Baixa (não usa o sistema diretamente) | Que o alimento chegue antes de vencer | Não tem tela própria nesta iteração — impacto medido indiretamente |
| Grupo de desenvolvimento (disciplina) | Entregar um produto real, com processo ágil, em três unidades | Alta | Walking skeleton simples, testável e que evolua sem retrabalho | Define o escopo mínimo: publicar → listar → aceitar, nada além disso |
| Professor / avaliador | Avaliar rigor de análise, projeto e construção ágil | Alta | Rastreabilidade entre análise, decisões (ADR) e código | Exige este próprio documento de análise atualizado e coerente com o código |
| Vigilância sanitária | Garantir rastreabilidade mínima do alimento redistribuído | Alta (pode vetar) | Saber tipo, quantidade e validade de cada doação | Define os 3 campos obrigatórios do cadastro (ver Conflitos de prioridade) |

## Objetivos de impacto

1. Reduzir o tempo entre "excedente disponível" e "doação reservada por uma
   ONG" de dias/horas informais para minutos, através de um canal único e
   público.
2. Aumentar a proporção de excedente alimentar redistribuído antes do
   vencimento, evitando que doadores descartem por falta de destinatário.
3. Dar a ONGs pequenas, sem rede de contatos ampla, o mesmo acesso a
   doações que ONGs maiores e mais conectadas já têm informalmente.

## Regras de negócio

- Toda doação publicada precisa de **tipo**, **quantidade** e **validade**;
  sem os três campos a publicação é recusada.
- Uma doação nasce com status `disponivel` e só aparece na listagem
  enquanto estiver nesse status.
- Uma doação só pode ser aceita por **uma** ONG. A partir do momento em que
  uma ONG aceita, a doação muda para status `aceita` e some da lista de
  disponíveis — nenhuma outra ONG pode aceitá-la depois, mesmo que a
  tentativa chegue quase ao mesmo tempo (condição de corrida resolvida na
  camada de dados, não na regra de negócio isolada).
- Não há, nesta unidade, edição ou cancelamento de doação, nem autenticação
  de doador/ONG — está fora do escopo do walking skeleton.

- **Regra ausente (o caso não define):** o que acontece se uma ONG aceita uma doação e
  não retira dentro de um prazo razoável — a doação fica "presa" indefinidamente com
  status `aceita`? Nesta unidade, não há expiração automática nem devolução à lista de
  disponíveis; fica registrado como lacuna a decidir em unidade futura, não como
  requisito esquecido.

## Conflitos de prioridade

**Conflito: simplicidade de cadastro (doador) x rastreabilidade (vigilância sanitária)**

- **Fala do doador:** "Se eu tiver que preencher um monte de campo toda vez que sobra
  comida, eu simplesmente não vou usar — no WhatsApp eu só mando uma mensagem."
- **Fala da vigilância sanitária:** "Sem saber o quê, quanto e até quando, não dá pra
  garantir que o alimento redistribuído é seguro para consumo."

**O eixo do trade-off:** número de campos obrigatórios no cadastro da doação. Quanto mais
campos a vigilância exige para rastreabilidade, maior o atrito para o doador publicar —
e quanto menor o atrito para o doador, menos garantia de rastreabilidade mínima existe.

**O que cada lado perde:**
- O doador perde velocidade e simplicidade a cada campo adicional exigido.
- A vigilância perde garantia de rastreabilidade a cada campo que deixa de ser obrigatório.

**Critério usado para decidir:** manter obrigatório apenas o mínimo de informação que já
permite rastrear uma doação problemática até a origem (tipo, quantidade e validade) —
qualquer campo além desses três (ex.: forma de preparo, temperatura de conservação,
número de lote) fica fora do walking skeleton por aumentar o atrito sem mudar o
comportamento central que estamos validando nesta unidade.

**Saída adotada:** *anular o eixo*, não apenas decidir um lado. Em vez de escolher entre
"poucos campos" e "muitos campos", o grupo reduziu a rastreabilidade ao mínimo que já
resolve o problema regulatório central (saber o quê, quanto e até quando) sem tratá-la
como um formulário extenso — os três campos obrigatórios (`tipo`, `quantidade`,
`validade`) cumprem as duas necessidades ao mesmo tempo. Isso é visível diretamente em
`criarDoacao()`, em `src/doacoes.js`, onde exatamente esses três campos são validados como
obrigatórios.

## Histórias de usuário

| # | História (Como… quero… para…) | INVEST: o que falha |
|---|---|---|
| 1 | Como **doador**, quero publicar uma doação com tipo, quantidade e validade, para que uma ONG saiba que o alimento existe antes que vença. | Pequena e testável isoladamente; Independente das demais (não depende de aceitação). |
| 2 | Como **ONG**, quero ver a lista de doações disponíveis, para escolher qual reservar antes que outra instituição o faça. | Depende da História 1 já existir para ter dado a listar — Independente fica parcialmente comprometido, é aceitável nesta ordem. |
| 3 | Como **ONG**, quero aceitar uma doação disponível, para garantir que ela seja destinada à minha instituição. | Precisa da regra de exclusividade (Valuable só se a doação some da lista para outras ONGs) — é o ponto onde Small e Valuable competem: a regra de concorrência exige mais cuidado do que o texto da história sugere. |

## Critérios de aceite

**História 1 — Doador publica uma doação**
Dado que o doador informa tipo, quantidade e validade
Quando ele publica a doação
Então ela aparece com status `disponivel`

Dado que falta algum campo obrigatório
Quando o doador tenta publicar
Então a publicação é recusada com erro 400

**História 2 — ONG vê doações disponíveis**
Dado que existe uma doação publicada com status `disponivel`
Quando uma ONG consulta a lista de doações
Então a doação aparece na lista

**História 3 — ONG aceita uma doação**
Dado que existe uma doação disponível
Quando uma ONG a aceita
Então a doação passa a ter status `aceita` e o nome da ONG registrado

Dado que uma doação já foi aceita
Quando ela é consultada na lista de disponíveis
Então ela não aparece mais

Dado que uma doação já foi aceita por uma ONG
Quando outra ONG tenta aceitá-la
Então o pedido é recusado com erro 400

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Duas ONGs aceitam a mesma doação ao mesmo tempo (condição de corrida) | Média | Alto — quebra a regra central do produto | Resolver a exclusividade na camada de dados (`UPDATE ... WHERE status = 'disponivel'`), não apenas checando antes de gravar |
| Doador esquece de publicar e o alimento se perde do mesmo jeito | Alta | Alto — o produto não cumpre seu objetivo | Fora do escopo técnico da U1; validar com usuário real na U2/U3 (lembrete, integração com sistemas do doador) |
| Falta de confiança entre desconhecidos (doador não sabe se a ONG é legítima e vice-versa) | Média | Médio | Fora do escopo do walking skeleton; registrar como próximo passo, não implementar autenticação prematuramente |
| Volume de dados cresce e a listagem simples não escala | Baixa nesta unidade | Baixo | SQLite resolve para o volume da disciplina; troca de banco já prevista para a Unidade 3 |

## Hipótese e experimento

**Hipótese:** se o doador tiver um canal com esforço mínimo (três campos,
sem cadastro) para publicar excedente, e a ONG tiver uma lista única e
atualizada de doações disponíveis, mais alimento será redistribuído antes
de vencer do que pelo canal informal atual (telefone/WhatsApp).

**Experimento (walking skeleton, U1):** implementar a fatia mais fina que
prova a hipótese ponta a ponta — publicar, listar e aceitar uma doação —
com testes automatizados cobrindo os critérios de aceite acima. O
experimento de validação com usuários reais (doador e ONG de verdade) fica
para as próximas unidades, quando o produto tiver interface e fluxo
completos o suficiente para observar comportamento real.

## Decisão de análise

- **Problema:** excedente alimentar se perde porque não existe canal rápido
  e público entre quem doa e quem pode redistribuir a tempo.
- **Alternativas:**
  1. Continuar informal (grupos de WhatsApp/telefone) — não escala, não dá
     visibilidade a novas ONGs, não registra histórico.
  2. Aplicativo completo com autenticação, geolocalização e notificações
     push desde o início — resolve mais, mas atrasa a validação da
     hipótese central e é grande demais para um walking skeleton.
  3. Fatia mínima ponta a ponta (publicar → listar → aceitar), sem
     autenticação nem geolocalização — escolhida.
- **Decisão e justificativa:** implementar a alternativa 3. O objetivo da
  Unidade 1 é provar a hipótese central com o menor artefato possível que
  ainda execute ponta a ponta; autenticação, geolocalização e notificações
  são incrementos que dependem de a hipótese central já estar validada.
- **Riscos e limitações:** sem autenticação, o sistema confia em quem
  publica e em quem aceita — aceitável para o escopo de disciplina e para
  provar a hipótese, mas é a primeira lacuna a resolver caso o produto saia
  do contexto acadêmico.

## Uso de IA

Usamos o Claude Code para: (1) revisar os testes existentes em
`tests/doacoes.test.js` e os *stubs* de `src/doacoes.js` e
`src/repositorio.js` para identificar o que faltava implementar; (2)
implementar as regras de negócio e o acesso a dados do fluxo
publicar → listar → aceitar; (3) redigir uma primeira versão deste
documento de análise a partir do contexto do projeto descrito no README e
nas histórias de usuário do template.

Verificamos manualmente: os critérios de aceite contra o comportamento real
da API (`npm test`, 6 testes passando), a regra de exclusividade de
aceitação (dupla aceitação é de fato recusada), e revisamos o texto deste
documento para refletir decisões e riscos que o grupo discutiu, não apenas
o que a IA sugeriu por padrão.

Na Aula 2 (nível "IA para consulta"), usamos o Claude para conferir o que
já estava coberto no documento contra o que a atividade pedia (mapa de
stakeholders, objetivos, conflito de prioridade) e para revisar a redação
do conflito de prioridade, da regra de negócio ausente e da nova coluna da
tabela de stakeholders.
