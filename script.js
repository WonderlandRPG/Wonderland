const enterButton = document.getElementById("enter");

enterButton.addEventListener("click", () => {

    document.body.classList.add("opening");

    setTimeout(() => {

        window.location.href = "menu.html";

    },1200);

});
const mobileMenuButton = document.getElementById("mobile-menu-button");
const headerMenu = document.getElementById("header-menu");

if (mobileMenuButton && headerMenu) {
    mobileMenuButton.addEventListener("click", () => {
        headerMenu.classList.toggle("open");
    });
}
/*==================================
        HISTÓRIA DINÂMICA
==================================*/

const eras = document.querySelectorAll(".era");
const bookContent = document.getElementById("bookContent");

async function carregarHistoria(arquivo){

    if(!bookContent) return;

    try{

        const resposta = await fetch("Historia/" + arquivo);

        const html = await resposta.text();

        bookContent.classList.remove("show");

        setTimeout(()=>{

            bookContent.innerHTML = html;

            bookContent.classList.add("show");

        },150);

    }

    catch{

        bookContent.innerHTML="<h2>Erro</h2><p>Não foi possível carregar esta era.</p>";

    }

}

eras.forEach(botao=>{

    botao.addEventListener("click",()=>{

        eras.forEach(e=>e.classList.remove("active"));

        botao.classList.add("active");

        carregarHistoria(botao.dataset.file);

    });

});

carregarHistoria("primeiro-sonho.html");