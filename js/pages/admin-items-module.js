"use strict";
(function(){
  const localItems=Array.isArray(window.WONDERLAND_ADMIN_LOCAL_ITEMS)?window.WONDERLAND_ADMIN_LOCAL_ITEMS:[];
  const client=window.WONDERLAND_SUPABASE;
  const moduleContent=document.getElementById("adminModuleContent");
  const moduleTitle=document.getElementById("adminModuleTitle");
  const itemButton=document.querySelector('[data-admin-module="items"]');
  if(!moduleContent||!moduleTitle||!itemButton||!localItems.length)return;

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const slotNames=window.WONDERLAND_ITEM_SLOTS||{};
  const state={index:0,items:localItems.map(item=>({...item,stats:{...(item.stats||{})}})),loaded:false};

  function normalizeRow(row){
    return{
      id:row.item_key||row.id,
      name:row.name||row.item_key,
      description:row.description||"Equipamento disponível na Loja de Wonderland.",
      rarity:row.rarity||"Comum",
      slot:row.slot||"",
      base_value:Number(row.price_wg||0),
      price:Number(row.price_wg||0),
      required_level:Number(row.required_level||1),
      icon_url:row.icon||"",
      icon:row.icon||"",
      artwork_url:row.image_url||"",
      image:row.image_url||null,
      is_active:row.is_active!==false,
      active:row.is_active!==false,
      stats:{...(row.stats||{})},
      two_handed:Boolean(row.two_handed),
      occupies_both_hands:Boolean(row.occupies_both_hands),
      _source:"supabase"
    };
  }

  async function loadItems(){
    if(state.loaded||!client)return;
    try{
      const {data,error}=await client.from("items").select("item_key,name,description,slot,rarity,price_wg,required_level,stats,icon,image_url,two_handed,occupies_both_hands,is_active").order("name");
      if(error)throw error;
      if(Array.isArray(data)&&data.length)state.items=data.map(normalizeRow);
    }catch(error){console.warn("Não foi possível carregar itens persistidos do Supabase.",error)}finally{state.loaded=true}
  }

  function renderList(){return `<aside class="admin-record-list">${state.items.map((item,index)=>`<button type="button" class="admin-record-button ${index===state.index?"active":""}" data-local-item-index="${index}"><small>${esc(item.rarity)} • ${esc(slotNames[item.slot]||item.slot)}</small><strong>${esc(item.name)}</strong><span>${esc(Object.entries(item.stats||{}).map(([key,value])=>`${key} +${value}`).join(" • "))}</span></button>`).join("")}</aside>`}
  function field(label,name,value,type="text",extra=""){return `<label class="admin-field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value??"")}" ${extra}></label>`}
  function renderEditor(){
    const item=state.items[state.index];const stats=item.stats||{};
    return `<section class="admin-editor admin-editor-detail"><header><div><span>Editor de item</span><h3>${esc(item.name)}</h3></div></header><form id="adminLocalItemForm" class="admin-edit-form">
      ${field("Nome","name",item.name)}${field("Raridade","rarity",item.rarity)}${field("Slot","slot",item.slot)}${field("Preço em WG","base_value",item.base_value,"number","min=0 step=1")}${field("Nível mínimo","required_level",item.required_level,"number","min=1 max=100")}${field("Ícone","icon_url",item.icon_url)}${field("Imagem","artwork_url",item.artwork_url,"url")}
      <label class="admin-field admin-field-wide"><span>Descrição</span><textarea name="description" rows="4">${esc(item.description||"")}</textarea></label>
      ${["FOR","DEF","RES","INI","INT","ARC"].map(attr=>field(attr,`stat_${attr}`,stats[attr]||0,"number","min=0 step=1")).join("")}
      <label class="admin-field admin-field-check"><span>Duas mãos</span><input type="checkbox" name="two_handed" ${item.two_handed?"checked":""}></label>
      <label class="admin-field admin-field-check"><span>Ocupa os dois slots</span><input type="checkbox" name="occupies_both_hands" ${item.occupies_both_hands?"checked":""}></label>
      <label class="admin-field admin-field-check"><span>Ativo na loja</span><input type="checkbox" name="is_active" ${item.is_active?"checked":""}></label>
      <div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar alterações</button></div><p id="adminLocalItemMessage" class="admin-form-message"></p>
    </form></section>`
  }
  function render(){
    moduleTitle.textContent="Itens";moduleContent.innerHTML=`<section class="admin-browser">${renderList()}<div class="admin-detail-pane">${renderEditor()}</div></section>`;
    moduleContent.querySelectorAll("[data-local-item-index]").forEach(button=>button.addEventListener("click",()=>{state.index=Number(button.dataset.localItemIndex)||0;render()}));
    const form=document.getElementById("adminLocalItemForm");
    form?.addEventListener("submit",async event=>{
      event.preventDefault();const item=state.items[state.index];const fd=new FormData(form);const message=document.getElementById("adminLocalItemMessage");const submit=form.querySelector('button[type="submit"]');
      item.name=String(fd.get("name")||"").trim();item.rarity=String(fd.get("rarity")||"Comum").trim();item.slot=String(fd.get("slot")||"").trim();item.base_value=Math.max(0,Number(fd.get("base_value")||0));item.price=item.base_value;item.required_level=Math.max(1,Number(fd.get("required_level")||1));item.icon_url=String(fd.get("icon_url")||"").trim();item.icon=item.icon_url;item.artwork_url=String(fd.get("artwork_url")||"").trim();item.image=item.artwork_url||null;item.description=String(fd.get("description")||"").trim();item.two_handed=form.elements.two_handed.checked;item.occupies_both_hands=form.elements.occupies_both_hands.checked||item.two_handed;item.is_active=form.elements.is_active.checked;item.active=item.is_active;item.stats={};["FOR","DEF","RES","INI","INT","ARC"].forEach(attr=>{const value=Math.max(0,Number(fd.get(`stat_${attr}`)||0));if(value)item.stats[attr]=value});
      if(!client){message.textContent="Supabase indisponível. Nada foi salvo.";return}
      submit.disabled=true;message.textContent="Salvando no Supabase...";
      const payload={item_key:item.id,name:item.name,description:item.description,slot:item.slot,rarity:item.rarity,price_wg:item.base_value,required_level:item.required_level,stats:item.stats,icon:item.icon_url||null,image_url:item.artwork_url||null,two_handed:item.two_handed,occupies_both_hands:item.occupies_both_hands,is_active:item.is_active};
      try{
        const {error}=await client.from("items").upsert(payload,{onConflict:"item_key"});if(error)throw error;message.textContent="Alterações salvas no Supabase e disponíveis globalmente.";
      }catch(error){console.error(error);message.textContent=error.message||"Não foi possível salvar o item."}finally{submit.disabled=false}
    });
  }
  itemButton.addEventListener("click",async event=>{event.preventDefault();event.stopImmediatePropagation();document.querySelectorAll("[data-admin-module]").forEach(button=>button.classList.toggle("active",button===itemButton));await loadItems();render()},true);
})();
