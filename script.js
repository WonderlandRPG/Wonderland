const enterButton = document.getElementById("enter");

if (enterButton) {
    enterButton.addEventListener("click", () => {
        document.body.classList.add("leaving");

        setTimeout(() => {
            window.location.href = "menu.html";
        }, 900);
    });
}
const mobileMenuButton = document.getElementById("mobile-menu-button");
const headerMenu = document.getElementById("header-menu");

if (mobileMenuButton && headerMenu) {
    mobileMenuButton.addEventListener("click", () => {
        headerMenu.classList.toggle("open");
    });
}