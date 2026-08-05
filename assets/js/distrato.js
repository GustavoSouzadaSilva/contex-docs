"use strict";

const distratoForm = document.getElementById("distratoForm");

if (distratoForm) {
    const empresas = {
        brasil: {
            nome: "CONTEX BRASIL SERVIÇOS CONTÁBEIS LTDA",
            qualificacao: "empresa de direito privado, inscrita no CNPJ sob o n.º 04.244.373/0001-69, com sede na Rua Gustavo Lauck, 167, Centro, Parobé-RS, neste ato representada por seu sócio Davi Daniel Teixeira, inscrito no CPF sob o n.º 486.510.360-00, registrado no CRC n.º RS 44738",
            cidade: "Parobé",
            foro: "Parobé/RS"
        },
        digital: {
            nome: "CONTEX DIGITAL SERVIÇOS CONTÁBEIS LTDA",
            qualificacao: "empresa de direito privado, inscrita no CNPJ sob o n.º 34.199.150/0001-98, com sede na Estrada Serra Grande, 1090, Serra Grande, Três Coroas-RS, neste ato representada por seu sócio titular Lucas Ismael Schnorr",
            cidade: "Três Coroas",
            foro: "Três Coroas/RS"
        }
    };

    const feedback = distratoForm.querySelector('[data-js="feedback"]');
    const statusCnpj = distratoForm.querySelector('[data-js="status-cnpj"]');
    const botaoBuscarCnpj = distratoForm.querySelector('[data-js="buscar-cnpj"]');
    const camposMulta = distratoForm.querySelector('[data-js="campos-multa"]');
    const camposPagamento = distratoForm.querySelector('[data-js="campos-pagamento"]');
    const camposTestemunhas = distratoForm.querySelector('[data-js="campos-testemunhas"]');
    const incluirTestemunhas = document.getElementById("incluirTestemunhas");
    const dataDistrato = document.getElementById("dataDistrato");
    const dataEncerramento = document.getElementById("dataEncerramento");
    const cidadeAssinatura = document.getElementById("cidadeAssinatura");
    const menuToggle = document.querySelector('[data-js="menu-toggle"]');
    const sidebarOverlay = document.querySelector('[data-js="sidebar-overlay"]');

    function campo(nome) {
        return String(distratoForm.elements[nome]?.value || "").trim();
    }

    function somenteNumeros(valor) {
        return String(valor || "").replace(/\D/g, "");
    }

    function formatarCnpj(valor) {
        return somenteNumeros(valor).slice(0, 14)
            .replace(/^(\d{2})(\d)/, "$1.$2")
            .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/\.(\d{3})(\d)/, ".$1/$2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    function formatarCpf(valor) {
        return somenteNumeros(valor).slice(0, 11)
            .replace(/^(\d{3})(\d)/, "$1.$2")
            .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    function formatarCep(valor) {
        return somenteNumeros(valor).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
    }

    function formatarMoeda(valor) {
        const centavos = somenteNumeros(valor);
        if (!centavos) return "";
        return (Number(centavos) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function dataLocalHoje() {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        return `${ano}-${mes}-${dia}`;
    }

    function formatarData(valor) {
        if (!valor) return "";
        const [ano, mes, dia] = valor.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    function formatarDataExtenso(valor) {
        if (!valor) return "";
        const [ano, mes, dia] = valor.split("-").map(Number);
        const data = new Date(ano, mes - 1, dia);
        return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(data);
    }

    function formatarCompetencia(valor) {
        if (!valor) return "";
        const [ano, mes] = valor.split("-").map(Number);
        const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(ano, mes - 1, 1));
        return `${nomeMes}/${ano}`;
    }

    function escaparHtml(valor) {
        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function modeloSelecionado() {
        return distratoForm.querySelector('input[name="modeloDistrato"]:checked')?.value || "";
    }

    function atualizarCampo(input) {
        const field = input.closest(".field");
        if (!field) return input.checkValidity();
        const valido = input.checkValidity();
        field.classList.toggle("has-error", !valido);
        input.setAttribute("aria-invalid", String(!valido));
        return valido;
    }

    function atualizarValidadeDocumento(input, tamanho, mensagem) {
        const preenchido = somenteNumeros(input.value);
        input.setCustomValidity(!preenchido || preenchido.length === tamanho ? "" : mensagem);
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
        if (!input || valor === null || valor === undefined || String(valor).trim() === "") return;
        input.value = String(valor).trim();
        atualizarCampo(input);
    }

    async function buscarDadosCnpj() {
        const cnpj = somenteNumeros(campo("cnpjCliente"));
        if (cnpj.length !== 14) {
            atualizarStatusCnpj("Digite um CNPJ válido com 14 números.", "error");
            document.getElementById("cnpjCliente").focus();
            return;
        }

        botaoBuscarCnpj.disabled = true;
        botaoBuscarCnpj.textContent = "Consultando...";
        atualizarStatusCnpj("Consultando os dados públicos do CNPJ...");

        try {
            const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, { headers: { Accept: "application/json" } });
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(resposta.status === 404 ? "CNPJ não encontrado na base consultada." : (dados.message || "Não foi possível consultar o CNPJ agora."));

            const tipo = String(dados.descricao_tipo_de_logradouro || "").trim();
            const logradouro = String(dados.logradouro || "").trim();
            const rua = tipo && !logradouro.toUpperCase().startsWith(tipo.toUpperCase()) ? `${tipo} ${logradouro}` : logradouro;
            preencherCampo("razaoSocial", dados.razao_social);
            preencherCampo("logradouro", rua);
            preencherCampo("numero", dados.numero || "S/N");
            preencherCampo("bairro", dados.bairro);
            preencherCampo("cidade", dados.municipio);
            preencherCampo("uf", dados.uf);
            preencherCampo("cep", formatarCep(String(dados.cep || "").padStart(8, "0")));

            const situacao = String(dados.descricao_situacao_cadastral || "NÃO INFORMADA").toUpperCase();
            atualizarStatusCnpj(`Dados encontrados. Situação cadastral: ${situacao}. Confira os dados e informe o representante legal.`, situacao === "ATIVA" ? "success" : "warning");
        } catch (erro) {
            atualizarStatusCnpj(erro instanceof TypeError ? "Não foi possível acessar o serviço de consulta. Verifique a internet e tente novamente." : erro.message, "error");
        } finally {
            botaoBuscarCnpj.disabled = false;
            botaoBuscarCnpj.textContent = "Buscar dados";
        }
    }

    function alternarGrupo(grupo, ativo, idsObrigatorios) {
        grupo.hidden = !ativo;
        idsObrigatorios.forEach((id) => {
            const input = document.getElementById(id);
            input.required = ativo;
            if (!ativo) {
                input.closest(".field")?.classList.remove("has-error");
                input.setAttribute("aria-invalid", "false");
            }
        });
    }

    function atualizarCondicionais() {
        alternarGrupo(camposMulta, campo("temMulta") === "sim", ["valorMulta", "vencimentoMulta"]);
        alternarGrupo(camposPagamento, campo("temUltimoPagamento") === "sim", ["valorUltimoPagamento", "vencimentoUltimoPagamento"]);
        alternarGrupo(camposTestemunhas, incluirTestemunhas.checked, ["testemunha1Nome", "testemunha1Cpf", "testemunha2Nome", "testemunha2Cpf"]);
    }

    function qualificacaoContratante() {
        const endereco = `${campo("logradouro")}, ${campo("numero")}, ${campo("bairro")}, ${campo("cidade")}-${campo("uf")}, CEP ${campo("cep")}`;
        return `<strong>CONTRATANTE: ${escaparHtml(campo("razaoSocial").toUpperCase())}</strong>, empresa de direito privado, inscrita no CNPJ sob o n.º ${escaparHtml(campo("cnpjCliente"))}, com sede na ${escaparHtml(endereco)}, neste ato representada por ${escaparHtml(campo("representanteCliente"))}, inscrito(a) no CPF sob o n.º ${escaparHtml(campo("cpfRepresentante"))}.`;
    }

    function qualificacaoContratada(empresa) {
        return `<strong>CONTRATADA: ${escaparHtml(empresa.nome)}</strong>, ${escaparHtml(empresa.qualificacao)}.`;
    }

    function textoObrigacoes() {
        const itens = [];
        if (campo("temMulta") === "sim") itens.push(`multa de rescisão no valor de R$ ${escaparHtml(campo("valorMulta"))}, com vencimento em ${formatarData(campo("vencimentoMulta"))}`);
        if (campo("temUltimoPagamento") === "sim") itens.push(`último pagamento no valor de R$ ${escaparHtml(campo("valorUltimoPagamento"))}, referente à competência ${escaparHtml(formatarCompetencia(campo("ultimaCompetencia")))}, com vencimento em ${formatarData(campo("vencimentoUltimoPagamento"))}`);
        if (campo("obrigacoesPendentes")) itens.push(escaparHtml(campo("obrigacoesPendentes")));

        if (!itens.length) return "As partes declaram não haver valores ou obrigações pendentes decorrentes do contrato ora encerrado.";
        return `Permanecem pendentes apenas as seguintes obrigações: ${itens.join("; ")}. As partes comprometem-se a cumpri-las integralmente nos prazos indicados.`;
    }

    function assinaturas(empresa) {
        const testemunhas = incluirTestemunhas.checked ? `
            <div class="witnesses-title">TESTEMUNHAS</div>
            <div class="signature-grid witnesses">
                <div class="signature"><span></span><strong>TESTEMUNHA</strong><p>${escaparHtml(campo("testemunha1Nome").toUpperCase())}<br>CPF ${escaparHtml(campo("testemunha1Cpf"))}</p></div>
                <div class="signature"><span></span><strong>TESTEMUNHA</strong><p>${escaparHtml(campo("testemunha2Nome").toUpperCase())}<br>CPF ${escaparHtml(campo("testemunha2Cpf"))}</p></div>
            </div>` : "";

        return `
            <div class="signature-grid parties">
                <div class="signature"><span></span><strong>CONTRATADA</strong><p>${escaparHtml(empresa.nome)}</p></div>
                <div class="signature"><span></span><strong>CONTRATANTE</strong><p>${escaparHtml(campo("razaoSocial").toUpperCase())}</p></div>
            </div>${testemunhas}`;
    }

    function montarDocumento() {
        const empresa = empresas[modeloSelecionado()];
        const comTestemunhas = incluirTestemunhas.checked;
        const fechamento = comTestemunhas ? "juntamente com duas testemunhas" : "pelas partes";
        const nomeArquivo = `Distrato_${empresa.nome.includes("BRASIL") ? "Contex_Brasil" : "Contex_Digital"}_${campo("razaoSocial").replace(/[^a-zA-ZÀ-ÿ0-9]+/g, "_")}`;

        return `<!DOCTYPE html>
            <html lang="pt-BR"><head><meta charset="UTF-8"><title>${escaparHtml(nomeArquivo)}</title>
            <style>
                @page { size: A4; margin: 22mm 20mm; }
                * { box-sizing: border-box; }
                body { margin: 0; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 11.5pt; line-height: 1.45; }
                .document { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 22mm 20mm; background: #fff; }
                h1 { margin: 0 0 24pt; font-size: 14pt; text-align: center; text-transform: uppercase; }
                h2 { margin: 16pt 0 8pt; font-size: 11.5pt; text-transform: uppercase; }
                p { margin: 0 0 10pt; text-align: justify; }
                .place-date { margin-top: 22pt; text-align: center; }
                .signature-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32pt 40pt; page-break-inside: avoid; break-inside: avoid; }
                .signature-grid.parties { margin-top: 42pt; }
                .signature-grid.witnesses { margin-top: 30pt; }
                .signature { text-align: center; }
                .signature > span { display: block; border-top: 1px solid #000; margin-bottom: 6pt; }
                .signature strong { display: block; font-weight: 700; }
                .signature p { margin-top: 3pt; font-size: 10pt; line-height: 1.3; text-align: center; }
                .witnesses-title { margin-top: 30pt; font-weight: 700; text-align: center; }
                .screen-toolbar { position: sticky; top: 0; z-index: 5; display: flex; justify-content: center; padding: 12px; background: #eef3f7; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
                .screen-toolbar button { padding: 10px 18px; border: 0; border-radius: 7px; background: #0a4e8a; color: #fff; font: 700 14px Arial, sans-serif; cursor: pointer; }
                @media screen { body { background: #dfe5ea; } .document { box-shadow: 0 5px 25px rgba(0,0,0,.15); } }
                @media print { .screen-toolbar { display: none; } .document { width: auto; min-height: auto; padding: 0; box-shadow: none; } }
            </style></head><body>
                <div class="screen-toolbar"><button type="button" onclick="window.print()">Salvar como PDF</button></div>
                <article class="document">
                    <h1>Termo de Distrato Contratual</h1>
                    <p>${qualificacaoContratante()}</p>
                    <p>${qualificacaoContratada(empresa)}</p>
                    <p>As partes acima identificadas têm, entre si, justo e acordado o presente Termo de Distrato Contratual, mediante as cláusulas e condições seguintes:</p>

                    <h2>Cláusula primeira — Do contrato</h2>
                    <p>As partes declaram que celebraram, em ${formatarData(campo("dataContratoOriginal"))}, Contrato de Prestação de Serviços Contábeis.</p>

                    <h2>Cláusula segunda — Da rescisão</h2>
                    <p>O encerramento foi solicitado pela ${escaparHtml(campo("parteSolicitante"))} e expressamente aceito por ambas as partes, que resolvem rescindir, de forma livre, voluntária e de comum acordo, o contrato referido na cláusula anterior, com efeitos a partir de ${formatarData(campo("dataEncerramento"))}. A última competência dos serviços será ${escaparHtml(formatarCompetencia(campo("ultimaCompetencia")))}.</p>
                    <p>O presente distrato decorre do seguinte motivo: ${escaparHtml(campo("motivoDistrato"))}</p>

                    <h2>Cláusula terceira — Das obrigações pendentes</h2>
                    <p>${textoObrigacoes()}</p>

                    <h2>Cláusula quarta — Da quitação</h2>
                    <p>Após o integral cumprimento das obrigações previstas neste instrumento, as partes concederão entre si plena, geral, irrevogável e irretratável quitação relativamente ao contrato ora encerrado, nada mais tendo a reclamar uma da outra a qualquer título.</p>

                    <h2>Cláusula quinta — Da confidencialidade</h2>
                    <p>Permanecem válidas, quando aplicáveis, as obrigações de confidencialidade assumidas durante a vigência do contrato original.</p>

                    <h2>Cláusula sexta — Do foro</h2>
                    <p>Fica eleito o foro da Comarca de ${escaparHtml(empresa.foro)}, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias decorrentes deste instrumento.</p>

                    <p>E, por estarem de pleno acordo, firmam o presente instrumento ${fechamento}.</p>
                    <p class="place-date">${escaparHtml(campo("cidadeAssinatura"))}, ${formatarDataExtenso(campo("dataDistrato"))}.</p>
                    ${assinaturas(empresa)}
                </article>
            </body></html>`;
    }

    function gerarDistrato() {
        const janela = window.open("", "_blank");
        if (!janela) {
            exibirFeedback("O navegador bloqueou a janela do distrato. Autorize pop-ups e tente novamente.", "error");
            return;
        }
        janela.document.open();
        janela.document.write(montarDocumento());
        janela.document.close();
        janela.focus();
        window.setTimeout(() => janela.print(), 400);
    }

    distratoForm.querySelectorAll('input[name="modeloDistrato"]').forEach((input) => {
        input.addEventListener("change", () => {
            const empresa = empresas[modeloSelecionado()];
            if (empresa) cidadeAssinatura.value = empresa.cidade;
            distratoForm.querySelectorAll('input[name="modeloDistrato"]').forEach(atualizarCampo);
            esconderFeedback();
        });
    });

    distratoForm.querySelectorAll('input[name="temMulta"], input[name="temUltimoPagamento"], #incluirTestemunhas').forEach((input) => input.addEventListener("change", atualizarCondicionais));
    distratoForm.querySelectorAll('[data-js="cpf"]').forEach((input) => input.addEventListener("input", () => {
        input.value = formatarCpf(input.value);
        atualizarValidadeDocumento(input, 11, "Informe um CPF válido com 11 números.");
    }));
    distratoForm.querySelector('[data-js="cnpj"]')?.addEventListener("input", (evento) => {
        evento.currentTarget.value = formatarCnpj(evento.currentTarget.value);
        atualizarValidadeDocumento(evento.currentTarget, 14, "Informe um CNPJ válido com 14 números.");
        atualizarStatusCnpj("");
    });
    distratoForm.querySelector('[data-js="cep"]')?.addEventListener("input", (evento) => { evento.currentTarget.value = formatarCep(evento.currentTarget.value); });
    distratoForm.querySelectorAll('[data-js="moeda"]').forEach((input) => input.addEventListener("input", () => { input.value = formatarMoeda(input.value); }));
    botaoBuscarCnpj?.addEventListener("click", buscarDadosCnpj);

    distratoForm.querySelectorAll("input, select, textarea").forEach((input) => {
        input.addEventListener("blur", () => atualizarCampo(input));
        input.addEventListener("input", esconderFeedback);
    });

    distratoForm.addEventListener("submit", (evento) => {
        evento.preventDefault();
        distratoForm.querySelectorAll('[data-js="cpf"]').forEach((input) => atualizarValidadeDocumento(input, 11, "Informe um CPF válido com 11 números."));
        const cnpj = distratoForm.querySelector('[data-js="cnpj"]');
        atualizarValidadeDocumento(cnpj, 14, "Informe um CNPJ válido com 14 números.");
        const campos = [...distratoForm.querySelectorAll("input, select, textarea")].filter((input) => !input.disabled && !input.closest("[hidden]") && input.type !== "button");
        const invalidos = campos.filter((input) => !atualizarCampo(input));
        if (invalidos.length) {
            exibirFeedback("Revise os campos destacados antes de gerar o distrato.", "error");
            invalidos[0].focus();
            return;
        }
        exibirFeedback("Dados validados. O distrato foi aberto para conferência e salvamento em PDF.", "success");
        gerarDistrato();
    });

    distratoForm.addEventListener("reset", () => window.setTimeout(() => {
        distratoForm.querySelectorAll(".field").forEach((field) => field.classList.remove("has-error"));
        dataDistrato.value = dataLocalHoje();
        dataEncerramento.value = dataLocalHoje();
        cidadeAssinatura.value = "";
        atualizarStatusCnpj("");
        atualizarCondicionais();
        esconderFeedback();
    }));

    function fecharMenu() {
        document.body.classList.remove("menu-open");
        menuToggle?.setAttribute("aria-expanded", "false");
    }

    menuToggle?.addEventListener("click", () => {
        const aberto = document.body.classList.toggle("menu-open");
        menuToggle.setAttribute("aria-expanded", String(aberto));
    });
    sidebarOverlay?.addEventListener("click", fecharMenu);
    document.addEventListener("keydown", (evento) => { if (evento.key === "Escape") fecharMenu(); });
    document.querySelectorAll('[data-js="ano-atual"]').forEach((elemento) => { elemento.textContent = String(new Date().getFullYear()); });

    dataDistrato.value = dataLocalHoje();
    dataEncerramento.value = dataLocalHoje();
    atualizarCondicionais();
}
