const classesList = document.getElementById("classesList");
const classContent = document.getElementById("classContent");

let currentClass = null;

/* ===============================
   CRIA MENU LATERAL
=============================== */

function createSidebar() {

    classesList.innerHTML = "";

    Object.values(classes).forEach(classe => {

        const button = document.createElement("div");

        button.className = "class-button";
        button.dataset.id = classe.id;

        button.innerHTML = `
            <img
                class="class-icon"
                src="${classe.icone || classe.imagem}"
                alt="${classe.nome}"
            >

            <div class="class-info">

                <span class="class-name">
                    ${classe.nome}
                </span>

                <span class="class-role">
                    ${classe.cargo}
                </span>

            </div>
        `;

        button.addEventListener("click", () => {

            loadClass(classe.id);

        });

        classesList.appendChild(button);

    });

}

/* ===============================
   TROCAR CLASSE
=============================== */

function loadClass(id) {

    currentClass = classes[id];

    if (!currentClass) return;

    document
        .querySelectorAll(".class-button")
        .forEach(btn => {

            btn.classList.remove("active");

            if (btn.dataset.id === id) {

                btn.classList.add("active");

            }

        });

    renderClass();

}

/* ===============================
   RENDERIZA
=============================== */

function renderClass() {

    const c = currentClass;

    classContent.innerHTML = `

        <div class="class-header">

            <div class="class-image">

                <img
                    src="${c.imagem}"
                    alt="${c.nome}"
                >

            </div>

            <div>

                <h1 class="class-title">

                    ${c.nome}

                </h1>

                <div class="class-stars">

                    ${c.dificuldade}

                </div>

                <p class="class-description">

                    ${c.descricao}

                </p>

            </div>

        </div>

        <div class="info-grid">

            <div class="info-card">

                <h3>Função Principal</h3>

                <p>${c.estilo?.principal || ""}</p>

            </div>

            <div class="info-card">

                <h3>Função Secundária</h3>

                <p>${c.estilo?.secundaria || ""}</p>

            </div>

            <div class="info-card">

                <h3>Pontos Fortes</h3>

                <p>${c.estilo?.fortes || ""}</p>

            </div>

            <div class="info-card">

                <h3>Pontos Fracos</h3>

                <p>${c.estilo?.fracos || ""}</p>

            </div>

            <div class="info-card">

                <h3>Atributos Recomendados</h3>

                <p>${c.estilo?.atributos || ""}</p>

            </div>

            <div class="info-card">

                <h3>${c.recurso?.nome || "Recurso"}</h3>

                <p>${c.recurso?.descricao || ""}</p>

            </div>

        </div>

        ${renderPassivas()}

        ${renderProgressao()}

        ${renderCuriosidades()}

    `;

}

/* ===============================
   PASSIVAS
=============================== */

function renderPassivas() {

    if (!currentClass.passivas || !currentClass.passivas.length)
        return "";

    return `

        <h2 class="section-title">

            Traços da Classe

        </h2>

        ${currentClass.passivas.map(passiva => `

            <div class="passive-card">

                <h4>${passiva.nome}</h4>

                <p>${passiva.descricao}</p>

            </div>

        `).join("")}

    `;

}

/* ===============================
   PROGRESSÃO
=============================== */

function renderProgressao() {

    if (!currentClass.progressao || !currentClass.progressao.length)
        return "";

    return `

        <h2 class="section-title">

            Progressão

        </h2>

        ${currentClass.progressao.map(skill => `

            <div class="progress-card">

                <h3>${skill.nivel}</h3>

                <strong>${skill.nome}</strong>

                <br><br>

                <p>${skill.descricao}</p>

            </div>

        `).join("")}

    `;

}

/* ===============================
   CURIOSIDADES
=============================== */

function renderCuriosidades() {

    if (!currentClass.curiosidades || !currentClass.curiosidades.length)
        return "";

    return `

        <div class="curiosities">

            <h2 class="section-title">

                Curiosidades

            </h2>

            <ul>

                ${currentClass.curiosidades.map(item => `

                    <li>${item}</li>

                `).join("")}

            </ul>

        </div>

    `;

}

/* ===============================
   INÍCIO
=============================== */

createSidebar();

loadClass(Object.keys(classes)[0]);