"use strict";

/*
===========================================================
WONDERLAND ENGINE
Render System
v1.0
===========================================================
*/

window.Wonderland = window.Wonderland || {};

Wonderland.Render = (() => {

    /*========================================*/

    function clear(element){

        if(!element) return;

        element.innerHTML = "";

    }

    /*========================================*/

    function create(tag, classes = "", html = ""){

        const el = document.createElement(tag);

        if(classes){

            el.className = classes;

        }

        if(html){

            el.innerHTML = html;

        }

        return el;

    }

    /*========================================*/

    function append(parent,...children){

        children.forEach(child=>{

            parent.appendChild(child);

        });

    }

    /*========================================*/

    function fadeOut(element,duration=350){

        return new Promise(resolve=>{

            element.style.transition =
                `opacity ${duration}ms`;

            element.style.opacity="0";

            setTimeout(resolve,duration);

        });

    }

    /*========================================*/

    function fadeIn(element,duration=350){

        return new Promise(resolve=>{

            element.style.transition =
                `opacity ${duration}ms`;

            element.style.opacity="1";

            setTimeout(resolve,duration);

        });

    }

    /*========================================*/

    async function replace(

        element,

        callback

    ){

        await fadeOut(element);

        callback();

        await fadeIn(element);

    }

    /*========================================*/

    return{

        clear,

        create,

        append,

        replace,

        fadeIn,

        fadeOut

    };

})();