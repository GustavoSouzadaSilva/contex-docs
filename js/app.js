"use strict";

const rotasDosModulos = [
    ["btnConfissao", "pages/confissao.html"],
    ["btnNovaConfissao", "pages/confissao.html"],
    ["btnContratos", "pages/contratos.html"],
    ["btnDistratos", "pages/distrato.html"]
];

rotasDosModulos.forEach(([id, rota]) => {
    document.getElementById(id)?.addEventListener("click", () => {
        window.location.href = rota;
    });
});
