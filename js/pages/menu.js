"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const music = document.getElementById("bgMusic");
    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");

    const unavailableLinks = document.querySelectorAll(
        ".menu-link.unavailable"
    );

    if (!music) {
        console.error("O elemento de música não foi encontrado.");
        return;
    }

    music.volume = 0.25;

    const savedTime = Number(
        localStorage.getItem("wonderlandMusicTime")
    );

    const musicEnabled =
        localStorage.getItem("wonderlandMusicEnabled") === "true";

    function salvarPosicao() {
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

    function atualizarBotao() {
        if (!musicButton || !musicIcon) {
            return;
        }

        const pausada = music.paused;

        musicButton.classList.toggle("paused", pausada);

        musicIcon.textContent = pausada ? "♪" : "♫";

        const texto = pausada
            ? "Tocar música"
            : "Pausar música";

        musicButton.setAttribute("aria-label", texto);
        musicButton.setAttribute("title", texto);
    }

    function tentarTocarMusica() {
        if (!musicEnabled || !music.paused) {
            return;
        }

        music.play()
            .then(() => {
                atualizarBotao();
                removerDesbloqueioAutomatico();
            })
            .catch(() => {
                /*
                 * O navegador ainda bloqueou o áudio.
                 * A música será iniciada na primeira interação.
                 */
            });
    }

    function desbloquearMusica() {
        if (!musicEnabled || !music.paused) {
            removerDesbloqueioAutomatico();
            return;
        }

        music.play()
            .then(() => {
                atualizarBotao();
                removerDesbloqueioAutomatico();
            })
            .catch((error) => {
                console.warn(
                    "A música ainda não pôde ser iniciada.",
                    error
                );
            });
    }

    function removerDesbloqueioAutomatico() {
        document.removeEventListener(
            "pointerdown",
            desbloquearMusica
        );

        document.removeEventListener(
            "keydown",
            desbloquearMusica
        );

        document.removeEventListener(
            "touchstart",
            desbloquearMusica
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

        tentarTocarMusica();
    });

    /*
     * Caso os dados do áudio já tenham sido carregados
     * antes de o evento acima ser registrado.
     */
    if (music.readyState >= 1) {
        if (
            Number.isFinite(savedTime) &&
            savedTime > 0 &&
            savedTime < music.duration
        ) {
            music.currentTime = savedTime;
        }

        tentarTocarMusica();
    }

    /*
     * Se o navegador bloquear o autoplay, qualquer clique,
     * toque ou tecla fará a música continuar automaticamente.
     */
    document.addEventListener(
        "pointerdown",
        desbloquearMusica
    );

    document.addEventListener(
        "touchstart",
        desbloquearMusica,
        { passive: true }
    );

    document.addEventListener(
        "keydown",
        desbloquearMusica
    );

    music.addEventListener("play", () => {
        localStorage.setItem(
            "wonderlandMusicEnabled",
            "true"
        );

        atualizarBotao();
    });

    music.addEventListener("pause", atualizarBotao);

    music.addEventListener("timeupdate", salvarPosicao);

    window.addEventListener("pagehide", salvarPosicao);
    window.addEventListener("beforeunload", salvarPosicao);

    if (musicButton) {
        musicButton.addEventListener("click", (event) => {
            event.stopPropagation();

            if (music.paused) {
                localStorage.setItem(
                    "wonderlandMusicEnabled",
                    "true"
                );

                music.play()
                    .then(atualizarBotao)
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

                salvarPosicao();
            }
        });
    }

    unavailableLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
        });
    });

    atualizarBotao();
});