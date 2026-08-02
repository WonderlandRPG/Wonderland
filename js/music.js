const music = document.getElementById("bgMusic");

if (music) {
    const savedTime = Number(localStorage.getItem("wonderlandMusicTime")) || 0;
    const musicEnabled = localStorage.getItem("wonderlandMusicEnabled");

    music.volume = 0.25;

    if (savedTime > 0) {
        music.currentTime = savedTime;
    }

    if (musicEnabled === "true") {
        music.play().catch(() => {
            // O navegador pode bloquear até o usuário interagir.
        });
    }

    music.addEventListener("timeupdate", () => {
        localStorage.setItem(
            "wonderlandMusicTime",
            String(music.currentTime)
        );
    });

    window.addEventListener("beforeunload", () => {
        localStorage.setItem(
            "wonderlandMusicTime",
            String(music.currentTime)
        );
    });
}