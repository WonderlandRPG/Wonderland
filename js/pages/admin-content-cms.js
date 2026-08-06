"use strict";
(function(){
  const client=window.WONDERLAND_SUPABASE;
  const store=window.WONDERLAND_CONTENT_STORE;
  const host=document.getElementById("adminModuleContent");
  const title=document.getElementById("adminModuleTitle");
  if(!client||!host||!title)return;

  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const slug=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  const normalize=v=>String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const labels={races:"Raças",classes:"Classes",paths:"Caminhos",skills:"Habilidades",passives:"Passivas",mechanics:"Mecânicas"};
  const tables={races:"races",classes:"classes",paths:"class_paths",skills:"skills",passives:"passives",mechanics:"combat_mechanics"};
  const keys={races:"id",classes:"id",paths:"id",skills:"id",passives:"id",mechanics:"mechanic_key"};
  const state={module:"races",rows:[],selected:null,classes:[],races:[],paths:[],source:"db",search:""};

  async function bootstrapLocal(){
    if(!store)return;
    const data=await store.load();
    const payloads=[
      ["races",data.races.map(({_local,...r})=>r),"id"],
      ["classes",data.classes.map(({_local,...r})=>r),"id"],
      ["class_paths",data.paths.map(({_local,...r})=>r),"id"],
      ["passives",data.passives.map(r=>{const {_local,id,...rest}=r;return rest}),"passive_key"],
      ["skills",data.skills.map(r=>{const {_local,id,...rest}=r;return rest}),"skill_key"]
    ];
    for(const [table,rows,onConflict] of payloads){
      if(!rows.length)continue;
      const {error}=await client.from(table).upsert(rows,{onConflict,ignoreDuplicates:false});
      if(error)console.warn(`Falha ao importar ${table}:`,error);
    }
  }

  function sourceOptions(type,value){
    const options=[];
    if(type==="race")state.races.forEach(r=>options.push(`<option value="${esc(r.id)}" ${value===r.id?"selected":""}>${esc(r.name)}</option>`));
    if(type==="class")state.classes.forEach(c=>options.push(`<option value="${esc(c.id)}" ${value===c.id?"selected":""}>${esc(c.name)}</option>`));
    if(type==="path")state.paths.forEach(p=>options.push(`<option value="${esc(p.id)}" ${value===p.id?"selected":""}>${esc(p.name)} — ${esc(state.classes.find(c=>c.id===p.class_id)?.name||p.class_id)}</option>`));
    return options.join("");
  }

  function field(label,name,value,type="text",wide=false){return `<label class="admin-field ${wide?"admin-field-wide":""}"><span>${esc(label)}</span><input name="${name}" type="${type}" value="${esc(value??"")}"></label>`}
  function textarea(label,name,value,rows=6){return `<label class="admin-field admin-field-wide"><span>${esc(label)}</span><textarea name="${name}" rows="${rows}">${esc(value??"")}</textarea></label>`}
  function select(label,name,options,wide=false){return `<label class="admin-field ${wide?"admin-field-wide":""}"><span>${esc(label)}</span><select name="${name}">${options}</select></label>`}
  function check(label,name,value){return `<label class="admin-field admin-field-check"><span>${esc(label)}</span><input type="checkbox" name="${name}" ${value?"checked":""}></label>`}

  function editorRace(row){return `${field("Identificador","id",row.id)}${field("Nome","name",row.name)}${textarea("Descrição","description",row.description)}${field("Arquétipo","archetype",row.archetype)}${field("Dificuldade","difficulty",row.difficulty,"number")}${field("HP inicial","base_hp",row.base_hp,"number")}${field("Mana inicial","base_mana",row.base_mana,"number")}${field("Nome da mecânica","mechanic_name",row.mechanic_name)}${textarea("Descrição da mecânica","mechanic_description",row.mechanic_description,4)}${field("Imagem","artwork_url",row.artwork_url)}${check("Ativa","is_active",row.is_active!==false)}`}
  function editorClass(row){return `${field("Identificador","id",row.id)}${field("Nome","name",row.name)}${textarea("Descrição","description",row.description)}${field("Função","role",row.role)}${field("Especialização","specialization",row.specialization)}${field("Dificuldade","difficulty",row.difficulty,"number")}${field("Atributo principal","primary_attribute",row.primary_attribute)}${field("Atributo secundário","secondary_attribute",row.secondary_attribute)}${field("Nome do recurso","resource_name",row.resource_name)}${textarea("Descrição do recurso","resource_description",row.resource_description,4)}${field("Imagem","artwork_url",row.artwork_url)}${check("Ativa","is_active",row.is_active!==false)}`}
  function editorPath(row){return `${select("Classe","class_id",sourceOptions("class",row.class_id))}${field("Identificador","id",row.id)}${field("Nome","name",row.name)}${textarea("Cole aqui o texto completo do Caminho","description",row.description,10)}${field("Especialização","specialization",row.specialization)}${field("Complexidade","complexity",row.complexity)}${check("Ativo","is_active",row.is_active!==false)}`}
  function editorSkill(row){const source=row.source_type||"class";return `${field("Nome","name",row.name)}${field("Chave","skill_key",row.skill_key)}${select("Origem","source_type",["race","class","path"].map(v=>`<option value="${v}" ${source===v?"selected":""}>${v==="race"?"Raça":v==="class"?"Classe":"Caminho"}</option>`).join(""))}${select(source==="race"?"Raça":source==="class"?"Classe":"Caminho",source==="race"?"race_id":source==="class"?"class_id":"class_path_id",sourceOptions(source,row[source==="race"?"race_id":source==="class"?"class_id":"class_path_id"]))}${textarea("Descrição completa","description",row.description,9)}${field("Nível","unlock_level",row.unlock_level,"number")}${field("Mana","mana_cost",row.mana_cost,"number")}${field("Recarga","cooldown_turns",row.cooldown_turns,"number")}${field("Alcance","range_cells",row.range_cells,"number")}${field("Escala %","scale_percent",row.scale_percent,"number")}${field("Atributo de escala","scale_attribute",row.scale_attribute)}${select("Alvo","target_type",["enemy","self","ally","area"].map(v=>`<option value="${v}" ${row.target_type===v?"selected":""}>${v}</option>`).join(""))}${select("Tipo de dano","damage_type",["physical","magical","true","none"].map(v=>`<option value="${v}" ${row.damage_type===v?"selected":""}>${v}</option>`).join(""))}${textarea("Efeitos estruturados (JSON)","effect_schema",JSON.stringify(row.effect_schema||[],null,2),8)}${check("Ultimate","is_ultimate",row.is_ultimate)}${check("Ativa","is_active",row.is_active!==false)}`}
  function editorPassive(row){const source=row.source_type||"class";return `${field("Nome","name",row.name)}${field("Chave","passive_key",row.passive_key)}${select("Origem","source_type",["race","class","path"].map(v=>`<option value="${v}" ${source===v?"selected":""}>${v==="race"?"Raça":v==="class"?"Classe":"Caminho"}</option>`).join(""))}${select(source==="race"?"Raça":source==="class"?"Classe":"Caminho",source==="race"?"race_id":source==="class"?"class_id":"class_path_id",sourceOptions(source,row[source==="race"?"race_id":source==="class"?"class_id":"class_path_id"]))}${textarea("Descrição completa","description",row.description,9)}${textarea("Efeitos estruturados (JSON)","effect_schema",JSON.stringify(row.effect_schema||[],null,2),8)}${check("Ativa","is_active",row.is_active!==false)}`}
  function editorMechanic(row){const source=row.source_type||"global";return `${field("Chave","mechanic_key",row.mechanic_key)}${field("Nome","name",row.name)}${select("Origem","source_type",["global","race","class","path"].map(v=>`<option value="${v}" ${source===v?"selected":""}>${v}</option>`).join(""))}${source!=="global"?select(source==="race"?"Raça":source==="class"?"Classe":"Caminho",source==="race"?"race_id":source==="class"?"class_id":"class_path_id",sourceOptions(source,row[source==="race"?"race_id":source==="class"?"class_id":"class_path_id"])):""}${textarea("Cole aqui o texto completo da mecânica","description",row.description,9)}${field("Valor inicial","initial_value",row.initial_value,"number")}${field("Valor máximo","max_value",row.max_value,"number")}${textarea("Ganho (JSON)","gain_schema",JSON.stringify(row.gain_schema||[],null,2),6)}${textarea("Gasto (JSON)","spend_schema",JSON.stringify(row.spend_schema||[],null,2),6)}${textarea("Efeitos (JSON)","effect_schema",JSON.stringify(row.effect_schema||[],null,2),6)}${check("Ativa","is_active",row.is_active!==false)}`}

  function editor(row){if(!row)return'<div class="admin-empty admin-cms-empty"><strong>Nenhum registro selecionado.</strong><span>Importe o conteúdo atual ou crie um novo registro.</span></div>';const body=state.module==="races"?editorRace(row):state.module==="classes"?editorClass(row):state.module==="paths"?editorPath(row):state.module==="skills"?editorSkill(row):state.module==="passives"?editorPassive(row):editorMechanic(row);return `<section class="admin-editor admin-cms-editor"><header><div><span>Editor guiado</span><h3>${esc(row.name||row.mechanic_key||"Novo registro")}</h3></div><span class="admin-cms-source">${row._local?"Catálogo local":"Banco de dados"}</span></header><form id="cmsForm" class="admin-edit-form">${body}<div class="admin-form-actions"><button class="wl-button wl-button-green" type="submit">Salvar</button><button class="wl-button wl-button-red" type="button" id="cmsDelete">Excluir</button></div><p id="cmsMessage" class="admin-form-message"></p></form></section>`}

  function searchableText(row){return normalize([row.name,row.id,row.skill_key,row.passive_key,row.mechanic_key,row.class_id,row.race_id,row.class_path_id,row.source_type,row.description,state.classes.find(c=>c.id===row.class_id)?.name,state.races.find(r=>r.id===row.race_id)?.name,state.paths.find(p=>p.id===row.class_path_id)?.name].filter(Boolean).join(" "))}
  function visibleRows(){const q=normalize(state.search);return q?state.rows.filter(row=>searchableText(row).includes(q)):state.rows}

  function render(){
    title.textContent=labels[state.module];
    const key=keys[state.module],selected=state.rows.find(r=>String(r[key])===String(state.selected));
    const rows=visibleRows();
    host.innerHTML=`<section class="admin-cms-hero"><div><span>Biblioteca viva</span><h3>${labels[state.module]}</h3><p>Edite o conteúdo do RPG sem tocar no código. Registros locais podem ser importados para o banco.</p></div><div class="admin-cms-actions"><button id="cmsImport" class="wl-button wl-button-ghost" type="button">Importar conteúdo atual</button><button id="cmsCreate" class="wl-button wl-button-gold" type="button">Criar novo</button></div></section><section class="admin-cms-toolbar"><input id="cmsSearch" type="search" value="${esc(state.search)}" placeholder="Pesquisar por nome, classe, raça ou chave..."><span>${rows.length} de ${state.rows.length} registro(s)</span></section><section class="admin-browser admin-cms-browser"><aside class="admin-record-list" id="cmsList">${rows.map(r=>`<button class="admin-record-button ${String(r[key])===String(state.selected)?"active":""}" data-id="${esc(r[key])}"><small>${esc(r.source_type||r.class_id||r.id||r[key])}${r._local?" • local":""}</small><strong>${esc(r.name||r.skill_key||r.passive_key||r.mechanic_key)}</strong></button>`).join("")||'<div class="admin-empty">Nenhum registro encontrado com essa pesquisa.</div>'}</aside><div class="admin-detail-pane">${editor(selected)}</div></section>`;
    bind();
  }

  function readForm(form,row){const fd=new FormData(form),p={};for(const [k,v] of fd.entries())p[k]=v;form.querySelectorAll('input[type="checkbox"]').forEach(el=>p[el.name]=el.checked);["difficulty","base_hp","base_mana","unlock_level","mana_cost","cooldown_turns","range_cells","scale_percent","initial_value","max_value"].forEach(k=>{if(k in p)p[k]=p[k]===""?null:Number(p[k])});["effect_schema","gain_schema","spend_schema"].forEach(k=>{if(k in p){try{p[k]=JSON.parse(p[k]||"[]")}catch{throw new Error(`${k} contém JSON inválido.`)}}});if(state.module==="skills"||state.module==="passives"){p.race_id=p.source_type==="race"?p.race_id:null;p.class_id=p.source_type==="class"?p.class_id:null;p.class_path_id=p.source_type==="path"?p.class_path_id:null}if(state.module==="mechanics"){p.race_id=p.source_type==="race"?p.race_id:null;p.class_id=p.source_type==="class"?p.class_id:null;p.class_path_id=p.source_type==="path"?p.class_path_id:null}const key=keys[state.module];if(state.module==="paths"&&!p.id)p.id=slug(p.name);if(state.module==="races"&&!p.id)p.id=slug(p.name);if(state.module==="classes"&&!p.id)p.id=slug(p.name);if(state.module==="skills"&&!p.skill_key)p.skill_key=`${p.source_type}-${slug(p.name)}`;if(state.module==="passives"&&!p.passive_key)p.passive_key=`${p.source_type}-${slug(p.name)}`;if(state.module==="mechanics"&&!p.mechanic_key)p.mechanic_key=`${p.source_type}-${slug(p.name)}`;if(row&&String(row[key]||"").startsWith("novo-"))delete p[key];return p}

  function bind(){
    host.querySelectorAll("[data-id]").forEach(b=>b.addEventListener("click",()=>{state.selected=b.dataset.id;render()}));
    document.getElementById("cmsSearch")?.addEventListener("input",e=>{state.search=e.target.value;render()});
    document.getElementById("cmsImport")?.addEventListener("click",async()=>{const btn=document.getElementById("cmsImport");btn.disabled=true;btn.textContent="Importando...";await bootstrapLocal();await load(state.module)});
    document.getElementById("cmsCreate")?.addEventListener("click",()=>{const key=keys[state.module],row={[key]:`novo-${Date.now()}`,name:"Novo registro",is_active:true};if(state.module==="paths")row.class_id=state.classes[0]?.id||"";if(["skills","passives"].includes(state.module)){row.source_type="class";row.class_id=state.classes[0]?.id||"";row.effect_schema=[]}if(state.module==="mechanics"){row.source_type="global";row.gain_schema=[];row.spend_schema=[];row.effect_schema=[]}state.rows.unshift(row);state.selected=row[key];state.search="";render()});
    const form=document.getElementById("cmsForm");if(!form)return;const key=keys[state.module],row=state.rows.find(r=>String(r[key])===String(state.selected)),msg=document.getElementById("cmsMessage");
    form.addEventListener("submit",async e=>{e.preventDefault();try{const payload=readForm(form,row),table=tables[state.module],isNew=String(row[key]||"").startsWith("novo-")||row._local;msg.textContent="Salvando...";let response;if(isNew)response=await client.from(table).insert(payload).select("*").single();else response=await client.from(table).update(payload).eq(key,row[key]).select("*").single();if(response.error)throw response.error;msg.textContent="Salvo com sucesso.";await load(state.module)}catch(error){console.error(error);msg.textContent=error.message||"Não foi possível salvar."}});
    document.getElementById("cmsDelete")?.addEventListener("click",async()=>{if(!confirm("Excluir este registro?"))return;if(row._local||String(row[key]||"").startsWith("novo-")){state.rows=state.rows.filter(item=>item!==row);state.selected=state.rows[0]?.[key]||null;render();return}const {error}=await client.from(tables[state.module]).delete().eq(key,row[key]);if(error){msg.textContent=error.message;return}await load(state.module)});
  }

  async function load(module){
    state.module=module;state.search="";
    const data=store?await store.load():null;
    state.classes=data?.classes||[];state.races=data?.races||[];state.paths=data?.paths||[];
    const table=tables[module],key=keys[module];
    const {data:dbRows,error}=await client.from(table).select("*").order(key);
    if(error){host.innerHTML=`<div class="admin-error">${esc(error.message)}</div>`;return}
    const localRows=data?.[module]||[];
    const dbKeys=new Set((dbRows||[]).map(r=>String(r[key]||r.skill_key||r.passive_key)));
    const extras=localRows.filter(r=>!dbKeys.has(String(r[key]||r.skill_key||r.passive_key))).map(r=>({...r,_local:true}));
    state.rows=[...(dbRows||[]),...extras];state.selected=state.rows[0]?.[key]||null;render();
  }

  document.querySelector('[data-admin-module="races"]')?.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();load("races")},true);
  document.querySelector('[data-admin-module="classes"]')?.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();load("classes")},true);
  document.querySelector('[data-admin-module="skills"]')?.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();load("skills")},true);
  const nav=document.querySelector(".admin-module-nav");if(nav&&!nav.querySelector('[data-admin-module="paths"]')){const insert=(key,label,sub)=>{const b=document.createElement("button");b.type="button";b.dataset.adminModule=key;b.innerHTML=`<span>✦</span><strong>${label}</strong><small>${sub}</small>`;nav.insertBefore(b,nav.querySelector('[data-admin-module="items"]'));b.addEventListener("click",()=>load(key))};insert("paths","Caminhos","Especializações de classe");insert("passives","Passivas","Regras permanentes");insert("mechanics","Mecânicas","Recursos e gatilhos")}
})();
