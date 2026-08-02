//==============================
// TELA INICIAL
//==============================

const enterButton = document.getElementById("enter");

if (enterButton) {

    enterButton.addEventListener("click", () => {

        document.body.classList.add("opening");

        setTimeout(() => {

            window.location.href = "menu.html";

        }, 1200);

    });

}

//==============================
// MENU MOBILE
//==============================

const mobileMenuButton = document.getElementById("mobile-menu-button");
const headerMenu = document.getElementById("header-menu");

if (mobileMenuButton && headerMenu) {

    mobileMenuButton.addEventListener("click", () => {

        headerMenu.classList.toggle("open");

    });

}

//==============================
// HISTÓRIA
//==============================

const eras = document.querySelectorAll(".era");
const bookContent = document.getElementById("bookContent");

if (eras.length > 0 && bookContent) {

    async function carregarHistoria(arquivo) {

        try {

            const resposta = await fetch("Historia/" + arquivo);

            if (!resposta.ok) {

                throw new Error("Arquivo não encontrado");

            }

            const html = await resposta.text();

            bookContent.innerHTML = html;

        }

        catch (erro) {

            console.error(erro);

            bookContent.innerHTML = `
                <h2>Erro</h2>
                <p>Não foi possível carregar esta era.</p>
            `;

        }

    }

    eras.forEach(botao => {

        botao.addEventListener("click", () => {

            eras.forEach(e => e.classList.remove("active"));

            botao.classList.add("active");

            carregarHistoria(botao.dataset.file);

        });

    });

    carregarHistoria("primeiro-sonho.html");

}