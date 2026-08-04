"use strict";

const botoesConfissao = [
    document.getElementById("btnConfissao"),
    document.getElementById("btnNovaConfissao")
].filter(Boolean);

const botoesContratos = [
    document.getElementById("btnContratos"),
    document.getElementById("menuContratos")
].filter(Boolean);

botoesConfissao.forEach((botao) => {
    botao.addEventListener("click", () => {
        window.location.href = "pages/confissao.html";
    });
});

botoesContratos.forEach((botao) => {
    botao.addEventListener("click", () => {
        window.location.href = "pages/contratos.html";
    });
});

