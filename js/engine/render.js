"use strict";

const Render = {

    clear(element) {

        element.innerHTML = "";

    },

    html(element, content) {

        element.innerHTML = content;

    },

    append(element, content) {

        element.insertAdjacentHTML(
            "beforeend",
            content
        );

    }

};