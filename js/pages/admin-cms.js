"use strict";
(function(){
  const client=window.WONDERLAND_SUPABASE;
  const moduleContent=document.getElementById("adminModuleContent");
  const moduleTitle=document.getElementById("adminModuleTitle");
  const settingsButton=document.querySelector('[data-admin-module="settings"]');
  if(!client||!moduleContent||!moduleTitle||!settingsButton)return;

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const state={rows:[],selected:null,filter:"all"};
  const categoryNames={attributes:"Atributos",economy:"Economia",combat:"Combate",progression:"Progressão",world:"Mundo"};

  async function load(){
    const {data,error}=await client.from("game_balance").select("*").order("category",{ascending:true}).order("label",{ascending:true});
    if(error)throw error;
    state.rows=data||[];
    if(!state.selected&&state.rows.length)state.selected=state.rows[0].key;
    render();
  }

  function filtered(){return state.rows.filter(row=>state.filter==="all"||row.category===state.filter)}
  function selected(){return state.rows.find(row=>row.key===state.selected)||null}
  function render(){
    const categories=[...new Set(state.rows.map(row=>row.category))];
    const row=selected();
    moduleTitle.textContent="Balanceamento";
    moduleContent.innerHTML=`<section class="admin-cms-toolbar"><div><span>Engine de regras</span><h3>Configurações globais do Wonderland</h3><p>Altere números usados por todas as páginas e sistemas.</p></div><label><span>Categoria</span><select id="adminBalanceFilter"><option value="all">Todas</option>${categories.map(value=>`<option value="${esc(value)}" ${state.filter===value?"selected":""}>${esc(categoryNames[value]||value)}</option>`).join("")}</select></label></section><section class="admin-browser admin-cms-browser"><aside class="admin-record-list">${filtered().map(item=>`<button type="button" class="admin-record-button ${item.key===state.selected?"active":""}" data-balance-key="${esc(item.key)}"><small>${esc(categoryNames[item.category]||item.category)}</small><strong>${esc(item.label)}</strong><span>${esc(item.description||"")}</span></button>`).join("")||'<div class="admin-empty">Nenhuma configuração encontrada.</div>'}</aside><div class="admin-detail-pane">${row?editor(row):'<div class="admin-empty">Selecione uma configuração.</div>'}</div></section>`;
    bind();
  }

  function editor(row){
    const raw=typeof row.value==="string"?row.value:JSON.stringify(row.value);
    return `<section class="admin-editor admin-editor-detail admin-balance-editor"><header><div><span>${esc(categoryNames[row.category]||row.category)}</span><h3>${esc(row.label)}</h3><p>${esc(row.description||"")}</p></div><code>${esc(row.key)}</code></header><form id="adminBalanceForm" class="admin-edit-form"><label class="admin-field admin-field-wide"><span>Valor</span><input name="value" value="${esc(raw)}"></label><div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar configuração</button></div><p id="adminBalanceMessage" class="admin-form-message"></p></form></section>`
  }

  function parseValue(raw){
    const value=String(raw??"").trim();
    if(value==="")return null;
    if(/^-?\d+(?:[.,]\d+)?$/.test(value))return Number(value.replace(",","."));
    if(value==="true")return true;
    if(value==="false")return false;
    try{return JSON.parse(value)}catch{return value}
  }

  async function saveDirect(row,value){
    const lookup=await client.from("game_balance").select("*").eq("key",row.key).limit(1);
    if(lookup.error)throw lookup.error;
    const payload={...row,value};
    delete payload.updated_at;
    delete payload.created_at;
    const response=lookup.data?.length
      ?await client.from("game_balance").update({value}).eq("key",row.key).select("*").limit(1)
      :await client.from("game_balance").insert(payload).select("*").limit(1);
    if(response.error)throw response.error;
    return response.data?.[0]||{...row,value};
  }

  async function saveBalance(row,value){
    const rpc=await client.rpc("admin_save_balance",{p_key:row.key,p_value:value});
    if(!rpc.error)return Array.isArray(rpc.data)?rpc.data[0]:rpc.data;
    const message=String(rpc.error.message||"");
    if(/ON CONFLICT|unique or exclusion constraint/i.test(message))return saveDirect(row,value);
    throw rpc.error;
  }

  function bind(){
    document.getElementById("adminBalanceFilter")?.addEventListener("change",event=>{state.filter=event.target.value;const available=filtered();if(!available.some(row=>row.key===state.selected))state.selected=available[0]?.key||null;render()});
    moduleContent.querySelectorAll("[data-balance-key]").forEach(button=>button.addEventListener("click",()=>{state.selected=button.dataset.balanceKey;render()}));
    const form=document.getElementById("adminBalanceForm");
    if(!form)return;
    form.addEventListener("submit",async event=>{
      event.preventDefault();
      const row=selected();
      const message=document.getElementById("adminBalanceMessage");
      const submit=form.querySelector('button[type="submit"]');
      try{
        submit.disabled=true;
        message.textContent="Salvando no banco...";
        const value=parseValue(form.elements.value.value);
        const saved=await saveBalance(row,value);
        if(saved)Object.assign(row,saved);else row.value=value;
        message.textContent="Configuração salva e sincronizada.";
      }catch(error){
        console.error(error);
        message.textContent=error.message||"Não foi possível salvar esta configuração.";
      }finally{submit.disabled=false}
    });
  }

  settingsButton.addEventListener("click",async event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    document.querySelectorAll("[data-admin-module]").forEach(button=>button.classList.toggle("active",button===settingsButton));
    moduleTitle.textContent="Balanceamento";
    moduleContent.innerHTML='<div class="admin-loading">Carregando configurações...</div>';
    try{await load()}catch(error){moduleContent.innerHTML=`<div class="admin-error">${esc(error.message||"Não foi possível carregar o balanceamento.")}</div>`}
  },true);
})();
