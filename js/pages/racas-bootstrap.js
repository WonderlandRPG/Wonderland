"use strict";

try {
  if (window.WONDERLAND_CONTENT_READY) {
    await window.WONDERLAND_CONTENT_READY;
  }
} catch (error) {
  console.warn("A página de Raças seguirá com o catálogo local normalizado.", error);
}

await import("./racas.js?v=25");
