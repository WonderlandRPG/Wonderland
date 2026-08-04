"use strict";

const classesList = document.getElementById("classesList");
const classContent = document.getElementById("classContent");
let classes = {};
let currentClass = null;
let activeTab = "overview";

const CLASS_ORDER = [
    "barbaro", "alquimista", "arqueiro", "assassino", "bardo", "bruxo",
    "druida", "espadachim", "feiticeiro", "mago", "ninja", "necromante", "guerreiro"
];

const ATTRIBUTE_THEMES = {
    FOR: { accent: "#e56a3d", rgb: "229, 106, 61", secondary: "#d8a04d", secondaryRgb: "216, 160, 77" },
    DEF: { accent: "#4f8fd8", rgb: "79, 143, 216", secondary: "#7bb4e8", secondaryRgb: "123, 180, 232" },
    RES: { accent: "#43b77a", rgb: "67, 183, 122", secondary: "#82cf9f", secondaryRgb: "130, 207, 159" },
    INI: { accent: "#d5aa38", rgb: "213, 170, 56", secondary: "#f0cf67", secondaryRgb: "240, 207, 103" },
    INT: { accent: "#865dd4", rgb: "134, 93, 212", secondary: "#b08bea", secondaryRgb: "176, 139, 234" },
    ARC: { accent: "#35b7bd", rgb: "53, 183, 189", secondary: "#70d7d2", secondaryRgb: "112, 215, 210" }
};

const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

function getPrimaryAttribute(classe) {
    const attributes = String(classe?.estilo?.atributos || "").toUpperCase();
    const role = String(classe?.cargo || "").toLowerCase();
    if (role.includes("suporte") || role.includes("invocador")) return "ARC";
    if (role.includes("mágico") || role.includes("magico")) return "INT";
    if (role.includes("assassino")) return "INI";
    if (role.includes("tanque") && !role.includes("dps")) return "DEF";
    return ["FOR", "DEF", "RES", "INI", "INT", "ARC"].find((attribute) =>
        attributes.startsWith(attribute) || attributes.includes(`${attribute} PRINCIPAL`)
    ) || "FOR";
}

function getClassTheme(classe) {
    return ATTRIBUTE_THEMES[getPrimaryAttribute(classe)] || ATTRIBUTE_THEMES.FOR;
}

function applyClassTheme(classe) {
    const theme = getClassTheme(classe);
    const root = document.documentElement;
    root.style.setProperty("--classes-red", theme.accent);
    root.style.setProperty("--classes-red-rgb", theme.rgb);
    root.style.setProperty("--classes-gold", theme.secondary);
    root.style.setProperty("--classes-gold-rgb", theme.secondaryRgb);
    document.body.dataset.classTheme = getPrimaryAttribute(classe).toLowerCase();
}

function createSidebar() {
    classesList.innerHTML = "";
    const orderedClasses = CLASS_ORDER.map((id) => classes[id]).filter(Boolean);
    const remaining = Object.values(classes).filter((classe) => !CLASS_ORDER.includes(classe.id));

    [...orderedClasses, ...remaining].forEach((classe) => {
        const theme = getClassTheme(classe);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "class-button";
        button.dataset.id = classe.id;
        button.style.setProperty("--item-accent", theme.accent);
        button.style.setProperty("--item-accent-rgb", theme.rgb);
        button.innerHTML = `
            <span class="class-icon class-icon-symbol" aria-hidden="true"
                style="color:${theme.accent};border-color:rgba(${theme.rgb},.42);background:radial-gradient(circle,rgba(${theme.rgb},.20),rgba(5,11,13,.94));box-shadow:inset 0 0 18px rgba(${theme.rgb},.10)">
                ${esc(classe.icone || "✦")}
            </span>
            <div class="class-info">
                <span class="class-name">${esc(classe.nome)}</span>
                <span class="class-role">${esc(classe.cargo)}</span>
            </div>`;
        button.addEventListener("click", () => loadClass(classe.id));
        classesList.appendChild(button);
    });

    const heading = document.querySelector(".classes-index-heading p");
    if (heading) heading.textContent = `${orderedClasses.length + remaining.length} classes oficiais. Escolha uma para consultar seu estilo de combate e progressão.`;
}

function loadClass(id) {
    currentClass = classes[id];
    if (!currentClass) return;
    activeTab = "overview";
    applyClassTheme(currentClass);
    document.querySelectorAll(".class-button").forEach((button) => {
        const active = button.dataset.id === id;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        if (active) button.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    renderClass();
}

function renderClass() {
    const c = currentClass;
    const primary = getPrimaryAttribute(c);
    classContent.innerHTML = `
        <div class="class-header">
            <div class="class-image"><img src="${esc(c.imagem)}" alt="${esc(c.nome)}"></div>
            <div>
                <span class="class-kicker">${esc(c.cargo)}</span>
                <h1 class="class-title">${esc(c.nome)}</h1>
                <div class="class-stars">${esc(c.dificuldade)}</div>
                <p class="class-description">${esc(c.descricao)}</p>
                <div class="class-path-meta"><strong>${esc(primary)} principal</strong><small>${esc(c.recurso?.nome || "Mecânica própria")}</small></div>
            </div>
        </div>
        ${renderAffinityPanel()}
        <nav class="class-tabs" aria-label="Informações da classe">
            <button class="class-tab ${activeTab === "overview" ? "active" : ""}" data-tab="overview" type="button"><span>✦</span>Visão Geral</button>
            <button class="class-tab ${activeTab === "skills" ? "active" : ""}" data-tab="skills" type="button"><span>⚔</span>Habilidades</button>
            <button class="class-tab ${activeTab === "paths" ? "active" : ""}" data-tab="paths" type="button"><span>▲</span>Caminhos</button>
        </nav>
        <section class="class-tab-content">${renderActiveTab()}</section>`;

    const artwork = classContent.querySelector(".class-image img");
    if (artwork) artwork.addEventListener("error", () => {
        artwork.src = "assets/images/logo.png";
        artwork.classList.add("fallback");
    }, { once: true });

    classContent.querySelectorAll(".class-tab").forEach((tab) =>
        tab.addEventListener("click", () => {
            activeTab = tab.dataset.tab;
            renderClass();
        })
    );
    bindPathTabs();
}

function renderAffinityPanel() {
    const affinities = currentClass.afinidades || {};
    const primary = getPrimaryAttribute(currentClass);
    const cards = ["FOR", "DEF", "RES", "INI", "INT", "ARC"].map((attribute) => `
        <article class="class-affinity-card ${attribute === primary ? "primary" : ""}">
            <span>${attribute}</span>
            <strong>${esc(affinities[attribute] || "☆☆☆☆☆")}</strong>
        </article>`).join("");
    return `<section class="class-affinity-panel">
        <div class="class-affinity-copy"><span>Afinidade de atributos</span><h2>Potencial da Classe</h2><p>O tema visual desta classe acompanha seu atributo principal e sua função de combate.</p></div>
        <div class="class-affinity-grid">${cards}</div>
    </section>`;
}

function renderActiveTab() {
    if (activeTab === "skills") return renderProgressao();
    if (activeTab === "paths") return renderCaminhos();
    return renderOverviewTab();
}

function renderOverviewTab() {
    const c = currentClass;
    return `<div class="overview-grid">
        <article class="class-highlight-card"><span>Especialização</span><h2>${esc(c.especializacao?.titulo || c.cargo)}</h2><p>${esc(c.especializacao?.descricao || c.descricao)}</p></article>
        <aside class="class-playstyle-card">${row("Função principal", c.estilo?.principal)}${row("Mecânica exclusiva", c.recurso?.nome)}${row("Pontos fortes", c.estilo?.fortes)}${row("Pontos fracos", c.estilo?.fracos)}${row("Atributos centrais", c.estilo?.atributos)}</aside>
    </div>${renderResourceCard()}${renderPassivas()}${renderComplexidade()}${renderCuriosidades()}`;
}

function row(label, value) { return `<div class="playstyle-row"><span>${esc(label)}</span><strong>${esc(value || "—")}</strong></div>`; }
function renderResourceCard() { const r=currentClass.recurso; return r?`<section class="class-resource-card"><span>Mecânica da Classe</span><h2>${esc(r.nome)}</h2><p>${esc(r.descricao)}</p></section>`:""; }
function renderPassivas() { return currentClass.passivas?.length?`<section class="class-section-block"><header class="class-section-heading"><span>Característica permanente</span><h2>Passiva da Classe</h2></header><div class="class-passive-grid">${currentClass.passivas.map(p=>`<article class="passive-card"><h3>${esc(p.nome)}</h3><p>${esc(p.descricao)}</p></article>`).join("")}</div></section>`:""; }
function renderComplexidade() { const c=currentClass.complexidade; return c?`<section class="class-complexity-card"><span>Grau de Complexidade</span><h2>${esc(c.grau)}</h2><p>${esc(c.descricao)}</p></section>`:""; }
function renderCuriosidades() { return currentClass.curiosidades?.length?`<section class="curiosities"><h2 class="section-title">Regras de progressão</h2><ul>${currentClass.curiosidades.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></section>`:""; }

function renderProgressao() {
    const skills = currentClass.progressao || [];
    return `<section class="class-progression-section"><header class="class-section-heading"><span>Arsenal da Classe</span><h2>Habilidades — níveis 1 a 50</h2><p>Duas habilidades são desbloqueadas em cada marco. Clique em uma habilidade para consultar seu efeito completo.</p></header><div class="class-skill-list">${skills.map((skill,index)=>`
        <details class="class-skill-card" ${index === 0 ? "open" : ""}>
            <summary class="class-skill-summary">
                <span class="class-skill-level">Nível<br><strong>${esc(String(skill.nivel).replace(/[^0-9]/g, "") || index + 1)}</strong></span>
                <span class="class-skill-title-wrap"><small>${esc(skill.categoria || "Habilidade da Classe")}</small><strong>${esc(skill.nome)}</strong></span>
                <span class="class-skill-toggle" aria-hidden="true">＋</span>
            </summary>
            <div class="class-skill-body"><p>${esc(skill.descricao)}</p></div>
        </details>`).join("")}</div></section>`;
}

function renderCaminhos() {
    const caminhos = currentClass.caminhos || [];
    if (!caminhos.length) return `<div class="class-empty-state"><strong>Nenhum Caminho registrado.</strong></div>`;
    return `<section class="class-paths-section"><header class="class-section-heading"><span>Especializações de nível 50</span><h2>Caminhos de ${esc(currentClass.nome)}</h2><p>A escolha é definitiva e as doze habilidades da classe-base são preservadas.</p></header><div class="class-path-selector">${caminhos.map((c,i)=>`<button class="class-path-selector-button ${i===0?"active":""}" type="button" data-path-index="${i}"><span>Caminho ${i+1}</span><strong>${esc(c.nome)}</strong></button>`).join("")}</div><div id="classPathView">${renderSinglePath(caminhos[0],0)}</div></section>`;
}

function renderSinglePath(caminho, index) {
    return `<article class="class-path-card"><header class="class-path-header"><span>Caminho ${index+1}</span><h3>${esc(caminho.nome)}</h3><div class="class-path-meta"><strong>${esc(caminho.especializacao)}</strong><small>Complexidade: ${esc(caminho.complexidade)}</small></div><p>${esc(caminho.descricao)}</p></header><section class="class-path-passive"><span>Nova Passiva</span><h4>${esc(caminho.passiva?.nome)}</h4><div>${esc(caminho.passiva?.descricao)}</div></section><div class="class-skill-list class-path-progression">${(caminho.habilidades||[]).map((h,i)=>`
        <details class="class-skill-card ${String(h.tipo).toLowerCase()==="ultimate"?"ultimate":""}" ${i===0?"open":""}>
            <summary class="class-skill-summary"><span class="class-skill-level">${esc(h.tipo || "Ativa")}<br><strong>${i+1}</strong></span><span class="class-skill-title-wrap"><small>${String(h.tipo).toLowerCase()==="ultimate"?"Poder Supremo":"Habilidade do Caminho"}</small><strong>${esc(h.nome)}</strong></span><span class="class-skill-toggle">＋</span></summary>
            <div class="class-skill-body"><p>${esc(h.descricao)}</p></div>
        </details>`).join("")}</div></article>`;
}

function bindPathTabs() {
    const buttons = classContent.querySelectorAll(".class-path-selector-button");
    const view = classContent.querySelector("#classPathView");
    buttons.forEach(button => button.addEventListener("click", () => {
        const i=Number(button.dataset.pathIndex);
        buttons.forEach(b=>b.classList.toggle("active",b===button));
        view.innerHTML=renderSinglePath(currentClass.caminhos[i],i);
    }));
}

async function initializeClasses() {
    try {
        if (window.WONDERLAND_CLASSES_READY) await window.WONDERLAND_CLASSES_READY;
    } catch (error) {
        console.error("Falha ao carregar classes:", error);
    }
    classes = window.WONDERLAND_CLASSES || {};
    const ids = Object.keys(classes);
    if (!ids.length) {
        classContent.innerHTML = `<div class="class-empty-state"><strong>Não foi possível carregar as classes.</strong></div>`;
        return;
    }
    const missing = CLASS_ORDER.filter((id) => !classes[id]);
    if (missing.length) console.warn("Classes ausentes no arquivo oficial:", missing);
    createSidebar();
    loadClass(CLASS_ORDER.find((id) => classes[id]) || ids[0]);
}

initializeClasses();
