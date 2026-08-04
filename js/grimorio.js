"use strict";

/*
=========================================================
GRIMÓRIO
MAIN CONTROLLER
=========================================================
*/

const categoryList =
document.getElementById("categoryList");

const termList =
document.getElementById("termList");

const termContent =
document.getElementById("termContent");

const searchInput =
document.getElementById("searchInput");

let currentCategory = null;

let currentTerm = null;

/*========================================*/

init();

/*========================================*/

function init(){

    createCategories();

    Wonderland.Particles.start();

}

/*========================================*/

function createCategories(){

    categoryList.innerHTML="";

    WONDERLAND_GRIMOIRE.categorias.forEach(cat=>{

        const button =
        Wonderland.Render.create(

            "div",

            "category-button"

        );

        button.dataset.id=cat.id;

        button.innerHTML=`

            <div class="category-icon">

                ${cat.icone}

            </div>

            <div>

                ${cat.nome}

            </div>

        `;

        button.onclick=()=>{

            loadCategory(cat.id);

        };

        categoryList.appendChild(

            button

        );

    });

}

/*========================================*/

function loadCategory(id){

    currentCategory=id;

    document

    .querySelectorAll(

        ".category-button"

    )

    .forEach(btn=>{

        btn.classList.remove(

            "active"

        );

        if(btn.dataset.id===id){

            btn.classList.add(

                "active"

            );

        }

    });

    renderTerms();

}

/*========================================*/

function renderTerms(){

    termList.innerHTML="";

    const termos=

    WONDERLAND_GRIMOIRE.termos

    .filter(t=>

        t.categoria===currentCategory

    );

    termos.forEach(termo=>{

        const div=

        Wonderland.Render.create(

            "div",

            "term-button"

        );

        div.innerHTML=`

            ✦ ${termo.nome}

        `;

        div.onclick=()=>{

            loadTerm(

                termo.id

            );

        };

        termList.appendChild(div);

    });

}

/*========================================*/

function loadTerm(id){

    currentTerm=

    WONDERLAND_GRIMOIRE

    .termos

    .find(

        t=>t.id===id

    );

    Grimorio.Render.render(

        currentTerm

    );

}