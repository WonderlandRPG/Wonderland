"use strict";

/*
===========================================================
WONDERLAND ENGINE
Search
===========================================================
*/

window.Wonderland =
window.Wonderland || {};

Wonderland.Search = (()=>{

    function normalize(text){

        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu,"");

    }

    function filter(

        list,

        value,

        field

    ){

        const search =
            normalize(value);

        return list.filter(item=>{

            return normalize(

                item[field]

            ).includes(search);

        });

    }

    return{

        filter

    };

})();