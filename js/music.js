"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const backgroundMusic = document.getElementById("bgMusic");

    if (!backgroundMusic) {
        return;
    }

    backgroundMusic.volume = 0.25;

    const savedTime = Number(
        localStorage.getItem("wonderlandMusicTime")
    );

    const musicEnabled =
        localStorage.getItem("wonderlandMusicEnabled") === "true";

    backgroundMusic.addEventListener("loadedmetadata", () => {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            savedTime < backgroundMusic.duration
        ) {
            backgroundMusic.currentTime = savedTime;
        }
    });

    if (musicEnabled) {
        backgroundMusic.play().catch(() => {
            /*
             * Alguns navegadores bloqueiam o áudio até o
             * usuário clicar na página.
             */
        });
    }

    backgroundMusic.addEventListener("timeupdate", () => {
        localStorage.setItem(
            "wonderlandMusicTime",
            String(backgroundMusic.currentTime)
        );
    });

    window.addEventListener("beforeunload", () => {
        localStorage.setItem(
            "wonderlandMusicTime",
            String(backgroundMusic.currentTime)
        );
    });
});