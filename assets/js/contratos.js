Exit code: 0
Wall time: 0.8 seconds
Output:
"use strict";

const contratoForm = document.getElementById("contratoForm");

if (contratoForm) {
    const modelos = window.CONTEX_CONTRACT_MODELS || {};
    const modeloDetalhes = document.querySelector('[data-js="modelo-detalhes"]');
    const camposDigital = [...document.querySelectorAll('[data-js="campo-digital"]')];
    const camposDigitalObrigatorios = [...document.querySelectorAll("[data-digital-required]")];
    const feedback = document.querySelector('[data-js="feedback"]');
    const dataContrato = document.getElementById("dataContrato");
    const inicioContrato = document.getElementById("inicioContrato");
    const primeiroVencimento = document.getElementById("primeiroVencimento");
    const menuToggle = document.querySelector('[data-js="menu-toggle"]');
    const sidebarOverlay = document.querySelector('[data-js="sidebar-overlay"]');
    const botaoBuscarCnpj = document.querySelector('[data-js="buscar-cnpj"]');
    const statusCnpj = document.querySelector('[data-js="status-cnpj"]');

    const detalhesPorModelo = {
        brasil: `
            <strong>Contrato Contex Brasil.</strong>
            Utiliza exclusivamente a minuta da Contex Brasil, com o título padronizado como
            “Contrato de Prestação de Serviços Profissionais Contábeis”.
        `,
        digital: `
            <strong>Contrato Contex Digital.</strong>
            Utiliza exclusivamente a minuta da Contex Digital e inclui Estado e CEP na
            qualificação da contratante.
        `
    };

    function somenteNumeros(valor) {
        return String(valor || "").replace(/\D/g, "");
    }

    function formatarCpf(valor) {
        const numeros = somenteNumeros(valor).slice(0, 11);
        return numeros
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    function formatarCnpj(valor) {
        const numeros = somenteNumeros(valor).slice(0, 14);
        return numeros
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
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

    function formatarCep(valor) {
        return somenteNumeros(valor).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
    }

    function formatarMoeda(valor) {
        const centavos = somenteNumeros(valor);
        if (!centavos) {
            return "";
        }

        return (Number(centavos) / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function dataLocalHoje() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function partesDaData(dataIso) {
        const meses = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ];
        const [ano, mes, dia] = dataIso.split("-").map(Number);
        return { ano, mes: meses[mes - 1], dia };
    }

    function formatarDataCurta(dataIso) {
        if (!dataIso) {
            return "";
        }
        const [ano, mes, dia] = dataIso.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    function campo(id) {
        return document.getElementById(id)?.value.trim() || "";
    }

    function modeloSelecionado() {
        return contratoForm.querySelector('input[name="modeloContrato"]:checked')?.value || "";
    }

    function atualizarModelo() {
        const modelo = modeloSelecionado();
        const digitalAtivo = modelo === "digital";

        camposDigital.forEach((grupo) => {
            grupo.hidden = !digitalAtivo;
        });

        camposDigitalObrigatorios.forEach((input) => {
            input.required = digitalAtivo;
            if (!digitalAtivo) {
                input.closest(".field")?.classList.remove("has-error");
                input.setAttribute("aria-invalid", "false");
            }
        });

        modeloDetalhes.innerHTML = modelo
            ? `<span class="note-icon" aria-hidden="true">i</span><p>${detalhesPorModelo[modelo]}</p>`
            : '<span class="note-icon" aria-hidden="true">i</span><p>Selecione uma empresa para visualizar as características da minuta.</p>';
    }

    function atualizarEstadoDoCampo(input) {
        const field = input.closest(".field");
        if (!field) {
            return input.checkValidity();
        }

        const valido = input.checkValidity();
        field.classList.toggle("has-error", !valido);
        input.setAttribute("aria-invalid", String(!valido));
        return valido;
    }

    function exibirFeedback(mensagem, tipo) {
        feedback.textContent = mensagem;
        feedback.className = `form-feedback is-visible is-${tipo}`;
        feedback.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function esconderFeedback() {
        feedback.textContent = "";
        feedback.className = "form-feedback";
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
        const cnpj = somenteNumeros(campo("cnpjEmpresa"));

        if (!cnpjValido(cnpj)) {
            atualizarStatusCnpj("Digite um CNPJ válido com 14 números.", "error");
            document.getElementById("cnpjEmpresa").focus();
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
            const ruaCompleta = tipoLogradouro && !logradouro.toUpperCase().startsWith(tipoLogradouro.toUpperCase())
                ? `${tipoLogradouro} ${logradouro}`
                : logradouro;
            const cep = dados.cep ? String(dados.cep).padStart(8, "0") : "";

            preencherCampo("nomeEmpresa", dados.razao_social);
            preencherCampo("ruaEmpresa", ruaCompleta);
            preencherCampo("numeroEmpresa", dados.numero || "S/N");
            preencherCampo("bairroEmpresa", dados.bairro);
            preencherCampo("cidadeEmpresa", dados.municipio);
            preencherCampo("estadoEmpresa", dados.uf);
            preencherCampo("cepEmpresa", formatarCep(cep));

            const situacao = String(dados.descricao_situacao_cadastral || "NÃO INFORMADA").toUpperCase();
            const tipoStatus = situacao === "ATIVA" ? "success" : "warning";
            atualizarStatusCnpj(
                `Dados encontrados. Situação cadastral: ${situacao}. Confira as informações e informe o representante legal.`,
                tipoStatus
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

    function escaparHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function valoresDoContrato() {
        const data = partesDaData(dataContrato.value);
        return {
            "{{NOME}}": campo("nomeEmpresa"),
            "{{CNPJ}}": campo("cnpjEmpresa"),
            "{{RUA}}": campo("ruaEmpresa"),
            "{{NUMERO}}": campo("numeroEmpresa"),
            "{{BAIRRO}}": campo("bairroEmpresa"),
            "{{CIDADE}}": campo("cidadeEmpresa"),
            "{{ESTADO}}": campo("estadoEmpresa"),
            "{{CEP}}": campo("cepEmpresa"),
            "{{NOME_SOCIO}}": campo("nomeSocio"),
            "{{CPF}}": campo("cpfSocio"),
            "{{Valor}}": campo("valorContrato"),
            "{{VALOR}}": campo("valorContrato"),
            "{{PRIMEIRO_VENCIMENTO}}": formatarDataCurta(primeiroVencimento.value),
            "{{DATA_VENCIMENTO}}": campo("diaVencimento"),
            "{{DATA}}": campo("diaVencimento"),
            "{{INICIO_CONTRATO}}": formatarDataCurta(inicioContrato.value),
            "{{DATA_HOJE}}": String(data.dia),
            "{{MES_HOJE}}": data.mes,
            "{{ANO_HOJE}}": String(data.ano),
            "{{TESTEMUNHA1_NOME}}": campo("testemunha1Nome").toUpperCase(),
            "{{TESTEMUNHA1_CPF}}": campo("testemunha1Cpf"),
            "{{TESTEMUNHA2_NOME}}": campo("testemunha2Nome").toUpperCase(),
            "{{TESTEMUNHA2_CPF}}": campo("testemunha2Cpf")
        };
    }

    function preencherTexto(texto, valores) {
        let resultado = String(texto || "");
        Object.entries(valores).forEach(([marcador, valor]) => {
            resultado = resultado.split(marcador).join(valor);
        });
        return escaparHtml(resultado).replace(/\n/g, "<br>");
    }

    function prepararTabelaBrasil(rows, indiceTabela, valores) {
        if (indiceTabela === 0) {
            return [[
                `CONTEX BRASIL SERVIÇOS CONTÁBEIS LTDA\nCONTRATADA`,
                `${valores["{{NOME}}"].toUpperCase()}\nCONTRATANTE`
            ]];
        }

        if (indiceTabela === 1) {
            return [[
                `${valores["{{TESTEMUNHA1_NOME}}"]}\nCPF ${valores["{{TESTEMUNHA1_CPF}}"]}\nTESTEMUNHA`,
                `${valores["{{TESTEMUNHA2_NOME}}"]}\nCPF ${valores["{{TESTEMUNHA2_CPF}}"]}\nTESTEMUNHA`
            ]];
        }

        return rows;
    }

    function montarAssinaturas(rows, valores) {
        const papeis = /^(CONTRATANTE|CONTRATADO|CONTRATADA|TESTEMUNHA)$/;
        const itens = rows.flatMap((row) => row).filter((cell) => cell.trim()).map((cell) => {
            const textoPreenchido = Object.entries(valores).reduce(
                (texto, [marcador, valor]) => texto.split(marcador).join(valor),
                cell
            );
            const linhas = textoPreenchido.split("\n").map((linha) => linha.trim()).filter(Boolean);
            const indicePapel = linhas.findIndex((linha) => papeis.test(linha.toUpperCase()));
            let papel = indicePapel >= 0 ? linhas.splice(indicePapel, 1)[0].toUpperCase() : "ASSINATURA";

            if (papel === "CONTRATADO") {
                papel = "CONTRATADA";
            }

            return `
                <div class="signature-item">
                    <span class="signature-line" aria-hidden="true"></span>
                    <strong class="signature-role">${escaparHtml(papel)}</strong>
                    <span class="signature-name">${linhas.map(escaparHtml).join("<br>")}</span>
                </div>
            `;
        }).join("");

        return `<div class="signature-grid">${itens}</div>`;
    }

    function montarCondicoesEspeciais() {
        const observacoes = campo("observacoesContrato");

        if (!observacoes) {
            return "";
        }

        return `
            <section class="special-conditions">
                <p class="doc-heading">CONDIÇÕES ESPECIAIS</p>
                <p class="doc-paragraph">${escaparHtml(observacoes).replace(/\n/g, "<br>")}</p>
            </section>
        `;
    }

    function montarBlocos(modelo, valores) {
        let indiceTabela = 0;
        let condicoesInseridas = false;
        const condicoesEspeciais = montarCondicoesEspeciais();

        return modelo.blocks.map((bloco) => {
            if (bloco.type === "paragraph") {
                if (bloco.kind === "spacer") {
                    return '<div class="doc-spacer" aria-hidden="true"></div>';
                }

                if (bloco.text.trim().toLowerCase() === "testemunhas:") {
                    return `<p class="doc-witness-title">${preencherTexto(bloco.text, valores)}</p>`;
                }

                const iniciaAssinaturas = bloco.kind === "closing"
                    || bloco.text.trim().startsWith("Após ler e compreender");
                const prefixo = !condicoesInseridas && condicoesEspeciais && iniciaAssinaturas
                    ? condicoesEspeciais
                    : "";

                if (prefixo) {
                    condicoesInseridas = true;
                }

                return `${prefixo}<p class="doc-${bloco.kind}">${preencherTexto(bloco.text, valores)}</p>`;
            }

            let rows = bloco.rows;
            const atual = indiceTabela;
            indiceTabela += 1;

            if (modeloSelecionado() === "brasil") {
                rows = prepararTabelaBrasil(rows, atual, valores);
            }

            const tabelaQualificacao = atual === 0 && modeloSelecionado() === "digital";

            if (!tabelaQualificacao) {
                return montarAssinaturas(rows, valores);
            }

            const corpo = rows.map((row) => `
                <tr>${row.map((cell) => `<td>${preencherTexto(cell, valores)}</td>`).join("")}</tr>
            `).join("");
            return `<table class="doc-table qualification-table"><tbody>${corpo}</tbody></table>`;
        }).join("");
    }

    function montarDocumentoHtml() {
        const chaveModelo = modeloSelecionado();
        const modelo = modelos[chaveModelo];
        const valores = valoresDoContrato();
        const papel = modelo.paper === "Letter" ? "Letter" : "A4";
        const largura = papel === "Letter" ? "216mm" : "210mm";
        const altura = papel === "Letter" ? "279mm" : "297mm";
        const margens = chaveModelo === "digital" ? "25.4mm" : "12mm 18mm";
        const nomeArquivo = `Contrato_${modelo.label.replace(/\s+/g, "_")}_${campo("nomeEmpresa").replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "_")}`;

        return `<!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${escaparHtml(nomeArquivo)}</title>
                <style>
                    @page { size: ${papel}; margin: ${margens}; }
                    * { box-sizing: border-box; }
                    body { margin: 0; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.35; }
                    .document { width: ${largura}; min-height: ${altura}; margin: 0 auto; padding: ${margens}; background: #fff; }
                    p { margin: 0 0 8pt; text-align: justify; }
                    .doc-title { margin: 0 0 18pt; font-size: 13pt; font-weight: 700; text-align: center; text-transform: uppercase; }
                    .doc-heading { margin: 14pt 0 7pt; font-weight: 700; text-align: left; }
                    .doc-subheading { margin: 9pt 0 4pt; font-weight: 700; text-align: left; }
                    .doc-closing { margin-top: 18pt; }
                    .doc-spacer { height: 6pt; }
                    .doc-table { width: 100%; margin: 16pt 0; border-collapse: collapse; page-break-inside: avoid; }
                    .doc-table td { padding: 8pt; vertical-align: top; white-space: normal; }
                    .qualification-table td { border: 1px solid #000; }
                    .qualification-table td:first-child { width: 25%; font-weight: 700; }
                    .doc-witness-title { margin: 24pt 0 0; font-weight: 700; text-align: left; }
                    .special-conditions { margin: 16pt 0; padding: 10pt 12pt; border: 1px solid #000; page-break-inside: avoid; break-inside: avoid; }
                    .special-conditions .doc-heading { margin-top: 0; }
                    .special-conditions .doc-paragraph { margin-bottom: 0; }
                    .signature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32pt 42pt; margin: 34pt 0 24pt; page-break-inside: avoid; break-inside: avoid; }
                    .signature-item { min-width: 0; text-align: center; page-break-inside: avoid; break-inside: avoid; }
                    .signature-line { display: block; width: 100%; margin-bottom: 7pt; border-top: 1px solid #000; }
                    .signature-role { display: block; margin-bottom: 3pt; font-size: 10.5pt; font-weight: 700; }
                    .signature-name { display: block; font-size: 10.5pt; line-height: 1.25; }
                    .screen-toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: center; gap: 10px; padding: 12px; background: #eef3f7; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
                    .screen-toolbar button { padding: 10px 18px; border: 0; border-radius: 7px; background: #0a4e8a; color: #fff; font: 700 14px Arial, sans-serif; cursor: pointer; }
                    @media screen { body { background: #dfe5ea; } .document { box-shadow: 0 5px 25px rgba(0,0,0,.15); } }
                    @media print { .screen-toolbar { display: none; } .document { width: auto; min-height: auto; padding: 0; box-shadow: none; } }
                </style>
            </head>
            <body>
                <div class="screen-toolbar">
                    <button type="button" onclick="window.print()">Salvar como PDF</button>
                </div>
                <article class="document">
                    ${montarBlocos(modelo, valores)}
                </article>
            </body>
            </html>`;
    }

    function gerarContrato() {
        const janela = window.open("", "_blank");
        if (!janela) {
            exibirFeedback("O navegador bloqueou a janela do contrato. Autorize pop-ups e tente novamente.", "error");
            return;
        }

        janela.document.open();
        janela.document.write(montarDocumentoHtml());
        janela.document.close();
        janela.focus();
        window.setTimeout(() => janela.print(), 400);
    }

    function fecharMenu() {
        document.body.classList.remove("menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
    }

    contratoForm.querySelectorAll('input[name="modeloContrato"]').forEach((input) => {
        input.addEventListener("change", () => {
            atualizarModelo();
            contratoForm.querySelectorAll('input[name="modeloContrato"]').forEach(atualizarEstadoDoCampo);
            esconderFeedback();
        });
    });

    contratoForm.querySelectorAll('[data-js="cpf"]').forEach((input) => {
        input.addEventListener("input", () => {
            input.value = formatarCpf(input.value);
        });
    });

    contratoForm.querySelector('[data-js="cnpj"]')?.addEventListener("input", (evento) => {
        evento.currentTarget.value = formatarCnpj(evento.currentTarget.value);
        atualizarStatusCnpj("");
    });

    botaoBuscarCnpj?.addEventListener("click", buscarDadosCnpj);

    contratoForm.querySelector('[data-js="cep"]')?.addEventListener("input", (evento) => {
        evento.currentTarget.value = formatarCep(evento.currentTarget.value);
    });

    contratoForm.querySelector('[data-js="moeda"]')?.addEventListener("input", (evento) => {
        evento.currentTarget.value = formatarMoeda(evento.currentTarget.value);
    });

    contratoForm.querySelectorAll("input, select, textarea").forEach((input) => {
        input.addEventListener("blur", () => atualizarEstadoDoCampo(input));
        input.addEventListener("input", esconderFeedback);
    });

    contratoForm.addEventListener("submit", (evento) => {
        evento.preventDefault();
        const campos = [...contratoForm.querySelectorAll("input, select, textarea")]
            .filter((input) => !input.closest("[hidden]"));
        const invalidos = campos.filter((input) => !atualizarEstadoDoCampo(input));

        if (invalidos.length > 0) {
            exibirFeedback("Revise os campos destacados antes de gerar o contrato.", "error");
            invalidos[0].focus();
            return;
        }

        exibirFeedback("Dados validados. O contrato foi aberto para conferência e salvamento em PDF.", "success");
        gerarContrato();
    });

    contratoForm.addEventListener("reset", () => {
        window.setTimeout(() => {
            contratoForm.querySelectorAll(".field").forEach((field) => field.classList.remove("has-error"));
            contratoForm.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.setAttribute("aria-invalid", "false"));
            dataContrato.value = dataLocalHoje();
            inicioContrato.value = dataLocalHoje();
            atualizarModelo();
            atualizarStatusCnpj("");
            esconderFeedback();
        });
    });

    menuToggle?.addEventListener("click", () => {
        const aberto = document.body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(aberto));
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

    dataContrato.value = dataLocalHoje();
    inicioContrato.value = dataLocalHoje();
    atualizarModelo();
}

