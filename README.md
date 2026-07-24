# 📊 Sistema Integrado de Produtos, Estoque e Pedidos

Sistema web com Dashboard consolidado e CRUD completo, integrando três endpoints (Produtos, Estoque e Pedidos) via json-server. O destaque do projeto é a **propriedade derivada**: o status de cada produto é calculado automaticamente a partir da quantidade disponível em estoque, sem possibilidade de edição manual.

---

## 🧭 Visão geral

O sistema é dividido em **3 páginas**, navegáveis por uma sidebar lateral:

1. **Dashboard + Estoque** — indicadores consolidados, gráficos (ApexCharts) e gestão de estoque.
2. **Produtos** — CRUD de produtos, com status calculado automaticamente.
3. **Pedidos** — CRUD de pedidos multi-item, com baixa automática de estoque.

---

## ✨ Funcionalidades

### Dashboard + Estoque
- Indicadores cruzando os 3 endpoints: total de produtos, produtos com estoque baixo, pedidos do dia/mês e faturamento estimado.
- Gráfico de pizza com o status dos produtos e gráfico de barra/linha com unidades vendidas.
- Info-banner ao passar o mouse sobre os gráficos.
- Exportação dos dados do dashboard para **CSV**.
- Gestão de estoque com soft delete (produto zerado some da listagem, sem exclusão física).
- Filtro por status de quantidade (Disponível / Estoque baixo / Indisponível).

### Produtos
- CRUD completo com validação de campos obrigatórios (`nome`, `categoria`, `preço`, ambos não vazios; `preço` numérico e maior que zero).
- Nome com capitalize automático.
- Preço formatado em BRL.
- **Status calculado automaticamente** a partir do estoque (badge colorida com emoji) — não editável pelo usuário.
- Produtos "Indisponível" ficam ocultos por padrão, aparecendo apenas quando esse filtro é selecionado.
- Busca por nome e filtros por categoria, preço e status.

### Pedidos
- CRUD completo com **múltiplos itens por pedido** (vários produtos e quantidades no mesmo pedido).
- `total` calculado automaticamente a partir dos itens (não editável).
- Validação de estoque disponível antes de confirmar o pedido.
- Status do pedido: `Pendente`, `Concluído` ou `Cancelado - sem estoque`.
- Filtros por data/hora e por produto mais pedido.

### Geral
- Feedback visual de sucesso/erro com **SweetAlert2** em todas as operações de CRUD.
- Modal de confirmação antes de qualquer exclusão.
- Tema claro/escuro com preferência salva em `localStorage`.
- Estados de carregamento e "nenhum resultado encontrado" nas listagens.
- Responsivo (mobile first).

---

## 🔗 Regra de negócio central — Propriedade derivada

O campo `status` do **Produto** nunca é definido manualmente: ele é sempre recalculado com base na `quantidade` do item correspondente no endpoint de **Estoque**.

| Quantidade em estoque | Status do produto |
|---|---|
| `> 10` | `Disponível` |
| `1` a `10` | `Estoque baixo` |
| `0` | `Indisponível` |

O recálculo acontece em dois momentos:
- Sempre que a quantidade é alterada diretamente pelo CRUD de Estoque.
- Sempre que um pedido é concluído, dando baixa na quantidade em estoque do(s) produto(s) envolvido(s).

> 📍 A lógica de recálculo está centralizada em `JS/api.js` (camada de comunicação com os endpoints), sendo chamada tanto pelo CRUD de Estoque quanto pelo CRUD de Pedidos ao confirmar uma alteração de quantidade.

Da mesma forma, o campo `total` do **Pedido** também é um valor calculado (soma de `quantidade × precoUnitario` de cada item) e não é editável diretamente.

---

## 🛠️ Tecnologias

- **JavaScript, HTML5 e CSS3** (vanilla)
- [json-server](https://github.com/typicode/json-server) — API REST mock, servindo `/produtos`, `/estoque` e `/pedidos` a partir de um único `dbDash.json`
- [Bootstrap](https://getbootstrap.com/) — base de layout, customizado
- [SweetAlert2](https://sweetalert2.github.io/) — feedbacks e modais de confirmação
- [Lucide Icons](https://lucide.dev/icons/) — ícones
- [ApexCharts.js](https://apexcharts.com/) — gráficos do dashboard

---

## 📁 Estrutura de pastas

```
src/
├── .claude/
├── .vscode/
├── CSS/
│   ├── layout.css              # navbar, tema, variáveis, responsividade base
│   ├── dashboard-estoque.css
│   ├── produtos.css
│   └── pedidos.css
├── HTML/
│   ├── dashboard-estoque.html  # página inicial
│   ├── produtos.html
│   └── pedidos.html
├── JS/
│   ├── utils.js                # formatação BRL, capitalize, validações
│   ├── api.js                  # comunicação HTTP + regra de propriedade derivada
│   ├── navbar.js                # navegação lateral + toggle de tema
│   ├── dashboard-estoque.js
│   ├── produtos.js
│   └── pedidos.js
├── JSONs/
│   └── dbDash.json             # base do json-server (produtos, estoque, pedidos)
├── .gitignore
├── CLAUDE.md
├── enunciado.md
├── prompt.md
└── README.md
```

---

## ▶️ Como rodar o projeto

### 1. Instalar o json-server
```bash
npm install -g json-server
```

### 2. Subir a API mock
```bash
json-server --watch src/JSONs/dbDash.json --port 3000
```

Isso disponibiliza os endpoints:
- `http://localhost:3000/produtos`
- `http://localhost:3000/estoque`
- `http://localhost:3000/pedidos`

### 3. Abrir o frontend
Abra `src/HTML/dashboard-estoque.html` em um navegador (ou sirva a pasta `src/` com a extensão Live Server do VS Code, por exemplo).

> Certifique-se de que a URL base configurada em `JS/api.js` aponta para `http://localhost:3000`.

---

## 📌 Modelo de dados

**Produto**
```json
{
  "id": "k3f7a9",
  "nome": "Teclado Mecânico RGB",
  "categoria": "Periféricos",
  "preco": 259.90,
  "status": "Disponível"
}
```

**Estoque**
```json
{
  "id": "e1r6y3",
  "produtoId": "k3f7a9",
  "quantidade": 35,
  "atualizadoEm": "2026-07-20T10:15:00Z"
}
```

**Pedido**
```json
{
  "id": "o1c4g9",
  "cliente": "João Silva",
  "data": "2026-07-22T16:20:00Z",
  "itens": [
    { "produtoId": "k3f7a9", "quantidade": 2, "precoUnitario": 259.90 }
  ],
  "total": 519.80,
  "status": "Concluído"
}
```

---

## 👤 Autor

Desenvolvido por Pablo Henry

Projeto desenvolvido como exercício de integração de múltiplos endpoints REST com dashboard e CRUD.
