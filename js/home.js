"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const enterButton = document.getElementById("enterButton");
    const backgroundMusic = document.getElementById("bgMusic");

    if (!enterButton) {
        console.error("O botão #enterButton não foi encontrado.");
        return;
    }

    enterButton.addEventListener("click", async () => {
        enterButton.disabled = true;

        if (backgroundMusic) {
            try {
                backgroundMusic.volume = 0.25;

                await backgroundMusic.play();

                localStorage.setItem(
                    "wonderlandMusicEnabled",
                    "true"
                );

                localStorage.setItem(
                    "wonderlandMusicTime",
                    String(backgroundMusic.currentTime)
                );
            } catch (error) {
                console.error(
                    "Não foi possível reproduzir a música:",
                    error
                );
            }
        }

        document.body.classList.add("fade-out");

        window.setTimeout(() => {
            window.location.href = "menu.html";
        }, 800);
    });
});