"use strict";
(function(){
  const items=Array.isArray(window.WONDERLAND_ADMIN_LOCAL_ITEMS)?window.WONDERLAND_ADMIN_LOCAL_ITEMS:[];
  const moduleContent=document.getElementById("adminModuleContent");
  const moduleTitle=document.getElementById("adminModuleTitle");
  const itemButton=document.querySelector('[data-admin-module="items"]');
  if(!moduleContent||!moduleTitle||!itemButton||!items.length)return;

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const slotNames=window.WONDERLAND_ITEM_SLOTS||{};
  const state={index:0,items:items.map(item=>({...item,stats:{...(item.stats||{})}}))};

  function renderList(){
    return `<aside class="admin-record-list">${state.items.map((item,index)=>`<button type="button" class="admin-record-button ${index===state.index?"active":""}" data-local-item-index="${index}"><small>${esc(item.rarity)} • ${esc(slotNames[item.slot]||item.slot)}</small><strong>${esc(item.name)}</strong><span>${esc(Object.entries(item.stats||{}).map(([key,value])=>`${key} +${value}`).join(" • "))}</span></button>`).join("")}</aside>`;
  }

  function field(label,name,value,type="text",extra=""){
    return `<label class="admin-field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value??"")}" ${extra}></label>`;
  }

  function renderEditor(){
    const item=state.items[state.index];
    const stats=item.stats||{};
    return `<section class="admin-editor admin-editor-detail"><header><div><span>Editor de item</span><h3>${esc(item.name)}</h3></div></header><form id="adminLocalItemForm" class="admin-edit-form">
      ${field("Nome","name",item.name)}
      ${field("Raridade","rarity",item.rarity)}
      ${field("Slot","slot",item.slot)}
      ${field("Preço em WG","base_value",item.base_value,"number","min=0 step=1")}
      ${field("Nível mínimo","required_level",item.required_level,"number","min=1 max=100")}
      ${field("Ícone","icon_url",item.icon_url)}
      ${field("Imagem","artwork_url",item.artwork_url,"url")}
      <label class="admin-field admin-field-wide"><span>Descrição</span><textarea name="description" rows="4">${esc(item.description||"")}</textarea></label>
      ${["FOR","DEF","RES","INI","INT","ARC"].map(attr=>field(attr,`stat_${attr}`,stats[attr]||0,"number","min=0 step=1")).join("")}
      <label class="admin-field admin-field-check"><span>Duas mãos</span><input type="checkbox" name="two_handed" ${item.two_handed?"checked":""}></label>
      <label class="admin-field admin-field-check"><span>Ocupa os dois slots</span><input type="checkbox" name="occupies_both_hands" ${item.occupies_both_hands?"checked":""}></label>
      <label class="admin-field admin-field-check"><span>Ativo na loja</span><input type="checkbox" name="is_active" ${item.is_active?"checked":""}></label>
      <div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar edição local</button></div>
      <p id="adminLocalItemMessage" class="admin-form-message"></p>
    </form></section>`;
  }

  function render(){
    moduleTitle.textContent="Itens";
    moduleContent.innerHTML=`<section class="admin-browser">${renderList()}<div class="admin-detail-pane">${renderEditor()}</div></section>`;
    moduleContent.querySelectorAll("[data-local-item-index]").forEach(button=>button.addEventListener("click",()=>{state.index=Number(button.dataset.localItemIndex)||0;render()}));
    const form=document.getElementById("adminLocalItemForm");
    form?.addEventListener("submit",event=>{
      event.preventDefault();
      const item=state.items[state.index];
      const fd=new FormData(form);
      item.name=String(fd.get("name")||"").trim();
      item.rarity=String(fd.get("rarity")||"Comum").trim();
      item.slot=String(fd.get("slot")||"").trim();
      item.base_value=Math.max(0,Number(fd.get("base_value")||0));
      item.price=item.base_value;
      item.required_level=Math.max(1,Number(fd.get("required_level")||1));
      item.icon_url=String(fd.get("icon_url")||"").trim();
      item.icon=item.icon_url;
      item.artwork_url=String(fd.get("artwork_url")||"").trim();
      item.image=item.artwork_url||null;
      item.description=String(fd.get("description")||"").trim();
      item.two_handed=form.elements.two_handed.checked;
      item.occupies_both_hands=form.elements.occupies_both_hands.checked||item.two_handed;
      item.is_active=form.elements.is_active.checked;
      item.active=item.is_active;
      item.stats={};
      ["FOR","DEF","RES","INI","INT","ARC"].forEach(attr=>{const value=Math.max(0,Number(fd.get(`stat_${attr}`)||0));if(value)item.stats[attr]=value});
      const message=document.getElementById("adminLocalItemMessage");
      message.textContent="Alteração aplicada nesta sessão. Para persistência global, o próximo passo é salvar os itens no Supabase.";
      render();
    });
  }

  itemButton.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();document.querySelectorAll("[data-admin-module]").forEach(button=>button.classList.toggle("active",button===itemButton));render()},true);
})();
