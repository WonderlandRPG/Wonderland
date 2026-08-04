"use strict";

/*=========================================
WONDERLAND NAVIGATION ENGINE
=========================================*/

window.Wonderland =
window.Wonderland || {};

Wonderland.Navigation = (()=>{

    function create(){

        const transition =
        document.createElement("div");

        transition.id="wl-transition";

        transition.innerHTML=`

            <img
                class="transition-logo"
                src="assets/images/logo.png"
                alt="Wonderland"
            >

        `;

        document.body.appendChild(

            transition

        );

    }

    function start(url){

        const screen =
        document.getElementById(

            "wl-transition"

        );

        screen.classList.add(

            "active"

        );

        setTimeout(()=>{

            location.href=url;

        },650);

    }

    return{

        create,

        start

    };

})();