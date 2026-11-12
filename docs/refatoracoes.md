# Refatorações — Prato Cheio

*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*

A Refatoração 1 é a migração de banco decidida no ADR 0002, feita em 04/11 (PR #19). As Refatorações 2 a 5 são as quatro da atividade da Aula 13. Os cheiros de código foram identificados com apoio de IA (Claude) e cada um foi conferido no código antes de mexer.

**Regra que seguimos:** antes de refatorar, conferir se os testes realmente pegariam uma quebra. Onde não pegavam, escrevemos o teste primeiro, vimos ele passar no código antigo e só então mexemos.

## Antes de refatorar: os testes protegiam de verdade?

Os 33 testes existentes conferiam quase só o status HTTP (200/400). Para medir isso, introduzimos de propósito um defeito por refatoração e rodamos a suíte (teste de mutação manual):

| Defeito introduzido de propósito | Suíte original (33) | Suíte nova (50) |
|---|---|---|
| Rota devolve `{ mensagem }` em vez de `{ erro }` | 6 falham | 12 falham |
| ONG padrão `'ONG'` vira `'ong'` | **0 falham** | 2 falham |
| Mensagem "doação não encontrada" muda de texto | 1 falha | 5 falham |
| Prazo da reserva de 20 vira 25 minutos | **0 falham** | 1 falha |
| UPDATE perde a condição `AND status = ?` (atomicidade) | **0 falham** | 4 falham |

O último caso é o mais grave: a regra central do produto (duas ONGs não ficam com a mesma doação) não tinha teste que a protegesse. Os testes de "corrida" com `Promise.all` passavam mesmo sem a condição, porque `doacoes.js` confere o status antes de gravar e as duas requisições acabam rodando em sequência.

Testes criados antes das refatorações:

- `tests/caracterizacao.test.js` (11 testes): fixa a mensagem de erro exata de cada rota, a ONG padrão, os campos devolvidos e o prazo de 20 minutos (19 min ainda ativa, 21 min expirada).
- `tests/repositorio.test.js` (6 testes): chama o repositório direto, pulando as regras, e prova que o próprio UPDATE recusa a segunda reserva, o segundo aceite, o cancelamento de uma reservada e a confirmação por outra ONG.

Total: **33 → 50 testes**. Os 17 novos passaram no código antes de qualquer refatoração.

## Refatoração 1 — Migração de SQLite para PostgreSQL

*Feita por Lucas em 04/11 (PR #19, commits `1f53a92` e `c6b3923`).*

- **Motivo:** ADR 0002. O SQLite aceita um escritor por vez e fica preso a um arquivo local, o `node:sqlite` é experimental e a disciplina exige PostgreSQL na Unidade 3.
- **O que mudou:**
  - `src/db.js`: `node:sqlite` trocado por `pg` (Pool via `DATABASE_URL`). A função `paraPostgres()` converte `?` em `$1, $2…`, então o resto do código continua usando `?`. O schema passou a usar `GENERATED ALWAYS AS IDENTITY` e `TIMESTAMPTZ`.
  - `src/repositorio.js`: `datetime('now')` virou `now()` e `datetime(x, '+20 minutes')` virou `x + interval '20 minutes'`, em 3 linhas.
  - `.github/workflows/ci.yml`: serviço `postgres:16-alpine` no job.
  - `vitest.config.js`: `fileParallelism: false`, porque os arquivos de teste dividem o mesmo banco.
- **O que NÃO mudou:**
  - `src/doacoes.js` e `src/app.js` (0 linhas no diff): as regras de negócio e as rotas nem perceberam a troca.
  - Nos testes, só as 2 linhas que simulam a expiração mudaram, porque usavam SQL do SQLite (`datetime('now', '-30 minutes')`).
- **Evidência de que o comportamento se manteve:**
  - testes antes da mudança (SQLite, commit `23ac02c`, o anterior à migração): **33 passando**
  - testes depois da mudança (PostgreSQL): **33 passando**
  - link da execução do CI verde: https://github.com/migueldufloth/g1126-template-prato-cheio/actions/runs/41932865595/job/126933903765?pr=19

## Refatoração 2 — Extrair o tratamento de erro das rotas (`src/app.js`)

- **Cheiro de código atacado:** código duplicado. As 6 rotas repetiam o mesmo bloco `try { res.json(...) } catch { res.status(400).json({ erro }) }`, e `req.body?.ong ?? 'ONG'` aparecia 3 vezes.
- **Qual dor concreta isso resolvia:** o contrato da API (sucesso em JSON, erro como 400 com `{ erro }`) estava espalhado. Mudar esse contrato, por exemplo para devolver 404 em "não encontrada", exigiria editar 6 lugares iguais e lembrar de todos.
- **O que mudou:** criamos a função `rota(executar, statusSucesso)`, que embrulha cada rota, e `ongDa(req)`. Cada rota virou uma linha. O arquivo caiu de 62 para 39 linhas.
- **Evidência (testes verdes antes e depois):** 44/44 antes e 44/44 depois (commit `149b42b`). A troca de `{ erro }` por `{ mensagem }` derruba 12 testes, e a troca da ONG padrão derruba 2.

## Refatoração 3 — Extrair a verificação "a doação existe" (`src/doacoes.js`)

- **Cheiro de código atacado:** código duplicado. `aceitar`, `reservar`, `confirmarReserva` e `cancelar` abriam com as mesmas duas linhas: buscar por id e lançar `'doação não encontrada'`.
- **Qual dor concreta isso resolvia:** a regra "a doação precisa existir" estava em 4 lugares. Uma nova operação, como editar a doação, teria de copiar o bloco, e mudar a mensagem exigiria mexer nos 4.
- **O que mudou:** criamos a função `buscarExistente(id)`, que as 4 operações chamam.
- **Evidência (testes verdes antes e depois):** 44/44 antes e 44/44 depois (commit `7597477`). Mudar o texto da mensagem derruba 5 testes (antes da caracterização, derrubava só 1).

## Refatoração 4 — Constantes no lugar de textos e números mágicos (`src/status.js`)

- **Cheiro de código atacado:** números e textos mágicos. Os estados `'disponivel'`, `'reservada'`, `'aceita'` e `'cancelada'` estavam escritos à mão em 21 lugares entre `doacoes.js` e `repositorio.js`, e o prazo de 20 minutos estava fixo dentro do SQL.
- **Qual dor concreta isso resolvia:** um erro de digitação, como `'disponível'` com acento, passaria calado: o UPDATE simplesmente não acharia a linha. E o prazo da Decisão 2 ficava escondido numa string SQL.
- **O que mudou:**
  - Novo arquivo `src/status.js`, com `STATUS` (objeto congelado, os mesmos estados do diagrama de estados) e `PRAZO_RESERVA_MINUTOS = 20`.
  - `doacoes.js` e `repositorio.js` passaram a usar essas constantes.
  - No SQL, status e prazo agora vão como parâmetro (`? * interval '1 minute'`), não concatenados.
- **Evidência (testes verdes antes e depois):** 44/44 antes e 44/44 depois (commit `723634c`). Mudar o prazo para 25 minutos derruba o teste "reserva com 21 minutos já expirou". Na suíte original nenhum teste falhava, porque o único teste de expiração usava 30 minutos.

## Refatoração 5 — Extrair a transição de estado atômica (`src/repositorio.js`)

- **Cheiro de código atacado:** código duplicado. `aceitar`, `reservar`, `confirmarReserva` e `cancelar` repetiam o mesmo esqueleto: `atualizarExpiradas()`, depois o UPDATE condicional, depois `if (alteradas === 0) return undefined`, depois `buscarPorId(id)`.
- **Qual dor concreta isso resolvia:**
  - O padrão que garante que só uma ONG vence (o UPDATE só altera se a doação *ainda* estiver no estado esperado) era a peça mais importante do sistema e estava copiado 4 vezes, com o motivo explicado em comentários diferentes.
  - Cada operação fazia 4 consultas, porque `buscarPorId` rodava `atualizarExpiradas` de novo antes do SELECT.
- **O que mudou:**
  - Criamos a função `transicionar(id, { de, para, set, valores, filtro })`, com um comentário único explicando a atomicidade.
  - As 4 operações viraram chamadas declarativas ("de disponível para reservada, gravando reservada_por").
  - O `RETURNING *` devolve a doação já atualizada: **2 consultas por operação em vez de 4**.
- **Evidência (testes verdes antes e depois):**
  - Primeiro criamos `tests/repositorio.test.js`, porque nenhum teste protegia a atomicidade (ver a tabela acima). Ele deu 50/50 no código antigo, e tirar a condição do UPDATE de `reservar` derrubava 2 testes.
  - Depois da refatoração: 50/50 (commits `1cdd422` e `3b54983`). Tirar a condição de `transicionar()` derruba 4 testes.

**CI verde das Refatorações 2 a 5 (PR #22):** https://github.com/migueldufloth/g1126-template-prato-cheio/actions/runs/43136343309/job/130912489550?pr=22

---

**Limitações e o que ficou de fora:** coisas que vimos e decidimos não refatorar, e por quê.

- **Todo erro vira 400**, inclusive "doação não encontrada", que deveria ser 404. Corrigir isso muda o comportamento da API, então não é refatoração: é uma história nova. Depois da Refatoração 2, a mudança fica num lugar só, `rota()`.
- **Aceitar uma doação *reservada* responde "doação já foi aceita por outra ONG"** (nome que engana). Também seria mudança de comportamento, então a fixamos num teste de caracterização e deixamos registrada para decidir com o grupo.
- **ONG padrão `'ONG'`:** sem `ong` no corpo, qualquer um aceita ou reserva em nome de "ONG". Isso é uma questão de identificação de usuário, fora do escopo de refatoração.
- **`paraPostgres()` em `db.js`** troca todo `?` por `$n`, então um `?` literal dentro de um texto SQL quebraria a consulta. Hoje nenhum SQL tem `?` literal. Deixamos o aviso no código.
- **`DEFAULT 'disponivel'` no schema** (`db.js`) continua literal, porque é DDL e não pode usar parâmetro.
- **Os testes repetem** `beforeEach(migrar + limparBanco)` e a função `publicar()` em cada `describe` e arquivo. Daria para extrair um arquivo de apoio, mas não mexemos em teste e código ao mesmo tempo nesta rodada.
- **README desatualizado:** ainda diz que o banco é SQLite, que os testes rodam em memória e fala do `ExperimentalWarning`. Precisa ser atualizado para PostgreSQL.
- **ADR 0002, "Como saberemos que deu certo":** o ADR cita as corridas pela API como prova, mas elas não exercitam a corrida de verdade. A prova real agora está em `tests/repositorio.test.js`.
