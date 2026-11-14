# Revisão de código e refatorações — grupo catolica-orangotango

**Repositório revisado:** <https://github.com/catolica-orangotango/projeto-prato-cheio>  
**Versão revisada:** commit [`bfcf211`](https://github.com/catolica-orangotango/projeto-prato-cheio/commit/bfcf211) (`main`, 12/11/2026), após o merge do PR [#44](https://github.com/catolica-orangotango/projeto-prato-cheio/pull/44) (`refatoracao/quatro-refatoracoes`, commit [`10fe27a`](https://github.com/catolica-orangotango/projeto-prato-cheio/commit/10fe27a))  
**Grupo revisado:** Gustavo Vinicius Taques, João Pedro Angélico, Luis Fernando Pereira, Vynicyus Candido  
**Revisores (grupo g1126 — 404 Fome Not Found):** Leonardo Lotério de Lima, Lucas Honorato dos Santos, Miguel Angel Balladares Huertas, Miguel Angelo Dufloth Filho

---

## Como revisamos

1. **Execução local da suíte e das ferramentas de qualidade:** clonamos o repositório localmente no Windows e executamos:
   - `npm test`: **44/44 testes passando** em ~350 ms;
   - `npm run test:cobertura`: **100% de cobertura de linhas e funções** em `src/` (`99,19%` de *statements* e `94,23%` de *branches*);
   - `npm run lint`: **0 erros** no ESLint;
   - `npm run formatar:checar`: **falhou localmente nos 15 arquivos** por diferença de quebra de linha (`CRLF` vs `LF` no Windows — ver achado **A8**).
2. **Inspeção dos commits da refatoração:** analisamos o histórico commit a commit da branch `refatoracao/quatro-refatoracoes` (`5e91531`, `c4df893`, `08eddb4`, `24adf9d`, `f994ad2` e `10fe27a`) confrontando com o documento [`docs/refatoracoes.md`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/refatoracoes.md).
3. **Leitura crítica do código e da documentação:** revisamos `src/` (`app.js`, `db.js`, `doacoes.js`, `repositorio.js`, `status.js`, `server.js`), `public/index.html`, `tests/doacoes.test.js`, `tests/e2e/*.e2e.js` e confrontamos com as regras de negócio e critérios de aceite de [`docs/analise.md`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/analise.md), [`docs/projeto.md`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/projeto.md) e os ADRs 0001 a 0007.

**Escala de prioridade:**
- **Alta:** viola regra de negócio/critério de aceite, permite gravar dado inconsistente ou bloqueia requisito obrigatório da Unidade 3.
- **Média:** brecha de validação, teste que não protege a camada de dados isoladamente ou mensagem de erro imprecisa.
- **Baixa:** oportunidade de refatoração complementar, portabilidade entre sistemas operacionais (Windows/Linux) ou melhoria de UX/arquitetura.

---

## Checklist de revisão

| # | Item avaliado | Resultado | Achado / Observação |
|:--:|---|:--:|---|
| 1 | As 4 refatorações estão registradas em `docs/refatoracoes.md` com cheiro, mudança e evidência | ✅ | R1 a R4 muito bem documentadas, com hashes de commit e tabela de evolução |
| 2 | Testes existentes protegiam o código antes de refatorar (ou novos testes foram criados antes) | ✅ | Criaram 2 testes antes da R1 (`5e91531`); ressalva sobre teste direto do repositório em **A5** |
| 3 | As refatorações preservaram o comportamento externo da API | ✅ | 44 testes de API e 20 E2E verdes antes e depois |
| 4 | Testes rodam e passam localmente e no CI | ✅ | 44/44 passando localmente com `npm test` |
| 5 | Validação das entradas (campos obrigatórios, tipos, datas, ONG) | ⚠️ | **A1**, **A6** |
| 6 | Coerência com as regras de negócio e critérios de aceite (`docs/analise.md`) | ⚠️ | **A2**, **A4** |
| 7 | Separação de responsabilidades em camadas (`app.js` → `doacoes.js` → `repositorio.js` → `db.js`) | ✅ | R2 corrigiu o vazamento da `ONG_PADRAO` que estava na rota |
| 8 | Mensagens e códigos de erro claros e sem expor detalhes internos | ⚠️ | **A5**, **A9** |
| 9 | SQL parametrizado, sem risco de injeção de SQL | ✅ | Todas as queries usam `?` (inclusive os status após a R4) |
| 10 | Controle de concorrência (aceite duplo e coleta dupla) | ⚠️ | Trava atômica no `UPDATE`, mas falta teste de corrida/repositório direto (**A5**) |
| 11 | Ausência de duplicação relevante e de strings mágicas | ✅ | Atacadas em R1, R3 e R4; oportunidade complementar em **A7** |
| 12 | Interface protegida contra XSS e funcional no celular | ✅ | Uso seguro de `textContent` e cobertura E2E mobile; ressalva de UX em **A10** |
| 13 | Ferramentas de qualidade (ESLint, Prettier, cobertura) | ⚠️ | Cobertura 100% e ESLint limpo, mas `formatar:checar` falha no Windows (**A8**) |
| 14 | Preparação / migração para PostgreSQL (Unidade 3 / ADR 0001) | ❌ | Ainda em SQLite e com funções exclusivas do SQLite no repositório e em teste (**A3**) |

---

## Avaliação das 4 refatorações e pontos fortes

- **Disciplina exemplar de refatoração guiada por cobertura (R1):** antes de extrair o `try/catch` das 7 rotas para `responder()` em [`src/app.js:6-14`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/app.js#L6-L14), o grupo usou o relatório de cobertura para notar que os blocos `catch` de `GET /api/doacoes` e `GET /api/doacoes/aceitas` não eram cobertos. Criaram primeiro o teste de falha real do banco ([`tests/doacoes.test.js:619-640`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/tests/doacoes.test.js#L619-L640), commit `5e91531`) e só depois refatoraram (`c4df893`), levando `src/` a 100% de cobertura de linhas.
- **Correção arquitetural precisa na R2 (`08eddb4`):** mover `ONG_PADRAO = 'ONG'` da rota para [`src/doacoes.js:8`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L8) alinhou o código com a Decisão D5 de `docs/projeto.md` e com o diagrama de classes do grupo.
- **Extração limpa de validações na R3 (`24adf9d`):** substituir o laço sobre pares `[campo, rótulo]` por chamadas diretas a `dataObrigatoria(inicio, 'início')` e `dataObrigatoria(fim, 'fim')` em [`src/doacoes.js:117-123`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L117-L123) deixou a leitura de `totalColetadas` muito mais clara e direta, além de unificar `buscarExistente(id)` e `nomeDaOng(ong)`.
- **Eliminação de *magic strings* com objeto imutável na R4 (`f994ad2`):** [`src/status.js`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/status.js) usa `Object.freeze` e passa os status como parâmetros `?` nas queries de [`src/repositorio.js`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js), evitando tanto concatenação em SQL quanto literais espalhados.
- **Validação rigorosa de calendário e suíte E2E com Playwright:** a função `dataValida` ([`src/doacoes.js:13-17`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L13-L17)) recusa datas inexistentes como `2026-02-31`, e a suíte Playwright em `tests/e2e/` testa a aplicação real em viewport de celular, incluindo queda de servidor (`page.route`).

---

## Achados e propostas de melhoria

### A1 · Alta · Aceite com `ong` vazia (`""`) ou só com espaços (`"   "`) grava ONG em branco e deixa a doação "invisível" para as Histórias 4 e 5

- **Onde:** [`src/doacoes.js:83-93`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L83-L93) e [`docs/refatoracoes.md:58-59`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/refatoracoes.md#L58-L59).
- **O que encontramos:** em `aceitar(id, ong)`, a linha 88 faz:
  ```js
  const aceita = await repo.aceitar(id, String(ong ?? ONG_PADRAO).trim());
  ```
  Como o operador `??` só ativa `ONG_PADRAO` para `null` ou `undefined`, se uma requisição enviar `{ "ong": "" }` ou `{ "ong": "   " }`, o `.trim()` resulta em `""` (string vazia) e a doação é gravada como aceita com `ong = ""`. Em `docs/refatoracoes.md`, vocês registraram isso de forma consciente porque manteria o comportamento antigo durante a refatoração.
- **Por que importa (e por que propomos mudar):**
  1. Quando essa doação é coletada (`POST /api/doacoes/:id/coletar`), ela fica com `status = 'coletada'` e `ong = ""`.
  2. Porém, as rotas das Histórias 4 e 5 (`totalColetadas` e `estoqueDaOng`) validam a ONG com `nomeDaOng(ong)` ([`src/doacoes.js:29-34`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L29-L34)), que **recusa** string vazia ou só de espaços (`throw new Error('informe a ONG')`).
  3. Resultado: uma doação aceita com `{ "ong": "   " }` entra num limbo — **nunca poderá ser consultada pelo coordenador (H4) nem auditada pela vigilância sanitária (H5)**, quebrando a rastreabilidade exigida pela RN1 e pela H5.
  4. Além disso, a R3 extraiu `nomeDaOng(ong)` para centralizar a limpeza do nome da ONG, mas `aceitar()` continuou fazendo `String(...).trim()` separado.
- **Proposta:**
  - Tratar string vazia/espaços da mesma forma que ausente aplicando `vazio(ong) ? ONG_PADRAO : nomeDaOng(ong)` em `aceitar(id, ong)` (ou passar a exigir `nomeDaOng(ong)` também no aceite), garantindo que nenhuma doação aceita seja gravada com `ong = ""`.
  - Adicionar um teste em `tests/doacoes.test.js` cobrindo `POST /api/doacoes/:id/aceitar` com `{ ong: '   ' }`.

---

### A2 · Alta · Buscas por ONG diferenciam maiúsculas e minúsculas, mas `aceitar` não compartilha a função `nomeDaOng` criada na R3

- **Onde:** [`src/doacoes.js:29-34`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L29-L34), [`src/doacoes.js:88`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L88) e [`src/repositorio.js:88,103`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js#L88).
- **O que encontramos:** na justificativa da R3 em [`docs/refatoracoes.md:70-72`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/refatoracoes.md#L70-L72), vocês explicam que extraíram `nomeDaOng(ong)` porque *"uma correção numa dessas validações (por exemplo, normalizar o nome da ONG para minúsculas, o problema da 'Casa da Sopa' registrado nos diagramas) teria de ser feita em dois lugares"*. Contudo:
  1. `aceitar()` (linha 88) **não chama `nomeDaOng()`** — faz `String(ong ?? ONG_PADRAO).trim()` por conta própria. Se alguém alterar apenas `nomeDaOng()` para normalizar maiúsculas/minúsculas na consulta, o valor gravado no aceite continuará sem normalizar e a busca quebrará!
  2. Hoje, se a doação é aceita por `"Casa da Sopa"` e consultada nas Histórias 4 ou 5 como `"casa da sopa"`, o banco retorna `0` doações porque `WHERE ong = ?` é *case-sensitive*.
- **Por que importa:** a motivação declarada na R3 (ter um ponto único para normalizar o nome da ONG entre gravação e leitura) ainda está incompleta enquanto `aceitar()` não passar pela mesma função de normalização que `totalColetadas()` e `estoqueDaOng()`.
- **Proposta:**
  - Fazer `aceitar()` usar `nomeDaOng(ong ?? ONG_PADRAO)` para que gravação e leitura passem de fato pelo mesmo ponto único.
  - Comparar sem diferenciar caixa no SQL (`LOWER(ong) = LOWER(?)`) para não perder a formatação original ao exibir na interface e, ao mesmo tempo, não retornar zero quando o usuário digitar `"casa da sopa"`.

---

### A3 · Alta · Migração para PostgreSQL pendente e acoplamentos ao SQLite no repositório e no teste criado na R1

- **Onde:** [`src/db.js:1-72`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/db.js#L1-L72), [`src/repositorio.js:26,46,71,89`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js#L26) e [`tests/doacoes.test.js:632,638`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/tests/doacoes.test.js#L632).
- **O que encontramos:**
  1. A migração para PostgreSQL (decidida no ADR 0001 e prevista para a Unidade 3) ainda não foi executada ([`docs/refatoracoes.md:113-114`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/refatoracoes.md#L113-L114)).
  2. Embora o `README.md` (linha 101) diga que *"a troca do banco fica contida nele [`src/db.js`]"*, `src/repositorio.js` usa funções exclusivas do SQLite em 4 consultas:
     - `validade >= date('now')` (`listarDisponiveis`, linha 26);
     - `aceita_em = datetime('now')` (`aceitar`, linha 46);
     - `coletada_em = datetime('now')` (`coletar`, linha 71);
     - `date(coletada_em) BETWEEN ? AND ?` (`contarColetadas`, linha 89).
  3. O teste novo criado antes da R1 ([`tests/doacoes.test.js:632,638`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/tests/doacoes.test.js#L632)) verifica `expect(res.body.erro).toMatch(/no such table/i)`. Essa mensagem é específica do driver SQLite; no PostgreSQL a mensagem é `relation "doacoes" does not exist`.
- **Por que importa:** quando vocês executarem a refatoração de banco para PostgreSQL, além de `src/db.js` e `src/repositorio.js`, o próprio teste adicionado na R1 vai quebrar por depender do texto interno de erro do SQLite.
- **Proposta:**
  - No teste da linha 632/638 de `tests/doacoes.test.js`, verificar `expect(res.body.erro).toMatch(/no such table|does not exist/i)` (ou apenas `expect(res.body.erro).toBeTruthy()`), para que o teste sobreviva à troca de banco sem precisar ser editado durante a migração.
  - Na migração para PostgreSQL, substituir `date('now')` por `CURRENT_DATE` e `datetime('now')` por `CURRENT_TIMESTAMP` (que são SQL ANSI e funcionam nos dois bancos!).

---

### A4 · Média · Doação que vence após ser publicada ainda pode ser aceita por uma ONG

- **Onde:** [`src/doacoes.js:83-93`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L83-L93) e [`src/repositorio.js:43-52`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js#L43-L52).
- **O que encontramos:** a RN2 (`docs/analise.md`) define que *"só aparece o que ainda serve"* e `listarDisponiveis()` filtra `validade >= date('now')`. Porém, nem `doacoes.aceitar()` nem `repo.aceitar()` verificam se a doação já venceu no momento do aceite (`WHERE id = ? AND status = ?`).
  - Testamos esse cenário: se uma doação publicada ontem venceu hoje (ex.: inserida no banco com `validade` passada, como no teste da linha 111 de `tests/doacoes.test.js`), ela não aparece em `GET /api/doacoes`, mas um `POST /api/doacoes/:id/aceitar` **responde 200 e aceita a comida vencida**, que passa a aparecer em `GET /api/doacoes/aceitas` para o entregador retirar!
- **Por que importa:** uma ONG que deixou a página aberta antes da meia-noite (ou às 20h59 no Brasil, já que o servidor usa UTC) consegue clicar em "Aceitar" depois da virada do dia e agendar a coleta de um alimento já vencido, contrariando a RN2 e o risco R2 da Análise.
- **Proposta:**
  - Em `doacoes.aceitar(id, ong)`, aproveitar o retorno de `const doacao = await buscarExistente(id)` para verificar `if (doacao.validade < hoje()) throw new Error('doação já está vencida')`, e/ou incluir `AND validade >= date('now')` na trava do `UPDATE` em `repo.aceitar`.

---

### A5 · Média · A trava atômica de `repo.coletar` contra doação `disponivel` não é exercitada pelos testes, e aceitar doação já `coletada` responde mensagem imprecisa

- **Onde:** [`src/doacoes.js:83-113`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L83-L113) e [`src/repositorio.js:43-77`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js#L43-L77).
- **O que encontramos:**
  1. Em [`docs/refatoracoes.md:93-96`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/refatoracoes.md#L93-L96) (R4), vocês destacam que a trava `WHERE id = ? AND status = ?` em `repo.coletar` impede coletar uma doação disponível e citam o teste de coleta de doação disponível como evidência. Porém, em `doacoes.coletar(id)` (linha 104), há um `if (doacao.status === STATUS.DISPONIVEL)` **antes** de chamar `repo.coletar(id)`. Por isso, o teste via API nunca chega ao `UPDATE` de `repo.coletar` quando a doação está `disponivel`!
  2. Além disso, todos os testes de aceite duplo e coleta dupla em `tests/doacoes.test.js` fazem duas chamadas **sequenciais** (`await request...; await request...`), sem teste de concorrência (`Promise.all`) nem teste unitário chamando `repo.aceitar` e `repo.coletar` diretamente.
  3. Em `doacoes.aceitar(id, ong)` (linha 84), o retorno de `await buscarExistente(id)` é descartado. Se alguém tentar aceitar uma doação que já está **`coletada`**, a API responde `"doação já foi aceita por outra ONG"` (ou até quando foi a própria ONG que já coletou).
- **Por que importa:** na nossa atividade de refatoração descobrimos esse exato ponto com teste de mutação manual: quando a regra em `doacoes.js` barra antes, um defeito na cláusula `WHERE status = ?` do repositório pode passar com 100% dos testes de API verdes.
- **Proposta:**
  - Adicionar testes diretos para `repo.aceitar` e `repo.coletar` (chamando `repositorio.js` diretamente) para provar que o próprio SQL recusa transições inválidas e concorrência.

---

### A6 · Média · `Number(dados.quantidade)` aceita booleanos (`true`) e arrays (`[10]`) na publicação via API

- **Onde:** [`src/doacoes.js:50-58`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/doacoes.js#L50-L58).
- **O que encontramos:** `criarDoacao` valida os campos obrigatórios com `vazio(valor)` e converte a quantidade com `const quantidade = Number(dados.quantidade)`. Em JavaScript:
  - `vazio(true)` é `false` e `Number(true)` é `1` (`Number.isInteger(1)` é `true`);
  - `vazio([10])` é `false` e `Number([10])` é `10`;
  - `Number("0x10")` é `16`.
  Logo, um `POST /api/doacoes` com `{ "tipo": "Sopa", "quantidade": true, "unidade": "kg", "validade": "2099-12-31" }` é aceito com status `201` e grava `quantidade = 1` no banco.
- **Por que importa:** como o grupo decidiu no [ADR 0006](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/docs/adr/0006-interface-envia-quantidade-sem-converter.md) concentrar toda a validação da RN1 no servidor, convém garantir que `quantidade` seja apenas inteiro decimal positivo (número ou string de dígitos).
- **Proposta:**
  - Validar `/^[1-9]\d*$/.test(String(dados.quantidade).trim())` e garantir que `typeof dados.quantidade === 'number' || typeof dados.quantidade === 'string'` antes de converter.

---

### A7 · Baixa · Oportunidade de refatoração complementar: `repo.aceitar` e `repo.coletar` repetem o padrão de transição atômica

- **Onde:** [`src/repositorio.js:43-52`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js#L43-L52) e [`src/repositorio.js:68-77`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/repositorio.js#L68-L77).
- **O que encontramos:** as duas funções executam a mesma estrutura de transição condicional de estado (`UPDATE doacoes SET status = ?, ... WHERE id = ? AND status = ? RETURNING *` devolvendo `rows[0]`), com comentários quase idênticos explicando a trava otimista no `WHERE`.
- **Por que importa:** hoje são apenas duas transições (`DISPONIVEL → ACEITA` e `ACEITA → COLETADA`), então o código ainda é curto. Porém, caso o projeto evolua com novos estados (como reserva ou cancelamento), extrair uma função interna de transição evita duplicar o esqueleto do `UPDATE ... WHERE id = ? AND status = ? RETURNING *`.
- **Proposta:** manter no radar caso surja um terceiro estado; não é urgente com apenas duas transições.

---

### A8 · Baixa · `npm run formatar:checar` falha no Windows por ausência de `.gitattributes` / `endOfLine`

- **Onde:** [`.prettierrc.json`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/.prettierrc.json).
- **O que encontramos:** ao clonar o repositório no Windows e rodar `npm run formatar:checar`, o Prettier aponta erro de formatação em todos os 15 arquivos (`.js`). Isso acontece porque o Prettier 3 exige `LF` por padrão (`"endOfLine": "lf"`), mas o repositório não tem um arquivo `.gitattributes`, então o Git no Windows converte os arquivos para `CRLF` no checkout.
- **Por que importa:** qualquer integrante ou avaliador que rode os comandos de qualidade documentados no `README.md` em máquina Windows verá `npm run formatar:checar` falhar, mesmo sem ter alterado nenhuma linha.
- **Proposta:**
  - Adicionar um arquivo `.gitattributes` na raiz com `* text=auto eol=lf` (ou `"endOfLine": "auto"` no `.prettierrc.json`).

---

### A9 · Baixa · Falhas inesperadas de infraestrutura (banco fora do ar / tabela inexistente) respondem `400` e vazam mensagem interna do banco

- **Onde:** [`src/app.js:6-14`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/src/app.js#L6-L14) e [`tests/doacoes.test.js:629-639`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/tests/doacoes.test.js#L629-L639).
- **O que encontramos:** em `docs/refatoracoes.md` (linha 109), vocês registraram muito bem que mudar `400` para `404`/`409` em erros de negócio mudaria o comportamento da API e por isso ficou fora da refatoração. Contudo, o teste criado na R1 (`DROP TABLE doacoes`) evidencia outro efeito colateral: quando ocorre uma falha grave de infraestrutura/SQL no servidor, a API também devolve `400 Bad Request` (indicando culpa do cliente) e expõe a mensagem crua do driver (`"no such table: doacoes"`).
- **Por que importa:** expor erros internos de SQL em produção vaza detalhes do schema, e responder `400` em vez de `500` esconde quedas do banco no monitoramento.
- **Proposta:** aproveitando que a R1 centralizou tudo em `responder()`, diferenciar erros de domínio (ex.: lançados pelas regras com `status = 400/404/409`) de erros inesperados de infraestrutura (respondendo `500` com mensagem genérica).

---

### A10 · Baixa · Interface fixa `'Minha ONG'` no aceite, impedindo escolher a ONG pela tela

- **Onde:** [`public/index.html:157-161`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/public/index.html#L157-L161).
- **O que encontramos:** nas seções das Histórias 4 e 5 da página, existe um `<input>` para informar o nome da ONG consultada (`id="relatorio-ong"` e `id="estoque-ong"`). Já na seção "Doações disponíveis" (História 2), o botão "Aceitar" envia sempre `{ ong: 'Minha ONG' }` fixo no código. Por causa disso, nos testes E2E de relatórios ([`tests/e2e/relatorios.e2e.js:17`](https://github.com/catolica-orangotango/projeto-prato-cheio/blob/bfcf211/tests/e2e/relatorios.e2e.js#L17)), foi necessário fazer o aceite via API para conseguir usar nomes de ONGs diferentes.
- **Por que importa:** se duas ONGs diferentes usarem a interface web (sem chamar a API manualmente), ambas aceitarão doações sob o mesmo nome `'Minha ONG'`, misturando seus relatórios nas Histórias 4 e 5.
- **Proposta:** adicionar um campo `<input id="aceitar-ong" value="Minha ONG">` na seção de doações disponíveis para que a ONG possa se identificar ao aceitar pela tela, da mesma forma que já faz nos relatórios.

---

## Resumo das propostas, por prioridade

1. **Prioridade Alta (A1, A2, A3):**
   - Impedir que um aceite com `ong` vazia ou só de espaços (`""` / `"   "`) grave ONG em branco no banco, usando `nomeDaOng` também em `aceitar()` (**A1**);
   - Unificar a normalização do nome da ONG entre aceite e relatórios e tornar a busca *case-insensitive* (**A2**);
   - Preparar as queries de `src/repositorio.js` (`CURRENT_DATE`, `CURRENT_TIMESTAMP`) e desacoplar o regex `/no such table/i` do teste da R1 para a migração para PostgreSQL (**A3**).
2. **Prioridade Média (A4, A5, A6):**
   - Impedir o aceite de doação cuja validade já passou (**A4**);
   - Criar testes diretos de `repositorio.js` para exercitar a trava atômica de `repo.coletar` e `repo.aceitar` sem depender da checagem prévia em `doacoes.js` (**A5**);
   - Restringir `quantidade` em `criarDoacao` para não aceitar booleanos (`true`) ou arrays (`[10]`) (**A6**).
3. **Prioridade Baixa (A7, A8, A9, A10):**
   - Configurar `.gitattributes` / `endOfLine` para o Prettier passar no Windows (**A8**);
   - Separar erros de regra (4xx) de falhas de banco (500) no helper `responder()` (**A9**);
   - Permitir informar o nome da ONG ao aceitar pela interface (**A10**).

---

## Mensagem para o grupo catolica-orangotango

> Olá, pessoal! Revisamos o repositório de vocês no commit `bfcf211` (após o merge do PR #44 com as quatro refatorações e o `docs/refatoracoes.md`).
>
> Parabéns pelo cuidado técnico: rodamos o projeto localmente e os 44 testes de API passaram de primeira com 100% de cobertura de linhas em `src/` e 0 erros no ESLint. Gostamos muito de como vocês usaram a cobertura antes da R1 para identificar que o `catch` das rotas de listagem não tinha teste e criaram o teste de falha real antes de extrair o `responder()`, além da organização da suíte E2E com Playwright.
>
> Deixamos o nosso checklist completo e os achados detalhados (com links para as linhas e o motivo de cada proposta) no arquivo `docs/revisao-grupo-orangotango.md`. Os principais pontos que recomendamos olhar são:
> 1. **Aceite com ONG só de espaços (`"   "`) e normalização (A1 e A2):** após a R2/R3, `aceitar()` ainda faz `String(ong ?? ONG_PADRAO).trim()` sem passar por `nomeDaOng()`. Se vier `{ ong: "   " }`, grava `ong = ""` no banco, e depois essa doação nunca pode ser consultada nas Histórias 4 e 5 (pois `nomeDaOng` recusa string vazia). Usar `nomeDaOng` também no aceite resolve isso e fecha o ponto único de normalização que vocês motivaram na R3.
> 2. **Preparação para o PostgreSQL (A3):** o teste novo criado na R1 espera `/no such table/i`, que é a mensagem específica do SQLite, e `repositorio.js` ainda usa `date('now')` e `datetime('now')`.
> 3. **Validade no momento do aceite e teste direto do repositório (A4 e A5):** `aceitar()` não verifica se a doação já venceu quando o pedido chega, e a trava `AND status = 'aceita'` de `repo.coletar` contra doação disponível não chega a ser exercitada pelos testes de API porque `doacoes.coletar` barra antes na linha 104.
> 4. **Prettier no Windows (A8):** `npm run formatar:checar` falha nos 15 arquivos ao clonar no Windows por falta de `.gitattributes` (`eol=lf`) ou `"endOfLine": "auto"`.
>
> Qualquer dúvida sobre os pontos levantados, estamos à disposição!
