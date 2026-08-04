/**
 * ==========================================================
 * Wonderland Core
 * ----------------------------------------------------------
 * Núcleo principal da aplicação.
 *
 * Responsabilidades:
 * - Inicializar módulos
 * - Gerenciar o estado global
 * - Integrar a Engine
 * ==========================================================
 */

"use strict";

const Wonderland = (() => {

    /**
     * Estado global da aplicação
     */
    const state = {

        initialized: false,

        module: null,

        page: null,

        data: null,

        container: null

    };

    /**
     * Inicializa um módulo.
     */
    function init(config = {}) {

        if (!config.module) {
            throw new Error("Wonderland: módulo não informado.");
        }

        if (!config.page) {
            throw new Error("Wonderland: página não informada.");
        }

        if (!config.container) {
            throw new Error("Wonderland: container não informado.");
        }

        state.module = config.module;
        state.page = config.page;
        state.data = config.data || {};
        state.container = config.container;

        state.initialized = true;

        console.log(
            `[Wonderland] ${state.module}/${state.page} iniciado.`
        );

    }

    /**
     * Atualiza o módulo atual.
     */
    function refresh() {

        console.log(
            "[Wonderland] Atualizando..."
        );

    }

    /**
     * Finaliza o módulo.
     */
    function destroy() {

        state.initialized = false;

        state.module = null;
        state.page = null;
        state.data = null;
        state.container = null;

    }

    /**
     * Retorna o estado atual.
     */
    function getState() {

        return structuredClone(state);

    }

    return {

        init,

        refresh,

        destroy,

        getState

    };

})();