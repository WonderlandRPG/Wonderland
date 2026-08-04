"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const music = document.getElementById("bgMusic");
    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");
    const volumeSlider = document.getElementById("volumeSlider");
    const volumeValue = document.getElementById("volumeValue");

    const unavailableLinks = document.querySelectorAll(
        ".menu-link.unavailable"
    );

    if (!music) {
        console.error("O elemento de música não foi encontrado.");
        return;
    }

    const STORAGE_KEYS = {
        enabled: "wonderlandMusicEnabled",
        time: "wonderlandMusicTime",
        volume: "wonderlandMusicVolume"
    };

    const savedVolume = Number(localStorage.getItem(STORAGE_KEYS.volume));
    const initialVolume = Number.isFinite(savedVolume)
        ? Math.min(Math.max(savedVolume, 0), 1)
        : 0.25;

    music.volume = initialVolume;

    if (volumeSlider) {
        volumeSlider.value = String(Math.round(initialVolume * 100));
    }

    if (volumeValue) {
        volumeValue.textContent = `${Math.round(initialVolume * 100)}%`;
    }

    const savedTime = Number(localStorage.getItem(STORAGE_KEYS.time));

    function isMusicEnabled() {
        return localStorage.getItem(STORAGE_KEYS.enabled) !== "false";
    }

    function savePosition() {
        if (Number.isFinite(music.currentTime) && music.currentTime >= 0) {
            localStorage.setItem(STORAGE_KEYS.time, String(music.currentTime));
        }
    }

    function saveVolume(volume) {
        localStorage.setItem(STORAGE_KEYS.volume, String(volume));
    }

    function updateMusicButton() {
        if (!musicButton || !musicIcon) return;

        const paused = music.paused;
        musicButton.classList.toggle("paused", paused);
        musicButton.classList.toggle("playing", !paused);
        musicIcon.textContent = paused ? "♪" : "♫";

        const text = paused ? "Tocar música" : "Pausar música";
        musicButton.setAttribute("aria-label", text);
        musicButton.setAttribute("title", text);
    }

    function restorePosition() {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            Number.isFinite(music.duration) &&
            savedTime < music.duration
        ) {
            music.currentTime = savedTime;
        }
    }

    function playMusic() {
        localStorage.setItem(STORAGE_KEYS.enabled, "true");

        return music.play()
            .then(() => {
                updateMusicButton();
                removeAutoUnlock();
            })
            .catch((error) => {
                console.warn("O navegador bloqueou o início automático da música.", error);
                updateMusicButton();
            });
    }

    function tryAutoplay() {
        if (!isMusicEnabled() || !music.paused) return;
        playMusic();
    }

    function unlockMusic() {
        if (!isMusicEnabled() || !music.paused) {
            removeAutoUnlock();
            return;
        }

        playMusic();
    }

    function removeAutoUnlock() {
        document.removeEventListener("pointerdown", unlockMusic);
        document.removeEventListener("keydown", unlockMusic);
        document.removeEventListener("touchstart", unlockMusic);
    }

    music.addEventListener("loadedmetadata", () => {
        restorePosition();
        tryAutoplay();
    });

    if (music.readyState >= 1) {
        restorePosition();
        tryAutoplay();
    }

    document.addEventListener("pointerdown", unlockMusic);
    document.addEventListener("keydown", unlockMusic);
    document.addEventListener("touchstart", unlockMusic, { passive: true });

    music.addEventListener("play", () => {
        localStorage.setItem(STORAGE_KEYS.enabled, "true");
        updateMusicButton();
    });

    music.addEventListener("pause", updateMusicButton);
    music.addEventListener("timeupdate", savePosition);

    window.addEventListener("pagehide", savePosition);
    window.addEventListener("beforeunload", savePosition);

    if (musicButton) {
        musicButton.addEventListener("click", (event) => {
            event.stopPropagation();

            if (music.paused) {
                playMusic();
            } else {
                music.pause();
                localStorage.setItem(STORAGE_KEYS.enabled, "false");
                savePosition();
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            const volume = Math.min(
                Math.max(Number(volumeSlider.value) / 100, 0),
                1
            );

            music.volume = volume;
            saveVolume(volume);

            if (volumeValue) {
                volumeValue.textContent = `${Math.round(volume * 100)}%`;
            }

            if (volume === 0) {
                music.muted = true;
            } else {
                music.muted = false;
            }
        });
    }

    unavailableLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
        });
    });

    updateMusicButton();
});