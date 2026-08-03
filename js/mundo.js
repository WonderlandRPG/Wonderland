"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const regionMarkers = document.querySelectorAll(".region-marker");

    const regionTitle = document.getElementById("regionTitle");
    const regionDescription = document.getElementById(
        "regionDescription"
    );
    const regionTerrain = document.getElementById("regionTerrain");
    const regionDanger = document.getElementById("regionDanger");
    const regionKnownFor = document.getElementById(
        "regionKnownFor"
    );
    const regionQuote = document.getElementById("regionQuote");

    const exploreButton = document.getElementById("exploreButton");
    const exploreMessage = document.getElementById(
        "exploreMessage"
    );

    const music = document.getElementById("bgMusic");
    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");

    let selectedRegion = "centro";

    const regions = {
        norte: {
            title: "Terras do Norte",

            description:
                "Uma região de montanhas, florestas frias e antigas fortalezas. Seus habitantes aprenderam a sobreviver entre nevascas, feras e ruínas esquecidas.",

            terrain:
                "Montanhas, florestas e vales congelados",

            danger:
                "Alto",

            knownFor:
                "Fortalezas, minérios e criaturas ancestrais",

            quote:
                "“O frio preserva aquilo que o mundo desejou esquecer.”"
        },

        leste: {
            title: "Domínios do Leste",

            description:
                "Terras cobertas por florestas profundas e caminhos antigos. Dizem que espíritos e criaturas mágicas ainda protegem seus territórios.",

            terrain:
                "Florestas, rios e montanhas antigas",

            danger:
                "Moderado",

            knownFor:
                "Magia natural, espíritos e povos antigos",

            quote:
                "“Toda árvore guarda uma lembrança.”"
        },

        centro: {
            title: "Reinos Centrais",

            description:
                "O coração político e comercial de Wonderland. Suas grandes cidades foram erguidas sobre ruínas pertencentes a civilizações esquecidas.",

            terrain:
                "Planícies, rios e grandes cidades",

            danger:
                "Moderado",

            knownFor:
                "Reinos, comércio e academias",

            quote:
                "“Onde muitas coroas disputam o mesmo horizonte.”"
        },

        oeste: {
            title: "Terras do Oeste",

            description:
                "Uma região de penhascos, campos abertos e cidades fortificadas. Suas estradas são percorridas por mercadores, cavaleiros e aventureiros.",

            terrain:
                "Campos, penhascos e costa rochosa",

            danger:
                "Moderado",

            knownFor:
                "Cavalaria, comércio marítimo e fortalezas",

            quote:
                "“O sol se põe sobre muralhas que nunca dormem.”"
        },

        sul: {
            title: "Fronteiras do Sul",

            description:
                "Terras quentes e perigosas, marcadas por desertos, cânions e ruínas soterradas. Muitas expedições desapareceram em suas areias.",

            terrain:
                "Desertos, cânions e planícies secas",

            danger:
                "Muito alto",

            knownFor:
                "Ruínas, relíquias e tempestades de areia",

            quote:
                "“A areia esconde impérios inteiros.”"
        },

        ilhas: {
            title: "Ilhas Distantes",

            description:
                "Um conjunto de ilhas cercado por mares instáveis. Algumas aparecem e desaparecem conforme as Fraturas alteram a realidade.",

            terrain:
                "Ilhas, praias, falésias e mares profundos",

            danger:
                "Desconhecido",

            knownFor:
                "Navegadores, monstros marinhos e Fraturas",

            quote:
                "“Nem toda ilha permanece no mesmo lugar.”"
        }
    };

    function updateRegion(regionId) {
        const region = regions[regionId];

        if (!region) {
            return;
        }

        selectedRegion = regionId;

        regionTitle.textContent = region.title;
        regionDescription.textContent = region.description;
        regionTerrain.textContent = region.terrain;
        regionDanger.textContent = region.danger;
        regionKnownFor.textContent = region.knownFor;
        regionQuote.textContent = region.quote;

        exploreMessage.textContent = "";

        regionMarkers.forEach((marker) => {
            marker.classList.toggle(
                "active",
                marker.dataset.region === regionId
            );
        });
    }

    regionMarkers.forEach((marker) => {
        marker.addEventListener("click", () => {
            updateRegion(marker.dataset.region);
        });
    });

    if (exploreButton) {
        exploreButton.addEventListener("click", () => {
            const region = regions[selectedRegion];

            exploreMessage.textContent =
                `${region.title} será detalhada em uma próxima atualização.`;
        });
    }

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

        musicButton.classList.toggle("paused", paused);

        musicIcon.textContent = paused ? "♪" : "♫";

        const label = paused
            ? "Tocar música"
            : "Pausar música";

        musicButton.setAttribute("aria-label", label);
        musicButton.setAttribute("title", label);
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
                 * O navegador pode exigir
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

    music.addEventListener("play", () => {
        localStorage.setItem(
            "wonderlandMusicEnabled",
            "true"
        );

        updateMusicButton();
    });

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