const enterButton = document.getElementById("enter");

if (enterButton) {
    enterButton.addEventListener("click", () => {
        document.body.classList.add("leaving");

        setTimeout(() => {
            window.location.href = "menu.html";
        }, 900);
    });
}