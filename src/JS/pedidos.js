/**
 * pedidos.js — Listagem com filtros, formulário com lista dinâmica de
 * itens, total calculado automaticamente e baixa de estoque.
 *
 * DECISÃO DE ARQUITETURA (pedida no enunciado, documentada aqui e no
 * README): quando falta estoque para concluir um pedido, o cadastro NÃO é
 * bloqueado — ele é salvo com status "Cancelado - sem estoque", igual ao
 * pedido o3k0p4 que já vem no mock de dados. Ver validarEstoqueDoPedido.
 */

let listaPedidos = [];
let listaProdutos = [];
let listaEstoque = [];

/* ============================================================
   Reaproveita a mesma regra de propriedade derivada usada em
   dashboard-estoque.js — como as páginas são isoladas, cada script
   carrega essa função de forma independente (ver prompt.md).
   ============================================================ */
function calcularStatusPorQuantidade(quantidade) {
    if (quantidade > 10) {
        return 'Disponível';
    } else if (quantidade >= 1) {
        return 'Estoque baixo';
    } else {
        return 'Indisponível';
    }
}

/* ============================================================
   1. CARREGAMENTO E RENDERIZAÇÃO DA LISTAGEM
   ============================================================ */

async function carregarPedidos() {
    const tabela = document.getElementById('tabelaPedidos');
    const skeleton = document.getElementById('skeletonPedidos');
    const estadoVazio = document.getElementById('estadoVazioPedidos');

    skeleton.hidden = false;
    tabela.hidden = true;
    estadoVazio.hidden = true;

    try {
        const resultados = await Promise.all([buscarPedidos(), buscarProdutos(), buscarEstoque()]);

        listaPedidos = resultados[0];
        listaProdutos = resultados[1];
        listaEstoque = resultados[2];

        preencherFiltroProdutos();
        aplicarFiltrosPedidos();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível carregar os pedidos',
            text: 'Verifique se o json-server está rodando e tente novamente.',
            customClass: { popup: 'popup-silo' }
        });
    } finally {
        skeleton.hidden = true;
    }
}

function preencherFiltroProdutos() {
    const totaisPorProduto = {};

    for (const pedido of listaPedidos) {
        for (const item of pedido.itens) {
            if (!totaisPorProduto[item.produtoId]) {
                totaisPorProduto[item.produtoId] = 0;
            }
            totaisPorProduto[item.produtoId] = totaisPorProduto[item.produtoId] + item.quantidade;
        }
    }

    let produtoIdMaisPedido = null;
    let maiorTotal = 0;
    for (const produtoId in totaisPorProduto) {
        if (totaisPorProduto[produtoId] > maiorTotal) {
            maiorTotal = totaisPorProduto[produtoId];
            produtoIdMaisPedido = produtoId;
        }
    }

    const select = document.getElementById('filtroProdutoPedido');
    let opcoesHtml = '<option value="todos">Todos os produtos</option>';

    for (const produto of listaProdutos) {
        let texto = produto.nome;
        if (produto.id === produtoIdMaisPedido) {
            texto = texto + ' (mais pedido)';
        }
        opcoesHtml = opcoesHtml + '<option value="' + produto.id + '">' + texto + '</option>';
    }

    select.innerHTML = opcoesHtml;
}

function aplicarFiltrosPedidos() {
    const dataFiltro = document.getElementById('filtroDataPedido').value;
    const produtoFiltro = document.getElementById('filtroProdutoPedido').value;
    const statusFiltro = document.getElementById('filtroStatusPedido').value;

    const resultado = [];

    for (const pedido of listaPedidos) {
        if (dataFiltro) {
            const dataPedido = new Date(pedido.data);
            const dataPedidoFormatada = dataPedido.toISOString().slice(0, 10);
            if (dataPedidoFormatada !== dataFiltro) {
                continue;
            }
        }

        if (produtoFiltro !== 'todos') {
            let contemProduto = false;
            for (const item of pedido.itens) {
                if (item.produtoId === produtoFiltro) {
                    contemProduto = true;
                }
            }
            if (!contemProduto) {
                continue;
            }
        }

        if (statusFiltro !== 'todos' && pedido.status !== statusFiltro) {
            continue;
        }

        resultado.push(pedido);
    }

    renderizarTabelaPedidos(resultado);
}

function montarBadgePedido(status) {
    let classe = 'badge-pedido--cancelado';

    if (status === 'Pendente') {
        classe = 'badge-pedido--pendente';
    } else if (status === 'Concluído') {
        classe = 'badge-pedido--concluido';
    }

    return '<span class="badge-pedido ' + classe + '">' + status + '</span>';
}

function montarLinhaTabelaPedido(pedido) {
    const dataObjeto = new Date(pedido.data);
    const dataFormatada = dataObjeto.toLocaleDateString('pt-BR') + ' ' +
        dataObjeto.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const totalFormatado = Utils.Numero.formatarMoeda(pedido.total);

    return '<tr>' +
        '<td class="tabela__celula-principal">' + pedido.cliente + '</td>' +
        '<td>' + dataFormatada + '</td>' +
        '<td><span class="resumo-itens-pedido"><i data-lucide="package" aria-hidden="true"></i>' + pedido.itens.length + ' item(ns)</span></td>' +
        '<td class="dado-numerico">' + totalFormatado + '</td>' +
        '<td>' + montarBadgePedido(pedido.status) + '</td>' +
        '<td class="tabela__acoes">' +
        '<button type="button" class="btn btn--icone btn--fantasma" data-acao="editar-pedido" data-id="' + pedido.id + '" aria-label="Editar pedido">' +
        '<i data-lucide="pencil" aria-hidden="true"></i></button>' +
        '<button type="button" class="btn btn--icone btn--fantasma" data-acao="excluir-pedido" data-id="' + pedido.id + '" aria-label="Excluir pedido">' +
        '<i data-lucide="trash-2" aria-hidden="true"></i></button>' +
        '</td></tr>';
}

function renderizarTabelaPedidos(pedidos) {
    const tabela = document.getElementById('tabelaPedidos');
    const estadoVazio = document.getElementById('estadoVazioPedidos');
    const corpoTabela = document.getElementById('corpoTabelaPedidos');

    if (pedidos.length === 0) {
        tabela.hidden = true;
        estadoVazio.hidden = false;
        return;
    }

    tabela.hidden = false;
    estadoVazio.hidden = true;

    let linhasHtml = '';
    for (const pedido of pedidos) {
        linhasHtml = linhasHtml + montarLinhaTabelaPedido(pedido);
    }

    corpoTabela.innerHTML = linhasHtml;
    lucide.createIcons();
}

/* ============================================================
   2. LISTA DINÂMICA DE ITENS (dentro do modal)
   ============================================================ */

// Recalcula o subtotal de uma linha (quantidade x preço) e, em seguida, o total do pedido inteiro.
function recalcularSubtotalDaLinha(linha) {
    const campoQuantidade = linha.querySelector('.item-quantidade');
    const campoPrecoUnitario = linha.querySelector('.item-preco-unitario');
    const campoSubtotal = linha.querySelector('.item-subtotal');

    const quantidade = Number(campoQuantidade.value);
    const precoUnitario = Number(campoPrecoUnitario.getAttribute('data-valor'));

    let subtotal = 0;
    if (quantidade > 0 && precoUnitario > 0) {
        subtotal = quantidade * precoUnitario;
    }

    campoSubtotal.textContent = Utils.Numero.formatarMoeda(subtotal);
    campoSubtotal.setAttribute('data-valor', subtotal);

    recalcularTotalPedido();
}

// CAMPO CALCULADO: o total nunca é digitado, é sempre a soma dos subtotais de cada linha de item.
function recalcularTotalPedido() {
    const linhas = document.querySelectorAll('#listaItensPedido .linha-item-pedido');
    let total = 0;

    for (const linha of linhas) {
        const valorAtributo = linha.querySelector('.item-subtotal').getAttribute('data-valor');
        if (valorAtributo) {
            total = total + Number(valorAtributo);
        }
    }

    const elementoTotal = document.getElementById('pedidoTotalPreview');
    elementoTotal.textContent = Utils.Numero.formatarMoeda(total);
    elementoTotal.setAttribute('data-valor', total);
}

function adicionarLinhaItemPedido(itemExistente) {
    const template = document.getElementById('templateItemPedido');
    const clone = template.content.cloneNode(true);

    const linha = clone.querySelector('.linha-item-pedido');
    const selectProduto = clone.querySelector('.item-produto');
    const campoQuantidade = clone.querySelector('.item-quantidade');
    const campoPrecoUnitario = clone.querySelector('.item-preco-unitario');
    const campoSubtotal = clone.querySelector('.item-subtotal');
    const botaoRemover = clone.querySelector('.botao-remover-item');

    let opcoesHtml = '<option value="" selected disabled>Selecione o produto…</option>';
    for (const produto of listaProdutos) {
        opcoesHtml = opcoesHtml + '<option value="' + produto.id + '">' + produto.nome + '</option>';
    }
    selectProduto.innerHTML = opcoesHtml;

    if (itemExistente) {
        selectProduto.value = itemExistente.produtoId;
        campoQuantidade.value = itemExistente.quantidade;
        campoPrecoUnitario.value = Utils.Numero.formatarMoeda(itemExistente.precoUnitario);
        campoPrecoUnitario.setAttribute('data-valor', itemExistente.precoUnitario);
        const subtotalExistente = itemExistente.quantidade * itemExistente.precoUnitario;
        campoSubtotal.textContent = Utils.Numero.formatarMoeda(subtotalExistente);
        campoSubtotal.setAttribute('data-valor', subtotalExistente);
    }

    selectProduto.addEventListener('change', function () {
        let produtoSelecionado = null;
        for (const produto of listaProdutos) {
            if (produto.id === selectProduto.value) {
                produtoSelecionado = produto;
            }
        }

        if (produtoSelecionado) {
            campoPrecoUnitario.value = Utils.Numero.formatarMoeda(produtoSelecionado.preco);
            campoPrecoUnitario.setAttribute('data-valor', produtoSelecionado.preco);
        }

        recalcularSubtotalDaLinha(linha);
    });

    campoQuantidade.addEventListener('input', function () {
        recalcularSubtotalDaLinha(linha);
    });

    botaoRemover.addEventListener('click', function () {
        linha.remove();
        recalcularTotalPedido();
    });

    document.getElementById('listaItensPedido').appendChild(clone);
    lucide.createIcons();
}

/* ============================================================
   3. FORMULÁRIO (CRIAR / EDITAR) + REGRA DE ESTOQUE INSUFICIENTE
   ============================================================ */

function formatarDataParaInput(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');

    return ano + '-' + mes + '-' + dia + 'T' + hora + ':' + minuto;
}

function abrirModalNovoPedido() {
    document.getElementById('formPedido').reset();
    document.getElementById('pedidoId').value = '';
    document.getElementById('pedidoData').value = formatarDataParaInput(new Date());
    document.getElementById('pedidoStatus').value = 'Pendente';
    document.getElementById('modalPedidoTitulo').textContent = 'Novo pedido';

    document.getElementById('listaItensPedido').innerHTML = '';
    adicionarLinhaItemPedido();
    recalcularTotalPedido();
}

function abrirModalEdicaoPedido(id) {
    let pedido = null;
    for (const item of listaPedidos) {
        if (item.id === id) {
            pedido = item;
        }
    }

    if (!pedido) {
        return;
    }

    document.getElementById('pedidoId').value = pedido.id;
    document.getElementById('pedidoCliente').value = pedido.cliente;
    document.getElementById('pedidoData').value = formatarDataParaInput(new Date(pedido.data));

    // O <select> de status só tem "Pendente"/"Concluído" — um pedido já cancelado volta como "Pendente" para reedição.
    if (pedido.status === 'Cancelado - sem estoque') {
        document.getElementById('pedidoStatus').value = 'Pendente';
    } else {
        document.getElementById('pedidoStatus').value = pedido.status;
    }

    document.getElementById('modalPedidoTitulo').textContent = 'Editar pedido';

    document.getElementById('listaItensPedido').innerHTML = '';
    for (const item of pedido.itens) {
        adicionarLinhaItemPedido(item);
    }
    recalcularTotalPedido();

    const modal = new bootstrap.Modal(document.getElementById('modalPedido'));
    modal.show();
}

// Verifica se a quantidade pedida de cada item cabe no estoque disponível. Lista vazia = tudo certo.
function validarEstoqueDoPedido(itens) {
    const problemas = [];

    for (const item of itens) {
        let registroEstoque = null;
        for (const registro of listaEstoque) {
            if (registro.produtoId === item.produtoId) {
                registroEstoque = registro;
            }
        }

        let quantidadeDisponivel = 0;
        if (registroEstoque) {
            quantidadeDisponivel = registroEstoque.quantidade;
        }

        if (item.quantidade > quantidadeDisponivel) {
            let nomeProduto = 'Produto';
            for (const produto of listaProdutos) {
                if (produto.id === item.produtoId) {
                    nomeProduto = produto.nome;
                }
            }
            problemas.push(nomeProduto + ': pedido de ' + item.quantidade + ', disponível ' + quantidadeDisponivel);
        }
    }

    return problemas;
}

// Dá baixa no estoque de cada item e recalcula o status do produto (propriedade derivada).
async function darBaixaNoEstoque(itens) {
    for (const item of itens) {
        let registroEstoque = null;
        for (const registro of listaEstoque) {
            if (registro.produtoId === item.produtoId) {
                registroEstoque = registro;
            }
        }

        if (!registroEstoque) {
            continue;
        }

        let novaQuantidade = registroEstoque.quantidade - item.quantidade;
        if (novaQuantidade < 0) {
            novaQuantidade = 0;
        }

        await atualizarEstoque(registroEstoque.id, { quantidade: novaQuantidade, atualizadoEm: new Date().toISOString() });

        const novoStatus = calcularStatusPorQuantidade(novaQuantidade);
        await atualizarProduto(item.produtoId, { status: novoStatus });
    }
}

async function tratarEnvioFormularioPedido(evento) {
    evento.preventDefault();

    const id = document.getElementById('pedidoId').value;
    const cliente = document.getElementById('pedidoCliente').value;
    const dataInformada = document.getElementById('pedidoData').value;
    const statusDesejado = document.getElementById('pedidoStatus').value;

    const erroCliente = document.getElementById('erroPedidoCliente');
    const erroItens = document.getElementById('erroItensPedido');
    erroCliente.hidden = true;
    erroItens.hidden = true;

    if (!Utils.Texto.tamanhoValido(cliente, 2, 120)) {
        erroCliente.textContent = 'Informe o nome do cliente (mínimo de 2 caracteres).';
        erroCliente.hidden = false;
        document.getElementById('pedidoCliente').focus();
        return;
    }

    const linhas = document.querySelectorAll('#listaItensPedido .linha-item-pedido');
    const itens = [];

    for (const linha of linhas) {
        const produtoId = linha.querySelector('.item-produto').value;
        const quantidade = linha.querySelector('.item-quantidade').value;
        const precoUnitario = linha.querySelector('.item-preco-unitario').getAttribute('data-valor');

        if (!produtoId || !quantidade || !Utils.Numero.ehInteiro(quantidade) || !Utils.Numero.ehPositivo(quantidade)) {
            erroItens.textContent = 'Preencha o produto e uma quantidade inteira maior que zero em todos os itens.';
            erroItens.hidden = false;
            linha.querySelector('.item-produto').focus();
            return;
        }

        itens.push({ produtoId: produtoId, quantidade: Number(quantidade), precoUnitario: Number(precoUnitario) });
    }

    if (itens.length === 0) {
        erroItens.textContent = 'Adicione ao menos um item ao pedido.';
        erroItens.hidden = false;
        return;
    }

    let total = 0;
    for (const item of itens) {
        total = total + (item.quantidade * item.precoUnitario);
    }

    let statusFinal = statusDesejado;

    if (statusDesejado === 'Concluído') {
        const problemas = validarEstoqueDoPedido(itens);

        // Abordagem adotada: não bloqueia o cadastro, salva como "Cancelado - sem estoque" (ver comentário no topo do arquivo).
        if (problemas.length > 0) {
            statusFinal = 'Cancelado - sem estoque';

            await Swal.fire({
                icon: 'warning',
                title: 'Pedido registrado sem baixa no estoque',
                html: 'Não há estoque suficiente para concluir este pedido:<br>' + problemas.join('<br>'),
                customClass: { popup: 'popup-silo' }
            });
        }
    }

    try {
        const dadosPedido = {
            cliente: cliente,
            data: new Date(dataInformada).toISOString(),
            itens: itens,
            total: total,
            status: statusFinal
        };

        if (id) {
            await atualizarPedido(id, dadosPedido);
        } else {
            await criarPedido(dadosPedido);
        }

        if (statusFinal === 'Concluído') {
            await darBaixaNoEstoque(itens);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPedido'));
        modal.hide();

        Swal.fire({
            icon: 'success',
            title: 'Pedido salvo!',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'popup-silo' }
        });

        await carregarPedidos();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível salvar o pedido',
            customClass: { popup: 'popup-silo' }
        });
    }
}

// Exclui o pedido. Observação: a quantidade dada de baixa no estoque não é devolvida automaticamente.
async function confirmarExclusaoPedido(id) {
    const resultado = await Swal.fire({
        icon: 'warning',
        title: 'Excluir pedido?',
        text: 'Esta ação não pode ser desfeita.',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'popup-silo' }
    });

    if (!resultado.isConfirmed) {
        return;
    }

    try {
        await excluirPedido(id);

        Swal.fire({
            icon: 'success',
            title: 'Pedido excluído!',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'popup-silo' }
        });

        await carregarPedidos();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível excluir o pedido',
            customClass: { popup: 'popup-silo' }
        });
    }
}

/* ============================================================
   4. INICIALIZAÇÃO
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {
    lucide.createIcons();
    await carregarPedidos();

    document.getElementById('filtroDataPedido').addEventListener('change', aplicarFiltrosPedidos);
    document.getElementById('filtroProdutoPedido').addEventListener('change', aplicarFiltrosPedidos);
    document.getElementById('filtroStatusPedido').addEventListener('change', aplicarFiltrosPedidos);

    document.getElementById('botaoLimparFiltrosPedido').addEventListener('click', function () {
        document.getElementById('filtroDataPedido').value = '';
        document.getElementById('filtroProdutoPedido').value = 'todos';
        document.getElementById('filtroStatusPedido').value = 'todos';
        aplicarFiltrosPedidos();
    });

    document.getElementById('botaoNovoPedido').addEventListener('click', abrirModalNovoPedido);

    document.getElementById('botaoAdicionarItemPedido').addEventListener('click', function () {
        adicionarLinhaItemPedido();
    });

    document.getElementById('formPedido').addEventListener('submit', tratarEnvioFormularioPedido);

    document.getElementById('corpoTabelaPedidos').addEventListener('click', function (evento) {
        const botaoEditar = evento.target.closest('[data-acao="editar-pedido"]');
        const botaoExcluir = evento.target.closest('[data-acao="excluir-pedido"]');

        if (botaoEditar) {
            abrirModalEdicaoPedido(botaoEditar.getAttribute('data-id'));
        }

        if (botaoExcluir) {
            confirmarExclusaoPedido(botaoExcluir.getAttribute('data-id'));
        }
    });
});
