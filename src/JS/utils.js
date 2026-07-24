/**
 * Utils — funções de validação e formatação reutilizáveis
 * Organizadas em três namespaces: Texto, Numero e Data.
 * Uso: <script src="utils.js"></script> (carregar antes do seu script principal)
 */
const Utils = (() => {

    // ===================================================================
    // TEXTO
    // ===================================================================
    const Texto = {
        /** Retorna true se a string não for vazia (ignorando espaços nas pontas) */
        naoVazio(valor) {
            return typeof valor === 'string' && valor.trim().length > 0;
        },

        /** Retorna true se a string contiver apenas letras e espaços (com acentos) */
        apenasLetras(valor) {
            return typeof valor === 'string' && /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(valor.trim());
        },

        /** Retorna true se o tamanho da string estiver entre min e max (inclusive) */
        tamanhoValido(valor, min, max) {
            if (typeof valor !== 'string') return false;
            const tamanho = valor.trim().length;
            return tamanho >= min && tamanho <= max;
        },

        /** Retorna true se a string for um e-mail em formato válido */
        ehEmailValido(valor) {
            return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
        },

        /** Remove espaços extras nas pontas e capitaliza a primeira letra de cada palavra */
        capitalizar(valor) {
            if (typeof valor !== 'string') return '';
            return valor
                .trim()
                .toLowerCase()
                .replace(/(^|\s)\p{L}/gu, (letra) => letra.toUpperCase());
        }
    };

    // ===================================================================
    // NUMERO
    // ===================================================================
    const Numero = {
        /** Retorna true se o valor puder ser convertido para um número válido */
        ehNumero(valor) {
            return valor !== '' && valor !== null && !isNaN(Number(valor));
        },

        /** Retorna true se o valor for um número inteiro */
        ehInteiro(valor) {
            return Numero.ehNumero(valor) && Number.isInteger(Number(valor));
        },

        /** Retorna true se o valor for um número maior que zero */
        ehPositivo(valor) {
            return Numero.ehNumero(valor) && Number(valor) > 0;
        },

        /** Retorna true se o valor for um número maior ou igual a zero */
        ehNaoNegativo(valor) {
            return Numero.ehNumero(valor) && Number(valor) >= 0;
        },

        /** Retorna true se o valor estiver dentro do intervalo [min, max] */
        estaEntre(valor, min, max) {
            return Numero.ehNumero(valor) && Number(valor) >= min && Number(valor) <= max;
        },

        /** Formata um número como moeda brasileira (R$ 1.234,56) */
        formatarMoeda(valor) {
            const numero = Number(valor);
            if (isNaN(numero)) return '';
            return numero.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });
        },

        /** Converte uma string de moeda BRL ("R$ 1.234,56") de volta para number (1234.56) */
        moedaParaNumero(valorFormatado) {
            if (typeof valorFormatado !== 'string') return NaN;
            const limpo = valorFormatado
                .replace(/[^\d,.-]/g, '')
                .replace(/\./g, '')
                .replace(',', '.');
            return Number(limpo);
        }
    };

    // ===================================================================
    // DATA
    // ===================================================================
    const Data = {
        /** Retorna true se o valor for uma data válida (aceita string ou Date) */
        ehDataValida(valor) {
            const data = valor instanceof Date ? valor : new Date(valor);
            return data instanceof Date && !isNaN(data.getTime());
        },

        /** Retorna true se a data for anterior a hoje */
        ehDataPassada(valor) {
            if (!Data.ehDataValida(valor)) return false;
            return new Date(valor) < new Date();
        },

        /** Retorna true se a data for posterior a hoje */
        ehDataFutura(valor) {
            if (!Data.ehDataValida(valor)) return false;
            return new Date(valor) > new Date();
        },

        /** Formata uma data para o padrão brasileiro (dd/mm/aaaa) */
        formatarDataBr(valor) {
            if (!Data.ehDataValida(valor)) return '';
            return new Date(valor).toLocaleDateString('pt-BR');
        },

        /** Calcula a idade em anos completos a partir de uma data de nascimento */
        calcularIdade(dataNascimento) {
            if (!Data.ehDataValida(dataNascimento)) return null;

            const nascimento = new Date(dataNascimento);
            const hoje = new Date();
            let idade = hoje.getFullYear() - nascimento.getFullYear();

            const aniversarioJaOcorreuEsteAno =
                hoje.getMonth() > nascimento.getMonth() ||
                (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());

            if (!aniversarioJaOcorreuEsteAno) idade--;

            return idade;
        },

        /** Retorna true se a pessoa tiver ao menos idadeMinima anos, com base na data de nascimento */
        ehMaiorDeIdade(dataNascimento, idadeMinima = 18) {
            const idade = Data.calcularIdade(dataNascimento);
            return idade !== null && idade >= idadeMinima;
        }
    };

    return { Texto, Numero, Data };
})();
