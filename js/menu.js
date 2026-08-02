"use strict";

const music = document.getElementById("bgMusic");
const musicButton = document.getElementById("musicButton");
const musicIcon = document.getElementById("musicIcon");
const unavailableLinks = document.querySelectorAll(
    ".menu-link.unavailable"
);

function saveMusicTime() {
    if (!music) {
        return;
    }

    localStorage.setItem(
        "wonderlandMusicTime",
        String(music.currentTime)
    );
}

function updateMusicButton() {
    if (!music || !musicButton || !musicIcon) {
        return;
    }

    const isPaused = music.paused;

    musicButton.classList.toggle("paused", isPaused);

    musicIcon.textContent = isPaused ? "♪" : "♫";

    musicButton.setAttribute(
        "aria-label",
        isPaused ? "Tocar música" : "Pausar música"
    );

    musicButton.setAttribute(
        "title",
        isPaused ? "Tocar música" : "Pausar música"
    );
}

if (music) {
    music.volume = 0.25;

    const savedTime = Number(
        localStorage.getItem("wonderlandMusicTime")
    );

    music.addEventListener("loadedmetadata", () => {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            savedTime < music.duration
        ) {
            music.currentTime = savedTime;
        }

        const musicEnabled =
            localStorage.getItem("wonderlandMusicEnabled") === "true";

        if (musicEnabled) {
            music
                .play()
                .catch((error) => {
                    console.warn(
                        "O navegador bloqueou a reprodução automática.",
                        error
                    );

                    updateMusicButton();
                });
        }
    });

    music.addEventListener(
        "play",
        updateMusicButton
    );

    music.addEventListener(
        "pause",
        updateMusicButton
    );

    music.addEventListener(
        "timeupdate",
        saveMusicTime
    );

    window.addEventListener(
        "beforeunload",
        saveMusicTime
    );
}

if (musicButton && music) {
    musicButton.addEventListener("click", () => {
        if (music.paused) {
            music
                .play()
                .then(() => {
                    localStorage.setItem(
                        "wonderlandMusicEnabled",
                        "true"
                    );
                })
                .catch((error) => {
                    console.error(
                        "Não foi possível iniciar a música.",
                        error
                    );
                });
        } else {
            music.pause();

            localStorage.setItem(
                "wonderlandMusicEnabled",
                "false"
            );
        }
    });
}

unavailableLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
        event.preventDefault();
    });
});

updateMusicButton();