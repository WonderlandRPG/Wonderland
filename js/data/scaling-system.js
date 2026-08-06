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
    const number = toNumber(value, 1);
    const prefix = options.signed && number > 0 ? "+" : "";
    return `${prefix}${formatNumber(number)}x`;
  }

  function normalizeAttribute(value) {
    const attribute = String(value || "").toUpperCase();
    return ATTRIBUTES.includes(attribute) ? attribute : null;
  }

  function parseTerms(value) {
    const source = String(value || "");
    const terms = [];

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

  function parseFirst(value) {
    return parseTerms(value)[0] || null;
  }

  function normalizeDescription(value) {
    let result = String(value ?? "");

    PERCENT_PATTERN.lastIndex = 0;
    result = result.replace(PERCENT_PATTERN, (full, rawValue, attribute) => {
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

    return parseFirst(description)?.multiplier || 1;
  }

  function attributeFromSkill(skill, description = "", fallback = "FOR") {
    return normalizeAttribute(skill?.scale_attribute)
      || parseFirst(description)?.attribute
      || normalizeAttribute(fallback)
      || "FOR";
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
    return Math.round(toNumber(attributeValue) * toNumber(multiplier, 1));
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
    const normalizedAttribute = normalizeAttribute(attribute) || "FOR";
    return `${formatMultiplier(multiplier, options)} ${normalizedAttribute}`;
  }

  window.WONDERLAND_SCALING = Object.freeze({
    ATTRIBUTES,
    toNumber,
    formatNumber,
    formatMultiplier,
    normalizeAttribute,
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
