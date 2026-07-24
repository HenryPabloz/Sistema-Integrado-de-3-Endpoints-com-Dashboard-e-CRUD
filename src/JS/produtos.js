/**
 * produtos.js — Listagem com busca/filtros e CRUD de Produtos.
 *
 * O campo "status" nunca é editado aqui: o formulário nem tem um <select>
 * para ele, só uma prévia (badge) somente leitura — o valor real é sempre
 * calculado a partir da quantidade em estoque (ver calcularStatusPorQuantidade).
 * Ao CRIAR um produto, a quantidade inicial informada já gera o registro de
 * estoque correspondente; ajustes depois disso são feitos na página de Estoque.
 */

let listaProdutos = [];
let temporizadorBuscaProduto = null;

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
   1. CARREGAMENTO E RENDERIZAÇÃO
   ============================================================ */

async function carregarProdutos() {
    const tabela = document.getElementById('tabelaProdutos');
    const skeleton = document.getElementById('skeletonProdutos');
    const estadoVazio = document.getElementById('estadoVazioProdutos');

    skeleton.hidden = false;
    tabela.hidden = true;
    estadoVazio.hidden = true;

    try {
        listaProdutos = await buscarProdutos();
        aplicarFiltrosEBuscar();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível carregar os produtos',
            text: 'Verifique se o json-server está rodando e tente novamente.',
            customClass: { popup: 'popup-silo' }
        });
    } finally {
        skeleton.hidden = true;
    }
}

function aplicarFiltrosEBuscar() {
    const textoBusca = document.getElementById('buscaNomeProduto').value.trim().toLowerCase();
    const categoria = document.getElementById('filtroCategoria').value;
    const status = document.getElementById('filtroStatusProduto').value;
    const operadorPreco = document.getElementById('filtroPrecoOperador').value;
    const valorPreco = document.getElementById('filtroPrecoValor').value;

    const resultado = [];

    for (const produto of listaProdutos) {
        const nomeEmMinusculas = produto.nome.toLowerCase();
        if (textoBusca && !nomeEmMinusculas.includes(textoBusca)) {
            continue;
        }

        if (categoria !== 'todas' && produto.categoria !== categoria) {
            continue;
        }

        // Regra do enunciado: por padrão, produtos "Indisponível" ficam ocultos.
        if (status === 'todos') {
            if (produto.status === 'Indisponível') {
                continue;
            }
        } else if (produto.status !== status) {
            continue;
        }

        if (operadorPreco !== 'qualquer' && valorPreco !== '') {
            if (operadorPreco === 'maior' && produto.preco <= Number(valorPreco)) {
                continue;
            }
            if (operadorPreco === 'menor' && produto.preco >= Number(valorPreco)) {
                continue;
            }
        }

        resultado.push(produto);
    }

    renderizarTabelaProdutos(resultado);
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

function montarLinhaTabelaProduto(produto) {
    const precoFormatado = Utils.Numero.formatarMoeda(produto.preco);

    return '<tr>' +
        '<td class="celula-produto__nome">' + produto.nome + '</td>' +
        '<td>' + produto.categoria + '</td>' +
        '<td class="dado-numerico">' + precoFormatado + '</td>' +
        '<td>' + montarBadgeStatus(produto.status) + '</td>' +
        '<td class="tabela__acoes">' +
        '<button type="button" class="btn btn--icone btn--fantasma" data-acao="editar-produto" data-id="' + produto.id + '" aria-label="Editar produto">' +
        '<i data-lucide="pencil" aria-hidden="true"></i></button>' +
        '<button type="button" class="btn btn--icone btn--fantasma" data-acao="excluir-produto" data-id="' + produto.id + '" aria-label="Remover produto">' +
        '<i data-lucide="trash-2" aria-hidden="true"></i></button>' +
        '</td></tr>';
}

function renderizarTabelaProdutos(produtos) {
    const tabela = document.getElementById('tabelaProdutos');
    const estadoVazio = document.getElementById('estadoVazioProdutos');
    const corpoTabela = document.getElementById('corpoTabelaProdutos');

    if (produtos.length === 0) {
        tabela.hidden = true;
        estadoVazio.hidden = false;
        return;
    }

    tabela.hidden = false;
    estadoVazio.hidden = true;

    let linhasHtml = '';
    for (const produto of produtos) {
        linhasHtml = linhasHtml + montarLinhaTabelaProduto(produto);
    }

    corpoTabela.innerHTML = linhasHtml;
    lucide.createIcons();
}

/* ============================================================
   2. FORMULÁRIO (CRIAR / EDITAR)
   ============================================================ */

function atualizarPreviaStatus(status) {
    const elemento = document.getElementById('previaStatusProduto');

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

    elemento.className = 'badge-status ' + classeBadge;
    elemento.innerHTML = '<span class="medidor-nivel ' + classeMedidor + '" aria-hidden="true">' +
        '<span class="medidor-nivel__barra"></span><span class="medidor-nivel__barra"></span><span class="medidor-nivel__barra"></span>' +
        '</span><span class="badge-status__emoji">' + emoji + '</span>' + status;

    lucide.createIcons();
}

function abrirModalNovoProduto() {
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('modalProdutoTitulo').textContent = 'Novo produto';

    // A quantidade inicial só faz sentido ao CRIAR o produto (vira o primeiro registro de estoque dele).
    document.getElementById('campoQuantidadeInicial').hidden = false;
    document.getElementById('produtoQuantidadeInicial').value = '';

    atualizarPreviaStatus('Indisponível');
}

function abrirModalEdicaoProduto(id) {
    let produto = null;
    for (const item of listaProdutos) {
        if (item.id === id) {
            produto = item;
        }
    }

    if (!produto) {
        return;
    }

    document.getElementById('produtoId').value = produto.id;
    document.getElementById('produtoNome').value = produto.nome;
    document.getElementById('produtoCategoria').value = produto.categoria;
    document.getElementById('produtoPreco').value = produto.preco;
    document.getElementById('modalProdutoTitulo').textContent = 'Editar produto';

    // Editando um produto que já existe, ajuste de quantidade é sempre pela página de Estoque.
    document.getElementById('campoQuantidadeInicial').hidden = true;

    atualizarPreviaStatus(produto.status);

    const modal = new bootstrap.Modal(document.getElementById('modalProduto'));
    modal.show();
}

async function tratarEnvioFormularioProduto(evento) {
    evento.preventDefault();

    const id = document.getElementById('produtoId').value;
    const nome = document.getElementById('produtoNome').value;
    const categoria = document.getElementById('produtoCategoria').value;
    const preco = document.getElementById('produtoPreco').value;
    const quantidadeInicial = document.getElementById('produtoQuantidadeInicial').value;

    const campoNome = document.getElementById('produtoNome');
    const campoCategoria = document.getElementById('produtoCategoria');
    const campoPreco = document.getElementById('produtoPreco');
    const campoQuantidade = document.getElementById('produtoQuantidadeInicial');
    const erroNome = document.getElementById('erroProdutoNome');
    const erroCategoria = document.getElementById('erroProdutoCategoria');
    const erroPreco = document.getElementById('erroProdutoPreco');
    const erroQuantidade = document.getElementById('erroProdutoQuantidadeInicial');

    campoNome.classList.remove('campo-invalido');
    campoCategoria.classList.remove('campo-invalido');
    campoPreco.classList.remove('campo-invalido');
    campoQuantidade.classList.remove('campo-invalido');
    erroNome.hidden = true;
    erroCategoria.hidden = true;
    erroPreco.hidden = true;
    erroQuantidade.hidden = true;

    let formularioValido = true;

    if (!Utils.Texto.naoVazio(nome)) {
        campoNome.classList.add('campo-invalido');
        erroNome.textContent = 'Informe o nome do produto.';
        erroNome.hidden = false;
        formularioValido = false;
    }

    if (!Utils.Texto.naoVazio(categoria)) {
        campoCategoria.classList.add('campo-invalido');
        erroCategoria.textContent = 'Selecione uma categoria.';
        erroCategoria.hidden = false;
        formularioValido = false;
    }

    if (!Utils.Numero.ehPositivo(preco)) {
        campoPreco.classList.add('campo-invalido');
        erroPreco.textContent = 'Informe um preço numérico maior que zero.';
        erroPreco.hidden = false;
        formularioValido = false;
    }

    // A quantidade só é exigida ao CRIAR um produto novo (no editar, o campo fica escondido).
    if (!id) {
        if (!Utils.Numero.ehInteiro(quantidadeInicial) || !Utils.Numero.ehNaoNegativo(quantidadeInicial)) {
            campoQuantidade.classList.add('campo-invalido');
            erroQuantidade.textContent = 'Informe uma quantidade inteira maior ou igual a zero.';
            erroQuantidade.hidden = false;
            formularioValido = false;
        }
    }

    if (!formularioValido) {
        if (!Utils.Texto.naoVazio(nome)) {
            campoNome.focus();
        } else if (!Utils.Texto.naoVazio(categoria)) {
            campoCategoria.focus();
        } else if (!Utils.Numero.ehPositivo(preco)) {
            campoPreco.focus();
        } else {
            campoQuantidade.focus();
        }
        return;
    }

    const nomeCapitalizado = Utils.Texto.capitalizar(nome);

    try {
        if (id) {
            await atualizarProduto(id, { nome: nomeCapitalizado, categoria: categoria, preco: Number(preco) });
        } else {
            // O status já nasce calculado a partir da quantidade informada (propriedade derivada).
            const statusInicial = calcularStatusPorQuantidade(Number(quantidadeInicial));

            const produtoCriado = await criarProduto({
                nome: nomeCapitalizado,
                categoria: categoria,
                preco: Number(preco),
                status: statusInicial
            });

            await criarRegistroEstoque({
                produtoId: produtoCriado.id,
                quantidade: Number(quantidadeInicial),
                atualizadoEm: new Date().toISOString()
            });
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProduto'));
        modal.hide();

        Swal.fire({
            icon: 'success',
            title: 'Produto salvo!',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'popup-silo' }
        });

        await carregarProdutos();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível salvar o produto',
            customClass: { popup: 'popup-silo' }
        });
    }
}

// Soft delete (regra do enunciado): o produto NÃO é apagado, só some da listagem
// padrão — a quantidade em estoque dele é zerada, e o status vira "Indisponível".
// Ele volta a aparecer assim que o usuário escolher o filtro de status "Indisponível".
async function confirmarExclusaoProduto(id) {
    const resultado = await Swal.fire({
        icon: 'warning',
        title: 'Remover produto?',
        text: 'O produto não é apagado: a quantidade em estoque é zerada e ele passa a aparecer só no filtro de status "Indisponível".',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        customClass: { popup: 'popup-silo' }
    });

    if (!resultado.isConfirmed) {
        return;
    }

    try {
        const listaEstoqueAtual = await buscarEstoque();
        let registroEstoque = null;
        for (const registro of listaEstoqueAtual) {
            if (registro.produtoId === id) {
                registroEstoque = registro;
            }
        }

        if (registroEstoque) {
            await atualizarEstoque(registroEstoque.id, { quantidade: 0, atualizadoEm: new Date().toISOString() });
        }

        await atualizarProduto(id, { status: 'Indisponível' });

        Swal.fire({
            icon: 'success',
            title: 'Produto removido!',
            toast: true,
            position: 'top-end',
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'popup-silo' }
        });

        await carregarProdutos();
    } catch (erro) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível remover o produto',
            customClass: { popup: 'popup-silo' }
        });
    }
}

/* ============================================================
   3. INICIALIZAÇÃO
   ============================================================ */

document.addEventListener('DOMContentLoaded', async function () {
    lucide.createIcons();
    await carregarProdutos();

    document.getElementById('buscaNomeProduto').addEventListener('input', function () {
        // "Debounce": espera a pessoa parar de digitar por 300ms antes de filtrar,
        // pra não refazer a busca a cada letra digitada.
        clearTimeout(temporizadorBuscaProduto);
        temporizadorBuscaProduto = setTimeout(aplicarFiltrosEBuscar, 300);
    });
    document.getElementById('filtroCategoria').addEventListener('change', aplicarFiltrosEBuscar);
    document.getElementById('filtroStatusProduto').addEventListener('change', aplicarFiltrosEBuscar);

    document.getElementById('filtroPrecoOperador').addEventListener('change', function () {
        const operador = document.getElementById('filtroPrecoOperador').value;
        const campoValor = document.getElementById('filtroPrecoValor');

        if (operador === 'qualquer') {
            campoValor.disabled = true;
            campoValor.value = '';
        } else {
            campoValor.disabled = false;
        }

        aplicarFiltrosEBuscar();
    });

    document.getElementById('filtroPrecoValor').addEventListener('input', aplicarFiltrosEBuscar);

    document.getElementById('botaoLimparFiltrosProduto').addEventListener('click', function () {
        document.getElementById('buscaNomeProduto').value = '';
        document.getElementById('filtroCategoria').value = 'todas';
        document.getElementById('filtroStatusProduto').value = 'todos';
        document.getElementById('filtroPrecoOperador').value = 'qualquer';
        document.getElementById('filtroPrecoValor').value = '';
        document.getElementById('filtroPrecoValor').disabled = true;
        aplicarFiltrosEBuscar();
    });

    document.getElementById('botaoNovoProduto').addEventListener('click', abrirModalNovoProduto);
    document.getElementById('formProduto').addEventListener('submit', tratarEnvioFormularioProduto);

    document.getElementById('corpoTabelaProdutos').addEventListener('click', function (evento) {
        const botaoEditar = evento.target.closest('[data-acao="editar-produto"]');
        const botaoExcluir = evento.target.closest('[data-acao="excluir-produto"]');

        if (botaoEditar) {
            abrirModalEdicaoProduto(botaoEditar.getAttribute('data-id'));
        }

        if (botaoExcluir) {
            confirmarExclusaoProduto(botaoExcluir.getAttribute('data-id'));
        }
    });
});
