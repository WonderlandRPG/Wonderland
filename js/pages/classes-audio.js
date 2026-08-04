"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const music = document.getElementById("bgMusic");
    const button = document.getElementById("musicButton");
    const icon = document.getElementById("musicIcon");
    if (!music || !button || !icon) return;

    const TIME_KEY = "wonderlandClassesMusicTime";
    const ENABLED_KEY = "wonderlandClassesMusicEnabled";
    const VOLUME_KEY = "wonderlandMusicVolume";

    const savedVolume = Number.parseFloat(localStorage.getItem(VOLUME_KEY));
    music.volume = Number.isFinite(savedVolume) ? Math.min(Math.max(savedVolume, 0), 1) : 0.25;

    const savedTime = Number.parseFloat(sessionStorage.getItem(TIME_KEY));
    if (Number.isFinite(savedTime) && savedTime >= 0) {
        music.addEventListener("loadedmetadata", () => {
            if (savedTime < music.duration) music.currentTime = savedTime;
        }, { once: true });
    }

    const setVisualState = () => {
        const playing = !music.paused;
        button.classList.toggle("paused", !playing);
        button.setAttribute("aria-label", playing ? "Pausar música das Classes" : "Tocar música das Classes");
        button.title = playing ? "Pausar música das Classes" : "Tocar música das Classes";
        icon.textContent = playing ? "♫" : "♪";
    };

    const startMusic = async () => {
        try {
            await music.play();
            localStorage.setItem(ENABLED_KEY, "true");
        } catch {
            localStorage.setItem(ENABLED_KEY, "false");
        }
        setVisualState();
    };

    button.addEventListener("click", async () => {
        if (music.paused) await startMusic();
        else {
            music.pause();
            localStorage.setItem(ENABLED_KEY, "false");
            setVisualState();
        }
    });

    music.addEventListener("timeupdate", () => {
        sessionStorage.setItem(TIME_KEY, String(music.currentTime));
    });

    music.addEventListener("play", setVisualState);
    music.addEventListener("pause", setVisualState);

    if (localStorage.getItem(ENABLED_KEY) !== "false") startMusic();
    else setVisualState();
});
