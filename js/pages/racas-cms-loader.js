"use strict";

(function () {
  function loadRacePageScript() {
    const script = document.createElement("script");
    script.src = "js/pages/racas.js?v=26";
    script.async = false;
    document.body.appendChild(script);
  }

  (async () => {
    try {
      if (window.WONDERLAND_CONTENT_READY) {
        await window.WONDERLAND_CONTENT_READY;
      }
    } catch (error) {
      console.warn("A página de Raças seguirá com o catálogo local normalizado.", error);
    } finally {
      loadRacePageScript();
    }
  })();
})();
