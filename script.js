const button = document.getElementById("enter");

button.onclick = () => {

    document.body.style.transition = "1s";

    document.body.style.opacity = "0";

    setTimeout(()=>{

        window.location.href = "pages/menu.html";

    },1000);

}
