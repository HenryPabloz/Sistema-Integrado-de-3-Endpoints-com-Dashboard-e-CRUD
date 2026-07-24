/**
 * dashboard-estoque.js — Indicadores consolidados, gráficos ApexCharts e
 * CRUD de Estoque.
 *
 * Contém a REGRA DE PROPRIEDADE DERIVADA do projeto: o status do produto
 * nunca é digitado por ninguém, ele é sempre resultado de
 * calcularStatusPorQuantidade(), chamada logo depois de qualquer alteração
 * na quantidade em estoque (movimento manual aqui, ou baixa automática
 * feita em pedidos.js).
 */

let listaProdutos = [];
let listaEstoque = [];
let listaPedidos = [];
let graficoStatus = null;
let graficoVendas = null;
let intervaloAtualizacaoDashboard = null;

/* ============================================================
   1. REGRA CENTRAL: PROPRIEDADE DERIVADA (status do produto)
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
   2. CARREGAMENTO DE DADOS
   ============================================================ */

async function carregarDadosDashboard() {
    const tabela = document.getElementById('tabelaEstoque');
    const skeleton = document.getElementById('skeletonEstoque');
    const estadoVazio = document.getElementById('estadoVazioEstoque');

    skeleton.hidden = false;
    tabela.hidden = true;
    estadoVazio.hidden = true;

    try {
        const resultados = await Promise.all([buscarProdutos(), buscarEstoque(), buscarPedidos()]);

        listaProdutos = resultados[0];
        listaEstoque = resultados[1];
        listaPedidos = resultados[2];

        renderizarKpis();
        renderizarGraficoStatusProdutos();
        renderizarGraficoUnidadesVendidas();
        renderizarTabelaEstoque();
        atualizarTextoIndicadorTempoReal();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível carregar o dashboard',
            text: 'Verifique se o json-server está rodando e tente novamente.',
            customClass: { popup: 'popup-silo' }
        });
    } finally {
        skeleton.hidden = true;
    }
}

/* ============================================================
   3. INDICADORES (KPIs)
   ============================================================ */

function renderizarKpis() {
    document.getElementById('kpiTotalProdutos').textContent = listaProdutos.length;

    let totalEstoqueBaixo = 0;
    for (const produto of listaProdutos) {
        if (produto.status === 'Estoque baixo') {
            totalEstoqueBaixo = totalEstoqueBaixo + 1;
        }
    }
    document.getElementById('kpiEstoqueBaixo').textContent = totalEstoqueBaixo;

    const hoje = new Date();
    let totalPedidosMes = 0;
    for (const pedido of listaPedidos) {
        const dataPedido = new Date(pedido.data);
        if (dataPedido.getMonth() === hoje.getMonth() && dataPedido.getFullYear() === hoje.getFullYear()) {
            totalPedidosMes = totalPedidosMes + 1;
        }
    }
    document.getElementById('kpiPedidosMes').textContent = totalPedidosMes;

    let faturamento = 0;
    for (const pedido of listaPedidos) {
        if (pedido.status === 'Concluído') {
            faturamento = faturamento + pedido.total;
        }
    }
    document.getElementById('kpiFaturamento').textContent = Utils.Numero.formatarMoeda(faturamento);
}

/* ============================================================
   4. GRÁFICOS (ApexCharts)
   ============================================================ */

function renderizarGraficoStatusProdutos() {
    let totalDisponivel = 0;
    let totalBaixo = 0;
    let totalIndisponivel = 0;

    for (const produto of listaProdutos) {
        if (produto.status === 'Disponível') {
            totalDisponivel = totalDisponivel + 1;
        } else if (produto.status === 'Estoque baixo') {
            totalBaixo = totalBaixo + 1;
        } else if (produto.status === 'Indisponível') {
            totalIndisponivel = totalIndisponivel + 1;
        }
    }

    const rotulos = ['Disponível', 'Estoque baixo', 'Indisponível'];
    const valores = [totalDisponivel, totalBaixo, totalIndisponivel];
    const estilos = getComputedStyle(document.documentElement);

    const opcoes = {
        chart: {
            type: 'pie',
            height: 280,
            events: {
                dataPointMouseEnter: function (event, chartContext, config) {
                    const indice = config.dataPointIndex;
                    const banner = document.getElementById('infoBannerStatus');
                    banner.textContent = rotulos[indice] + ': ' + valores[indice] + ' produto(s)';
                    banner.classList.add('ativo');
                },
                dataPointMouseLeave: function () {
                    const banner = document.getElementById('infoBannerStatus');
                    banner.textContent = 'Passe o mouse sobre uma fatia para ver os detalhes.';
                    banner.classList.remove('ativo');
                }
            }
        },
        series: valores,
        labels: rotulos,
        colors: [
            estilos.getPropertyValue('--cor-sucesso').trim(),
            estilos.getPropertyValue('--cor-aviso').trim(),
            estilos.getPropertyValue('--cor-perigo').trim()
        ],
        legend: { position: 'bottom' },
        dataLabels: { enabled: true }
    };

    if (graficoStatus) {
        graficoStatus.destroy();
    }

    graficoStatus = new ApexCharts(document.querySelector('#graficoStatusProdutos'), opcoes);
    graficoStatus.render();
}

function renderizarGraficoUnidadesVendidas() {
    const nomesProdutos = [];
    const totaisVendidos = [];

    for (const produto of listaProdutos) {
        let totalVendido = 0;

        for (const pedido of listaPedidos) {
            if (pedido.status === 'Concluído') {
                for (const item of pedido.itens) {
                    if (item.produtoId === produto.id) {
                        totalVendido = totalVendido + item.quantidade;
                    }
                }
            }
        }

        nomesProdutos.push(produto.nome);
        totaisVendidos.push(totalVendido);
    }

    const estilos = getComputedStyle(document.documentElement);

    const opcoes = {
        chart: {
            type: 'bar',
            height: 280,
            toolbar: { show: false },
            events: {
                dataPointMouseEnter: function (event, chartContext, config) {
                    const indice = config.dataPointIndex;
                    const banner = document.getElementById('infoBannerVendas');
                    banner.textContent = nomesProdutos[indice] + ': ' + totaisVendidos[indice] + ' unidade(s) vendida(s)';
                    banner.classList.add('ativo');
                },
                dataPointMouseLeave: function () {
                    const banner = document.getElementById('infoBannerVendas');
                    banner.textContent = 'Passe o mouse sobre uma barra para ver os detalhes.';
                    banner.classList.remove('ativo');
                }
            }
        },
        series: [{ name: 'Unidades vendidas', data: totaisVendidos }],
        xaxis: { categories: nomesProdutos },
        colors: [estilos.getPropertyValue('--cor-primaria').trim()],
        plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
        dataLabels: { enabled: false }
    };

    if (graficoVendas) {
        graficoVendas.destroy();
    }

    graficoVendas = new ApexCharts(document.querySelector('#graficoUnidadesVendidas'), opcoes);
    graficoVendas.render();
}

/* ============================================================
   5. ATUALIZAÇÃO EM TEMPO REAL
   ============================================================ */

function iniciarAtualizacaoEmTempoReal() {
    intervaloAtualizacaoDashboard = setInterval(function () {
        carregarDadosDashboard();
    }, 15000);
}

function atualizarTextoIndicadorTempoReal() {
    const agora = new Date();
    const horarioFormatado = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('textoIndicadorTempoReal').textContent = 'Atualizado às ' + horarioFormatado;
}

/* ============================================================
   6. EXPORTAÇÃO CSV
   ============================================================ */

function exportarDashboardParaCsv() {
    const totalProdutos = document.getElementById('kpiTotalProdutos').textContent;
    const estoqueBaixo = document.getElementById('kpiEstoqueBaixo').textContent;
    const pedidosMes = document.getElementById('kpiPedidosMes').textContent;
    const faturamento = document.getElementById('kpiFaturamento').textContent;

    let conteudoCsv = '"Indicador","Valor"\n';
    conteudoCsv = conteudoCsv + '"Total de produtos","' + totalProdutos + '"\n';
    conteudoCsv = conteudoCsv + '"Estoque baixo","' + estoqueBaixo + '"\n';
    conteudoCsv = conteudoCsv + '"Pedidos no mês","' + pedidosMes + '"\n';
    conteudoCsv = conteudoCsv + '"Faturamento estimado","' + faturamento + '"\n';

    // O caractere ﻿ no início avisa o Excel que o arquivo está em UTF-8 (mantém os acentos certos).
    const arquivo = new Blob(['﻿' + conteudoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(arquivo);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-silo.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/* ============================================================
   7. CRUD DE ESTOQUE
   ============================================================ */

function encontrarProdutoPorId(produtoId) {
    for (const produto of listaProdutos) {
        if (produto.id === produtoId) {
            return produto;
        }
    }
    return null;
}

function encontrarRegistroEstoquePorProdutoId(produtoId) {
    for (const registro of listaEstoque) {
        if (registro.produtoId === produtoId) {
            return registro;
        }
    }
    return null;
}

// Monta o HTML de um badge de status, incluindo o medidor de nível (elemento de assinatura visual do Silo).
function montarBadgeStatus(status) {
    let classeBadge = 'badge-status--indisponivel';
    let classeMedidor = 'medidor-nivel--nivel-1';
    let emoji = '🔴';

    if (status === 'Disponível') {
        classeBadge = 'badge-status--disponivel';
        classeMedidor = 'medidor-nivel--nivel-3';
        emoji = '🟢';
    } else if (status === 'Estoque baixo') {
        classeBadge = 'badge-status--baixo';
        classeMedidor = 'medidor-nivel--nivel-2';
        emoji = '🟡';
    }

    return '<span class="badge-status ' + classeBadge + '">' +
        '<span class="medidor-nivel ' + classeMedidor + '" aria-hidden="true">' +
        '<span class="medidor-nivel__barra"></span><span class="medidor-nivel__barra"></span><span class="medidor-nivel__barra"></span>' +
        '</span>' +
        '<span class="badge-status__emoji">' + emoji + '</span>' +
        status +
        '</span>';
}

function montarLinhaTabelaEstoque(registro, nomeProduto, status, dataFormatada) {
    return '<tr>' +
        '<td class="tabela__celula-principal">' + nomeProduto + '</td>' +
        '<td class="dado-numerico">' + registro.quantidade + '</td>' +
        '<td>' + montarBadgeStatus(status) + '</td>' +
        '<td class="tabela__celula-secundaria">' + dataFormatada + '</td>' +
        '<td class="tabela__acoes">' +
        '<button type="button" class="btn btn--icone btn--fantasma" data-acao="editar-estoque" data-id="' + registro.id + '" aria-label="Editar item de estoque">' +
        '<i data-lucide="pencil" aria-hidden="true"></i></button>' +
        '<button type="button" class="btn btn--icone btn--fantasma" data-acao="remover-estoque" data-id="' + registro.id + '" aria-label="Remover item de estoque">' +
        '<i data-lucide="trash-2" aria-hidden="true"></i></button>' +
        '</td></tr>';
}

function renderizarTabelaEstoque() {
    const filtro = document.getElementById('filtroStatusEstoque').value;
    const tabela = document.getElementById('tabelaEstoque');
    const estadoVazio = document.getElementById('estadoVazioEstoque');
    const corpoTabela = document.getElementById('corpoTabelaEstoque');

    const itensVisiveis = [];

    for (const registro of listaEstoque) {
        // Soft delete: itens zerados ficam ocultos, EXCETO quando o usuário
        // escolhe o filtro "Indisponível" — aí eles são exatamente o que ele quer ver.
        if (registro.quantidade === 0 && filtro !== 'indisponivel') {
            continue;
        }

        const statusCalculado = calcularStatusPorQuantidade(registro.quantidade);

        if (filtro === 'todos') {
            itensVisiveis.push(registro);
        } else if (filtro === 'disponivel' && statusCalculado === 'Disponível') {
            itensVisiveis.push(registro);
        } else if (filtro === 'baixo' && statusCalculado === 'Estoque baixo') {
            itensVisiveis.push(registro);
        } else if (filtro === 'indisponivel' && statusCalculado === 'Indisponível') {
            itensVisiveis.push(registro);
        }
    }

    if (itensVisiveis.length === 0) {
        tabela.hidden = true;
        estadoVazio.hidden = false;
        return;
    }

    tabela.hidden = false;
    estadoVazio.hidden = true;

    let linhasHtml = '';
    for (const registro of itensVisiveis) {
        const produto = encontrarProdutoPorId(registro.produtoId);
        let nomeProduto = 'Produto não encontrado';
        if (produto) {
            nomeProduto = produto.nome;
        }

        const status = calcularStatusPorQuantidade(registro.quantidade);
        const dataFormatada = Utils.Data.formatarDataBr(registro.atualizadoEm);
        linhasHtml = linhasHtml + montarLinhaTabelaEstoque(registro, nomeProduto, status, dataFormatada);
    }

    corpoTabela.innerHTML = linhasHtml;
    lucide.createIcons();
}

function preencherOpcoesProdutoNoFormularioEstoque() {
    const select = document.getElementById('estoqueProdutoId');
    let opcoesHtml = '<option value="" selected disabled>Selecione um produto…</option>';

    for (const produto of listaProdutos) {
        opcoesHtml = opcoesHtml + '<option value="' + produto.id + '">' + produto.nome + '</option>';
    }

    select.innerHTML = opcoesHtml;
}

function prepararNovoItemEstoque() {
    document.getElementById('formEstoque').reset();
    document.getElementById('estoqueId').value = '';
    document.getElementById('estoqueProdutoId').disabled = false;
    document.getElementById('estoqueQuantidadeAtual').textContent = '0';
    document.getElementById('modalEstoqueTitulo').textContent = 'Registrar movimento de estoque';
}

function atualizarQuantidadeAtualNoFormulario() {
    const produtoId = document.getElementById('estoqueProdutoId').value;
    const registro = encontrarRegistroEstoquePorProdutoId(produtoId);
    const elemento = document.getElementById('estoqueQuantidadeAtual');

    if (registro) {
        elemento.textContent = registro.quantidade;
    } else {
        elemento.textContent = '0';
    }
}

function abrirModalEdicaoEstoque(idRegistro) {
    let registro = null;
    for (const item of listaEstoque) {
        if (item.id === idRegistro) {
            registro = item;
        }
    }

    if (!registro) {
        return;
    }

    document.getElementById('estoqueId').value = registro.id;
    document.getElementById('estoqueProdutoId').value = registro.produtoId;
    document.getElementById('estoqueProdutoId').disabled = true;
    document.getElementById('estoqueQuantidadeAtual').textContent = registro.quantidade;
    document.getElementById('estoqueQuantidadeMovimento').value = '';
    document.getElementById('modalEstoqueTitulo').textContent = 'Registrar movimento de estoque';

    const modal = new bootstrap.Modal(document.getElementById('modalEstoque'));
    modal.show();
}

async function tratarEnvioFormularioEstoque(evento) {
    evento.preventDefault();

    const idRegistro = document.getElementById('estoqueId').value;
    const produtoId = document.getElementById('estoqueProdutoId').value;
    const tipoMovimento = document.querySelector('input[name="tipoMovimento"]:checked').value;
    const quantidadeMovimento = document.getElementById('estoqueQuantidadeMovimento').value;

    const erroProduto = document.getElementById('erroEstoqueProdutoId');
    const erroQuantidade = document.getElementById('erroEstoqueQuantidade');
    erroProduto.hidden = true;
    erroQuantidade.hidden = true;

    if (!Utils.Texto.naoVazio(produtoId)) {
        erroProduto.textContent = 'Selecione um produto.';
        erroProduto.hidden = false;
        document.getElementById('estoqueProdutoId').focus();
        return;
    }

    if (!Utils.Numero.ehInteiro(quantidadeMovimento) || !Utils.Numero.ehPositivo(quantidadeMovimento)) {
        erroQuantidade.textContent = 'Informe uma quantidade inteira maior que zero.';
        erroQuantidade.hidden = false;
        document.getElementById('estoqueQuantidadeMovimento').focus();
        return;
    }

    let registroExistente = null;
    if (idRegistro) {
        for (const item of listaEstoque) {
            if (item.id === idRegistro) {
                registroExistente = item;
            }
        }
    } else {
        registroExistente = encontrarRegistroEstoquePorProdutoId(produtoId);
    }

    let quantidadeAtual = 0;
    if (registroExistente) {
        quantidadeAtual = registroExistente.quantidade;
    }

    let novaQuantidade = quantidadeAtual;
    if (tipoMovimento === 'entrada') {
        novaQuantidade = quantidadeAtual + Number(quantidadeMovimento);
    } else {
        novaQuantidade = quantidadeAtual - Number(quantidadeMovimento);
    }

    // Regra do enunciado: saída manual não pode zerar nem negativar o estoque.
    if (tipoMovimento === 'saida' && novaQuantidade <= 0) {
        Swal.fire({
            icon: 'error',
            title: 'Saída não permitida',
            text: 'A saída manual não pode zerar ou negativar o estoque. Para remover o item, use o botão de exclusão na tabela.',
            customClass: { popup: 'popup-silo' }
        });
        return;
    }

    try {
        const agora = new Date().toISOString();

        if (registroExistente) {
            await atualizarEstoque(registroExistente.id, { quantidade: novaQuantidade, atualizadoEm: agora });
        } else {
            await criarRegistroEstoque({ produtoId: produtoId, quantidade: novaQuantidade, atualizadoEm: agora });
        }

        // PROPRIEDADE DERIVADA: o status do produto é recalculado aqui, sempre que a quantidade muda.
        const novoStatus = calcularStatusPorQuantidade(novaQuantidade);
        await atualizarProduto(produtoId, { status: novoStatus });

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstoque'));
        modal.hide();

        Swal.fire({
            icon: 'success',
            title: 'Movimento registrado!',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'popup-silo' }
        });

        await carregarDadosDashboard();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível salvar o movimento',
            text: 'Tente novamente em instantes.',
            customClass: { popup: 'popup-silo' }
        });
    }
}

async function confirmarRemocaoEstoque(idRegistro) {
    let registro = null;
    for (const item of listaEstoque) {
        if (item.id === idRegistro) {
            registro = item;
        }
    }

    if (!registro) {
        return;
    }

    const resultado = await Swal.fire({
        icon: 'warning',
        title: 'Remover item de estoque?',
        text: 'A quantidade será zerada e o produto ficará marcado como Indisponível.',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'popup-silo' }
    });

    if (!resultado.isConfirmed) {
        return;
    }

    try {
        const agora = new Date().toISOString();
        await atualizarEstoque(registro.id, { quantidade: 0, atualizadoEm: agora });
        // Mesma regra de propriedade derivada: quantidade 0 -> status "Indisponível".
        await atualizarProduto(registro.produtoId, { status: 'Indisponível' });

        Swal.fire({
            icon: 'success',
            title: 'Item removido!',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'popup-silo' }
        });

        await carregarDadosDashboard();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível remover o item',
            customClass: { popup: 'popup-silo' }
        });
    }
}

/* ============================================================
   8. INICIALIZAÇÃO
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {
    lucide.createIcons();

    await carregarDadosDashboard();
    preencherOpcoesProdutoNoFormularioEstoque();

    document.getElementById('filtroStatusEstoque').addEventListener('change', renderizarTabelaEstoque);
    document.getElementById('botaoNovoItemEstoque').addEventListener('click', prepararNovoItemEstoque);
    document.getElementById('estoqueProdutoId').addEventListener('change', atualizarQuantidadeAtualNoFormulario);
    document.getElementById('formEstoque').addEventListener('submit', tratarEnvioFormularioEstoque);
    document.getElementById('botaoExportarCsv').addEventListener('click', exportarDashboardParaCsv);

    document.getElementById('corpoTabelaEstoque').addEventListener('click', function (evento) {
        const botaoEditar = evento.target.closest('[data-acao="editar-estoque"]');
        const botaoRemover = evento.target.closest('[data-acao="remover-estoque"]');

        if (botaoEditar) {
            abrirModalEdicaoEstoque(botaoEditar.getAttribute('data-id'));
        }

        if (botaoRemover) {
            confirmarRemocaoEstoque(botaoRemover.getAttribute('data-id'));
        }
    });

    iniciarAtualizacaoEmTempoReal();
});
