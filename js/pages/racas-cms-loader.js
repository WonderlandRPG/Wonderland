"use strict";

(function () {
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src^="${src.split("?")[0]}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") resolve();
        else {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.body.appendChild(script);
    });
  }

  function loadRacePageScript() {
    const script = document.createElement("script");
    script.src = "js/pages/racas.js?v=26";
    script.async = false;
    document.body.appendChild(script);
  }

  (async () => {
    try {
      if (!window.WONDERLAND_SCALING) {
        await loadScript("js/data/scaling-system.js?v=2");
      }
      if (!window.WONDERLAND_CONTENT_READY) {
        await loadScript("js/data/content-runtime-sync.js?v=1");
      }
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
