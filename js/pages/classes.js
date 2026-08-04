const classesList = document.getElementById("classesList");
const classContent = document.getElementById("classContent");

let currentClass = null;

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

        ${renderEspecializacao()}
        ${renderAfinidades()}

        <div class="info-grid">
            <div class="info-card"><h3>Função Principal</h3><p>${c.estilo?.principal || ""}</p></div>
            <div class="info-card"><h3>Função Secundária</h3><p>${c.estilo?.secundaria || ""}</p></div>
            <div class="info-card"><h3>Pontos Fortes</h3><p>${c.estilo?.fortes || ""}</p></div>
            <div class="info-card"><h3>Pontos Fracos</h3><p>${c.estilo?.fracos || ""}</p></div>
            <div class="info-card"><h3>Atributos Recomendados</h3><p>${c.estilo?.atributos || ""}</p></div>
            <div class="info-card"><h3>${c.recurso?.nome || "Recurso"}</h3><p>${c.recurso?.descricao || ""}</p></div>
        </div>

        ${renderPassivas()}
        ${renderTabelaProgressao()}
        ${renderProgressao()}
        ${renderComplexidade()}
        ${renderCaminhos()}
        ${renderCuriosidades()}
    `;
}

function renderEspecializacao() {
    const especializacao = currentClass.especializacao;
    if (!especializacao) return "";

    return `
        <section class="class-highlight-card">
            <span>Especialização</span>
            <h2>${especializacao.titulo}</h2>
            <p>${especializacao.descricao}</p>
        </section>
    `;
}

function renderAfinidades() {
    const afinidades = currentClass.afinidades;
    if (!afinidades) return "";

    return `
        <section class="class-affinities">
            <h2 class="section-title">Afinidade de Atributos</h2>
            <div class="class-affinity-grid">
                ${Object.entries(afinidades).map(([atributo, estrelas]) => `
                    <article class="class-affinity-card">
                        <strong>${atributo}</strong>
                        <span>${estrelas}</span>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
}

function renderPassivas() {
    if (!currentClass.passivas?.length) return "";

    return `
        <h2 class="section-title">Passiva da Classe</h2>
        ${currentClass.passivas.map((passiva) => `
            <article class="passive-card">
                <h3>${passiva.nome}</h3>
                <p>${passiva.descricao}</p>
            </article>
        `).join("")}
    `;
}

function renderTabelaProgressao() {
    if (!currentClass.tabelaProgressao?.length) return "";

    return `
        <section class="class-unlock-section">
            <h2 class="section-title">Progressão de Habilidades</h2>
            <div class="class-unlock-list">
                ${currentClass.tabelaProgressao.map(([nivel, desbloqueio]) => `
                    <div class="class-unlock-row">
                        <strong>Nível ${nivel}</strong>
                        <span>${desbloqueio}</span>
                    </div>
                `).join("")}
            </div>
            <p class="class-note">Os níveis que não aparecem na tabela não concedem uma nova habilidade de classe.</p>
        </section>
    `;
}

function renderProgressao() {
    if (!currentClass.progressao?.length) return "";

    return `
        <h2 class="section-title">Habilidades da Classe</h2>
        <div class="class-skill-grid">
            ${currentClass.progressao.map((skill) => `
                <article class="progress-card">
                    <span>${skill.nivel}</span>
                    <h3>${skill.nome}</h3>
                    <p>${skill.descricao}</p>
                </article>
            `).join("")}
        </div>
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
    if (!currentClass.caminhos?.length) return "";

    return `
        <section class="class-paths-section">
            <h2 class="section-title">Caminhos de ${currentClass.nome}</h2>
            <p class="class-paths-intro">No nível 50, a escolha de Caminho é definitiva. As habilidades originais da classe são preservadas.</p>

            <div class="class-paths-grid">
                ${currentClass.caminhos.map((caminho, index) => `
                    <article class="class-path-card">
                        <header>
                            <span>Caminho ${index + 1}</span>
                            <h3>${caminho.nome}</h3>
                            <div class="class-path-meta">
                                <strong>${caminho.especializacao}</strong>
                                <small>Complexidade: ${caminho.complexidade}</small>
                            </div>
                        </header>

                        <p>${caminho.descricao}</p>

                        <div class="class-path-passive">
                            <span>Passiva</span>
                            <h4>${caminho.passiva.nome}</h4>
                            <p>${caminho.passiva.descricao}</p>
                        </div>

                        <div class="class-path-skills">
                            ${caminho.habilidades.map((habilidade) => `
                                <article>
                                    <h4>${habilidade.nome}</h4>
                                    <p>${habilidade.descricao}</p>
                                </article>
                            `).join("")}
                        </div>
                    </article>
                `).join("")}
            </div>
        </section>
    `;
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
