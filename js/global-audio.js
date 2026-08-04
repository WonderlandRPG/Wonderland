"use strict";

(() => {
    const STORAGE_KEYS = {
        enabled: "wonderlandMusicEnabled",
        time: "wonderlandMusicTime",
        volume: "wonderlandMusicVolume"
    };

    function clampVolume(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0.25;
        return Math.min(Math.max(numeric, 0), 1);
    }

    function syncAudioState() {
        const music = document.getElementById("bgMusic");
        if (!music) return;

        const savedVolume = clampVolume(
            localStorage.getItem(STORAGE_KEYS.volume)
        );

        music.volume = savedVolume;
        music.muted = savedVolume === 0;

        const savedTime = Number(
            localStorage.getItem(STORAGE_KEYS.time)
        );

        const restoreTime = () => {
            if (
                Number.isFinite(savedTime) &&
                savedTime > 0 &&
                Number.isFinite(music.duration) &&
                savedTime < music.duration
            ) {
                music.currentTime = savedTime;
            }
        };

        const saveState = () => {
            if (
                Number.isFinite(music.currentTime) &&
                music.currentTime >= 0
            ) {
                localStorage.setItem(
                    STORAGE_KEYS.time,
                    String(music.currentTime)
                );
            }

            localStorage.setItem(
                STORAGE_KEYS.volume,
                String(music.volume)
            );
        };

        music.addEventListener("loadedmetadata", restoreTime, { once: true });

        if (music.readyState >= 1) {
            restoreTime();
        }

        music.addEventListener("volumechange", () => {
            localStorage.setItem(
                STORAGE_KEYS.volume,
                String(music.volume)
            );
        });

        music.addEventListener("timeupdate", saveState);
        window.addEventListener("pagehide", saveState);
        window.addEventListener("beforeunload", saveState);

        const syncFromStorage = (event) => {
            if (event.key === STORAGE_KEYS.volume) {
                const nextVolume = clampVolume(event.newValue);
                music.volume = nextVolume;
                music.muted = nextVolume === 0;
            }
        };

        window.addEventListener("storage", syncFromStorage);

        const originalPlay = music.play.bind(music);
        music.play = (...args) => {
            const currentVolume = clampVolume(
                localStorage.getItem(STORAGE_KEYS.volume)
            );

            music.volume = currentVolume;
            music.muted = currentVolume === 0;

            return originalPlay(...args);
        };
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", syncAudioState, { once: true });
    } else {
        syncAudioState();
    }
})();
