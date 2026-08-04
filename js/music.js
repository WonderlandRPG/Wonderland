"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const backgroundMusic = document.getElementById("bgMusic");

    if (!backgroundMusic) {
        return;
    }

    const STORAGE_KEYS = {
        enabled: "wonderlandMusicEnabled",
        time: "wonderlandMusicTime",
        volume: "wonderlandMusicVolume"
    };

    const savedVolume = Number(
        localStorage.getItem(STORAGE_KEYS.volume)
    );

    const initialVolume = Number.isFinite(savedVolume)
        ? Math.min(Math.max(savedVolume, 0), 1)
        : 0.25;

    backgroundMusic.volume = initialVolume;
    backgroundMusic.muted = initialVolume === 0;

    const savedTime = Number(
        localStorage.getItem(STORAGE_KEYS.time)
    );

    const musicEnabled =
        localStorage.getItem(STORAGE_KEYS.enabled) !== "false";

    function restoreTime() {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            Number.isFinite(backgroundMusic.duration) &&
            savedTime < backgroundMusic.duration
        ) {
            backgroundMusic.currentTime = savedTime;
        }
    }

    function saveState() {
        if (
            Number.isFinite(backgroundMusic.currentTime) &&
            backgroundMusic.currentTime >= 0
        ) {
            localStorage.setItem(
                STORAGE_KEYS.time,
                String(backgroundMusic.currentTime)
            );
        }

        localStorage.setItem(
            STORAGE_KEYS.volume,
            String(backgroundMusic.volume)
        );
    }

    function tryPlay() {
        if (!musicEnabled || !backgroundMusic.paused) {
            return;
        }

        backgroundMusic.play().catch(() => {
            /* O navegador pode exigir uma interação do usuário. */
        });
    }

    backgroundMusic.addEventListener("loadedmetadata", () => {
        restoreTime();
        tryPlay();
    });

    if (backgroundMusic.readyState >= 1) {
        restoreTime();
        tryPlay();
    }

    backgroundMusic.addEventListener("play", () => {
        localStorage.setItem(STORAGE_KEYS.enabled, "true");
    });

    backgroundMusic.addEventListener("pause", () => {
        localStorage.setItem(STORAGE_KEYS.enabled, "false");
        saveState();
    });

    backgroundMusic.addEventListener("volumechange", () => {
        localStorage.setItem(
            STORAGE_KEYS.volume,
            String(backgroundMusic.volume)
        );
    });

    backgroundMusic.addEventListener("timeupdate", saveState);

    window.addEventListener("pagehide", saveState);
    window.addEventListener("beforeunload", saveState);
});