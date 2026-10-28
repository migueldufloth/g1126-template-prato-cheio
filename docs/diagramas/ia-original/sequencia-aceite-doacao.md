# Diagrama de Sequência do aceite de uma doação — versão original da IA

> **Versão gerada pela IA, sem correções.** Esta é a saída da primeira geração, mantida como saiu para servir de base à análise crítica (`../analise-critica.md`) e à versão final (`../sequencia-aceite-doacao.md`).

| Item | Valor |
|---|---|
| Ferramenta | Claude (modelo Claude Sonnet 5.5), app Claude |
| Data da geração | 21/10/2026 |
| Autor do commit | Miguel Angel Balladares Huertas (@miguettohuertas) |
| Entrada fornecida à IA | `docs/diagramas/contexto-ia.md`, e mais nada |
| Pedido | Gerar o Diagrama de Sequência (UML) do aceite de uma doação por uma ONG, em Mermaid, com o caminho feliz e os caminhos de erro |

## Diagrama

```mermaid
sequenceDiagram
    actor ONG
    participant API as API do Prato Cheio
    participant Regras as Regras de negócio das doações
    participant Repo as Acesso ao banco
    participant BD as Banco de dados

    ONG->>API: aceitar doação (id da doação, nome da ONG)
    API->>Regras: aceitar doação (id, ONG)

    Regras->>Repo: buscar doação pelo id
    Repo->>BD: consultar doação
    BD-->>Repo: doação ou vazio
    Repo-->>Regras: doação ou vazio

    alt doação não existe
        Regras-->>API: erro: doação inexistente
        API-->>ONG: pedido recusado com erro
    else doação existe mas não está disponivel
        Regras-->>API: erro: doação já aceita
        API-->>ONG: pedido recusado com erro
    else doação está disponivel
        Regras->>Repo: gravar aceite (id, ONG)
        Repo->>BD: atualizar status para aceita e registrar a ONG, somente se ainda estiver disponivel
        BD-->>Repo: quantidade de linhas alteradas

        alt nenhuma linha alterada (outra ONG aceitou entre a verificação e a gravação)
            Repo-->>Regras: aceite não gravado
            Regras-->>API: erro: doação já aceita
            API-->>ONG: pedido recusado com erro
        else uma linha alterada
            Repo-->>Regras: aceite gravado
            Regras-->>API: doação aceita
            API-->>ONG: doação aceita, com a ONG registrada
        end
    end
```

## Descrição

A ONG pede à API para aceitar uma doação. A API repassa o pedido às regras de negócio, que primeiro buscam a doação pelo banco. Se ela não existe, ou se já não está `disponivel`, o pedido é recusado com erro.

Se a doação está `disponivel`, as regras mandam gravar o aceite, e o acesso ao banco só atualiza a doação se ela ainda estiver `disponivel`. Isso cobre o caso em que outra ONG aceita a mesma doação entre a verificação e a gravação: nenhuma linha é alterada e o pedido também é recusado. Se uma linha é alterada, o aceite é confirmado para a ONG.
