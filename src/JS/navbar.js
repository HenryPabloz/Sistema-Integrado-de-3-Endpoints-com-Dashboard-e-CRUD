/**
 * navbar.js — Lógica compartilhada da sidebar: alternância de tema
 * claro/escuro (com persistência em localStorage) e abertura/fechamento
 * da sidebar em telas mobile.
 */

/* ===================== TEMA CLARO/ESCURO ===================== */

function atualizarVisualBotaoTema(tema) {
    const trilho = document.getElementById('trilhoAlternarTema');
    const botao = document.getElementById('botaoAlternarTema');

    if (tema === 'escuro') {
        trilho.setAttribute('data-ativo', 'true');
        botao.setAttribute('aria-pressed', 'true');
    } else {
        trilho.setAttribute('data-ativo', 'false');
        botao.setAttribute('aria-pressed', 'false');
    }
}

// Lê o tema salvo (ou a preferência do sistema, se nunca foi escolhido) e aplica na página.
function aplicarTemaSalvo() {
    const temaSalvo = localStorage.getItem('temaSilo');
    let temaAtual = temaSalvo;

    if (!temaAtual) {
        const prefereEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefereEscuro) {
            temaAtual = 'escuro';
        } else {
            temaAtual = 'claro';
        }
    }

    if (temaAtual === 'escuro') {
        document.documentElement.setAttribute('data-tema', 'escuro');
    } else {
        document.documentElement.removeAttribute('data-tema');
    }

    atualizarVisualBotaoTema(temaAtual);
}

// Inverte o tema atual, salva a escolha e atualiza o visual do botão.
function alternarTema() {
    const temaEhEscuro = document.documentElement.getAttribute('data-tema') === 'escuro';

    if (temaEhEscuro) {
        document.documentElement.removeAttribute('data-tema');
        localStorage.setItem('temaSilo', 'claro');
        atualizarVisualBotaoTema('claro');
    } else {
        document.documentElement.setAttribute('data-tema', 'escuro');
        localStorage.setItem('temaSilo', 'escuro');
        atualizarVisualBotaoTema('escuro');
    }
}

/* ===================== SIDEBAR MOBILE ===================== */

function configurarSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const sobreposicao = document.getElementById('sobreposicaoSidebar');
    const botaoAbrir = document.getElementById('botaoAbrirSidebar');
    const botaoFechar = document.getElementById('botaoFecharSidebar');

    function abrirSidebar() {
        sidebar.classList.add('sidebar--aberta');
        sobreposicao.classList.add('ativa');
        botaoAbrir.setAttribute('aria-expanded', 'true');
    }

    function fecharSidebar() {
        sidebar.classList.remove('sidebar--aberta');
        sobreposicao.classList.remove('ativa');
        botaoAbrir.setAttribute('aria-expanded', 'false');
    }

    botaoAbrir.addEventListener('click', abrirSidebar);
    botaoFechar.addEventListener('click', fecharSidebar);
    sobreposicao.addEventListener('click', fecharSidebar);
}

/* ===================== INICIALIZAÇÃO ===================== */

document.addEventListener('DOMContentLoaded', function () {
    // Transforma as tags <i data-lucide="..."> em ícones SVG de verdade.
    lucide.createIcons();

    aplicarTemaSalvo();
    document.getElementById('botaoAlternarTema').addEventListener('click', alternarTema);
    configurarSidebarMobile();
});
