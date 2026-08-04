"use strict";

(function () {
  const data = Array.isArray(window.WONDERLAND_GRIMORIO) ? window.WONDERLAND_GRIMORIO : [];
  const categoryList = document.getElementById("categoryList");
  const termList = document.getElementById("termList");
  const termContent = document.getElementById("termContent");
  const searchInput = document.getElementById("searchInput");
  if (!categoryList || !termList || !termContent || !searchInput) return;

  let activeCategory = "Todas";
  let activeId = data[0]?.id || null;
  let search = "";

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const categories = ["Todas", ...new Set(data.map((item) => item.categoria))];

  function matches(item) {
    const inCategory = activeCategory === "Todas" || item.categoria === activeCategory;
    const haystack = [item.nome, item.categoria, item.origemTipo, item.origem, item.atributo, ...(item.tags || []), item.descricao, item.efeito]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return inCategory && haystack.includes(search.toLocaleLowerCase("pt-BR"));
  }

  function renderCategories() {
    categoryList.innerHTML = categories.map((category) => `
      <button type="button" class="category-button ${category === activeCategory ? "active" : ""}" data-category="${esc(category)}">
        <span class="category-icon" aria-hidden="true">✦</span>
        <span class="category-title">${esc(category)}</span>
      </button>`).join("");
  }

  function renderList() {
    const filtered = data.filter(matches);
    if (!filtered.some((item) => item.id === activeId)) activeId = filtered[0]?.id || null;

    termList.innerHTML = filtered.length ? filtered.map((item) => `
      <button type="button" class="term-button grimorio-record-card ${item.id === activeId ? "active" : ""}" data-id="${esc(item.id)}">
        <span class="grimorio-record-card-top"><small>${esc(item.origemTipo)} • ${esc(item.origem)}</small><strong>${esc(item.nome)}</strong></span>
        <span class="grimorio-record-card-meta"><em>${esc(item.categoria)}</em><em>Nível ${esc(item.nivel)}</em><em>${esc(item.atributo)}</em></span>
        <span class="grimorio-record-card-tags">${(item.tags || []).slice(0, 3).map((tag) => `<i>${esc(tag)}</i>`).join("")}</span>
      </button>`).join("") : '<div class="grimorio-empty">Nenhum registro encontrado.</div>';

    renderDetail();
  }

  function detailRow(label, value) {
    return `<div class="grimorio-detail-row"><span>${esc(label)}</span><strong>${esc(value || "—")}</strong></div>`;
  }

  function renderDetail() {
    const item = data.find((entry) => entry.id === activeId);
    if (!item) {
      termContent.innerHTML = '<div class="grimorio-placeholder"><h2>Nenhum registro selecionado</h2><p>Escolha um card para consultar os detalhes.</p></div>';
      return;
    }

    termContent.innerHTML = `
      <article class="grimorio-record-detail">
        <header class="term-header">
          <span class="term-subtitle">${esc(item.origemTipo)} • ${esc(item.origem)}</span>
          <h1>${esc(item.nome)}</h1>
          <div class="grimorio-detail-tags">${(item.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
        </header>

        <div class="grimorio-detail-grid">
          ${detailRow("Categoria", item.categoria)}
          ${detailRow("Nível", item.nivel)}
          ${detailRow("Atributo", item.atributo)}
          ${detailRow("Custo", item.custo)}
          ${detailRow("Recarga", item.recarga)}
          ${detailRow("Alcance", item.alcance)}
          ${detailRow("Área", item.area)}
        </div>

        <section class="grim-section"><h2>Descrição</h2><p>${esc(item.descricao)}</p></section>
        <section class="grim-section"><h2>Efeito</h2><p>${esc(item.efeito)}</p></section>
        ${item.observacoes ? `<section class="note-box"><strong>Observações</strong><p>${esc(item.observacoes)}</p></section>` : ""}
      </article>`;
  }

  categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category || "Todas";
    renderCategories();
    renderList();
  });

  termList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    activeId = button.dataset.id;
    renderList();
  });

  searchInput.addEventListener("input", () => {
    search = searchInput.value.trim();
    renderList();
  });

  renderCategories();
  renderList();
})();
