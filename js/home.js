document.addEventListener("DOMContentLoaded", () => {
    const enterButton = document.getElementById("enterButton");
    const music = document.getElementById("bgMusic");

    if (!enterButton) return;

    enterButton.addEventListener("click", async () => {
        if (music) {
            try {
                await music.play();

                localStorage.setItem(
                    "wonderlandMusicEnabled",
                    "true"
                );
            } catch (error) {
                console.warn("A música não pôde ser iniciada.", error);
            }
        }

        document.body.classList.add("fade-out");

        setTimeout(() => {
            window.location.href = "menu.html";
        }, 800);
    });
});