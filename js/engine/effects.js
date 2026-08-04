"use strict";

/*
===========================================================
WONDERLAND ENGINE
MAGIC EFFECTS
===========================================================
*/

window.Wonderland = window.Wonderland || {};

Wonderland.Effects = (()=>{

    const body = document.body;

    const THEMES = [

        "burn",
        "freeze",
        "poison",
        "shield",
        "healing",
        "curse",
        "shock",
        "arcane",
        "buff",
        "debuff",
        "summon",
        "transform",
        "armor",
        "reaction",
        "ultimate"

    ];

    function clear(){

        THEMES.forEach(effect=>{

            body.classList.remove(

                "theme-"+effect

            );

        });

    }

    function play(effect){

        clear();

        body.classList.add(

            "theme-"+effect

        );

    }

    return{

        play,

        clear

    };

})();