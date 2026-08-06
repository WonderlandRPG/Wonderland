"use strict";

(function () {
  const scaling = window.WONDERLAND_SCALING;
  if (!scaling) return;

  function toLegacyScaleText(value) {
    const source = String(value || "");
    const terms = scaling.parseTerms(source);
    if (!terms.length) return source;

    let result = source;
    [...terms].reverse().forEach((term) => {
      if (term.syntax !== "multiplier") return;
      const percent = Number((term.multiplier * 100).toFixed(4));
      const signed = term.signed && percent > 0 ? "+" : "";
      const replacement = `${signed}${percent.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}% de ${term.attribute}`;
      result = `${result.slice(0, term.index)}${replacement}${result.slice(term.index + term.raw.length)}`;
    });
    return result;
  }

  function prepareValue(value, seen) {
    if (typeof value === "string") return toLegacyScaleText(value);
    if (!value || typeof value !== "object") return value;
    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        value[index] = prepareValue(item, seen);
      });
      return value;
    }

    ["description", "descricao", "content", "text"].forEach((key) => {
      if (typeof value[key] === "string") value[key] = toLegacyScaleText(value[key]);
    });

    Object.keys(value).forEach((key) => {
      if (["description", "descricao", "content", "text"].includes(key)) return;
      if (value[key] && typeof value[key] === "object") prepareValue(value[key], seen);
    });
    return value;
  }

  async function prepareArenaData() {
    if (window.WONDERLAND_CONTENT_READY) {
      try {
        await window.WONDERLAND_CONTENT_READY;
      } catch (error) {
        console.warn("A Arena usará o catálogo local para preparar as escalas.", error);
      }
    }

    const seen = new WeakSet();
    prepareValue(window.WONDERLAND_CLASSES, seen);
    prepareValue(window.WONDERLAND_RACES, seen);
  }

  function normalizeNode(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const next = scaling.normalizeDescription(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((textNode) => {
      const next = scaling.normalizeDescription(textNode.nodeValue);
      if (next !== textNode.nodeValue) textNode.nodeValue = next;
    });
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach(normalizeNode));
  });

  window.WONDERLAND_PREPARE_ARENA_SCALING = prepareArenaData;

  window.addEventListener("DOMContentLoaded", () => {
    normalizeNode(document.body);
    observer.observe(document.body, { childList: true, subtree: true });
  }, { once: true });
})();
