# Respostas - Aula 03 (Pontos 1 e 2)

Este documento contém as respostas para as atividades dos pontos 1 e 2 solicitadas em [aula03.md](file:///c:/Users/leona/Documents/engenharia_de_software/6o_semestre/desenvolvimento_agil/Aula03/aula03.md). As histórias de usuário foram elaboradas com base no escopo do projeto **Prato Cheio** (uma aplicação web acadêmica em Node.js/Express e SQLite/PostgreSQL).

---

## 1. Avaliação de Histórias de Usuário pelo INVEST

Abaixo estão apresentadas 5 histórias de usuário para o contexto do **Prato Cheio**, cada uma avaliada segundo os critérios do INVEST e acompanhada de justificativa dentro do escopo do projeto de desenvolvimento ágil.

### História de Usuário 1: Filtrar doações por distância
* **História:** "Como ONG, quero poder filtrar as doações por distância em quilômetros em relação à minha sede, para priorizar a busca dos alimentos que estão mais próximos."
* **Critério INVEST que falha:** **I**ndependent (Independente).
* **Justificativa:** Esta história possui uma dependência forte com outras funcionalidades que ainda não existem: o cadastro/registro de endereços físicos para doadores e ONGs, e um serviço de geolocalização ou cálculo de coordenadas (ex: integração com uma API de mapas). Não é possível desenvolver ou testar este filtro de forma independente antes que a base de dados de localização geográfica seja implementada.

### História de Usuário 2: Confirmação de aceite de doação
* **História:** "Como ONG, quero informar meu nome, telefone e o horário previsto de retirada ao aceitar uma doação, para que o doador possa me contatar e se prepare para a entrega."
* **Critério INVEST que falha:** **N**egotiable (Negociável).
* **Justificativa:** Mesmo nessa formulação, a história ainda gera discussões sobre quais campos são realmente necessários e em que formato. A equipe pode questionar, por exemplo, se o telefone deve ser obrigatório caso a ONG já tenha cadastro no sistema, ou se um campo de observações livre substituiria o campo de horário. Esses detalhes precisam ser negociados com o cliente antes de entrar em sprint, indicando que a história ainda não está estável o suficiente para ser desenvolvida sem alinhamento prévio.

### História de Usuário 3: Busca e filtragem de doações disponíveis
* **História:** "Como ONG, quero buscar doações disponíveis filtrando por tipo de alimento e data de validade, para encontrar rapidamente os itens que mais se adequam às minhas necessidades."
* **Critério INVEST que falha:** **V**aluable (Valiosa).
* **Justificativa:** Histórias de usuário devem entregar valor perceptível para os usuários finais da aplicação. Embora a funcionalidade de busca seja aparentemente útil, ela não entrega valor de negócio de forma direta se o volume de doações cadastradas ainda é muito baixo. O valor percebido pela ONG depende de uma quantidade significativa de doações ativas no sistema — sem isso, filtrar uma lista quase vazia não resolve nenhum problema real. A história precisaria ser vinculada a um contexto em que o volume de dados justifique a funcionalidade.

### História de Usuário 4: Integração de categorização inteligente
* **História:** "Como doador, quero que o sistema categorize automaticamente o nível de perecibilidade e riscos de contaminação do alimento com base apenas no tipo de alimento digitado no campo de texto."
* **Critério INVEST que falha:** **E**stimable (Estimável).
* **Justificativa:** A ideia de prever riscos de contaminação e perecibilidade com base em um texto livre digitado pelo usuário (ex: "sobra de lasanha") é vaga e complexa. A equipe de desenvolvimento não tem informações suficientes sobre quais regras sanitárias aplicar, quais APIs usar ou qual o nível de precisão exigido, tornando impossível estimar o esforço e tempo necessários para codificar essa lógica sem uma fase prévia de pesquisa/especificação técnica.

### História de Usuário 5: Dashboard estatístico completo (Épico)
* **História:** "Como administrador do sistema, quero um painel de controle que mostre gráficos mensais de alimentos doados, ranking de ONGs mais ativas, estimativa de peso total de alimentos salvos do desperdício e a possibilidade de exportar relatórios em formato PDF e Excel."
* **Critério INVEST que falha:** **S**mall (Pequena).
* **Justificativa:** Esta história é um Épico ("história gigante"). Ela agrupa visualizações gráficas de histórico, ranking de ONGs, cálculos estatísticos e geração de arquivos PDF/Excel para download. Tentar desenvolver tudo isso de uma vez exigiria muito tempo e dificilmente caberia em um único ciclo de desenvolvimento (Sprint). Ela precisa ser quebrada em fatias menores de valor.

---

## 2. Divisão de uma História "Gigante" (Épico) em 3 Histórias Menores

Abaixo está a decomposição de uma história de logística realista para o contexto do **Prato Cheio** em 3 histórias menores e independentes.

### História Gigante (Épico Original)
> *"Como ONG, quero ter um fluxo completo de acompanhamento e confirmação de coleta, onde eu possa agendar a data e o horário da retirada, trocar mensagens com o doador para tirar dúvidas e tirar uma foto do alimento recebido no momento da entrega para comprovar o recebimento."*

### Divisão em 3 Histórias Menores com Valor Independente

#### História Menor 1: Agendamento de Horário no Aceite
* **História:** "Como ONG, quero informar a data e o horário previsto para a retirada ao aceitar uma doação, para que o doador saiba quando estarei no local."
* **Valor Independente:** Resolve o problema imediato de alinhamento de horários sem precisar de chat em tempo real. O doador já visualiza a estimativa de retirada na listagem do sistema.

#### História Menor 2: Campo de Observações na Publicação da Doação
* **História:** "Como doador, quero adicionar observações e instruções de retirada (ex: 'retirar na portaria B', 'trazer caixas para transporte') ao publicar a doação, para orientar a ONG sobre a logística física da entrega."
* **Valor Independente:** Facilita a comunicação de detalhes cruciais de retirada diretamente no cadastro da doação, reduzindo significativamente a necessidade de troca de mensagens.

#### História Menor 3: Confirmação de Recebimento com Upload de Foto
* **História:** "Como ONG, quero fazer o upload de uma foto do alimento recebido ao finalizar a retirada, para comprovar o estado físico do alimento e registrar a conclusão da doação."
* **Valor Independente:** Serve como um mecanismo simples de auditoria e recibo visual para o doador e para a administração do sistema, garantindo transparência no final do fluxo.
