"use strict";

(function () {
  const scaling = window.WONDERLAND_SCALING;
  if (!scaling) return;

  const nativeMatch = String.prototype.match;
  const scaleRegexSignature = "FOR|DEF|RES|INI|INT|ARC";

  String.prototype.match = function (expression) {
    const result = nativeMatch.call(this, expression);
    if (result || !(expression instanceof RegExp)) return result;

    const source = expression.source || "";
    const isLegacyArenaScale = source.includes("%")
      && source.includes(scaleRegexSignature)
      && source.includes("seu");

    if (!isLegacyArenaScale) return result;

    const term = scaling.parseFirst(String(this));
    if (!term) return result;

    const synthetic = [
      term.raw,
      String(Number((term.multiplier * 100).toFixed(4))),
      term.attribute
    ];
    synthetic.index = term.index;
    synthetic.input = String(this);
    synthetic.groups = undefined;
    return synthetic;
  };

  function forceMultiplierText(value) {
    return String(value || "").replace(
      /([+\-]?\d+(?:[.,]\d+)?)%\s*(?:do|de|da)?\s*(?:seu|sua)?\s*(FOR|DEF|RES|INI|INT|ARC)/gi,
      (full, rawValue, attribute) => {
        const percent = Number(String(rawValue).replace(",", "."));
        const signed = String(rawValue).startsWith("+");
        return `${scaling.formatMultiplier(percent / 100, { signed })} ${String(attribute).toUpperCase()}`;
      }
    );
  }

  function normalizeNode(node) {
    if (!node) return;

    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((textNode) => {
      const next = forceMultiplierText(textNode.nodeValue);
      if (next !== textNode.nodeValue) textNode.nodeValue = next;
    });
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const next = forceMultiplierText(node.nodeValue);
          if (next !== node.nodeValue) node.nodeValue = next;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          normalizeNode(node);
        }
      });
    });
  });

  window.addEventListener("DOMContentLoaded", () => {
    normalizeNode(document.body);
    observer.observe(document.body, { childList: true, subtree: true });
  }, { once: true });
})();
