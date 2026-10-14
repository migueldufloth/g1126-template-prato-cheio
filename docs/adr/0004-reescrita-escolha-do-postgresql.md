# ADR 0004 — PostgreSQL como banco relacional do Prato Cheio

- **Data:** 2026-10-14
- **Status:** aceito

> **Registro original (substituído por este ADR):** "Decidimos utilizar PostgreSQL porque é um banco melhor."
> Não serve como ADR: não diz qual problema motivou a decisão, não compara com nada e não registra o que se perde.

## Contexto

O Prato Cheio guarda as doações em SQLite embutido (`node:sqlite`, arquivo `dados.sqlite`), acessado só por `src/db.js` através de `query()`, que devolve `{ rows }`. A regra central do produto — uma doação aceita não fica disponível para outra ONG — está em `src/repositorio.js` como `UPDATE ... WHERE id = ? AND status = 'disponivel'`: se zero linhas mudam, a corrida foi perdida.

O que pesa nesta decisão:

- **A disciplina exige PostgreSQL na Unidade 3.** É uma restrição do trabalho, não uma conclusão técnica do grupo, e fica declarada aqui de forma explícita.
- **O SQLite já garante a exclusividade do aceite.** Ele serializa as escritas, então o `UPDATE ... WHERE status` é seguro hoje. A migração não corrige um bug; ela remove limites do SQLite que crescem junto com o produto.
- **Os limites do SQLite:** um escritor por vez; dados presos a um arquivo local (um servidor, uma máquina); o `README.md` já registra falha de `disk I/O error` em pastas sincronizadas; `node:sqlite` ainda é marcado como experimental.
- **As decisões da Aula 6 (expiração de doação aceita, reserva com prazo) acrescentam escritas e transições de estado por tempo** sobre a mesma tabela.
- **Restrições do piloto:** orçamento próximo de zero, um bairro só, prazo curto.

## Alternativas consideradas

1. **Manter SQLite.**
   - Prós: zero instalação e zero custo; testes em memória rápidos; já funciona (6/6 testes passando).
   - Contras: escrita serializada e dados presos a um arquivo local; `node:sqlite` experimental; descumpre a exigência da Unidade 3.
2. **PostgreSQL.**
   - Prós: várias conexões simultâneas, com bloqueio por linha; acesso pela rede via `DATABASE_URL`, sem depender de um arquivo; o `UPDATE ... WHERE status = 'disponivel'` mantém o mesmo significado (um segundo aceite espera o primeiro terminar, reavalia a condição e altera zero linhas); atende à exigência da disciplina.
   - Contras: é preciso subir e operar um servidor (contêiner Docker); o CI passa a precisar de um serviço PostgreSQL; os testes deixam de ser em memória; o dialeto SQL muda (`?` → `$1`, `datetime('now')`, `AUTOINCREMENT`), então `db.js` e `migrar()` precisam ser reescritos.
3. **MySQL / MariaDB.**
   - Prós: relacional maduro, também aceita acessos simultâneos.
   - Contras: não resolve nada que o PostgreSQL não resolva; o MySQL não tem `RETURNING`, e `inserir` em `src/repositorio.js` depende dele; descumpre a exigência da disciplina. Foi descartada por esses dois motivos, e não por ser tecnicamente inferior.

## Decisão

Migrar para **PostgreSQL**, executando a troca na Unidade 3 como refatoração protegida pelos testes, com o banco em contêiner Docker local acessado por `DATABASE_URL` (decisão de infraestrutura já registrada na Aula 6, em `docs/atividades/aula06.md`).

**Nota:** este ADR trata da escolha do motor de banco; a migração completa está na ADR-0002, e a hospedagem em produção foi revista na ADR-0003 (serviço gerenciado), com o contêiner Docker mantido para desenvolvimento e CI.

Por que esta e não as outras: é a única alternativa que atende à restrição da disciplina e, ao mesmo tempo, remove os limites de escrita serializada e de arquivo local sem mudar o significado da regra de exclusividade. Manter o SQLite adia o problema; o MySQL troca de banco sem ganho e ainda obriga a reescrever `inserir`.

## Consequências

- **Positivas:**
  - o banco deixa de ser um arquivo local e passa a ser alcançável por `DATABASE_URL`;
  - suporta acessos simultâneos reais, necessários às decisões de reserva e expiração;
  - a mudança fica contida em `src/db.js`, porque as regras de negócio já falam só com `query()`.
- **Negativas / o que abrimos mão:**
  - a instalação zero (agora é preciso Docker);
  - os testes em memória, que eram rápidos;
  - CI mais pesado, com um serviço PostgreSQL;
  - o dialeto SQL a reescrever (`db.js`, `migrar()`, `limparBanco()`).
- **Riscos e o que fazer se der errado:**
  - o comportamento mudar sem ninguém notar: mitigado pelo critério de validação abaixo;
  - o CI ficar instável por causa do serviço de banco: se isso acontecer, voltar o CI para um serviço fixo da pipeline antes de culpar o código;
  - o volume do piloto (um bairro) não justificar o custo: a decisão deve ser revista se o contexto de uso mudar (ver a revisão deste ADR).

**Critério de validação da migração:** os 6 testes atuais passam sem alterar nenhuma asserção; um teste novo dispara dois aceites ao mesmo tempo (`Promise.all`) e confirma que só um vence; o CI fica verde rodando contra PostgreSQL de verdade.

## Rastreabilidade

- Risco "volume de dados cresce e a listagem simples não escala" e risco "duas ONGs aceitam a mesma doação" — `docs/analise.md`, seção Riscos.
- Não-funcional de manutenibilidade ("trocar o banco sem reescrever regras") — Aula 9.
- ADR 0001 (stack): o isolamento em `src/db.js` foi desenhado para esta troca.
- Decisões 1, 2 e 3 da Aula 6 (`docs/atividades/aula06.md`).

## Uso de IA

Atividade da Aula 8 (nível: IA para consulta).

- **O que a IA fez:** o Claude ajudou a estruturar o ADR, levantar as alternativas e listar as consequências, a partir do código (`src/db.js`, `src/repositorio.js`) e dos documentos do repositório (`docs/analise.md`, ADR 0001, `docs/atividades/aula06.md`).
- **O que o grupo fez:** em 14/10/2026 o grupo revisou o rascunho, conferiu as afirmações contra o código e os documentos, e concordou com o conteúdo e com a decisão.
- **Responsabilidade:** a escolha do PostgreSQL e a justificativa são do grupo, que as defende.
