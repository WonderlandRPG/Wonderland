"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const eraButtons = document.querySelectorAll(".era-button");
    const bookContent = document.getElementById("bookContent");

    const music = document.getElementById("bgMusic");
    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");

    let currentRequest = 0;

    /*====================================
                HISTÓRIA
    ====================================*/

    async function loadHistory(fileName) {
        if (!bookContent) {
            return;
        }

        const requestId = ++currentRequest;

        bookContent.classList.add("changing");

        await new Promise((resolve) => {
            window.setTimeout(resolve, 220);
        });

        try {
            const response = await fetch(
                `Historia/${fileName}`,
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Erro ${response.status}: arquivo não encontrado.`
                );
            }

            const html = await response.text();

            if (requestId !== currentRequest) {
                return;
            }

            bookContent.innerHTML = html;
        } catch (error) {
            console.error(error);

            bookContent.innerHTML = `
                <div class="history-error">
                    <h2>Registro indisponível</h2>

                    <p>
                        Não foi possível carregar esta parte da história.
                    </p>
                </div>
            `;
        }

        window.requestAnimationFrame(() => {
            bookContent.classList.remove("changing");
        });
    }

    eraButtons.forEach((button) => {
        button.addEventListener("click", () => {
            eraButtons.forEach((item) => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            loadHistory(button.dataset.file);
        });
    });

    loadHistory("primeiro-sonho.html");

    /*====================================
                 MÚSICA
    ====================================*/

    if (!music) {
        return;
    }

    music.volume = 0.25;

    const savedTime = Number(
        localStorage.getItem("wonderlandMusicTime")
    );

    function musicIsEnabled() {
        return (
            localStorage.getItem("wonderlandMusicEnabled") === "true"
        );
    }

    function saveMusicTime() {
        if (
            Number.isFinite(music.currentTime) &&
            music.currentTime >= 0
        ) {
            localStorage.setItem(
                "wonderlandMusicTime",
                String(music.currentTime)
            );
        }
    }

    function updateMusicButton() {
        if (!musicButton || !musicIcon) {
            return;
        }

        const paused = music.paused;

        musicButton.classList.toggle(
            "paused",
            paused
        );

        musicIcon.textContent =
            paused ? "♪" : "♫";

        const label =
            paused
                ? "Tocar música"
                : "Pausar música";

        musicButton.setAttribute(
            "aria-label",
            label
        );

        musicButton.setAttribute(
            "title",
            label
        );
    }

    function tryToPlayMusic() {
        if (
            !musicIsEnabled() ||
            !music.paused
        ) {
            return;
        }

        music.play()
            .then(() => {
                updateMusicButton();
                removeUnlockListeners();
            })
            .catch(() => {
                /*
                 * O navegador poderá exigir
                 * uma interação nesta página.
                 */
            });
    }

    function unlockMusic() {
        if (
            !musicIsEnabled() ||
            !music.paused
        ) {
            removeUnlockListeners();
            return;
        }

        music.play()
            .then(() => {
                updateMusicButton();
                removeUnlockListeners();
            })
            .catch((error) => {
                console.warn(
                    "A música ainda foi bloqueada.",
                    error
                );
            });
    }

    function removeUnlockListeners() {
        document.removeEventListener(
            "pointerdown",
            unlockMusic
        );

        document.removeEventListener(
            "keydown",
            unlockMusic
        );

        document.removeEventListener(
            "touchstart",
            unlockMusic
        );
    }

    music.addEventListener("loadedmetadata", () => {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            savedTime < music.duration
        ) {
            music.currentTime = savedTime;
        }

        tryToPlayMusic();
    });

    if (music.readyState >= 1) {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            savedTime < music.duration
        ) {
            music.currentTime = savedTime;
        }

        tryToPlayMusic();
    }

    document.addEventListener(
        "pointerdown",
        unlockMusic
    );

    document.addEventListener(
        "touchstart",
        unlockMusic,
        {
            passive: true
        }
    );

    document.addEventListener(
        "keydown",
        unlockMusic
    );

    music.addEventListener(
        "play",
        () => {
            localStorage.setItem(
                "wonderlandMusicEnabled",
                "true"
            );

            updateMusicButton();
        }
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
        "pagehide",
        saveMusicTime
    );

    window.addEventListener(
        "beforeunload",
        saveMusicTime
    );

    if (musicButton) {
        musicButton.addEventListener(
            "click",
            (event) => {
                event.stopPropagation();

                if (music.paused) {
                    localStorage.setItem(
                        "wonderlandMusicEnabled",
                        "true"
                    );

                    music.play()
                        .catch((error) => {
                            console.error(
                                "Não foi possível tocar a música.",
                                error
                            );
                        });
                } else {
                    music.pause();

                    localStorage.setItem(
                        "wonderlandMusicEnabled",
                        "false"
                    );

                    saveMusicTime();
                }
            }
        );
    }

    updateMusicButton();
});