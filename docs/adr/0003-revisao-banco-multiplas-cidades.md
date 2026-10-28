# ADR-0003: Revisão da decisão de banco diante da expansão para várias cidades
 
- **Status:** Aceita
- **Data:** 14/10/2026
- **Decisores:** Grupo Prato Cheio
- **Revisa:** [ADR-0002](0002-migrar-sqlite-para-postgresql.md)
- **Substitui parcialmente:** ADR-0002, somente a parte "Como vai rodar" (hospedagem). A ADR-0002 foi mantida como histórico.
## Contexto
 
O Prato Cheio foi pensado para um único bairro. O novo cenário é:
 
- uso por **ONGs e doadores de várias cidades**;
- **acessos simultâneos** de muito mais gente;
- **maior volume de doações** e, portanto, de leituras na lista e de aceites.
Perguntas a responder: o PostgreSQL continua sendo a escolha certa? E a forma como decidimos rodá-lo (contêiner Docker local) ainda serve?
 
## Reavaliação
 
### 1. O motor de banco (PostgreSQL)
 
| Alternativa | Reavaliação no novo cenário |
|---|---|
| Manter SQLite | Já era limitado e agora é inviável: um escritor por vez e banco preso a um arquivo numa máquina não sustentam vários usuários em várias cidades. |
| **PostgreSQL** | Os motivos da ADR-0002 só ficam mais fortes: concorrência por linha, transações para o aceite, acesso por rede. |
| MySQL/MariaDB | Continua sem vantagem decisiva sobre o PostgreSQL para o nosso caso. |
| MongoDB | Continua inadequado: o domínio segue relacional e a integridade segue crítica. |
 
**Conclusão:** o PostgreSQL é **mantido**.
 
### 2. A hospedagem (contêiner Docker local)
 
O contêiner Docker na máquina de cada integrante serve para desenvolver e testar, mas **não serve para produção** com usuários de várias cidades. Faltam disponibilidade contínua, backup, acesso seguro pela internet e uma única fonte de dados compartilhada.
 
| Alternativa de hospedagem | Vantagens | Desvantagens |
|---|---|---|
| Manter contêiner em máquina própria | Controle total, custo zero | Sem alta disponibilidade, sem backup automático, expõe uma máquina pessoal à internet, o grupo vira responsável por operar |
| **Serviço gerenciado (ex.: Neon, Supabase, Render)** | Sem operar servidor; backup e disponibilidade a cargo do provedor; acesso por `DATABASE_URL` | Planos gratuitos têm limites (armazenamento, conexões, inatividade); dependência do provedor; verificar os limites atuais antes de contar com eles |
| Servidor próprio em VM paga | Controle e desempenho previsíveis | Custo, e o grupo precisa administrar o servidor |
 
## Decisão
 
1. **Mantemos o PostgreSQL** como banco do Prato Cheio.
2. **Substituímos a decisão de hospedagem da ADR-0002:** em produção, o banco passa a rodar em **serviço gerenciado** acessado por `DATABASE_URL`. O contêiner Docker continua valendo para **desenvolvimento local e CI**.
Preservamos a ADR-0002 como histórico: ela registra por que escolhemos PostgreSQL e como pretendíamos rodá-lo quando o escopo era um bairro. Seu status foi atualizado para "parcialmente substituída por esta ADR".
 
## Consequências
 
**O que ganhamos**
 
- Banco único, disponível e com backup para todas as cidades.
- Menos trabalho operacional para o grupo.
- Ambiente local continua igual, então nada muda para quem desenvolve.
**O que passa a ser necessário (trabalho decorrente)**
 
- **Aceite atômico:** garantir por teste de concorrência que duas ONGs aceitando a mesma doação resultem em um único sucesso.
- **Índices** nas colunas mais consultadas (por exemplo, status, cidade e data de criação), já que a lista cresce.
- **Filtro por cidade/região** na listagem, para que a ONG veja doações relevantes.
- **Paginação** na lista de doações.
- **Pool de conexões**, porque provedores gerenciados limitam o número de conexões simultâneas.
- **Datas com fuso horário** (`timestamptz`), já que há cidades diferentes.
- **Segredos** (`DATABASE_URL` de produção) fora do repositório, no CI e no provedor.
**O que perdemos / riscos**
 
- **Dependência de terceiro** e de limites do plano gratuito. *Mitigação:* conferir os limites, documentar como migrar para outro provedor (basta trocar a `DATABASE_URL`).
- **Latência de rede** entre aplicação e banco. *Mitigação:* escolher região próxima e evitar consultas em excesso.
- **Diferença entre ambientes** (local x produção). *Mitigação:* mesma versão do PostgreSQL no Docker e no provedor.
**Quando reavaliar:** se o volume exceder os limites do plano escolhido, se o custo ou a disponibilidade do provedor virarem problema, ou se surgirem necessidades como réplicas de leitura (não previstas agora, por não haver evidência de que sejam necessárias).

## Estado da implementação (Entrega 2)

- Esta ADR é a **revisão prevista** na Decisão 3 da Aula 06 (`docs/atividades/aula06.md`), que manteve o PostgreSQL em Docker local para a N1 e a N2 e deixou a hospedagem para ser revisitada. **A mudança de hospedagem ainda não foi executada:** hoje o código roda em SQLite, e o provedor gerenciado só será escolhido e configurado na Unidade 3 (a escolha do provedor continua aberta).
- **O que já existe e sustenta a decisão:** os testes de concorrência (duas reservas simultâneas e cancelar × reservar), que mostram que as mudanças de status são atômicas; e o acesso ao banco concentrado em `src/db.js` e `src/repositorio.js`, que limita a troca de banco a essas duas camadas.
- **O que falta (trabalho decorrente):** índices, filtro por cidade, paginação, pool de conexões e `timestamptz`, listados em "Consequências". Hoje a tabela `doacoes` nem tem a coluna cidade.

## Rastreabilidade

Responde ao novo cenário (várias cidades, acessos simultâneos, mais volume), revisa o [ADR 0002](0002-migrar-sqlite-para-postgresql.md) e mantém coerência com o `docs/analise.md` (risco de volume que cresce e a listagem simples não escala).
