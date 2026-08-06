"use strict";

(async function () {
  const ready = window.WONDERLAND_GRIMORIO_READY;
  const resolved = ready ? await ready : window.WONDERLAND_GRIMORIO;
  const data = Array.isArray(resolved) ? resolved : [];

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
    const haystack = [
      item.nome,
      item.categoria,
      item.origemTipo,
      item.origem,
      item.atributo,
      ...(item.tags || []),
      item.descricao,
      item.efeito
    ].join(" ").toLocaleLowerCase("pt-BR");

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
      <button type="button" class="wl-card grimorio-skill-card ${item.id === activeId ? "wl-card-active" : ""}" data-id="${esc(item.id)}" aria-label="Abrir ${esc(item.nome)}">
        <span class="wl-card-frame" aria-hidden="true"></span>
        <span class="wl-card-corner wl-card-corner-top-left" aria-hidden="true"></span>
        <span class="wl-card-corner wl-card-corner-top-right" aria-hidden="true"></span>
        <span class="wl-card-corner wl-card-corner-bottom-left" aria-hidden="true"></span>
        <span class="wl-card-corner wl-card-corner-bottom-right" aria-hidden="true"></span>
        <span class="wl-card-shine" aria-hidden="true"></span>
        <div class="wl-card-body">
          <span class="wl-card-subtitle">${esc(item.origemTipo)} • ${esc(item.origem)}</span>
          <h3 class="wl-card-title">${esc(item.nome)}</h3>
          <p class="wl-card-text">${esc(item.descricao)}</p>
          <div class="wl-card-meta">
            <span class="wl-card-stars">${esc(item.categoria)}</span>
            <span class="grimorio-card-level">Nível ${esc(item.nivel)}</span>
          </div>
        </div>
      </button>`).join("") : '<div class="grimorio-empty">Nenhum registro encontrado.</div>';
  }

  function detailRow(label, value) {
    return `<div class="grimorio-detail-row"><span>${esc(label)}</span><strong>${esc(value || "—")}</strong></div>`;
  }

  function renderDetail(item) {
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

  function openModal(item) {
    const modal = document.getElementById("grimorioSkillModal");
    const modalBody = document.getElementById("grimorioSkillModalBody");
    if (!modal || !modalBody || !item) return;

    modalBody.innerHTML = `
      <span class="term-subtitle">${esc(item.origemTipo)} • ${esc(item.origem)}</span>
      <h2>${esc(item.nome)}</h2>
      <div class="grimorio-detail-tags">${(item.tags || []).map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
      <div class="grimorio-detail-grid">
        ${detailRow("Categoria", item.categoria)}
        ${detailRow("Nível", item.nivel)}
        ${detailRow("Atributo", item.atributo)}
        ${detailRow("Custo", item.custo)}
        ${detailRow("Recarga", item.recarga)}
        ${detailRow("Alcance", item.alcance)}
        ${detailRow("Área", item.area)}
      </div>
      <section class="grim-section"><h3>Descrição</h3><p>${esc(item.descricao)}</p></section>
      <section class="grim-section"><h3>Efeito</h3><p>${esc(item.efeito)}</p></section>
      ${item.observacoes ? `<section class="note-box"><strong>Observações</strong><p>${esc(item.observacoes)}</p></section>` : ""}
    `;

    if (typeof modal.showModal === "function") modal.showModal();
    else modal.setAttribute("open", "");
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
    const item = data.find((entry) => entry.id === activeId);
    renderList();
    renderDetail(item);
    openModal(item);
  });

  searchInput.addEventListener("input", () => {
    search = searchInput.value.trim();
    renderList();
  });

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-grimorio-modal]");
    if (!closeButton) return;
    document.getElementById("grimorioSkillModal")?.close();
  });

  const modal = document.getElementById("grimorioSkillModal");
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  renderCategories();
  renderList();
  renderDetail(data.find((entry) => entry.id === activeId));
})();
