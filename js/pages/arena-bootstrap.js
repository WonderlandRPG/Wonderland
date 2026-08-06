"use strict";

try {
  if (window.WONDERLAND_CONTENT_READY) {
    await window.WONDERLAND_CONTENT_READY;
  }
} catch (error) {
  console.warn("A Arena seguirá com o catálogo local normalizado.", error);
}

await import("./arena.js?v=10");
