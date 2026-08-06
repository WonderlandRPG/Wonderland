"use strict";

(function () {
  const ATTRIBUTES = ["FOR", "DEF", "RES", "INI", "INT", "ARC"];
  const ATTRIBUTE_PATTERN = "(FOR|DEF|RES|INI|INT|ARC)";
  const PERCENT_PATTERN = new RegExp(
    `([+\\-]?\\d+(?:[.,]\\d+)?)%\\s*(?:(?:do|de|da)\\s+)?(?:(?:seu|sua)\\s+)?${ATTRIBUTE_PATTERN}`,
    "gi"
  );
  const MULTIPLIER_PATTERN = new RegExp(
    `([+\\-]?\\d+(?:[.,]\\d+)?)\\s*[x×]\\s*(?:(?:do|de|da)\\s+)?(?:(?:seu|sua)\\s+)?${ATTRIBUTE_PATTERN}`,
    "gi"
  );
  const DIRECT_WORDS = [
    "causa", "dano", "cura", "curar", "recupera", "restaura", "regenera",
    "escudo", "barreira", "absorve", "equivalente", "valor igual", "pontos de vida",
    "hp", "ataque", "ataca", "atinge", "golpeia", "dispara", "projétil", "projetil"
  ];
  const MODIFIER_WORDS = [
    "aumenta", "reduz", "diminui", "eleva", "amplifica", "fortalece", "enfraquece",
    "recebe bônus", "recebe bonus", "ganha bônus", "ganha bonus"
  ];

  const toNumber = (value, fallback = 0) => {
    const parsed = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const round = (value, decimals = 4) => {
    const factor = 10 ** decimals;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  };

  function formatNumber(value) {
    const number = round(toNumber(value));
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  }

  function formatMultiplier(value, options = {}) {
    const number = toNumber(value, 0);
    const prefix = options.signed && number > 0 ? "+" : "";
    return `${prefix}${formatNumber(number)}x`;
  }

  function normalizeAttribute(value) {
    const attribute = String(value || "").toUpperCase();
    return ATTRIBUTES.includes(attribute) ? attribute : null;
  }

  function sentenceBounds(source, index, length) {
    const start = Math.max(
      source.lastIndexOf(".", index - 1),
      source.lastIndexOf("!", index - 1),
      source.lastIndexOf("?", index - 1),
      source.lastIndexOf(";", index - 1),
      source.lastIndexOf("\n", index - 1)
    ) + 1;

    const nextStops = [".", "!", "?", ";", "\n"]
      .map((token) => source.indexOf(token, index + length))
      .filter((position) => position >= 0);
    const end = nextStops.length ? Math.min(...nextStops) : source.length;
    return { start, end };
  }

  function lastKeywordIndex(source, words) {
    return words.reduce((last, word) => Math.max(last, source.lastIndexOf(word)), -1);
  }

  function containsKeyword(source, words) {
    return words.some((word) => source.includes(word));
  }

  function isDirectScaleContext(source, index, length) {
    const bounds = sentenceBounds(source, index, length);
    const context = source.slice(bounds.start, bounds.end).toLowerCase();
    const prefix = source.slice(bounds.start, index).toLowerCase();
    const lastDirect = lastKeywordIndex(prefix, DIRECT_WORDS);
    const lastModifier = lastKeywordIndex(prefix, MODIFIER_WORDS);

    if (lastModifier > lastDirect) return false;
    if (lastDirect >= 0) return true;
    return containsKeyword(context, DIRECT_WORDS) && !containsKeyword(prefix, MODIFIER_WORDS);
  }

  function parseTerms(value, options = {}) {
    const source = String(value || "");
    const terms = [];
    const directOnly = options.directOnly !== false;

    MULTIPLIER_PATTERN.lastIndex = 0;
    let match;
    while ((match = MULTIPLIER_PATTERN.exec(source))) {
      terms.push({
        syntax: "multiplier",
        raw: match[0],
        index: match.index,
        multiplier: toNumber(match[1]),
        attribute: normalizeAttribute(match[2]),
        signed: /^[+]/.test(match[1])
      });
    }

    PERCENT_PATTERN.lastIndex = 0;
    while ((match = PERCENT_PATTERN.exec(source))) {
      const overlaps = terms.some((term) =>
        match.index >= term.index && match.index < term.index + term.raw.length
      );
      if (overlaps) continue;
      if (directOnly && !isDirectScaleContext(source, match.index, match[0].length)) continue;

      terms.push({
        syntax: "percent",
        raw: match[0],
        index: match.index,
        multiplier: toNumber(match[1]) / 100,
        percent: toNumber(match[1]),
        attribute: normalizeAttribute(match[2]),
        signed: /^[+]/.test(match[1])
      });
    }

    return terms
      .filter((term) => term.attribute && Number.isFinite(term.multiplier))
      .sort((a, b) => a.index - b.index);
  }

  function parseFirst(value, options = {}) {
    return parseTerms(value, options)[0] || null;
  }

  function normalizeDescription(value) {
    let result = String(value ?? "");

    PERCENT_PATTERN.lastIndex = 0;
    result = result.replace(PERCENT_PATTERN, (full, rawValue, attribute, offset, source) => {
      if (!isDirectScaleContext(source, offset, full.length)) return full;
      const percent = toNumber(rawValue);
      const multiplier = percent / 100;
      const signed = String(rawValue).startsWith("+");
      return `${formatMultiplier(multiplier, { signed })} ${String(attribute).toUpperCase()}`;
    });

    MULTIPLIER_PATTERN.lastIndex = 0;
    result = result.replace(MULTIPLIER_PATTERN, (full, rawValue, attribute) => {
      const multiplier = toNumber(rawValue);
      const signed = String(rawValue).startsWith("+");
      return `${formatMultiplier(multiplier, { signed })} ${String(attribute).toUpperCase()}`;
    });

    return result;
  }

  function multiplierFromSkill(skill, description = "") {
    const direct = toNumber(skill?.scale_multiplier, NaN);
    if (Number.isFinite(direct) && direct > 0) return direct;

    const legacyPercent = toNumber(skill?.scale_percent, NaN);
    if (Number.isFinite(legacyPercent) && legacyPercent > 0) {
      return legacyPercent / 100;
    }

    return parseFirst(description)?.multiplier || 0;
  }

  function attributeFromSkill(skill, description = "", fallback = null) {
    return normalizeAttribute(skill?.scale_attribute)
      || parseFirst(description)?.attribute
      || normalizeAttribute(fallback)
      || null;
  }

  function normalizeSkill(skill) {
    const description = normalizeDescription(
      skill?.description ?? skill?.descricao ?? skill?.content ?? ""
    );
    const multiplier = multiplierFromSkill(skill, description);
    const attribute = attributeFromSkill(skill, description);

    return {
      ...skill,
      description,
      scale_multiplier: multiplier,
      scale_percent: round(multiplier * 100, 2),
      scale_attribute: attribute
    };
  }

  function calculate(multiplier, attributeValue) {
    return Math.round(toNumber(attributeValue) * toNumber(multiplier, 0));
  }

  function calculateTerms(description, attributes = {}) {
    const terms = parseTerms(description);
    const values = terms.map((term) => {
      const base = toNumber(attributes[term.attribute]);
      return {
        ...term,
        base,
        total: calculate(term.multiplier, base)
      };
    });

    return {
      terms: values,
      total: values.reduce((sum, item) => sum + item.total, 0)
    };
  }

  function describe(multiplier, attribute, options = {}) {
    const normalizedAttribute = normalizeAttribute(attribute);
    return normalizedAttribute
      ? `${formatMultiplier(multiplier, options)} ${normalizedAttribute}`
      : formatMultiplier(multiplier, options);
  }

  window.WONDERLAND_SCALING = Object.freeze({
    ATTRIBUTES,
    toNumber,
    formatNumber,
    formatMultiplier,
    normalizeAttribute,
    isDirectScaleContext,
    parseTerms,
    parseFirst,
    normalizeDescription,
    multiplierFromSkill,
    attributeFromSkill,
    normalizeSkill,
    calculate,
    calculateTerms,
    describe
  });
})();
