"use strict";
(function(){
  const localItems=Array.isArray(window.WONDERLAND_ADMIN_LOCAL_ITEMS)?window.WONDERLAND_ADMIN_LOCAL_ITEMS:[];
  const client=window.WONDERLAND_SUPABASE;
  const moduleContent=document.getElementById("adminModuleContent");
  const moduleTitle=document.getElementById("adminModuleTitle");
  const itemButton=document.querySelector('[data-admin-module="items"]');
  if(!moduleContent||!moduleTitle||!itemButton||!localItems.length)return;

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const normalize=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const slotNames=window.WONDERLAND_ITEM_SLOTS||{};
  const state={
    index:0,
    items:localItems.map(item=>({...item,stats:{...(item.stats||{})},_raw:null,_dbId:null})),
    loaded:false,
    schema:new Set(),
    filters:{search:"",rarity:"all",slot:"all",status:"all"}
  };

  function normalizeImageUrl(value){
    const raw=String(value??"").trim();
    if(!raw)return"";
    try{const url=new URL(raw,window.location.href);return /^https?:$/.test(url.protocol)?url.href:""}catch(_error){return""}
  }

  function rowStats(row){
    const stats=row?.stats&&typeof row.stats==="object"?{...row.stats}:{};
    delete stats._icon;delete stats._image;delete stats._description;delete stats._active;delete stats._required_level;
    return stats;
  }

  function normalizeRow(row){
    const stats=row?.stats&&typeof row.stats==="object"?row.stats:{};
    return{
      id:row.item_key||row.slug||row.id,
      _dbId:row.id||null,
      _raw:{...row},
      name:row.name||row.item_key||"Item sem nome",
      description:row.description||stats._description||"Equipamento disponível na Loja de Wonderland.",
      rarity:row.rarity||"Comum",
      slot:row.slot||row.item_type||"",
      base_value:Number(row.price_wg??row.base_value??0),
      price:Number(row.price_wg??row.base_value??0),
      required_level:Number(row.required_level??stats._required_level??1),
      icon_url:row.icon_url||stats._icon||"",
      icon:row.icon_url||stats._icon||"",
      artwork_url:row.artwork_url||row.image_url||stats._image||"",
      image:row.artwork_url||row.image_url||stats._image||null,
      is_active:row.is_active??stats._active??true,
      active:row.is_active??stats._active??true,
      stats:rowStats(row),
      two_handed:Boolean(row.two_handed),
      occupies_both_hands:Boolean(row.occupies_both_hands),
      _source:"supabase"
    };
  }

  function mergeDatabaseRows(rows){
    if(!rows.length)return;
    state.schema=new Set(Object.keys(rows[0]||{}));
    const locals=[...state.items];
    const used=new Set();
    const merged=rows.map(row=>{
      const dbItem=normalizeRow(row);
      const matchIndex=locals.findIndex((item,index)=>!used.has(index)&&(item.id===dbItem.id||normalize(item.name)===normalize(dbItem.name)));
      if(matchIndex>=0){
        used.add(matchIndex);
        const local=locals[matchIndex];
        return{...local,...dbItem,stats:Object.keys(dbItem.stats||{}).length?dbItem.stats:{...(local.stats||{})}};
      }
      return dbItem;
    });
    locals.forEach((item,index)=>{if(!used.has(index))merged.push(item)});
    state.items=merged;
  }

  async function loadItems(){
    if(state.loaded||!client)return;
    try{
      const {data,error}=await client.from("items").select("*").order("name");
      if(error)throw error;
      mergeDatabaseRows(Array.isArray(data)?data:[]);
    }catch(error){
      console.warn("Não foi possível carregar os itens persistidos. O catálogo local continuará disponível.",error);
    }finally{state.loaded=true}
  }

  function filteredIndexes(){
    const term=normalize(state.filters.search);
    return state.items.map((item,index)=>({item,index})).filter(({item})=>{
      const haystack=normalize(`${item.name} ${item.rarity} ${slotNames[item.slot]||item.slot} ${Object.keys(item.stats||{}).join(" ")}`);
      if(term&&!haystack.includes(term))return false;
      if(state.filters.rarity!=="all"&&item.rarity!==state.filters.rarity)return false;
      if(state.filters.slot!=="all"&&item.slot!==state.filters.slot)return false;
      if(state.filters.status==="active"&&item.is_active===false)return false;
      if(state.filters.status==="inactive"&&item.is_active!==false)return false;
      return true;
    });
  }

  function filterToolbar(){
    const rarities=[...new Set(state.items.map(item=>item.rarity).filter(Boolean))].sort();
    const slots=[...new Set(state.items.map(item=>item.slot).filter(Boolean))].sort();
    return `<section class="admin-item-filters">
      <label class="admin-item-search"><span>Pesquisar</span><input id="adminItemSearch" type="search" value="${esc(state.filters.search)}" placeholder="Nome, raridade ou atributo..."></label>
      <label><span>Raridade</span><select id="adminItemRarity"><option value="all">Todas</option>${rarities.map(value=>`<option value="${esc(value)}" ${state.filters.rarity===value?"selected":""}>${esc(value)}</option>`).join("")}</select></label>
      <label><span>Slot</span><select id="adminItemSlot"><option value="all">Todos</option>${slots.map(value=>`<option value="${esc(value)}" ${state.filters.slot===value?"selected":""}>${esc(slotNames[value]||value)}</option>`).join("")}</select></label>
      <label><span>Status</span><select id="adminItemStatus"><option value="all">Todos</option><option value="active" ${state.filters.status==="active"?"selected":""}>Ativos</option><option value="inactive" ${state.filters.status==="inactive"?"selected":""}>Inativos</option></select></label>
      <div class="admin-item-filter-count"><span>Resultados</span><strong>${filteredIndexes().length}</strong></div>
    </section>`;
  }

  function renderList(){
    const results=filteredIndexes();
    if(!results.length)return '<aside class="admin-record-list"><div class="admin-empty">Nenhum item corresponde aos filtros.</div></aside>';
    return `<aside class="admin-record-list">${results.map(({item,index})=>`<button type="button" class="admin-record-button ${index===state.index?"active":""}" data-local-item-index="${index}"><small>${esc(item.rarity)} • ${esc(slotNames[item.slot]||item.slot)} • ${item.is_active===false?"Inativo":"Ativo"}</small><strong>${esc(item.name)}</strong><span>${esc(Object.entries(item.stats||{}).map(([key,value])=>`${key} +${value}`).join(" • ")||"Sem atributos")}</span></button>`).join("")}</aside>`;
  }

  function field(label,name,value,type="text",extra=""){return `<label class="admin-field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value??"")}" ${extra}></label>`}
  function imagePreview(item){const src=normalizeImageUrl(item.artwork_url||item.image||"");return `<div class="admin-item-image-preview" id="adminItemImagePreview">${src?`<img src="${esc(src)}" alt="Prévia de ${esc(item.name)}" referrerpolicy="no-referrer">`:'<div class="admin-item-image-placeholder">Sem imagem vinculada</div>'}</div>`}

  function renderEditor(){
    const item=state.items[state.index];
    if(!item)return '<div class="admin-empty">Selecione um item para editar.</div>';
    const stats=item.stats||{};
    return `<section class="admin-editor admin-editor-detail"><header><div><span>Editor de item</span><h3>${esc(item.name)}</h3></div></header><form id="adminLocalItemForm" class="admin-edit-form">
      ${field("Nome","name",item.name)}${field("Raridade","rarity",item.rarity)}${field("Slot","slot",item.slot)}${field("Preço em WG","base_value",item.base_value,"number","min=0 step=1")}${field("Nível mínimo","required_level",item.required_level,"number","min=1 max=100")}${field("Ícone","icon_url",item.icon_url)}${field("Imagem por link","artwork_url",item.artwork_url,"text",'inputmode="url" placeholder="https://exemplo.com/item.png"')}
      <div class="admin-field admin-field-wide">${imagePreview(item)}</div>
      <label class="admin-field admin-field-wide"><span>Descrição</span><textarea name="description" rows="4">${esc(item.description||"")}</textarea></label>
      ${["FOR","DEF","RES","INI","INT","ARC"].map(attr=>field(attr,`stat_${attr}`,stats[attr]||0,"number","min=0 step=1")).join("")}
      <label class="admin-field admin-field-check"><span>Duas mãos</span><input type="checkbox" name="two_handed" ${item.two_handed?"checked":""}></label>
      <label class="admin-field admin-field-check"><span>Ocupa os dois slots</span><input type="checkbox" name="occupies_both_hands" ${item.occupies_both_hands?"checked":""}></label>
      <label class="admin-field admin-field-check"><span>Ativo na loja</span><input type="checkbox" name="is_active" ${item.is_active!==false?"checked":""}></label>
      <div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar alterações</button></div><p id="adminLocalItemMessage" class="admin-form-message"></p>
    </form></section>`;
  }

  function bindImagePreview(form,item){
    const input=form.elements.artwork_url;const preview=document.getElementById("adminItemImagePreview");if(!input||!preview)return;
    const update=()=>{const src=normalizeImageUrl(input.value);if(!input.value.trim()){preview.innerHTML='<div class="admin-item-image-placeholder">Sem imagem vinculada</div>';return}if(!src){preview.innerHTML='<div class="admin-item-image-placeholder admin-item-image-error">Link de imagem inválido</div>';return}preview.innerHTML=`<img src="${esc(src)}" alt="Prévia de ${esc(item.name)}" referrerpolicy="no-referrer">`;preview.querySelector("img")?.addEventListener("error",()=>{preview.innerHTML='<div class="admin-item-image-placeholder admin-item-image-error">A imagem não pôde ser carregada.</div>'},{once:true})};
    input.addEventListener("input",update);input.addEventListener("change",update);
  }

  function collectForm(item,form){
    const fd=new FormData(form);const rawImage=String(fd.get("artwork_url")||"").trim();const normalizedImage=normalizeImageUrl(rawImage);
    if(rawImage&&!normalizedImage)throw new Error("O link da imagem é inválido. Use um endereço completo começando com http:// ou https://.");
    item.name=String(fd.get("name")||"").trim();item.rarity=String(fd.get("rarity")||"Comum").trim();item.slot=String(fd.get("slot")||"").trim();item.base_value=Math.max(0,Number(fd.get("base_value")||0));item.price=item.base_value;item.required_level=Math.max(1,Number(fd.get("required_level")||1));item.icon_url=String(fd.get("icon_url")||"").trim();item.icon=item.icon_url;item.artwork_url=normalizedImage;item.image=normalizedImage||null;item.description=String(fd.get("description")||"").trim();item.two_handed=form.elements.two_handed.checked;item.occupies_both_hands=form.elements.occupies_both_hands.checked||item.two_handed;item.is_active=form.elements.is_active.checked;item.active=item.is_active;item.stats={};
    ["FOR","DEF","RES","INI","INT","ARC"].forEach(attr=>{const value=Math.max(0,Number(fd.get(`stat_${attr}`)||0));if(value)item.stats[attr]=value});
  }

  function databasePayload(item){
    const schema=state.schema;
    const payload={};
    const set=(key,value)=>{if(schema.has(key))payload[key]=value};
    set("name",item.name);set("description",item.description);set("slot",item.slot);set("item_type",item.slot);set("rarity",item.rarity);set("price_wg",item.base_value);set("base_value",item.base_value);set("required_level",item.required_level);set("two_handed",item.two_handed);set("occupies_both_hands",item.occupies_both_hands);set("is_active",item.is_active);set("icon_url",item.icon_url||null);set("artwork_url",item.artwork_url||null);set("image_url",item.artwork_url||null);set("item_key",item.id);
    const stats={...item.stats,_icon:item.icon_url||"",_image:item.artwork_url||"",_description:item.description||"",_active:item.is_active,_required_level:item.required_level};
    set("stats",stats);
    return payload;
  }

  async function saveItem(item){
    if(!client)throw new Error("Supabase indisponível. Nada foi salvo.");
    if(!state.schema.size){
      const {data,error}=await client.from("items").select("*").limit(1);
      if(error)throw error;
      if(data?.[0])state.schema=new Set(Object.keys(data[0]));
    }
    const payload=databasePayload(item);
    if(!Object.keys(payload).length)throw new Error("Não foi possível identificar as colunas da tabela items.");
    let response;
    if(item._dbId&&state.schema.has("id"))response=await client.from("items").update(payload).eq("id",item._dbId).select("*").maybeSingle();
    else if(state.schema.has("item_key"))response=await client.from("items").upsert(payload,{onConflict:"item_key"}).select("*").maybeSingle();
    else{
      const found=await client.from("items").select("*").eq("name",item.name).limit(1);
      if(found.error)throw found.error;
      if(found.data?.[0]?.id)response=await client.from("items").update(payload).eq("id",found.data[0].id).select("*").maybeSingle();
      else response=await client.from("items").insert(payload).select("*").maybeSingle();
    }
    if(response.error)throw response.error;
    if(response.data){const normalized=normalizeRow(response.data);Object.assign(item,normalized)}
  }

  function bindFilters(){
    const search=document.getElementById("adminItemSearch");const rarity=document.getElementById("adminItemRarity");const slot=document.getElementById("adminItemSlot");const status=document.getElementById("adminItemStatus");
    search?.addEventListener("input",()=>{state.filters.search=search.value;render()});
    rarity?.addEventListener("change",()=>{state.filters.rarity=rarity.value;render()});
    slot?.addEventListener("change",()=>{state.filters.slot=slot.value;render()});
    status?.addEventListener("change",()=>{state.filters.status=status.value;render()});
  }

  function render(){
    const results=filteredIndexes();if(results.length&&!results.some(({index})=>index===state.index))state.index=results[0].index;
    moduleTitle.textContent="Itens";moduleContent.innerHTML=`${filterToolbar()}<section class="admin-browser">${renderList()}<div class="admin-detail-pane">${renderEditor()}</div></section>`;
    bindFilters();
    moduleContent.querySelectorAll("[data-local-item-index]").forEach(button=>button.addEventListener("click",()=>{state.index=Number(button.dataset.localItemIndex)||0;render()}));
    const form=document.getElementById("adminLocalItemForm");if(!form)return;bindImagePreview(form,state.items[state.index]);
    form.addEventListener("submit",async event=>{
      event.preventDefault();const item=state.items[state.index];const message=document.getElementById("adminLocalItemMessage");const submit=form.querySelector('button[type="submit"]');
      try{collectForm(item,form);submit.disabled=true;message.textContent="Salvando no Supabase...";await saveItem(item);const shopItem=(window.WONDERLAND_SHOP_ITEMS||[]).find(entry=>entry.id===item.id||normalize(entry.name)===normalize(item.name));if(shopItem)Object.assign(shopItem,{name:item.name,rarity:item.rarity,slot:item.slot,price:item.base_value,stats:{...item.stats},icon:item.icon_url||shopItem.icon,image:item.artwork_url||null,twoHanded:item.two_handed,occupiesBoth:item.occupies_both_hands,active:item.is_active,description:item.description});message.textContent="Alterações salvas com sucesso no Supabase."}catch(error){console.error(error);message.textContent=error.message||"Não foi possível salvar o item."}finally{submit.disabled=false}
    });
  }

  itemButton.addEventListener("click",async event=>{event.preventDefault();event.stopImmediatePropagation();document.querySelectorAll("[data-admin-module]").forEach(button=>button.classList.toggle("active",button===itemButton));await loadItems();render()},true);
})();
