const classesList = document.getElementById("classesList");
const classContent = document.getElementById("classContent");

let currentClass = null;
let activeTab = "overview";

function createSidebar() {
    classesList.innerHTML = "";

    Object.values(classes).forEach((classe) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "class-button";
        button.dataset.id = classe.id;

        button.innerHTML = `
            <img class="class-icon" src="${classe.icone || classe.imagem}" alt="${classe.nome}">
            <div class="class-info">
                <span class="class-name">${classe.nome}</span>
                <span class="class-role">${classe.cargo}</span>
            </div>
        `;

        button.addEventListener("click", () => loadClass(classe.id));
        classesList.appendChild(button);
    });
}

function loadClass(id) {
    currentClass = classes[id];
    if (!currentClass) return;

    activeTab = "overview";

    document.querySelectorAll(".class-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.id === id);
    });

    renderClass();
}

function renderClass() {
    const c = currentClass;

    classContent.innerHTML = `
        <div class="class-header">
            <div class="class-image">
                <img src="${c.imagem}" alt="${c.nome}">
            </div>

            <div>
                <span class="class-kicker">${c.cargo}</span>
                <h1 class="class-title">${c.nome}</h1>
                <div class="class-stars" aria-label="Dificuldade ${c.dificuldade}">${c.dificuldade}</div>
                <p class="class-description">${c.descricao}</p>
            </div>
        </div>

        <nav class="class-tabs" aria-label="Informações da classe">
            <button class="class-tab ${activeTab === "overview" ? "active" : ""}" data-tab="overview" type="button">
                <span aria-hidden="true">✦</span>
                Visão Geral
            </button>
            <button class="class-tab ${activeTab === "skills" ? "active" : ""}" data-tab="skills" type="button">
                <span aria-hidden="true">⚔</span>
                Habilidades
            </button>
            <button class="class-tab ${activeTab === "paths" ? "active" : ""}" data-tab="paths" type="button">
                <span aria-hidden="true">▲</span>
                Caminhos
            </button>
        </nav>

        <section class="class-tab-content">
            ${renderActiveTab()}
        </section>
    `;

    classContent.querySelectorAll(".class-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            activeTab = tab.dataset.tab;
            renderClass();
        });
    });

    bindPathTabs();
}

function renderActiveTab() {
    if (activeTab === "skills") return renderSkillsTab();
    if (activeTab === "paths") return renderPathsTab();
    return renderOverviewTab();
}

function renderOverviewTab() {
    const c = currentClass;

    return `
        <div class="overview-grid">
            <article class="class-highlight-card">
                <span>Especialização</span>
                <h2>${c.especializacao?.titulo || c.cargo}</h2>
                <p>${c.especializacao?.descricao || c.descricao}</p>
            </article>

            <aside class="class-playstyle-card">
                <div class="playstyle-row"><span>Função principal</span><strong>${c.estilo?.principal || "—"}</strong></div>
                <div class="playstyle-row"><span>Função secundária</span><strong>${c.estilo?.secundaria || "—"}</strong></div>
                <div class="playstyle-row"><span>Pontos fortes</span><strong>${c.estilo?.fortes || "—"}</strong></div>
                <div class="playstyle-row"><span>Pontos fracos</span><strong>${c.estilo?.fracos || "—"}</strong></div>
                <div class="playstyle-row"><span>Atributos recomendados</span><strong>${c.estilo?.atributos || "—"}</strong></div>
            </aside>
        </div>

        ${renderResourceCard()}
        ${renderPassivas()}
        ${renderComplexidade()}
        ${renderCuriosidades()}
    `;
}

function renderSkillsTab() {
    return renderProgressao();
}

function renderPathsTab() {
    return renderCaminhos();
}

function renderResourceCard() {
    const recurso = currentClass.recurso;
    if (!recurso) return "";

    return `
        <section class="class-resource-card">
            <span>Recurso da Classe</span>
            <h2>${recurso.nome}</h2>
            <p>${recurso.descricao}</p>
        </section>
    `;
}

function renderPassivas() {
    if (!currentClass.passivas?.length) return "";

    return `
        <section class="class-section-block">
            <header class="class-section-heading">
                <span>Características permanentes</span>
                <h2>Passiva da Classe</h2>
            </header>
            <div class="class-passive-grid">
                ${currentClass.passivas.map((passiva) => `
                    <article class="passive-card">
                        <h3>${passiva.nome}</h3>
                        <p>${passiva.descricao}</p>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function renderProgressao() {
    if (!currentClass.progressao?.length) return "";

    return `
        <section class="class-progression-section">
            <header class="class-section-heading">
                <span>Arsenal da Classe</span>
                <h2>Habilidades</h2>
                <p>As habilidades são apresentadas diretamente por nível, com todos os valores de dano, custo, alcance, duração e recarga.</p>
            </header>

            <div class="class-progression-list">
                ${currentClass.progressao.map((skill, index) => `
                    <article class="class-progression-card">
                        <div class="class-progression-level">
                            <span>Nível</span>
                            <strong>${String(skill.nivel).replace(/[^0-9]/g, "") || index + 1}</strong>
                        </div>

                        <div class="class-progression-copy">
                            <span class="class-progression-label">Habilidade da Classe</span>
                            <h3>${skill.nome}</h3>
                            <div class="class-progression-description">${skill.descricao}</div>
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function renderComplexidade() {
    const complexidade = currentClass.complexidade;
    if (!complexidade) return "";

    return `
        <section class="class-complexity-card">
            <span>Grau de Complexidade</span>
            <h2>${complexidade.grau}</h2>
            <p>${complexidade.descricao}</p>
        </section>
    `;
}

function renderCaminhos() {
    if (!currentClass.caminhos?.length) {
        return `
            <div class="class-empty-state">
                <strong>Nenhum Caminho registrado.</strong>
                <p>Esta classe ainda não possui especializações de nível 50 cadastradas.</p>
            </div>
        `;
    }

    return `
        <section class="class-paths-section">
            <header class="class-section-heading">
                <span>Especializações de nível 50</span>
                <h2>Caminhos de ${currentClass.nome}</h2>
                <p>No nível 50, a escolha é definitiva e as habilidades originais da classe são preservadas.</p>
            </header>

            <div class="class-path-selector" role="tablist" aria-label="Caminhos da classe">
                ${currentClass.caminhos.map((caminho, index) => `
                    <button class="class-path-selector-button ${index === 0 ? "active" : ""}" type="button" data-path-index="${index}">
                        <span>Caminho ${index + 1}</span>
                        <strong>${caminho.nome}</strong>
                    </button>
                `).join("")}
            </div>

            <div id="classPathView">
                ${renderSinglePath(currentClass.caminhos[0], 0)}
            </div>
        </section>
    `;
}

function renderSinglePath(caminho, index) {
    return `
        <article class="class-path-card">
            <header class="class-path-header">
                <span>Caminho ${index + 1}</span>
                <h3>${caminho.nome}</h3>
                <div class="class-path-meta">
                    <strong>${caminho.especializacao}</strong>
                    <small>Complexidade: ${caminho.complexidade}</small>
                </div>
                <p>${caminho.descricao}</p>
            </header>

            <section class="class-path-passive">
                <span>Passiva do Caminho</span>
                <h4>${caminho.passiva.nome}</h4>
                <div>${caminho.passiva.descricao}</div>
            </section>

            <div class="class-progression-list class-path-progression">
                ${caminho.habilidades.map((habilidade, skillIndex) => `
                    <article class="class-progression-card ${skillIndex === caminho.habilidades.length - 1 ? "ultimate" : ""}">
                        <div class="class-progression-level">
                            <span>${skillIndex === caminho.habilidades.length - 1 ? "Ultimate" : "Habilidade"}</span>
                            <strong>${skillIndex + 1}</strong>
                        </div>

                        <div class="class-progression-copy">
                            <span class="class-progression-label">${skillIndex === caminho.habilidades.length - 1 ? "Poder Supremo" : "Habilidade do Caminho"}</span>
                            <h3>${habilidade.nome}</h3>
                            <div class="class-progression-description">${habilidade.descricao}</div>
                        </div>
                    </article>
                `).join("")}
            </div>
        </article>
    `;
}

function bindPathTabs() {
    const pathButtons = classContent.querySelectorAll(".class-path-selector-button");
    const pathView = classContent.querySelector("#classPathView");

    if (!pathButtons.length || !pathView) return;

    pathButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.pathIndex);
            const caminho = currentClass.caminhos?.[index];
            if (!caminho) return;

            pathButtons.forEach((item) => item.classList.toggle("active", item === button));
            pathView.innerHTML = renderSinglePath(caminho, index);
        });
    });
}

function renderCuriosidades() {
    if (!currentClass.curiosidades?.length) return "";

    return `
        <section class="curiosities">
            <h2 class="section-title">Observações</h2>
            <ul>
                ${currentClass.curiosidades.map((item) => `<li>${item}</li>`).join("")}
            </ul>
        </section>
    `;
}

createSidebar();
loadClass(Object.keys(classes)[0]);
