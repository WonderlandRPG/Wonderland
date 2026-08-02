/*
=========================================
        HOME.JS
=========================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const enterButton = document.getElementById("enterButton");

    if (!enterButton) return;

    enterButton.addEventListener("click", () => {

        document.body.classList.add("fade-out");

        setTimeout(() => {

            window.location.href = "menu.html";

        }, 800);

    });

});