"use strict";

document.addEventListener("DOMContentLoaded", () => {
    /*==================================================
                    ELEMENTOS DA PÁGINA
    ==================================================*/

    const regionMarkers = document.querySelectorAll(".region-marker");

    const regionPanel = document.getElementById("regionPanel");
    const regionType = document.getElementById("regionType");
    const regionTitle = document.getElementById("regionTitle");
    const regionCapital = document.getElementById("regionCapital");
    const regionLocation = document.getElementById("regionLocation");
    const regionDescription = document.getElementById(
        "regionDescription"
    );
    const regionCharacteristics = document.getElementById(
        "regionCharacteristics"
    );
    const regionGovernment = document.getElementById(
        "regionGovernment"
    );
    const regionGovernmentDescription = document.getElementById(
        "regionGovernmentDescription"
    );

    const exploreButton = document.getElementById("exploreButton");
    const exploreMessage = document.getElementById(
        "exploreMessage"
    );

    const worldMapObject = document.getElementById("worldMapObject");

    const music = document.getElementById("bgMusic");
    const musicButton = document.getElementById("musicButton");
    const musicIcon = document.getElementById("musicIcon");

    let selectedRegion = "aurelia";
    let svgDocument = null;

    /*==================================================
                    DADOS DO MAPA
    ==================================================*/

    const regions = {
        aurelia: {
            type: "Reino selecionado",
            title: "Reino de Aurelia",
            capital: "Solaris",
            location: "Centro",

            description:
                "Aurelia é o coração político e comercial de Wonderland. Todas as grandes estradas passam por seu território. É o reino mais populoso e abriga o maior mercado do continente. Nobres, comerciantes, aventureiros e embaixadores convivem diariamente em sua capital. É considerado o reino mais estável, mas também o mais envolvido em intrigas políticas.",

            characteristics: [
                "Grandes planícies",
                "Fazendas",
                "Castelos",
                "Cidades fortificadas",
                "Guildas influentes",
                "Centro da diplomacia"
            ],

            government:
                "Monarquia Hereditária",

            governmentDescription:
                "Aurelia é governada pela Casa Solaris, uma linhagem que governa há séculos. O rei possui grande autoridade, mas precisa lidar constantemente com as Casas Nobres, que controlam exércitos, terras e riquezas. O maior perigo para Aurelia não vem de fora, mas das conspirações dentro da própria corte.",

            exploreMessage:
                "Você observa as grandes estradas de Aurelia convergindo em direção à capital Solaris."
        },

        vinterhold: {
            type: "Reino selecionado",
            title: "Reino de Vinterhold",
            capital: "Skallheim",
            location: "Norte",

            description:
                "Vinterhold é um reino forjado pelo gelo. O inverno dura quase o ano inteiro, e apenas os mais fortes sobrevivem. Seus habitantes valorizam honra, coragem e tradição. As montanhas escondem antigas fortalezas e minas de metais raros.",

            characteristics: [
                "Neve permanente",
                "Fiordes",
                "Montanhas",
                "Lobos gigantes",
                "Fortalezas antigas",
                "Guerreiros renomados"
            ],

            government:
                "Monarquia Eletiva",

            governmentDescription:
                "Cada grande clã possui um líder. Quando o rei morre, os chefes dos clãs se reúnem no Grande Salão de Skallheim para escolher o novo soberano. Isso faz com que as sucessões sejam marcadas por alianças, disputas e antigas rivalidades.",

            exploreMessage:
                "Os ventos de Vinterhold carregam o som distante dos chifres de guerra de Skallheim."
        },

        eldoria: {
            type: "Reino selecionado",
            title: "Reino de Eldoria",
            capital: "Sylvandor",
            location: "Leste",

            description:
                "Eldoria é conhecida como o Reino das Florestas Eternas. Suas cidades convivem em harmonia com a natureza. A magia é estudada há séculos, e muitos estudiosos viajam para aprender em suas bibliotecas. As árvores gigantes escondem ruínas muito mais antigas que o próprio reino.",

            characteristics: [
                "Florestas imensas",
                "Grandes rios",
                "Animais sagrados",
                "Magia natural",
                "Bibliotecas",
                "Jardins ancestrais"
            ],

            government:
                "Conselho Real",

            governmentDescription:
                "Eldoria não possui um único rei absoluto. O reino é administrado por um conselho formado por representantes das maiores cidades e guardiões das florestas. As decisões são lentas, porém cuidadosamente debatidas.",

            exploreMessage:
                "Entre as árvores de Eldoria, antigas luzes mágicas parecem observar seus passos."
        },

        valdor: {
            type: "Reino selecionado",
            title: "Reino de Valdor",
            capital: "Porto Coroa",
            location: "Oeste",

            description:
                "Valdor domina os mares. Sua riqueza vem do comércio naval, da pesca e das rotas marítimas. Também é conhecido por seus corsários, que atuam tanto como defensores quanto como piratas autorizados pela Coroa.",

            characteristics: [
                "Penhascos",
                "Arquipélagos",
                "Grandes portos",
                "Faróis",
                "Mercado marítimo",
                "Navegadores experientes"
            ],

            government:
                "Monarquia Comercial",

            governmentDescription:
                "A família real governa, mas depende fortemente das grandes Companhias Marítimas. Quem controla o comércio controla parte da política. Capitães de navio podem se tornar nobres apenas por enriquecerem o reino.",

            exploreMessage:
                "Os portos de Valdor estão repletos de navios mercantes, corsários e viajantes estrangeiros."
        },

        ashkara: {
            type: "Reino selecionado",
            title: "Reino de Ashkara",
            capital: "Kar-Atar",
            location: "Sul",

            description:
                "Ashkara é uma terra marcada pelo calor extremo. Desertos, cânions e vulcões fazem parte da paisagem. Apesar da aparência hostil, o reino possui cidades ricas construídas ao redor de oásis e minas de cristais raros. Os melhores ferreiros do continente vivem aqui.",

            characteristics: [
                "Desertos",
                "Vulcões",
                "Oásis",
                "Minas",
                "Forjas lendárias",
                "Ruínas soterradas"
            ],

            government:
                "Monarquia Militar",

            governmentDescription:
                "O governante precisa provar sua força para manter o trono. Embora a sucessão seja hereditária, um herdeiro considerado incapaz pode ser desafiado por outro membro da família real. Isso cria uma tradição de governantes experientes, mas também um histórico de conflitos internos.",

            exploreMessage:
                "O calor das forjas de Kar-Atar pode ser sentido mesmo antes de alcançar as muralhas da capital."
        },

        elysium: {
            type: "Cidade Livre selecionada",
            title: "Cidade Livre de Elysium",
            capital: "A própria cidade",
            location: "Entre Aurelia e Valdor",

            description:
                "Nenhum reino governa Elysium. Ela é administrada por um Conselho Mercantil formado pelas maiores guildas do continente. Ali, qualquer pessoa pode viver, desde que respeite as leis da cidade. É considerada o lugar mais cosmopolita de Wonderland.",

            characteristics: [
                "Centro financeiro",
                "Guildas",
                "Arena",
                "Mercado internacional",
                "Banco Continental",
                "Academia dos Aventureiros"
            ],

            government:
                "Conselho Mercantil",

            governmentDescription:
                "Nenhum rei governa Elysium. As maiores guildas elegem representantes para um Conselho que administra a cidade. O ouro vale mais do que títulos de nobreza, e qualquer pessoa pode alcançar poder por meio do comércio, da influência ou da fama.",

            exploreMessage:
                "Nas ruas de Elysium, mercadores, aventureiros e representantes de todos os reinos negociam lado a lado."
        },

        "terras-selvagens": {
            type: "Território neutro selecionado",
            title: "Terras Selvagens",
            capital: "Não possui",
            location: "Além das fronteiras dos cinco reinos",

            description:
                "Além dos cinco reinos existem regiões sem governo. Nessas terras, a autoridade das coroas desaparece e a sobrevivência depende da força, da experiência e da sorte de cada viajante.",

            characteristics: [
                "Regiões sem governo",
                "Criaturas selvagens",
                "Povoados isolados",
                "Rotas perigosas",
                "Exploradores",
                "Territórios desconhecidos"
            ],

            government:
                "Nenhuma forma de governo",

            governmentDescription:
                "As Terras Selvagens não reconhecem reis, conselhos ou fronteiras oficiais. Pequenas comunidades podem criar suas próprias leis, mas nenhuma autoridade controla toda a região.",

            exploreMessage:
                "Nas Terras Selvagens, não existem estradas seguras nem autoridades para responder aos pedidos de ajuda."
        },

        "floresta-antiga": {
            type: "Território neutro selecionado",
            title: "A Floresta Antiga",
            capital: "Não possui",
            location: "Terras neutras",

            description:
                "Uma floresta que existia antes mesmo da Era do Primeiro Sonho. Suas árvores são consideradas mais antigas que os reinos e algumas parecem guardar lembranças de eras esquecidas.",

            characteristics: [
                "Árvores ancestrais",
                "Trilhas mutáveis",
                "Animais incomuns",
                "Ruínas cobertas",
                "Magia antiga",
                "Locais inexplorados"
            ],

            government:
                "Nenhuma forma de governo",

            governmentDescription:
                "A Floresta Antiga não pertence a nenhum reino. Alguns acreditam que seus próprios habitantes e espíritos decidem quem pode atravessar seus caminhos.",

            exploreMessage:
                "Os caminhos da Floresta Antiga parecem mudar quando ninguém está olhando."
        },

        fraturas: {
            type: "Território neutro selecionado",
            title: "As Fraturas",
            capital: "Não possui",
            location: "Regiões instáveis de Wonderland",

            description:
                "As Fraturas são locais onde a realidade é instável e criaturas desconhecidas surgem sem aviso. O espaço, o tempo e a própria magia podem se comportar de maneira imprevisível em seu interior.",

            characteristics: [
                "Realidade instável",
                "Criaturas desconhecidas",
                "Magia imprevisível",
                "Rasgos dimensionais",
                "Desaparecimentos",
                "Fenômenos inexplicáveis"
            ],

            government:
                "Nenhuma forma de governo",

            governmentDescription:
                "Nenhum reino conseguiu ocupar ou controlar permanentemente uma Fratura. Expedições são organizadas por guildas, estudiosos e aventureiros, mas poucas retornam sem perdas.",

            exploreMessage:
                "Ao se aproximar de uma Fratura, o ar parece vibrar e as distâncias deixam de fazer sentido."
        },

        "cordilheira-colossos": {
            type: "Território neutro selecionado",
            title: "Cordilheira dos Colossos",
            capital: "Não possui",
            location: "Grande cadeia montanhosa",

            description:
                "A maior cadeia de montanhas de Wonderland é considerada por muitos o túmulo dos antigos Colossos. Seus picos atravessam as nuvens e suas cavernas permanecem quase totalmente inexploradas.",

            characteristics: [
                "Picos gigantescos",
                "Cavernas profundas",
                "Ruínas colossais",
                "Passagens perigosas",
                "Nevascas",
                "Criaturas montanhosas"
            ],

            government:
                "Nenhuma forma de governo",

            governmentDescription:
                "Nenhum reino controla toda a Cordilheira. Fortalezas e postos de mineração existem em suas extremidades, mas as regiões mais altas permanecem livres de qualquer domínio.",

            exploreMessage:
                "Entre os picos, estruturas gigantescas sugerem que os Colossos realmente caminharam por aquelas montanhas."
        },

        "mar-nevoa": {
            type: "Território neutro selecionado",
            title: "Mar da Névoa",
            capital: "Não possui",
            location: "Oceano além das rotas conhecidas",

            description:
                "Um oceano envolto por névoas permanentes. Poucos navios retornam após cruzá-lo, e os relatos dos sobreviventes quase sempre contradizem uns aos outros.",

            characteristics: [
                "Névoa permanente",
                "Correntes imprevisíveis",
                "Navios desaparecidos",
                "Criaturas marinhas",
                "Ilhas desconhecidas",
                "Rotas instáveis"
            ],

            government:
                "Nenhuma forma de governo",

            governmentDescription:
                "Nenhuma coroa reivindica domínio verdadeiro sobre o Mar da Névoa. Valdor patrulha parte de suas águas, mas mesmo seus navegadores evitam atravessar as regiões mais densas.",

            exploreMessage:
                "A névoa cobre o horizonte e apaga lentamente qualquer referência de direção."
        },

        "ruinas-asterion": {
            type: "Território neutro selecionado",
            title: "Ruínas de Asterion",
            capital: "Asterion, antiga capital em ruínas",
            location: "Terras neutras",

            description:
                "As Ruínas de Asterion são os restos de um império desaparecido durante a Era das Cinzas. Dizem que seus salões ainda escondem artefatos de valor incalculável.",

            characteristics: [
                "Palácios destruídos",
                "Salões subterrâneos",
                "Artefatos perdidos",
                "Armadilhas antigas",
                "Arquivos esquecidos",
                "Expedições desaparecidas"
            ],

            government:
                "Império extinto",

            governmentDescription:
                "Asterion já foi o centro de um poderoso império. Atualmente, nenhuma autoridade governa as ruínas, embora estudiosos, saqueadores e guildas disputem o direito de explorá-las.",

            exploreMessage:
                "Símbolos apagados nas paredes de Asterion parecem esconder registros de uma civilização perdida."
        }
    };

    /*==================================================
                    ATUALIZAÇÃO DO PAINEL
    ==================================================*/

    function updateRegion(regionId) {
        const region = regions[regionId];

        if (!region) {
            console.warn(
                `A região "${regionId}" não foi encontrada.`
            );

            return;
        }

        selectedRegion = regionId;

        if (regionPanel) {
            regionPanel.classList.remove("updating");

            void regionPanel.offsetWidth;

            regionPanel.classList.add("updating");
        }

        regionType.textContent = region.type;
        regionTitle.textContent = region.title;
        regionCapital.textContent = region.capital;
        regionLocation.textContent = region.location;
        regionDescription.textContent = region.description;
        regionGovernment.textContent = region.government;
        regionGovernmentDescription.textContent =
            region.governmentDescription;

        regionCharacteristics.innerHTML = "";

        region.characteristics.forEach((characteristic) => {
            const listItem = document.createElement("li");

            listItem.textContent = characteristic;

            regionCharacteristics.appendChild(listItem);
        });

        exploreMessage.textContent = "";

        regionMarkers.forEach((marker) => {
            const isSelected =
                marker.dataset.region === regionId;

            marker.classList.toggle(
                "active",
                isSelected
            );

            marker.setAttribute(
                "aria-pressed",
                String(isSelected)
            );
        });

        highlightSvgRegion(regionId);
    }

    /*==================================================
                    MARCADORES DO HTML
    ==================================================*/

    regionMarkers.forEach((marker) => {
        marker.addEventListener("click", () => {
            updateRegion(marker.dataset.region);
        });
    });

    /*==================================================
                    BOTÃO VER DETALHES
    ==================================================*/

    if (exploreButton) {
        exploreButton.addEventListener("click", () => {
            const region = regions[selectedRegion];

            if (!region) {
                return;
            }

            exploreMessage.textContent =
                region.exploreMessage;
        });
    }

    /*==================================================
                    INTERAÇÃO COM O SVG
    ==================================================*/

    const svgIdByRegion = {
        aurelia: "region-aurelia",
        vinterhold: "region-vinterhold",
        eldoria: "region-eldoria",
        valdor: "region-valdor",
        ashkara: "region-ashkara",
        elysium: "city-elysium",

        "floresta-antiga":
            "neutral-ancient-forest",

        fraturas:
            "neutral-fractures",

        "cordilheira-colossos":
            "neutral-colossus-range",

        "ruinas-asterion":
            "neutral-ruins-asterion",

        "terras-selvagens":
            "neutral-wildlands",

        "mar-nevoa":
            "neutral-mist-sea"
    };

    function resetSvgHighlights() {
        if (!svgDocument) {
            return;
        }

        Object.values(svgIdByRegion).forEach((elementId) => {
            const element =
                svgDocument.getElementById(elementId);

            if (!element) {
                return;
            }

            element.style.filter = "";
            element.style.opacity = "";
        });
    }

    function highlightSvgRegion(regionId) {
        if (!svgDocument) {
            return;
        }

        resetSvgHighlights();

        const svgElementId =
            svgIdByRegion[regionId];

        const selectedElement =
            svgDocument.getElementById(svgElementId);

        if (!selectedElement) {
            return;
        }

        selectedElement.style.opacity = "1";

        selectedElement.style.filter =
            "drop-shadow(0 0 12px rgba(112, 214, 167, 0.95))";
    }

    function prepareSvgInteraction() {
        if (!worldMapObject) {
            return;
        }

        try {
            svgDocument =
                worldMapObject.contentDocument;

            if (!svgDocument) {
                return;
            }

            Object.entries(svgIdByRegion).forEach(
                ([regionId, svgElementId]) => {
                    const element =
                        svgDocument.getElementById(
                            svgElementId
                        );

                    if (!element) {
                        return;
                    }

                    element.style.cursor = "pointer";

                    element.style.transition =
                        "filter 0.3s ease, opacity 0.3s ease";

                    element.addEventListener(
                        "click",
                        () => {
                            updateRegion(regionId);
                        }
                    );

                    element.addEventListener(
                        "mouseenter",
                        () => {
                            element.style.filter =
                                "drop-shadow(0 0 10px rgba(255, 216, 77, 0.9))";
                        }
                    );

                    element.addEventListener(
                        "mouseleave",
                        () => {
                            highlightSvgRegion(
                                selectedRegion
                            );
                        }
                    );
                }
            );

            highlightSvgRegion(selectedRegion);
        } catch (error) {
            console.warn(
                "Não foi possível acessar os elementos internos do SVG.",
                error
            );
        }
    }

    if (worldMapObject) {
        worldMapObject.addEventListener(
            "load",
            prepareSvgInteraction
        );

        if (worldMapObject.contentDocument) {
            prepareSvgInteraction();
        }
    }

    /*==================================================
                    SISTEMA DE MÚSICA
    ==================================================*/

    if (music) {
        music.volume = 0.25;

        const savedTime = Number(
            localStorage.getItem(
                "wonderlandMusicTime"
            )
        );

        function musicIsEnabled() {
            return (
                localStorage.getItem(
                    "wonderlandMusicEnabled"
                ) === "true"
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

            const label = paused
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
                     * O navegador aguardará
                     * a primeira interação.
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
                        "A reprodução ainda foi bloqueada.",
                        error
                    );
                });
        }

        function restoreMusicTime() {
            if (
                Number.isFinite(savedTime) &&
                savedTime > 0 &&
                Number.isFinite(music.duration) &&
                savedTime < music.duration
            ) {
                music.currentTime = savedTime;
            }
        }

        music.addEventListener(
            "loadedmetadata",
            () => {
                restoreMusicTime();
                tryToPlayMusic();
            }
        );

        if (music.readyState >= 1) {
            restoreMusicTime();
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
    }

    /*==================================================
                    ESTADO INICIAL
    ==================================================*/

    updateRegion("aurelia");
});