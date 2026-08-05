# ADR 0001 — Escolha da stack (Node.js 22+, Express, Vitest, SQLite)

- **Data:** 2026-08-05
- **Status:** aceito

## Contexto

O Prato Cheio precisa de um walking skeleton que execute ponta a ponta já na
Unidade 1: rota de saúde, API HTTP, persistência e testes automatizados
rodando por um único comando, com CI verde. O grupo tem experiência
prévia mais forte em JavaScript/Node.js do que em outras stacks, e o prazo
da entrega (Aula 5) não permite gastar tempo de aprendizagem de uma
linguagem ou framework novo só para provar a hipótese central do produto.
A disciplina também exige banco relacional embutido/sem instalação na
Unidade 1 (Postgres só entra na Unidade 3), o que restringe as opções de
persistência.

## Alternativas consideradas

1. **Node.js + Express + Vitest + SQLite (`node:sqlite`)** — stack
   preferencial sugerida pela disciplina. Prós: zero instalação além do
   Node 22+ (SQLite é módulo embutido), Express é minimalista e conhecido
   pelo grupo, Vitest roda com um comando e tem sintaxe compatível com
   Jest. Contras: `node:sqlite` ainda é experimental e específico do
   Node 22+; menos flexível que um ORM completo se o domínio crescer muito.
2. **Node.js + NestJS + Jest + Postgres desde já** — Prós: arquitetura mais
   robusta para produto grande. Contras: exige instalar e manter um
   Postgres já na Unidade 1 (contra a orientação da disciplina), curva de
   aprendizagem do NestJS consome tempo do walking skeleton, e o excesso de
   estrutura (módulos, providers, decorators) é desproporcional a uma fatia
   fina de valor.
3. **Python + FastAPI + Pytest + SQLite** — Prós: FastAPI é simples e bem
   documentado, Pytest é maduro. Contras: o grupo tem menos prática recente
   em Python que em Node/JS, o que aumentaria o tempo de implementação sem
   ganho correspondente para esta entrega.

## Decisão

Adotar a stack preferencial: **Node.js 22+, Express, Vitest e SQLite**
(`node:sqlite`). A decisão prioriza velocidade de entrega do walking
skeleton sem instalar nada além do Node, e mantém o design do acesso a
dados (`src/db.js` expondo `query()` devolvendo `{ rows }`) preparado para
a troca de banco na Unidade 3, sem precisar reescrever `doacoes.js` nem os
testes.

## Consequências

- **Positivas:** onboarding imediato (só precisa do Node instalado),
  testes rápidos e isolados por rodarem com SQLite em memória, superfície
  de código pequena (Express não impõe estrutura), stack já validada pelo
  template da disciplina reduz risco de configuração de CI.
- **Negativas / o que abrimos mão:** perdemos a tipagem estática que uma
  stack como NestJS + TypeScript daria "de graça"; `node:sqlite` sendo
  experimental significa acompanhar mudanças de API em versões futuras do
  Node; Express sozinho exige disciplina manual do grupo para não deixar
  as rotas virarem um único arquivo confuso conforme o produto cresce.
- **Riscos e o que fazer se der errado:** se a ausência de tipagem causar
  bugs de contrato entre camadas na Unidade 2, considerar adicionar JSDoc
  tipado ou migrar para TypeScript — decisão a registrar em novo ADR se
  acontecer. Se `node:sqlite` mudar de forma incompatível em uma versão
  futura do Node, o isolamento em `src/db.js` limita o raio de impacto ao
  próprio arquivo, o que já é a mitigação desenhada desde a Unidade 1.

## Rastreabilidade

Atende ao requisito da entrega "[ENTREGAR REPOSITORIO]" de registrar um ADR
justificando a stack mesmo ao optar pela alternativa preferencial da
disciplina, e ao risco de "escolha de tecnologia sem registro de
alternativas" identificado na análise (`docs/analise.md`).
