"use strict";

try {
  if (window.WONDERLAND_CONTENT_READY) {
    await window.WONDERLAND_CONTENT_READY;
  }
  if (window.WONDERLAND_PREPARE_ARENA_SCALING) {
    await window.WONDERLAND_PREPARE_ARENA_SCALING();
  }
} catch (error) {
  console.warn("A Arena seguirá com o catálogo local normalizado.", error);
}

await import("./arena.js?v=10");
