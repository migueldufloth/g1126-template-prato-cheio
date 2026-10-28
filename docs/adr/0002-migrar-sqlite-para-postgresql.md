# ADR-0002: Migrar o banco de dados de SQLite para PostgreSQL
 
- **Status:** Aceita — *parcialmente substituída pela [ADR-0003](0003-revisao-banco-multiplas-cidades.md) (somente a parte de hospedagem)*
- **Data:** 14/10/2026
- **Decisores:** Grupo Prato Cheio
## Contexto
 
O walking skeleton do Prato Cheio (Unidade 1) usa SQLite embutido no Node (`node:sqlite`). Isso foi ótimo para começar: zero instalação, testes rápidos em memória e nenhum servidor para manter.
 
Mas o produto vai crescer, e já enxergamos limites concretos:
 
- O SQLite grava em **um arquivo local** e aceita **um escritor por vez**. Se várias ONGs tentarem aceitar doações ao mesmo tempo, as escritas se enfileiram.
- O banco vive junto da máquina da aplicação. Não dá para ter mais de uma instância do servidor apontando para o mesmo dado.
- O módulo `node:sqlite` ainda é marcado como **experimental** (o Node imprime `ExperimentalWarning` a cada `npm test`).
- Já tivemos a restrição de não poder deixar o repositório em pasta sincronizada (OneDrive, Drive, Dropbox), por causa de travas de arquivo (`disk I/O error`).
- A disciplina exige banco relacional migrado para PostgreSQL na Unidade 3.
O problema a decidir: **qual banco sustenta publicação e aceite de doações por vários usuários, sem permitir que duas ONGs aceitem a mesma doação?**
 
## Alternativas
 
### A. Manter o SQLite
 
- **Vantagens:** nenhuma configuração; simples de rodar e testar; sem custo; sem infraestrutura.
- **Desvantagens:** um escritor por vez; banco preso a uma máquina; módulo experimental; sem acesso por rede; backup e recuperação ficam manuais; não cumpre a exigência da disciplina.
### B. PostgreSQL
 
- **Vantagens:** controle de concorrência por linha (MVCC), então leituras e escritas simultâneas não se bloqueiam como no arquivo único; acesso por rede via `DATABASE_URL`; transações e constraints robustas (garantem integridade doador–ONG–doação); tipos adequados (`timestamptz`, índices parciais); ampla oferta de hospedagem; exigido pela disciplina.
- **Desvantagens:** precisa de infraestrutura; dialeto SQL diferente (placeholders `$1` em vez de `?`, tipos de ID e data); testes passam a precisar de um banco real; mais configuração para o grupo.
### C. MySQL / MariaDB
 
- **Vantagens:** relacional, muito difundido, também funciona em rede.
- **Desvantagens:** não traz ganho que compense a troca para este projeto; foge do que a disciplina pede (PostgreSQL); mesmo custo de infraestrutura e de migração que a opção B, sem o requisito atendido.
### D. Banco NoSQL documental (ex.: MongoDB)
 
- **Vantagens:** esquema flexível; escala horizontal.
- **Desvantagens:** nosso domínio é naturalmente relacional (doador, ONG, doação, status) e exige integridade e transação no aceite; exigiria reescrever o modelo de dados e os testes; foge da exigência da disciplina.
## Decisão
 
Adotamos a **alternativa B: PostgreSQL**, migrando na Unidade 3.
 
Motivos principais: (1) resolve o gargalo de escrita concorrente no aceite de doações; (2) permite banco separado da aplicação, acessado por `DATABASE_URL`; (3) preserva o modelo relacional que já temos; (4) atende à exigência da disciplina.
 
A migração fica barata de executar porque o `src/db.js` já isola o acesso ao banco: ele expõe `query()` devolvendo `{ rows }`, então a troca fica contida nele e as regras de negócio (`src/doacoes.js`) não mudam.
 
**Como vai rodar (nesta ADR):** PostgreSQL em **contêiner Docker** no desenvolvimento e como *service container* no GitHub Actions (CI), configurado por `DATABASE_URL` no `.env`. *(Esta parte foi substituída pela ADR-0003.)*
 
## Consequências
 
**O que ganhamos**
 
- Escritas simultâneas sem fila global, com o aceite de doação protegido por transação.
- Banco independente da máquina da aplicação, abrindo caminho para mais de uma instância.
- Fim do aviso de módulo experimental e dos problemas de trava de arquivo.
- Alinhamento com a Unidade 3 da disciplina.
**O que perdemos / riscos**
 
- Simplicidade: antes era só `npm install`; agora todo mundo precisa de Docker (ou outro caminho) funcionando. *Mitigação:* documentar o passo a passo no README e fornecer um `docker-compose.yml`.
- Parte do SQL e do schema terá de ser reescrita (placeholders, tipos, auto incremento). *Mitigação:* a suíte de testes existente serve de prova de que o comportamento se manteve.
- Testes deixam de rodar em memória e o CI fica mais lento. *Mitigação:* usar service container no CI e limpar as tabelas entre testes.
- Mais um componente que pode falhar (conexão, credenciais). *Mitigação:* rota de saúde verificando o banco e `.env.example` atualizado.

## Estado da implementação (Entrega 2)

- **A decisão está aceita; a execução da migração está prevista para a Unidade 3**, como define o `README`. Nesta entrega o código **continua em SQLite** (`node:sqlite`).
- **O que já reflete a decisão no código:** todo acesso ao banco passa por `query()` em `src/db.js`, e o SQL fica em `src/repositorio.js`. As regras de negócio (`src/doacoes.js`) não conhecem o banco. As operações da Entrega 2 usam `UPDATE` condicional atômico e SQL parametrizado. **Mas o `repositorio.js` ainda tem SQL que só funciona no SQLite** (por exemplo `datetime('now', '+20 minutes')` na expiração da reserva), então a migração também vai mexer nele, não só no `db.js`.
- **O que terá de mudar na migração:** o marcador `?` (vira `$1`, `$2`...), o `AUTOINCREMENT`, `datetime('now')`, o `ALTER TABLE` dentro de `try/catch` em `migrar()` e a contagem de linhas alteradas (`info.changes` vira `rowCount`).
- **Como saberemos que deu certo:** os testes de API passam sem alteração, inclusive as corridas (duas reservas simultâneas e cancelar × reservar).

## Rastreabilidade

Atende ao risco "duas ONGs aceitam a mesma doação ao mesmo tempo" (`docs/analise.md`), à Decisão 3 da Aula 06 (`docs/atividades/aula06.md`), à exigência de PostgreSQL na Unidade 3 (`README.md`) e dá sequência ao [ADR 0001](0001-escolha-da-stack.md), que já previa a troca de banco.
