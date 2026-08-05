"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const client=window.WONDERLAND_SUPABASE;
  const greeting=document.getElementById("adminGreeting");
  const logout=document.getElementById("adminLogout");
  const moduleTitle=document.getElementById("adminModuleTitle");
  const moduleContent=document.getElementById("adminModuleContent");

  if(!account||!client){window.location.replace("conta.html");return}

  let user;
  try{user=await account.current()}catch(error){console.error(error)}
  if(!user){window.location.replace("conta.html");return}
  if(!account.isAdmin(user)){window.location.replace("personagens.html");return}

  greeting.textContent=`Bem-vindo, ${user.name}. Gerencie o conteúdo e o balanceamento do Wonderland.`;

  const modules={
    races:{title:"Raças",table:"races",id:"id",fields:["id","name","description","tagline","archetype","difficulty","base_hp","base_mana","icon","artwork_url","is_active","sort_order"]},
    classes:{title:"Classes",table:"classes",id:"id",fields:["id","name","description","role","specialization","difficulty","primary_attribute","secondary_attribute","strengths","weaknesses","resource_name","resource_description","icon","artwork_url","is_active","sort_order"]},
    skills:{title:"Habilidades",table:"skills",id:"id",fields:["id","name","description","category","source_type","class_id","class_path_id","race_id","unlock_level","mana_cost","cooldown_turns","range_cells","area_cells","duration_turns","uses_per_combat","is_passive","is_ultimate","is_active","sort_order"]},
    items:{title:"Itens",table:"items",id:"id",fields:["id","name","description","item_type","rarity","max_stack","required_level","base_value","icon_url","artwork_url","is_tradeable","is_active","sort_order"]},
    users:{title:"Usuários",table:"profiles",id:"id",fields:["id","username","display_name","role","is_banned","avatar_url"]},
    settings:{title:"Balanceamento",table:"game_settings",id:"key",fields:["key","category","label","description","value","default_value","value_type","is_public","is_editable"]}
  };

  const labels={
    id:"ID",key:"Chave",name:"Nome",description:"Descrição",tagline:"Frase",archetype:"Arquétipo",difficulty:"Dificuldade",base_hp:"HP Base",base_mana:"Mana Base",icon:"Ícone",artwork_url:"Imagem",is_active:"Ativo",sort_order:"Ordem",
    role:"Função",specialization:"Especialização",primary_attribute:"Atributo principal",secondary_attribute:"Atributo secundário",strengths:"Pontos fortes",weaknesses:"Pontos fracos",resource_name:"Recurso",resource_description:"Descrição do recurso",
    category:"Categoria",source_type:"Origem",class_id:"Classe",class_path_id:"Caminho",race_id:"Raça",unlock_level:"Nível",mana_cost:"Mana",cooldown_turns:"Recarga",range_cells:"Alcance",area_cells:"Área",duration_turns:"Duração",uses_per_combat:"Usos por combate",is_passive:"Passiva",is_ultimate:"Ultimate",
    item_type:"Tipo",rarity:"Raridade",max_stack:"Pilha máxima",required_level:"Nível mínimo",base_value:"Valor",icon_url:"Ícone",is_tradeable:"Negociável",
    username:"Usuário",display_name:"Nome exibido",is_banned:"Banido",avatar_url:"Avatar",value:"Valor",default_value:"Valor padrão",value_type:"Tipo",is_public:"Público",is_editable:"Editável"
  };

  const booleans=new Set(["is_active","is_passive","is_ultimate","is_tradeable","is_banned","is_public","is_editable"]);
  const numbers=new Set(["difficulty","base_hp","base_mana","sort_order","unlock_level","mana_cost","cooldown_turns","range_cells","area_cells","duration_turns","uses_per_combat","max_stack","required_level","base_value"]);
  const longText=new Set(["description","tagline","strengths","weaknesses","resource_description"]);
  const readonly=new Set(["id","key"]);

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const format=value=>typeof value==="boolean"?(value?"Sim":"Não"):value===null||value===undefined||value===""?"—":typeof value==="object"?esc(JSON.stringify(value)):esc(value);

  async function refreshStats(){
    const statMap={statUsers:"profiles",statCharacters:"characters",statRaces:"races",statClasses:"classes",statSkills:"skills",statItems:"items"};
    await Promise.all(Object.entries(statMap).map(async([elementId,table])=>{
      const element=document.getElementById(elementId);
      try{const {count,error}=await client.from(table).select("*",{count:"exact",head:true});if(error)throw error;element.textContent=String(count??0)}catch(error){console.error(error);element.textContent="—"}
    }));
  }

  function inputFor(field,value){
    const label=esc(labels[field]||field);
    if(booleans.has(field))return `<label class="admin-field admin-field-check"><span>${label}</span><input type="checkbox" name="${field}" ${value?"checked":""}></label>`;
    if(longText.has(field))return `<label class="admin-field admin-field-wide"><span>${label}</span><textarea name="${field}" rows="4">${esc(value??"")}</textarea></label>`;
    const type=numbers.has(field)?"number":"text";
    return `<label class="admin-field"><span>${label}</span><input type="${type}" name="${field}" value="${esc(value??"")}" ${readonly.has(field)?"readonly":""}></label>`;
  }

  function normalizeValue(field,input,existing){
    if(booleans.has(field))return input.checked;
    if(numbers.has(field))return input.value===""?null:Number(input.value);
    if(field==="value"||field==="default_value"){
      const raw=input.value.trim();
      if(raw==="")return null;
      try{return JSON.parse(raw)}catch{return raw}
    }
    if(input.value==="")return null;
    return input.value;
  }

  async function loadRows(module){
    const {data,error}=await client.from(module.table).select(module.fields.join(",")).order(module.id,{ascending:true}).limit(200);
    if(error)throw error;
    return data||[];
  }

  function renderTable(module,rows){
    if(!rows.length)return '<div class="admin-empty">Nenhum registro encontrado neste módulo.</div>';
    const previewFields=module.fields.slice(0,Math.min(6,module.fields.length));
    return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${previewFields.map(field=>`<th>${esc(labels[field]||field)}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${rows.map((row,index)=>`<tr>${previewFields.map(field=>`<td>${format(row[field])}</td>`).join("")}<td><button class="wl-button wl-button-gold admin-edit-button" type="button" data-edit-index="${index}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  function renderEditor(module,row,index){
    return `<section class="admin-editor"><header><div><span>Editor</span><h3>${row?`Editar ${esc(row.name||row.label||row.username||row[module.id])}`:`Novo registro`}</h3></div><button type="button" class="wl-button wl-button-ghost" data-close-editor>Fechar</button></header><form id="adminEditForm" class="admin-edit-form" data-edit-index="${index??""}">${module.fields.map(field=>inputFor(field,row?.[field])).join("")}<div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar alterações</button></div><p id="adminFormMessage" class="admin-form-message"></p></form></section>`;
  }

  async function openModule(key){
    const module=modules[key];if(!module)return;
    moduleTitle.textContent=module.title;
    moduleContent.innerHTML='<div class="admin-loading">Consultando o Supabase...</div>';
    try{
      const rows=await loadRows(module);
      moduleContent.innerHTML=`<div class="admin-module-toolbar"><p>${rows.length} registro(s) encontrados.</p></div>${renderTable(module,rows)}<div id="adminEditorHost"></div>`;
      const editorHost=document.getElementById("adminEditorHost");
      moduleContent.querySelectorAll("[data-edit-index]").forEach(button=>button.addEventListener("click",()=>{
        const index=Number(button.dataset.editIndex);editorHost.innerHTML=renderEditor(module,rows[index],index);bindEditor(module,rows,index,editorHost);
      }));
    }catch(error){console.error(error);moduleContent.innerHTML=`<div class="admin-error">${esc(error.message||"Não foi possível carregar este módulo.")}</div>`}
  }

  function bindEditor(module,rows,index,host){
    host.querySelector("[data-close-editor]")?.addEventListener("click",()=>host.innerHTML="");
    const form=host.querySelector("#adminEditForm");
    form?.addEventListener("submit",async event=>{
      event.preventDefault();
      const message=form.querySelector("#adminFormMessage");
      const row=rows[index];
      const payload={};
      module.fields.forEach(field=>{if(readonly.has(field))return;const input=form.elements.namedItem(field);if(input)payload[field]=normalizeValue(field,input,row)});
      message.textContent="Salvando...";
      try{
        const {error}=await client.from(module.table).update(payload).eq(module.id,row[module.id]);
        if(error)throw error;
        message.textContent="Alterações salvas com sucesso.";
        await refreshStats();
        window.setTimeout(()=>openModule(Object.keys(modules).find(key=>modules[key]===module)),300);
      }catch(error){console.error(error);message.textContent=error.message||"Não foi possível salvar."}
    });
  }

  document.querySelectorAll("[data-admin-module]").forEach(button=>button.addEventListener("click",()=>openModule(button.dataset.adminModule)));
  logout?.addEventListener("click",async()=>{await account.logout();window.location.assign("conta.html")});
  await refreshStats();
})();
