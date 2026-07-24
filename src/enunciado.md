# Enunciado — Sistema Integrado de 3 Endpoints com Dashboard e CRUD

## Contexto

Você deve desenvolver um sistema web que integra **três endpoints (APIs/serviços)** distintos, consumidos por um frontend único. O sistema deve conter uma **página de Dashboard** com visão consolidada dos dados e **páginas de CRUD** para os itens de pelo menos um dos endpoints.

Um dos itens gerenciados deve possuir uma **propriedade derivada**: um campo que **muda automaticamente de valor** conforme uma outra informação vinculada a esse item é alterada (ex: em outro endpoint, ou em um relacionamento interno).

---

## Cenário sugerido (pode ser adaptado)

Sistema de gestão de **Produtos, Estoque e Pedidos**:

| Endpoint | Responsabilidade |
|---|---|
| **1. Produtos** | CRUD de produtos (nome, categoria, preço, status) |
| **2. Estoque** | Controla a quantidade disponível de cada produto |
| **3. Pedidos** | Registra pedidos feitos, vinculando produtos e quantidades |

### Regra da propriedade derivada
O campo **`status`** do produto (endpoint 1) deve mudar automaticamente com base na **quantidade em estoque** (endpoint 2):

- `quantidade > 10` → status = **"Disponível"**
- `1 ≤ quantidade ≤ 10` → status = **"Estoque baixo"**
- `quantidade = 0` → status = **"Indisponível"**

Sempre que a quantidade em estoque de um produto for alterada (via CRUD do endpoint 2, ou por consequência de um novo pedido no endpoint 3), o status do produto deve refletir essa mudança — seja em tempo real, seja no próximo carregamento/consulta.

*(Você pode trocar o domínio — ex: Alunos/Matrículas/Notas; Chamados/Técnicos/SLA; Tarefas/Projetos/Prazos — desde que a lógica de propriedade derivada entre dois endpoints seja preservada.)*

---

## Requisitos Funcionais

### 1. Dashboard
- Exibir indicadores consolidados cruzando dados dos 3 endpoints (ex: total de produtos, produtos com estoque baixo, pedidos do dia/mês, faturamento estimado).
- Ao menos 1 gráfico (barras, pizza ou linha).
- Atualização dos dados ao recarregar a página (não precisa ser tempo real, salvo se quiser um diferencial).

### 2. CRUD de Itens
- Criar, listar, editar e excluir itens de pelo menos um dos endpoints.
- Validação de campos obrigatórios.
- Feedback visual de sucesso/erro nas operações.
- Listagem com busca e/ou filtro.

### 3. Propriedade Derivada (requisito central)
- Implementar a lógica descrita acima (ou equivalente no domínio escolhido).
- O valor derivado **não pode ser editável diretamente pelo usuário** — deve ser sempre calculado a partir da informação vinculada.
- Documentar claramente, no código ou no README, onde e como esse recálculo acontece.

---

## Requisitos Técnicos

- Os 3 endpoints podem ser implementados como serviços separados (ex: 3 pequenas APIs REST) ou simulados dentro de um único backend com rotas separadas — deixar claro qual abordagem foi escolhida.
- Frontend consumindo os 3 endpoints via requisições HTTP.
- Persistência de dados (banco de dados real, arquivo JSON ou mock — indicar a escolha).
- Tratamento de erros de comunicação entre endpoints.
