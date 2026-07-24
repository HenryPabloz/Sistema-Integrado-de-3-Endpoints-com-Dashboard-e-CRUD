/**
 * api.js — Camada de comunicação HTTP com os 3 endpoints do json-server
 * (Produtos, Estoque e Pedidos), servidos a partir de JSONs/dbDash.json.
 *
 * Para rodar o servidor de dados, na raiz de "src":
 *   npx json-server --watch JSONs/dbDash.json --port 3000
 */

const URL_BASE = 'http://localhost:3000';

/**
 * Função central de requisição: monta a URL, faz o fetch, registra o
 * status no console e devolve o corpo da resposta já em JSON.
 * Toda chamada à API do sistema passa por aqui.
 */
async function requisitar(caminho, opcoes) {
    let metodo = 'GET';
    if (opcoes && opcoes.method) {
        metodo = opcoes.method;
    }

    try {
        const resposta = await fetch(URL_BASE + caminho, opcoes);
        console.log(metodo + ' ' + caminho + ' -> ' + resposta.status);

        if (!resposta.ok) {
            throw new Error('Erro na requisição (' + resposta.status + '): ' + caminho);
        }

        if (resposta.status === 204) {
            return null;
        }

        const dados = await resposta.json();
        return dados;
    } catch (erro) {
        console.error('Falha ao acessar ' + caminho + ':', erro);
        throw erro;
    }
}

/* ===================== PRODUTOS ===================== */

async function buscarProdutos() {
    return await requisitar('/produtos');
}

async function criarProduto(produto) {
    const opcoes = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(produto)
    };
    return await requisitar('/produtos', opcoes);
}

async function atualizarProduto(id, dadosParciais) {
    const opcoes = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParciais)
    };
    return await requisitar('/produtos/' + id, opcoes);
}

async function excluirProduto(id) {
    const opcoes = { method: 'DELETE' };
    return await requisitar('/produtos/' + id, opcoes);
}

/* ===================== ESTOQUE ===================== */

async function buscarEstoque() {
    return await requisitar('/estoque');
}

async function criarRegistroEstoque(registro) {
    const opcoes = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
    };
    return await requisitar('/estoque', opcoes);
}

async function atualizarEstoque(id, dadosParciais) {
    const opcoes = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParciais)
    };
    return await requisitar('/estoque/' + id, opcoes);
}

/* ===================== PEDIDOS ===================== */

async function buscarPedidos() {
    return await requisitar('/pedidos');
}

async function criarPedido(pedido) {
    const opcoes = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido)
    };
    return await requisitar('/pedidos', opcoes);
}

async function atualizarPedido(id, dadosParciais) {
    const opcoes = {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParciais)
    };
    return await requisitar('/pedidos/' + id, opcoes);
}

async function excluirPedido(id) {
    const opcoes = { method: 'DELETE' };
    return await requisitar('/pedidos/' + id, opcoes);
}
