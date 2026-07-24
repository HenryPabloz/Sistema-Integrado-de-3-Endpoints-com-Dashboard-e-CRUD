# Sistema Integrado de 3 Endpoints com Dashboard e CRUD

## Contexto do projeto

Desenvolva um sistema web que integra três endpoints (APIs/serviços) distintos — **Produtos**, **Estoque** e **Pedidos** — consumidos por um frontend único. O sistema deve ter uma página de **Dashboard** (exibida junto com a tela de Estoque) com visão consolidada dos dados, além de páginas de CRUD completo para Produtos e Pedidos.

Um dos itens gerenciados possui uma **propriedade derivada**: o campo `status` do Produto muda automaticamente conforme a quantidade em Estoque é alterada. Esse é o requisito central do projeto.

## Diretriz visual (obrigatória para todas as páginas)

O visual do sistema deve ser **empresarial e moderno — nada de layout genérico de CRUD/admin template padrão**. Pense em um produto de SaaS real: hierarquia visual clara, paleta de cores consistente e sóbria (nada de cores "cruas" de Bootstrap puro), espaçamento generoso, cards com sombra suave, tipografia com peso e contraste bem definidos, microinterações (hover, transições) nos componentes interativos. Sempre que usar Bootstrap, sobrescreva o visual padrão dele para não parecer genérico. Use os ícones da Lucide Icons para reforçar a identidade visual em botões, cards e menus.

## Estrutura de pastas (já criada — não recriar)

```
src/
├── .claude/
├── .vscode/
├── CSS/
├── HTML/
├── JS/
├── JSONs/
├── .gitignore
├── CLAUDE.md
├── enunciado.md
└── prompt.md
```

**Para cada página do sistema, crie um arquivo HTML, um CSS e um JS próprios e isolados** dentro das pastas `HTML/`, `CSS/` e `JS/` respectivamente (ex.: `dashboard-estoque.html`, `dashboard-estoque.css`, `dashboard-estoque.js`). Não concentre tudo em um único arquivo por linguagem.

Além dos arquivos por página, crie os arquivos compartilhados necessários entre todas as telas, como:
- `JS/utils.js` — funções utilitárias reaproveitadas entre páginas (ex.: formatação de preço em BRL, capitalize de nomes, validações genéricas de input).
- `JS/api.js` (ou nome equivalente) — camada de comunicação HTTP com os 3 endpoints, com tratamento de erros via `try/catch` e log do status no console.
- `CSS/layout.css` (ou nome equivalente) — estilos compartilhados: navbar lateral, tema claro/escuro, variáveis de cor, responsividade base.
- `JS/navbar.js` (ou nome equivalente) — lógica da navegação lateral e do toggle de tema, compartilhada entre as páginas.

## Navegação

A navegação entre as páginas deve ser feita por uma **navbar lateral (sidebar)**, fixa, presente em todas as páginas, com indicação visual clara de qual página está ativa. A sidebar deve conter também o botão de alternância de tema claro/escuro.

## Ordem e organização das páginas

O sistema tem **3 páginas**, nesta ordem de navegação (a primeira é a página inicial do site):

1. **Dashboard + Estoque** (`dashboard-estoque.*`) — página inicial
2. **Produtos** (`produtos.*`)
3. **Pedidos** (`pedidos.*`)

---

### 1️⃣ Página: Dashboard + Estoque (página inicial)

Esta página reúne o Dashboard consolidado e o CRUD de Estoque na mesma tela.

**Bloco Dashboard:**
- Indicadores consolidados cruzando dados dos 3 endpoints: total de produtos, produtos com estoque baixo, pedidos do dia/mês, faturamento estimado.
- No mínimo **2 gráficos** feitos com **ApexCharts.js**: um de pizza e outro de barra ou linha.
  - Um gráfico deve mostrar a **unidade de produtos vendidos**.
  - Outro gráfico, separado, deve mostrar o **status dos produtos** (Disponível / Estoque baixo / Indisponível).
- Ao passar o mouse sobre os gráficos, exibir um **info-banner/tooltip** com detalhes do dado.
- Botão de **exportação para CSV** dos dados do dashboard.
- Atualização dos dados em tempo real (sem precisar recarregar a página manualmente).

**Bloco Estoque (CRUD):**
- Estoque relaciona `idProduto` e `idEstoque` (relacionamento com Produtos), além da `quantidade` disponível.
- A quantidade em estoque é atualizada conforme entrada/saída de produtos.
- O estoque de um produto **não pode chegar a zero manualmente**, exceto quando a saída ocorre por consequência de uma venda/pedido (endpoint de Pedidos).
- **Soft delete**: o produto não é excluído fisicamente do estoque — "remover" zera a quantidade, e produtos com quantidade zerada não devem aparecer na listagem.
- Listagem com **filtro por status de quantidade**: Indisponível / Estoque baixo / Disponível.
- Info-banner pequeno na página explicando o que significa cada status de quantidade.
- Validação de inputs: campos de número não podem ser menores ou iguais a zero, não podem aceitar letras, e a quantidade de estoque não pode ser decimal.
- Feedback visual de sucesso/erro com **SweetAlert2**.

---

### 2️⃣ Página: Produtos (CRUD)

- CRUD completo: criar, listar, editar e excluir produtos.
- Campos do produto:
  - `nome` (string) — aplicar capitalize na primeira letra de cada palavra.
  - `categoria` (string, select).
  - `preço` (float/decimal) — formatado no padrão BRL usando a função de `utils.js`.
  - `status` (string) — **campo derivado, não editável diretamente pelo usuário**; calculado a partir da quantidade em estoque (ver regra de propriedade derivada abaixo). Exibir como badge, com cor e emoji diferentes para cada status.
- Validações: campos de texto não podem estar vazios; campos de select (`categoria`, `status`) não podem estar vazios; `preço` deve ser numérico, maior que zero e não pode aceitar letras.
- Listagem com busca e filtros:
  - Busca por **nome**.
  - Filtro por **categoria** (select).
  - Filtro por **preço** (maior/menor).
  - Filtro por **status** (select).
- **Regra de exibição por status:** produtos com status "Indisponível" **não devem aparecer na listagem por padrão**. Eles só devem ser exibidos quando o usuário selecionar explicitamente o filtro de status "Indisponível".
- Feedback visual de sucesso/erro com **SweetAlert2** (ver regra geral de feedback abaixo).

---

### 3️⃣ Página: Pedidos (CRUD)

- CRUD completo: criar, listar, editar e excluir pedidos.
- Campos do pedido (estrutura conforme `dbDash.json`):
  - `id` (próprio, gerado automaticamente).
  - `cliente` (string) — nome de quem fez o pedido. Obrigatório, mínimo de 2 caracteres.
  - `data` (data/hora do pedido).
  - `itens` (array) — **um pedido pode conter múltiplos produtos**. Cada item tem: `produtoId` (relacionamento com Produtos), `quantidade`, `precoUnitario` (copiado do preço do produto no momento do pedido, para não mudar o histórico caso o preço do produto seja alterado depois).
  - `total` — **campo calculado, não editável diretamente pelo usuário**: soma de `quantidade × precoUnitario` de todos os itens do pedido. Deve ser recalculado automaticamente sempre que os itens do pedido mudarem.
  - `status` (do pedido, diferente do status do produto) — um dos valores: `"Pendente"`, `"Concluído"` ou `"Cancelado - sem estoque"` (ver regra de estoque insuficiente abaixo). Exibir como badge com cor própria.
- Ao montar um pedido, permitir adicionar múltiplos produtos e suas quantidades antes de confirmar (ex.: lista dinâmica de itens dentro do formulário de cadastro).
- Ao registrar um novo pedido com status "Concluído", deve ocorrer a **saída correspondente no estoque** de cada produto vinculado, refletindo em tempo real no `status` do produto (propriedade derivada).
- **Regra de estoque insuficiente:** ao cadastrar um pedido, valide para cada item se `quantidade` solicitada é maior do que a `quantidade` disponível no Estoque para aquele produto.
  - Se **algum item** do pedido exceder o estoque disponível, **bloqueie o cadastro** e exiba uma mensagem de erro (SweetAlert2) informando qual produto está sem estoque suficiente e a quantidade disponível.
  - Alternativamente (caso queira manter o cenário do mock, onde o pedido `o3k0p4` foi registrado mesmo sem estoque), o pedido pode ser salvo automaticamente com `status = "Cancelado - sem estoque"` em vez de bloquear — escolha **uma das duas abordagens** e documente no README qual foi adotada.
  - Em nenhum caso a quantidade em estoque pode ficar negativa.
- Listagem com filtros:
  - Filtro por **data e hora** do pedido.
  - Filtro por **produto mais pedido**.
  - Filtro por **status do pedido** (Pendente / Concluído / Cancelado - sem estoque).
- Feedback visual de sucesso/erro com **SweetAlert2**.

---

## Regra de propriedade derivada (requisito central — vale para todas as páginas)

O campo `status` do Produto (endpoint 1) deve mudar automaticamente com base na `quantidade` em Estoque (endpoint 2):

- `quantidade > 10` → status = **"Disponível"**
- `1 ≤ quantidade ≤ 10` → status = **"Estoque baixo"**
- `quantidade = 0` → status = **"Indisponível"**

Sempre que a quantidade em estoque de um produto for alterada — via CRUD do endpoint Estoque, ou por consequência de um novo pedido no endpoint Pedidos — o status do produto deve refletir essa mudança **em tempo real**, em qualquer página que o exiba (Dashboard, Estoque ou Produtos).

- O valor de `status` **não pode ser editável diretamente pelo usuário** — deve ser sempre calculado a partir da quantidade em estoque.
- Documente claramente, no código (comentários) e no README, **onde e como** esse recálculo acontece.

---

## Feedback e confirmações (aplicam-se a todas as telas com CRUD: Estoque, Produtos e Pedidos)

- Ao **cadastrar** um novo item com sucesso, exibir um **feedback visual de sucesso** com **SweetAlert2** (toast ou alerta), confirmando que o registro foi criado.
- Ao **editar** um item com sucesso, exibir o mesmo tipo de feedback de sucesso.
- Erros de validação ou de requisição devem exibir feedback de erro com **SweetAlert2**, com mensagem clara do que falhou.
- Antes de **excluir** qualquer item (produto, registro de estoque ou pedido), exibir um **modal de confirmação** (SweetAlert2) perguntando se o usuário realmente deseja excluir. A exclusão só deve ser executada após confirmação explícita — se o usuário cancelar, nada deve ser alterado.

## Detalhes de experiência (UX)

- **Persistência de tema:** a escolha entre tema claro/escuro deve ser salva (ex.: `localStorage`) e mantida ao navegar entre páginas e ao recarregar o site — o usuário não deve precisar escolher o tema toda vez.
- **Estado de carregamento:** enquanto os dados de qualquer endpoint estiverem sendo buscados (dashboard, listagens de Produtos/Estoque/Pedidos), exibir um indicador visual de carregamento (spinner ou skeleton) em vez de mostrar a tela vazia.
- **Estado vazio:** quando uma busca/filtro não retornar nenhum resultado, exibir uma mensagem clara de "nenhum resultado encontrado" em vez de uma lista/tabela em branco.
- **Formatação de datas:** todas as datas exibidas nas telas (Estoque, Pedidos, Dashboard) devem estar em formato legível `dd/mm/aaaa hh:mm`, e não no formato ISO cru vindo da API.

## Requisitos técnicos gerais (aplicam-se a todas as páginas)

- Os 3 endpoints (`/produtos`, `/estoque`, `/pedidos`) devem ser servidos por uma **única instância de json-server**, a partir de um único arquivo `JSONs/dbDash.json` com as três chaves de nível superior (`produtos`, `estoque`, `pedidos`). Não é necessário criar 3 serviços/instâncias separadas — as 3 rotas geradas automaticamente pelo json-server já atendem ao requisito de "3 endpoints".
- Os IDs são gerados automaticamente pelo json-server para novos registros, mas os dados mock de teste em `dbDash.json` já têm IDs cadastrados manualmente (strings curtas alfanuméricas) — mantenha esse padrão e garanta que os relacionamentos (`produtoId` em `estoque` e nos itens de `pedidos`) continuem batendo com os `id`s de `produtos`.
- Frontend consumindo os 3 endpoints via requisições HTTP, com tratamento de erros via `try/catch` em todas as chamadas, logando o status da resposta no console.
- Botão de alternância entre tema claro e escuro, disponível na navbar lateral em todas as páginas.
- Responsividade mobile first, com boa adaptação para tablets e celulares.

## Tecnologias

- JavaScript, HTML, CSS (vanilla — um arquivo de cada por página, mais os arquivos compartilhados).
- **SweetAlert2** — feedback visual de sucesso/erro (https://sweetalert2.github.io/).
- **Bootstrap** — base de layout, sempre customizado para não ficar genérico (https://getbootstrap.com/).
- **Lucide Icons** — ícones (https://lucide.dev/icons/).
- **ApexCharts.js** — gráficos do dashboard (https://apexcharts.com/).