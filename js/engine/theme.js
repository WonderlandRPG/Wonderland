"use strict";

/*
===========================================================
WONDERLAND ENGINE
Theme System
===========================================================
*/

window.Wonderland =
window.Wonderland || {};

Wonderland.Theme = (()=>{

    function apply(theme){

        if(!theme) return;

        document.documentElement.style
            .setProperty(
                "--theme-color",
                theme.cor
            );

        document.documentElement.style
            .setProperty(
                "--theme-light",
                theme.brilho
            );

    }

    return{

        apply

    };

})();