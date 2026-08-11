"use strict";

const form = document.getElementById("confissaoForm");

if (form) {
    const CREDORES = {
        "contex-brasil": {
            nome: "CONTEX BRASIL SERVIÇOS CONTÁBEIS LTDA",
            texto: "empresa de direito privado, inscrita no CNPJ sob o n.º 04.244.373/0001-69, com sede na Rua Gustavo Lauck, 167, Centro, Parobé-RS, neste ato representada por seu sócio Davi Daniel Teixeira, inscrito no CPF sob o n.º 486.510.360-00, registrado no CRC n.º RS 44738."
        },
        "contex-digital": {
            nome: "CONTEX DIGITAL SERVIÇOS CONTÁBEIS LTDA",
            texto: "empresa de direito privado, inscrita no CNPJ sob o n.º 34.199.150/0001-98, com sede na Estrada Serra Grande, 1090, Três Coroas-RS, neste ato representada por seu sócio Davi Daniel Teixeira, inscrito no CPF sob o n.º 486.510.360-00, registrado no CRC n.º RS 44738."
        }
    };

    const tipoPessoa = form.querySelector('[data-js="tipo-pessoa"]');
    const documentoDevedor = document.getElementById("documentoDevedor");
    const labelNome = form.querySelector('[data-js="label-nome"]');
    const labelDocumento = form.querySelector('[data-js="label-documento"]');
    const botaoBuscarCnpj = form.querySelector('[data-js="buscar-cnpj-devedor"]');
    const statusCnpj = form.querySelector('[data-js="status-cnpj-devedor"]');
    const origemDivida = document.getElementById("origemDivida");
    const contadorOrigem = form.querySelector('[data-js="contador-origem"]');
    const feedback = form.querySelector('[data-js="feedback"]');
    const dataConfissao = form.querySelector('[data-js="data-confissao"]');
    const valorDivida = document.getElementById("valorDivida");
    const primeiroVencimento = document.getElementById("primeiroVencimento");
    const periodicidadeParcelas = document.getElementById("periodicidadeParcelas");
    const quantidadeParcelas = document.getElementById("quantidadeParcelas");
    const possuiFiador = form.querySelector('[data-js="possui-fiador"]');
    const camposFiador = form.querySelector('[data-js="campos-fiador"]');
    const botaoGerarParcelas = form.querySelector('[data-js="gerar-parcelas"]');
    const parcelasCorpo = form.querySelector('[data-js="parcelas-corpo"]');
    const parcelasTabela = form.querySelector('[data-js="parcelas-tabela"]');
    const parcelasVazio = form.querySelector('[data-js="parcelas-vazio"]');
    const parcelasResumo = form.querySelector('[data-js="parcelas-resumo"]');
    const totalParcelas = form.querySelector('[data-js="total-parcelas"]');
    const diferencaParcelas = form.querySelector('[data-js="diferenca-parcelas"]');
    const credorDetalhes = form.querySelector('[data-js="credor-detalhes"]');
    const menuToggle = document.querySelector('[data-js="menu-toggle"]');
    const sidebarOverlay = document.querySelector('[data-js="sidebar-overlay"]');

    const somenteNumeros = (valor) => valor.replace(/\D/g, "");

    function formatarCpfCnpj(valor) {
        const numeros = somenteNumeros(valor).slice(0, 14);

        if (numeros.length <= 11) {
            return numeros
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d)/, "$1.$2")
                .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        }

        return numeros
            .replace(/(\d{2})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1/$2")
            .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }

    function cnpjValido(cnpj) {
        if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
            return false;
        }

        const calcularDigito = (base, pesos) => {
            const soma = base.split("").reduce((total, numero, indice) => {
                return total + Number(numero) * pesos[indice];
            }, 0);
            const resto = soma % 11;
            return resto < 2 ? 0 : 11 - resto;
        };
        const primeiro = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        const segundo = calcularDigito(cnpj.slice(0, 12) + primeiro, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return cnpj.endsWith(`${primeiro}${segundo}`);
    }

    function formatarTelefone(valor) {
        const numeros = somenteNumeros(valor).slice(0, 11);

        if (numeros.length <= 10) {
            return numeros
                .replace(/(\d{2})(\d)/, "($1) $2")
                .replace(/(\d{4})(\d)/, "$1-$2");
        }

        return numeros
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d)/, "$1-$2");
    }

    function formatarMoeda(valor) {
        const numeros = somenteNumeros(valor);

        if (!numeros) {
            return "";
        }

        return formatarCentavos(Number(numeros));
    }

    function formatarCentavos(centavos) {
        return (centavos / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function moedaParaCentavos(valor) {
        const numeros = somenteNumeros(valor);
        return numeros ? Number(numeros) : 0;
    }

    function dataLocalHoje() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function dataDaParcela(dataInicial, indice, periodicidade) {
        if (!dataInicial) {
            return "";
        }

        if (periodicidade === "personalizada") {
            return indice === 0 ? dataInicial : "";
        }

        const [ano, mes, dia] = dataInicial.split("-").map(Number);

        if (periodicidade === "mensal") {
            const primeiroDiaDoMes = new Date(ano, (mes - 1) + indice, 1);
            const ultimoDiaDoMes = new Date(
                primeiroDiaDoMes.getFullYear(),
                primeiroDiaDoMes.getMonth() + 1,
                0
            ).getDate();
            const data = new Date(
                primeiroDiaDoMes.getFullYear(),
                primeiroDiaDoMes.getMonth(),
                Math.min(dia, ultimoDiaDoMes)
            );

            return formatarDataIso(data);
        }

        const multiplicadores = {
            diaria: 1,
            semanal: 7,
            quinzenal: 15
        };
        const data = new Date(ano, mes - 1, dia);
        data.setDate(data.getDate() + (indice * multiplicadores[periodicidade]));

        return formatarDataIso(data);
    }

    function formatarDataIso(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, "0");
        const dia = String(data.getDate()).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function atualizarFiador() {
        const ativo = possuiFiador.checked;
        camposFiador.hidden = !ativo;

        camposFiador.querySelectorAll("[data-fiador-required]").forEach((campo) => {
            campo.required = ativo;

            if (!ativo) {
                campo.setAttribute("aria-invalid", "false");
                campo.closest(".field")?.classList.remove("has-error");
            }
        });
    }

    function atualizarCamposPorTipo() {
        const pessoaFisica = tipoPessoa.value === "fisica";
        const pessoaJuridica = tipoPessoa.value === "juridica";

        botaoBuscarCnpj.hidden = !pessoaJuridica;

        if (!pessoaJuridica) {
            atualizarStatusCnpj("");
        }

        if (pessoaFisica) {
            labelNome.innerHTML = 'Nome completo <span>*</span>';
            labelDocumento.innerHTML = 'CPF <span>*</span>';
            documentoDevedor.placeholder = "000.000.000-00";
            return;
        }

        if (pessoaJuridica) {
            labelNome.innerHTML = 'Razão social <span>*</span>';
            labelDocumento.innerHTML = 'CNPJ <span>*</span>';
            documentoDevedor.placeholder = "00.000.000/0000-00";
            return;
        }

        labelNome.innerHTML = 'Nome completo / Razão social <span>*</span>';
        labelDocumento.innerHTML = 'CPF / CNPJ <span>*</span>';
        documentoDevedor.placeholder = "Digite somente números";
    }

    function atualizarStatusCnpj(mensagem, tipo = "") {
        statusCnpj.textContent = mensagem;
        statusCnpj.className = `lookup-status${tipo ? ` is-${tipo}` : ""}`;
    }

    function preencherCampo(id, valor) {
        const input = document.getElementById(id);

        if (!input || valor === null || valor === undefined || String(valor).trim() === "") {
            return;
        }

        input.value = String(valor).trim();
        atualizarEstadoDoCampo(input);
    }

    async function buscarDadosCnpj() {
        const cnpj = somenteNumeros(documentoDevedor.value);

        if (!cnpjValido(cnpj)) {
            atualizarStatusCnpj("Digite um CNPJ válido com 14 números.", "error");
            documentoDevedor.focus();
            return;
        }

        botaoBuscarCnpj.disabled = true;
        botaoBuscarCnpj.textContent = "Consultando...";
        atualizarStatusCnpj("Consultando os dados públicos do CNPJ...");

        try {
            const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
                headers: { Accept: "application/json" }
            });
            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                const mensagem = resposta.status === 404
                    ? "CNPJ não encontrado na base consultada."
                    : dados.message || "Não foi possível consultar o CNPJ agora.";
                throw new Error(mensagem);
            }

            const tipoLogradouro = String(dados.descricao_tipo_de_logradouro || "").trim();
            const logradouro = String(dados.logradouro || "").trim();
            const rua = tipoLogradouro && !logradouro.toUpperCase().startsWith(tipoLogradouro.toUpperCase())
                ? `${tipoLogradouro} ${logradouro}`
                : logradouro;
            const endereco = [
                rua,
                dados.numero || "S/N",
                dados.complemento,
                dados.bairro,
                dados.municipio && dados.uf ? `${dados.municipio}-${dados.uf}` : dados.municipio,
                dados.cep ? `CEP ${String(dados.cep).padStart(8, "0").replace(/^(\d{5})(\d)/, "$1-$2")}` : ""
            ].filter((parte) => String(parte || "").trim()).join(", ");
            const telefone = [dados.ddd_telefone_1, dados.ddd_telefone_2]
                .map((item) => somenteNumeros(String(item || "")))
                .find(Boolean);

            preencherCampo("nomeDevedor", dados.razao_social);
            preencherCampo("enderecoDevedor", endereco);
            preencherCampo("emailDevedor", dados.correio_eletronico);
            preencherCampo("telefoneDevedor", telefone ? formatarTelefone(telefone) : "");

            const situacao = String(dados.descricao_situacao_cadastral || "NÃO INFORMADA").toUpperCase();
            atualizarStatusCnpj(
                `Dados encontrados. Situação cadastral: ${situacao}. Confira as informações antes de continuar.`,
                situacao === "ATIVA" ? "success" : "warning"
            );
        } catch (erro) {
            const mensagem = erro instanceof TypeError
                ? "Não foi possível acessar o serviço de consulta. Verifique a internet e tente novamente."
                : erro.message;
            atualizarStatusCnpj(mensagem, "error");
        } finally {
            botaoBuscarCnpj.disabled = false;
            botaoBuscarCnpj.textContent = "Buscar dados";
        }
    }

    function documentoTemTamanhoValido(campo) {
        const quantidade = somenteNumeros(campo.value).length;

        if (!campo.value) {
            return false;
        }

        if (campo === documentoDevedor && tipoPessoa.value === "fisica") {
            return quantidade === 11;
        }

        if (campo === documentoDevedor && tipoPessoa.value === "juridica") {
            return quantidade === 14;
        }

        return quantidade === 11 || quantidade === 14;
    }

    function campoValido(campo) {
        if (campo.matches('[data-js="documento"]')) {
            return documentoTemTamanhoValido(campo);
        }

        return campo.checkValidity();
    }

    function atualizarEstadoDoCampo(campo) {
        const field = campo.closest(".field");

        if (!field) {
            return true;
        }

        const valido = campoValido(campo);
        const deveExibirErro = !valido && (campo.required || campo.value !== "");

        field.classList.toggle("has-error", deveExibirErro);
        campo.setAttribute("aria-invalid", String(deveExibirErro));

        return valido || (!campo.required && campo.value === "");
    }

    function esconderFeedback() {
        feedback.textContent = "";
        feedback.className = "form-feedback";
    }

    function exibirFeedback(mensagem, tipo) {
        feedback.textContent = mensagem;
        feedback.className = `form-feedback is-visible is-${tipo}`;
        feedback.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function atualizarCredor() {
        const selecionado = form.querySelector('input[name="credorSelecionado"]:checked');
        const credor = selecionado ? CREDORES[selecionado.value] : null;

        if (!credor) {
            credorDetalhes.innerHTML = `
                <span class="note-icon" aria-hidden="true">i</span>
                <p>Selecione um credor para visualizar os dados que serão usados no documento.</p>
            `;
            return;
        }

        credorDetalhes.innerHTML = `
            <span class="note-icon" aria-hidden="true">✓</span>
            <p><strong>${credor.nome}</strong>, ${credor.texto}</p>
        `;
    }

    function dividirValorEmParcelas(totalEmCentavos, quantidade) {
        const valorBase = Math.floor(totalEmCentavos / quantidade);
        const diferenca = totalEmCentavos - (valorBase * quantidade);

        return Array.from({ length: quantidade }, (_, indice) => {
            return valorBase + (indice < diferenca ? 1 : 0);
        });
    }

    function criarLinhaParcela(numero, valorEmCentavos, vencimento = "") {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td><span class="installment-number">${numero}</span></td>
            <td>
                <div class="field">
                    <input
                        type="date"
                        name="parcelas[${numero}][vencimento]"
                        value="${vencimento}"
                        aria-label="Vencimento da parcela ${numero}"
                        required
                        data-js="data-parcela"
                    >
                    <small class="field-error">Informe a data.</small>
                </div>
            </td>
            <td>
                <div class="field">
                    <div class="input-prefix">
                        <span aria-hidden="true">R$</span>
                        <input
                            type="text"
                            inputmode="numeric"
                            name="parcelas[${numero}][valor]"
                            value="${formatarCentavos(valorEmCentavos)}"
                            aria-label="Valor da parcela ${numero}"
                            required
                            data-js="valor-parcela"
                        >
                    </div>
                    <small class="field-error">Informe o valor.</small>
                </div>
            </td>
            <td>
                <button
                    class="remove-installment"
                    type="button"
                    aria-label="Remover parcela ${numero}"
                    title="Remover parcela"
                    data-js="remover-parcela"
                >×</button>
            </td>
        `;

        const campoValor = linha.querySelector('[data-js="valor-parcela"]');
        const campoData = linha.querySelector('[data-js="data-parcela"]');

        campoValor.addEventListener("input", () => {
            campoValor.value = formatarMoeda(campoValor.value);
            atualizarEstadoDoCampo(campoValor);
            atualizarResumoParcelas();
            esconderFeedback();
        });

        campoData.addEventListener("change", () => {
            atualizarEstadoDoCampo(campoData);

            if (linha === parcelasCorpo.firstElementChild) {
                primeiroVencimento.value = campoData.value;
            }

            esconderFeedback();
        });

        linha.querySelector('[data-js="remover-parcela"]').addEventListener("click", () => {
            if (parcelasCorpo.children.length === 1) {
                exibirFeedback("A confissão deve possuir pelo menos uma parcela.", "error");
                return;
            }

            linha.remove();
            renumerarParcelas();
            atualizarResumoParcelas();
            esconderFeedback();
        });

        linha.querySelectorAll("input").forEach((campo) => {
            campo.addEventListener("blur", () => atualizarEstadoDoCampo(campo));
        });

        return linha;
    }

    function renumerarParcelas() {
        [...parcelasCorpo.children].forEach((linha, indice) => {
            const numero = indice + 1;
            const marcador = linha.querySelector(".installment-number");
            const campoData = linha.querySelector('[data-js="data-parcela"]');
            const campoValor = linha.querySelector('[data-js="valor-parcela"]');
            const remover = linha.querySelector('[data-js="remover-parcela"]');

            marcador.textContent = String(numero);
            campoData.name = `parcelas[${numero}][vencimento]`;
            campoData.setAttribute("aria-label", `Vencimento da parcela ${numero}`);
            campoValor.name = `parcelas[${numero}][valor]`;
            campoValor.setAttribute("aria-label", `Valor da parcela ${numero}`);
            remover.setAttribute("aria-label", `Remover parcela ${numero}`);
        });

        quantidadeParcelas.value = String(parcelasCorpo.children.length);

        const primeiraData = parcelasCorpo.querySelector('[data-js="data-parcela"]');
        primeiroVencimento.value = primeiraData?.value || primeiroVencimento.value;
    }

    function totalDasParcelasEmCentavos() {
        return [...parcelasCorpo.querySelectorAll('[data-js="valor-parcela"]')]
            .reduce((total, campo) => total + moedaParaCentavos(campo.value), 0);
    }

    function atualizarResumoParcelas() {
        const quantidade = parcelasCorpo.children.length;
        const total = totalDasParcelasEmCentavos();
        const totalDivida = moedaParaCentavos(valorDivida.value);
        const diferenca = total - totalDivida;

        parcelasTabela.hidden = quantidade === 0;
        parcelasResumo.hidden = quantidade === 0;
        parcelasVazio.hidden = quantidade > 0;
        totalParcelas.textContent = `R$ ${formatarCentavos(total)}`;

        const totaisDiferentes = quantidade > 0 && totalDivida > 0 && diferenca !== 0;
        parcelasResumo.classList.toggle("has-difference", totaisDiferentes);

        if (!totaisDiferentes) {
            diferencaParcelas.textContent = totalDivida > 0 ? "Valores conferem" : "";
            return;
        }

        const sinal = diferenca > 0 ? "acima" : "abaixo";
        diferencaParcelas.textContent = `R$ ${formatarCentavos(Math.abs(diferenca))} ${sinal} do valor da dívida`;
    }

    function gerarParcelas() {
        const quantidade = Number(quantidadeParcelas.value);
        const totalEmCentavos = moedaParaCentavos(valorDivida.value);

        if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 60) {
            atualizarEstadoDoCampo(quantidadeParcelas);
            exibirFeedback("Informe uma quantidade entre 1 e 60 parcelas.", "error");
            quantidadeParcelas.focus();
            return;
        }

        if (totalEmCentavos <= 0) {
            atualizarEstadoDoCampo(valorDivida);
            exibirFeedback("Informe o valor total da dívida antes de gerar as parcelas.", "error");
            valorDivida.focus();
            return;
        }

        const valores = dividirValorEmParcelas(totalEmCentavos, quantidade);
        parcelasCorpo.innerHTML = "";

        valores.forEach((valor, indice) => {
            const vencimento = dataDaParcela(
                primeiroVencimento.value,
                indice,
                periodicidadeParcelas.value
            );
            parcelasCorpo.appendChild(criarLinhaParcela(indice + 1, valor, vencimento));
        });

        atualizarResumoParcelas();
        esconderFeedback();
    }

    function escaparHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function campo(id) {
        return document.getElementById(id)?.value.trim() || "";
    }

    function formatarDataCurta(dataIso) {
        if (!dataIso) {
            return "";
        }

        const [ano, mes, dia] = dataIso.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    function formatarDataExtenso(dataIso) {
        const meses = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ];
        const [ano, mes, dia] = dataIso.split("-").map(Number);

        return `${dia} de ${meses[mes - 1]} de ${ano}`;
    }

    function grupoPorExtenso(numero) {
        const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
        const especiais = [
            "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"
        ];
        const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
        const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

        if (numero === 100) {
            return "cem";
        }

        const partes = [];
        const centena = Math.floor(numero / 100);
        const resto = numero % 100;

        if (centena) {
            partes.push(centenas[centena]);
        }

        if (resto >= 10 && resto <= 19) {
            partes.push(especiais[resto - 10]);
        } else {
            const dezena = Math.floor(resto / 10);
            const unidade = resto % 10;

            if (dezena) {
                partes.push(dezenas[dezena]);
            }

            if (unidade) {
                partes.push(unidades[unidade]);
            }
        }

        return partes.join(" e ");
    }

    function inteiroPorExtenso(numero) {
        if (numero === 0) {
            return "zero";
        }

        const milhoes = Math.floor(numero / 1000000);
        const milhares = Math.floor((numero % 1000000) / 1000);
        const unidades = numero % 1000;
        const partes = [];

        if (milhoes) {
            partes.push(milhoes === 1 ? "um milhão" : `${grupoPorExtenso(milhoes)} milhões`);
        }

        if (milhares) {
            partes.push(milhares === 1 ? "mil" : `${grupoPorExtenso(milhares)} mil`);
        }

        if (unidades) {
            partes.push(grupoPorExtenso(unidades));
        }

        if (partes.length === 1) {
            return partes[0];
        }

        return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
    }

    function valorPorExtenso(centavosTotais) {
        const reais = Math.floor(centavosTotais / 100);
        const centavos = centavosTotais % 100;
        const partes = [];

        if (reais > 0) {
            partes.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`);
        }

        if (centavos > 0) {
            partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
        }

        return partes.join(" e ") || "zero real";
    }

    function qualificacaoDevedor() {
        const nome = escaparHtml(campo("nomeDevedor")).toUpperCase();
        const documento = escaparHtml(campo("documentoDevedor"));
        const endereco = escaparHtml(campo("enderecoDevedor"));
        const registro = escaparHtml(campo("rgDevedor"));

        if (tipoPessoa.value === "juridica") {
            const inscricao = registro ? `, inscrição estadual ${registro}` : "";
            return `<strong>${nome}</strong>, empresa de direito privado, inscrita no CNPJ sob o n.º ${documento}${inscricao}, com sede em ${endereco}`;
        }

        const rg = registro ? `, portador(a) do RG n.º ${registro}` : "";
        return `<strong>${nome}</strong>, pessoa física, inscrita no CPF sob o n.º ${documento}${rg}, residente e domiciliada em ${endereco}`;
    }

    function qualificacaoFiador() {
        if (!possuiFiador.checked) {
            return "";
        }

        return `
            <p><strong>FIADOR:</strong> <strong>${escaparHtml(campo("nomeFiador")).toUpperCase()}</strong>,
            ${escaparHtml(campo("nacionalidadeFiador"))}, ${escaparHtml(campo("estadoCivilFiador"))},
            ${escaparHtml(campo("profissaoFiador"))}, inscrito(a) no CPF sob o n.º
            ${escaparHtml(campo("cpfFiador"))}, residente e domiciliado(a) em
            ${escaparHtml(campo("enderecoFiador"))}.</p>
        `;
    }

    function linhasParcelasDocumento() {
        return [...parcelasCorpo.querySelectorAll("tr")].map((linha, indice) => {
            const data = linha.querySelector('[data-js="data-parcela"]').value;
            const valor = linha.querySelector('[data-js="valor-parcela"]').value;

            return `
                <tr>
                    <td>${indice + 1}</td>
                    <td>${escaparHtml(formatarDataCurta(data))}</td>
                    <td>R$ ${escaparHtml(valor)}</td>
                </tr>
            `;
        }).join("");
    }

    function montarDocumentoHtml() {
        const credorSelecionado = form.querySelector('input[name="credorSelecionado"]:checked').value;
        const credor = CREDORES[credorSelecionado];
        const totalCentavos = moedaParaCentavos(valorDivida.value);
        const totalFormatado = formatarCentavos(totalCentavos);
        const totalExtenso = valorPorExtenso(totalCentavos);
        const quantidade = parcelasCorpo.children.length;
        const juros = campo("juros");
        const multa = campo("multa");
        const cidade = escaparHtml(campo("cidadeDocumento"));
        const foro = escaparHtml(campo("foroDocumento"));
        const nomeDevedor = escaparHtml(campo("nomeDevedor")).toUpperCase();
        const nomeArquivo = `Confissao_de_Divida_${campo("nomeDevedor").replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "_")}`;
        const fiadorAssinatura = possuiFiador.checked ? `
            <div class="signature">
                <span></span>
                <strong>${escaparHtml(campo("nomeFiador")).toUpperCase()}</strong>
                <small>FIADOR</small>
            </div>
        ` : "";
        const multaTexto = Number(multa) > 0
            ? `<li>multa moratória de ${escaparHtml(multa)}% sobre o valor em atraso;</li>`
            : "";
        const jurosTexto = Number(juros) > 0 ? escaparHtml(juros) : "1";

        return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${escaparHtml(nomeArquivo)}</title>
                <style>
                    @page { size: Letter; margin: 10mm 25.4mm 17mm; }
                    * { box-sizing: border-box; }
                    body { margin: 0; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.25; }
                    .document { max-width: 166mm; margin: 0 auto; }
                    h1 { margin: 0 0 20pt; font-size: 12pt; text-align: center; text-decoration: underline; }
                    p { margin: 0 0 12pt; text-align: justify; }
                    .clause-title { display: block; margin-bottom: 3pt; font-weight: 700; text-decoration: underline; }
                    ol { margin: -5pt 0 12pt 24pt; padding-left: 12pt; }
                    li { margin-bottom: 3pt; text-align: justify; }
                    table { width: 100%; margin: 10pt 0 14pt; border-collapse: collapse; page-break-inside: avoid; }
                    th, td { padding: 5pt 7pt; border: 1px solid #000; text-align: center; }
                    th { font-weight: 700; }
                    .place-date { margin: 26pt 0 32pt; text-align: center; }
                    .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 34pt 24pt; page-break-inside: avoid; }
                    .signature { min-height: 54pt; text-align: center; }
                    .signature > span { display: block; margin-bottom: 5pt; border-top: 1px solid #000; }
                    .signature strong, .signature small { display: block; font-size: 10pt; }
                    .screen-toolbar { position: sticky; top: 0; display: flex; justify-content: center; padding: 12px; background: #eef3f7; }
                    .screen-toolbar button { padding: 10px 18px; border: 0; border-radius: 7px; background: #0a4e8a; color: #fff; font: 700 14px Arial, sans-serif; cursor: pointer; }
                    @media screen { body { background: #dfe5ea; } .document { min-height: 279mm; padding: 10mm 25.4mm 17mm; background: #fff; box-shadow: 0 5px 25px rgba(0,0,0,.15); } }
                    @media print { .screen-toolbar { display: none; } }
                </style>
            </head>
            <body>
                <div class="screen-toolbar"><button type="button" onclick="window.print()">Salvar como PDF</button></div>
                <article class="document">
                    <h1>INSTRUMENTO DE CONFISSÃO DE DÍVIDA</h1>

                    <p><strong>CREDOR:</strong> <strong>${escaparHtml(credor.nome)}</strong>, ${escaparHtml(credor.texto)}</p>
                    <p><strong>DEVEDOR:</strong> ${qualificacaoDevedor()}.</p>
                    ${qualificacaoFiador()}

                    <p><strong>DECLARA POR ESTE INSTRUMENTO DE CONFISSÃO DE DÍVIDA</strong> que deve ao
                    <strong>CREDOR</strong> a quantia de <strong>R$ ${totalFormatado} (${totalExtenso})</strong>,
                    originada de ${escaparHtml(campo("origemDivida"))}.</p>

                    <p><span class="clause-title">CLÁUSULA PRIMEIRA (DO PAGAMENTO)</span>
                    Ressalvadas quaisquer outras obrigações aqui não incluídas, pelo presente instrumento e na melhor
                    forma de direito, o <strong>DEVEDOR</strong> confessa dever ao <strong>CREDOR</strong> a quantia
                    líquida, certa e exigível de <strong>R$ ${totalFormatado} (${totalExtenso})</strong>, que deverá ser
                    paga em ${quantidade} ${quantidade === 1 ? "parcela" : "parcelas"}, conforme o quadro abaixo.</p>

                    <table>
                        <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead>
                        <tbody>${linhasParcelasDocumento()}</tbody>
                    </table>

                    <p><span class="clause-title">CLÁUSULA SEGUNDA (DO ATRASO OU NÃO PAGAMENTO)</span>
                    O não pagamento de qualquer parcela na data avençada implicará no vencimento antecipado da
                    totalidade da dívida, podendo o CREDOR promover sua cobrança por meio administrativo ou judicial.
                    Após o vencimento, incidirão sobre o valor devido:</p>
                    <ol type="a">
                        <li>juros de mora de ${jurosTexto}% ao mês;</li>
                        ${multaTexto}
                        <li>correção monetária conforme índice oficial aplicável;</li>
                        <li>em caso de cobrança judicial, custas processuais e honorários advocatícios fixados em 20%
                        sobre o valor total do débito.</li>
                    </ol>

                    <p><span class="clause-title">CLÁUSULA TERCEIRA</span>
                    À dívida ora reconhecida e assumida pelo DEVEDOR, como líquida, certa e exigível, aplica-se o
                    disposto no artigo 784, III, do Código de Processo Civil Brasileiro, haja vista o caráter de título
                    executivo extrajudicial do presente instrumento de confissão de dívida.</p>

                    <p><span class="clause-title">CLÁUSULA QUARTA</span>
                    A eventual tolerância à infringência de qualquer das cláusulas deste instrumento ou o não exercício
                    de qualquer direito nele previsto constituirá mera liberalidade, não implicando em novação ou
                    transação de qualquer espécie.</p>

                    <p><span class="clause-title">CLÁUSULA QUINTA</span>
                    Para dirimir qualquer dúvida oriunda deste instrumento fica eleito o Foro de ${foro}, com exclusão
                    de qualquer outro que seja.</p>

                    <p>Isto posto, firmam este instrumento em 2 (duas) vias de igual teor.</p>
                    <p class="place-date">${cidade}, ${formatarDataExtenso(dataConfissao.value)}.</p>

                    <div class="signatures">
                        <div class="signature"><span></span><strong>${escaparHtml(credor.nome)}</strong><small>CREDOR</small></div>
                        <div class="signature"><span></span><strong>${nomeDevedor}</strong><small>DEVEDOR</small></div>
                        ${fiadorAssinatura}
                        <div class="signature"><span></span><strong>${escaparHtml(campo("testemunha1Nome")).toUpperCase()}</strong><small>CPF: ${escaparHtml(campo("testemunha1Cpf"))} - TESTEMUNHA 1</small></div>
                        <div class="signature"><span></span><strong>${escaparHtml(campo("testemunha2Nome")).toUpperCase()}</strong><small>CPF: ${escaparHtml(campo("testemunha2Cpf"))} - TESTEMUNHA 2</small></div>
                    </div>
                </article>
            </body>
            </html>`;
    }

    function gerarDocumentoParaPdf() {
        const janela = window.open("", "_blank");

        if (!janela) {
            exibirFeedback("O navegador bloqueou a janela do documento. Autorize pop-ups e tente novamente.", "error");
            return;
        }

        janela.document.open();
        janela.document.write(montarDocumentoHtml());
        janela.document.close();
        janela.focus();

        window.setTimeout(() => janela.print(), 350);
    }

    function fecharMenu() {
        document.body.classList.remove("menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
    }

    form.querySelectorAll('[data-js="documento"]').forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = formatarCpfCnpj(campo.value);
            atualizarEstadoDoCampo(campo);
            if (campo === documentoDevedor) {
                atualizarStatusCnpj("");
            }
            esconderFeedback();
        });
    });

    botaoBuscarCnpj.addEventListener("click", buscarDadosCnpj);

    form.querySelectorAll('[data-js="telefone"]').forEach((campo) => {
        campo.addEventListener("input", () => {
            campo.value = formatarTelefone(campo.value);
        });
    });

    valorDivida.addEventListener("input", () => {
        valorDivida.value = formatarMoeda(valorDivida.value);
        atualizarEstadoDoCampo(valorDivida);
        atualizarResumoParcelas();
        esconderFeedback();
    });

    form.querySelectorAll("input, select, textarea").forEach((campo) => {
        campo.addEventListener("blur", () => atualizarEstadoDoCampo(campo));
        campo.addEventListener("change", esconderFeedback);
    });

    tipoPessoa.addEventListener("change", () => {
        atualizarCamposPorTipo();
        documentoDevedor.value = formatarCpfCnpj(documentoDevedor.value);
        atualizarEstadoDoCampo(documentoDevedor);
    });

    form.querySelectorAll('input[name="credorSelecionado"]').forEach((campo) => {
        campo.addEventListener("change", () => {
            atualizarCredor();
            form.querySelectorAll('input[name="credorSelecionado"]').forEach(atualizarEstadoDoCampo);
        });
    });

    possuiFiador.addEventListener("change", () => {
        atualizarFiador();
        esconderFeedback();
    });

    origemDivida.addEventListener("input", () => {
        contadorOrigem.textContent = origemDivida.value.length;
    });

    primeiroVencimento.addEventListener("change", () => {
        const primeiraParcela = parcelasCorpo.querySelector('[data-js="data-parcela"]');

        if (primeiraParcela) {
            primeiraParcela.value = primeiroVencimento.value;
            atualizarEstadoDoCampo(primeiraParcela);
        }
    });

    botaoGerarParcelas.addEventListener("click", gerarParcelas);

    form.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (parcelasCorpo.children.length === 0) {
            exibirFeedback("Gere pelo menos uma parcela antes de revisar os dados.", "error");
            botaoGerarParcelas.focus();
            return;
        }

        const campos = [...form.querySelectorAll("input, select, textarea")];
        const camposInvalidos = campos.filter((campo) => !atualizarEstadoDoCampo(campo));

        if (camposInvalidos.length > 0) {
            exibirFeedback("Revise os campos destacados antes de continuar.", "error");
            camposInvalidos[0].focus();
            return;
        }

        if (totalDasParcelasEmCentavos() !== moedaParaCentavos(valorDivida.value)) {
            exibirFeedback("A soma das parcelas deve ser igual ao valor total da dívida.", "error");
            totalParcelas.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        exibirFeedback(
            "Dados validados. O documento foi aberto para conferência e salvamento em PDF.",
            "success"
        );
        gerarDocumentoParaPdf();
    });

    form.addEventListener("reset", () => {
        window.setTimeout(() => {
            form.querySelectorAll(".field").forEach((field) => {
                field.classList.remove("has-error");
            });

            form.querySelectorAll('[aria-invalid="true"]').forEach((campo) => {
                campo.setAttribute("aria-invalid", "false");
            });

            parcelasCorpo.innerHTML = "";
            contadorOrigem.textContent = "0";
            dataConfissao.value = dataLocalHoje();
            atualizarCamposPorTipo();
            atualizarStatusCnpj("");
            atualizarCredor();
            atualizarFiador();
            atualizarResumoParcelas();
            esconderFeedback();
        });
    });

    menuToggle?.addEventListener("click", () => {
        const menuAberto = document.body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(menuAberto));
    });

    sidebarOverlay?.addEventListener("click", fecharMenu);

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            fecharMenu();
        }
    });

    document.querySelectorAll('[data-js="ano-atual"]').forEach((elemento) => {
        elemento.textContent = String(new Date().getFullYear());
    });

    dataConfissao.value = dataLocalHoje();
    atualizarCamposPorTipo();
    atualizarCredor();
    atualizarFiador();
    atualizarResumoParcelas();
}

