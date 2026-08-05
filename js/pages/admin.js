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

  const classSource=window.WONDERLAND_CLASSES||{};
  const raceSource=Array.isArray(window.WONDERLAND_RACES)?window.WONDERLAND_RACES:[];

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
  const levelNumber=value=>Number(String(value??1).replace(/\D+/g,""))||1;
  const starsToNumber=value=>Math.max(1,Math.min(5,(String(value||"").match(/★/g)||[]).length||1));
  const classAttrs=cls=>{
    const source=String(cls?.estilo?.atributos||"").toUpperCase();
    const attrs=["FOR","DEF","RES","INI","INT","ARC"].filter(attr=>source.includes(attr));
    return{primary:attrs[0]||null,secondary:attrs[1]||null};
  };

  const localClasses=()=>Object.values(classSource).map((cls,index)=>{
    const attrs=classAttrs(cls);
    return{
      id:cls.id,name:cls.nome,description:cls.descricao||"",role:cls.cargo||"",specialization:cls.especializacao?.titulo||cls.cargo||"",
      difficulty:starsToNumber(cls.dificuldade),primary_attribute:attrs.primary,secondary_attribute:attrs.secondary,
      strengths:cls.estilo?.fortes||"",weaknesses:cls.estilo?.fracos||"",resource_name:"Mana",resource_description:cls.recurso?.descricao||"",
      icon:cls.icone||"",artwork_url:cls.imagem||"",is_active:true,sort_order:index,_source:"local"
    };
  });

  const localRaces=()=>raceSource.map((race,index)=>({
    id:race.id,name:race.name,description:race.description||race.descricao||"",tagline:race.tagline||"",archetype:race.archetype||"",
    difficulty:starsToNumber(race.difficulty||race.dificuldade),base_hp:Number(race.stats?.hp||race.hp||0),base_mana:Number(race.stats?.mana||race.mana||0),
    icon:race.icon||"",artwork_url:race.artwork||race.image||"",is_active:true,sort_order:index,_source:"local"
  }));

  const localSkills=()=>{
    const rows=[];
    Object.values(classSource).forEach(cls=>{
      (cls.passivas||[]).forEach((skill,index)=>rows.push({id:`${cls.id}-passiva-${index+1}`,name:skill.nome,description:skill.descricao||"",category:"Passiva",source_type:"class",class_id:cls.id,class_path_id:null,race_id:null,unlock_level:1,mana_cost:0,cooldown_turns:null,range_cells:null,area_cells:null,duration_turns:null,uses_per_combat:null,is_passive:true,is_ultimate:false,is_active:true,sort_order:index,_source:"local"}));
      (cls.progressao||[]).forEach((skill,index)=>rows.push({id:`${cls.id}-${String(skill.nome).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,name:skill.nome,description:skill.descricao||"",category:skill.categoria||"Habilidade",source_type:"class",class_id:cls.id,class_path_id:null,race_id:null,unlock_level:levelNumber(skill.nivel),mana_cost:window.WONDERLAND_SKILL_COSTS?.get?.({classId:cls.id,skill})?.value||0,cooldown_turns:null,range_cells:null,area_cells:null,duration_turns:null,uses_per_combat:null,is_passive:false,is_ultimate:false,is_active:true,sort_order:index,_source:"local"}));
      (cls.caminhos||[]).forEach(path=>{
        if(path.passiva)rows.push({id:`${cls.id}-${path.id}-passiva`,name:path.passiva.nome,description:path.passiva.descricao||"",category:"Passiva de Caminho",source_type:"class_path",class_id:cls.id,class_path_id:path.id,race_id:null,unlock_level:50,mana_cost:0,cooldown_turns:null,range_cells:null,area_cells:null,duration_turns:null,uses_per_combat:null,is_passive:true,is_ultimate:false,is_active:true,sort_order:0,_source:"local"});
        (path.habilidades||[]).forEach((skill,index)=>rows.push({id:`${cls.id}-${path.id}-${String(skill.nome).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,name:skill.nome,description:skill.descricao||"",category:skill.tipo||"Habilidade",source_type:"class_path",class_id:cls.id,class_path_id:path.id,race_id:null,unlock_level:[60,70,80,90,100][index]||100,mana_cost:window.WONDERLAND_SKILL_COSTS?.get?.({classId:cls.id,skill,pathId:path.id})?.value||0,cooldown_turns:null,range_cells:null,area_cells:null,duration_turns:null,uses_per_combat:null,is_passive:false,is_ultimate:String(skill.tipo).toLowerCase()==="ultimate",is_active:true,sort_order:index,_source:"local"}));
      });
    });
    raceSource.forEach(race=>{
      (race.progression||race.progressao||[]).forEach((skill,index)=>rows.push({id:`${race.id}-${String(skill.name||skill.nome).toLowerCase().replace(/[^a-z0-9]+/g,"-")}`,name:skill.name||skill.nome,description:skill.description||skill.descricao||"",category:skill.category||skill.categoria||"Habilidade racial",source_type:"race",class_id:null,class_path_id:null,race_id:race.id,unlock_level:levelNumber(skill.level||skill.nivel),mana_cost:Number(skill.mana_cost||skill.manaCost||0),cooldown_turns:skill.cooldown_turns||null,range_cells:null,area_cells:null,duration_turns:null,uses_per_combat:null,is_passive:Boolean(skill.is_passive),is_ultimate:Boolean(skill.is_ultimate),is_active:true,sort_order:index,_source:"local"}));
    });
    return rows;
  };

  async function refreshStats(){
    const statMap={statUsers:"profiles",statCharacters:"characters",statRaces:"races",statClasses:"classes",statSkills:"skills",statItems:"items"};
    await Promise.all(Object.entries(statMap).map(async([elementId,table])=>{
      const element=document.getElementById(elementId);
      try{
        const {count,error}=await client.from(table).select("*",{count:"exact",head:true});
        if(error)throw error;
        let value=count??0;
        if(value===0&&table==="races")value=localRaces().length;
        if(value===0&&table==="classes")value=localClasses().length;
        if(value===0&&table==="skills")value=localSkills().length;
        element.textContent=String(value);
      }catch(error){console.error(error);element.textContent="—"}
    }));
  }

  function inputFor(field,value){
    const label=esc(labels[field]||field);
    if(booleans.has(field))return `<label class="admin-field admin-field-check"><span>${label}</span><input type="checkbox" name="${field}" ${value?"checked":""}></label>`;
    if(longText.has(field))return `<label class="admin-field admin-field-wide"><span>${label}</span><textarea name="${field}" rows="4">${esc(value??"")}</textarea></label>`;
    const type=numbers.has(field)?"number":"text";
    return `<label class="admin-field"><span>${label}</span><input type="${type}" name="${field}" value="${esc(value??"")}" ${readonly.has(field)?"readonly":""}></label>`;
  }

  function normalizeValue(field,input){
    if(booleans.has(field))return input.checked;
    if(numbers.has(field))return input.value===""?null:Number(input.value);
    if(field==="value"||field==="default_value"){
      const raw=input.value.trim();
      if(raw==="")return null;
      try{return JSON.parse(raw)}catch{return raw}
    }
    return input.value===""?null:input.value;
  }

  async function loadRows(moduleKey,module){
    const {data,error}=await client.from(module.table).select(module.fields.join(",")).order(module.id,{ascending:true}).limit(500);
    if(error)throw error;
    if(data?.length)return data;
    if(moduleKey==="classes")return localClasses();
    if(moduleKey==="races")return localRaces();
    if(moduleKey==="skills")return localSkills();
    return[];
  }

  async function loadRelated(moduleKey,row){
    if(row._source==="local"){
      if(moduleKey==="classes")return localSkills().filter(skill=>skill.class_id===row.id);
      if(moduleKey==="races")return localSkills().filter(skill=>skill.race_id===row.id);
      return[];
    }
    if(moduleKey==="classes"){
      const {data,error}=await client.from("skills").select("id,name,description,category,unlock_level,mana_cost,cooldown_turns,is_passive,is_ultimate,is_active,class_path_id").eq("class_id",row.id).order("unlock_level",{ascending:true});
      if(error)throw error;
      return data||[];
    }
    if(moduleKey==="races"){
      const {data,error}=await client.from("skills").select("id,name,description,category,unlock_level,mana_cost,cooldown_turns,is_passive,is_ultimate,is_active").eq("race_id",row.id).order("unlock_level",{ascending:true});
      if(error)throw error;
      return data||[];
    }
    if(moduleKey==="users"){
      const {data,error}=await client.from("characters").select("id,name,race_id,class_id,level,experience,created_at").eq("user_id",row.id).order("created_at",{ascending:true});
      if(error)throw error;
      return data||[];
    }
    return[];
  }

  function renderRecordList(module,rows){
    if(!rows.length)return '<div class="admin-empty">Nenhum registro encontrado neste módulo.</div>';
    return `<aside class="admin-record-list">${rows.map((row,index)=>`<button type="button" class="admin-record-button" data-record-index="${index}"><small>${esc(row[module.id])}</small><strong>${esc(row.name||row.label||row.username||row.display_name||row[module.id])}</strong><span>${esc(row.role||row.category||row.source_type||row.item_type||"")}</span></button>`).join("")}</aside>`;
  }

  function renderEditor(module,row,index,related,moduleKey){
    const relatedTitle=moduleKey==="classes"?"Habilidades da classe":moduleKey==="races"?"Habilidades raciais":moduleKey==="users"?"Personagens da conta":"";
    const sourceNote=row._source==="local"?'<p class="admin-form-message">Dados oficiais carregados dos arquivos do site. Ao salvar, este registro será criado no Supabase.</p>':"";
    const relatedHtml=relatedTitle?`<section class="admin-related"><header><span>Conteúdo vinculado</span><h3>${relatedTitle}</h3></header>${related.length?related.map((item,relatedIndex)=>`<article class="admin-related-card"><div><small>${esc(item.category||`Nível ${item.level||item.unlock_level||1}`)}</small><h4>${esc(item.name)}</h4><p>${esc(item.description||"")}</p></div><div class="admin-related-meta">${item.unlock_level!==undefined?`<span>Nível ${esc(item.unlock_level)}</span>`:""}${item.mana_cost!==undefined?`<span>Mana ${esc(item.mana_cost)}</span>`:""}${item.cooldown_turns!==undefined&&item.cooldown_turns!==null?`<span>Recarga ${esc(item.cooldown_turns)}</span>`:""}</div><button type="button" class="wl-button wl-button-gold" data-related-edit="${relatedIndex}">Editar</button></article>`).join(""):"<div class='admin-empty'>Nenhum conteúdo vinculado encontrado.</div>"}</section>`:"";
    return `<section class="admin-editor admin-editor-detail"><header><div><span>Editor</span><h3>${esc(row.name||row.label||row.username||row[module.id])}</h3></div></header><form id="adminEditForm" class="admin-edit-form" data-edit-index="${index}">${module.fields.map(field=>inputFor(field,row?.[field])).join("")}<div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar alterações</button></div>${sourceNote}<p id="adminFormMessage" class="admin-form-message"></p></form>${relatedHtml}</section>`;
  }

  function renderRelatedEditor(item,index){
    const fields=["name","description","category","unlock_level","mana_cost","cooldown_turns","is_passive","is_ultimate","is_active"];
    return `<section class="admin-related-editor"><header><div><span>Editar habilidade</span><h3>${esc(item.name)}</h3></div><button type="button" class="wl-button wl-button-ghost" data-close-related>Fechar</button></header><form id="adminRelatedForm" data-related-index="${index}" class="admin-edit-form">${fields.map(field=>inputFor(field,item[field])).join("")}<div class="admin-form-actions"><button type="submit" class="wl-button wl-button-green">Salvar habilidade</button></div><p id="adminRelatedMessage" class="admin-form-message"></p></form></section>`;
  }

  async function openModule(key){
    const module=modules[key];if(!module)return;
    moduleTitle.textContent=module.title;
    moduleContent.innerHTML='<div class="admin-loading">Consultando o Supabase...</div>';
    try{
      const rows=await loadRows(key,module);
      moduleContent.innerHTML=`<div class="admin-browser">${renderRecordList(module,rows)}<div id="adminDetailPane" class="admin-detail-pane"><div class="admin-empty">Selecione um registro à esquerda para ver e editar todas as informações.</div></div></div>`;
      const detailPane=document.getElementById("adminDetailPane");
      moduleContent.querySelectorAll("[data-record-index]").forEach(button=>button.addEventListener("click",async()=>{
        moduleContent.querySelectorAll("[data-record-index]").forEach(item=>item.classList.toggle("active",item===button));
        const index=Number(button.dataset.recordIndex),row=rows[index];
        detailPane.innerHTML='<div class="admin-loading">Carregando detalhes...</div>';
        try{
          const related=await loadRelated(key,row);
          detailPane.innerHTML=renderEditor(module,row,index,related,key);
          bindEditor(module,rows,index,detailPane,key,related);
        }catch(error){detailPane.innerHTML=`<div class="admin-error">${esc(error.message||"Falha ao carregar detalhes.")}</div>`}
      }));
      if(rows.length)moduleContent.querySelector("[data-record-index='0']")?.click();
    }catch(error){console.error(error);moduleContent.innerHTML=`<div class="admin-error">${esc(error.message||"Não foi possível carregar este módulo.")}</div>`}
  }

  function bindEditor(module,rows,index,host,moduleKey,related){
    const form=host.querySelector("#adminEditForm");
    form?.addEventListener("submit",async event=>{
      event.preventDefault();
      const message=form.querySelector("#adminFormMessage");
      const row=rows[index],payload={};
      module.fields.forEach(field=>{if(readonly.has(field))return;const input=form.elements.namedItem(field);if(input)payload[field]=normalizeValue(field,input)});
      message.textContent="Salvando...";
      try{
        const query=row._source==="local"?client.from(module.table).upsert({...payload,[module.id]:row[module.id]}):client.from(module.table).update(payload).eq(module.id,row[module.id]);
        const {error}=await query;
        if(error)throw error;
        delete row._source;Object.assign(row,payload);
        message.textContent="Alterações salvas com sucesso no Supabase.";
        await refreshStats();
      }catch(error){console.error(error);message.textContent=error.message||"Não foi possível salvar."}
    });

    host.querySelectorAll("[data-related-edit]").forEach(button=>button.addEventListener("click",()=>{
      const relatedIndex=Number(button.dataset.relatedEdit),item=related[relatedIndex];
      let editor=host.querySelector(".admin-related-editor-host");
      if(!editor){editor=document.createElement("div");editor.className="admin-related-editor-host";host.appendChild(editor)}
      editor.innerHTML=renderRelatedEditor(item,relatedIndex);
      editor.querySelector("[data-close-related]")?.addEventListener("click",()=>editor.remove());
      const relatedForm=editor.querySelector("#adminRelatedForm");
      relatedForm?.addEventListener("submit",async event=>{
        event.preventDefault();
        const message=relatedForm.querySelector("#adminRelatedMessage"),payload={};
        ["name","description","category","unlock_level","mana_cost","cooldown_turns","is_passive","is_ultimate","is_active"].forEach(field=>{const input=relatedForm.elements.namedItem(field);if(input)payload[field]=normalizeValue(field,input)});
        message.textContent="Salvando...";
        try{
          const base={...payload,id:item.id,source_type:item.source_type||"class",class_id:item.class_id||null,class_path_id:item.class_path_id||null,race_id:item.race_id||null,sort_order:item.sort_order||0};
          const query=item._source==="local"?client.from("skills").upsert(base):client.from("skills").update(payload).eq("id",item.id);
          const {error}=await query;
          if(error)throw error;
          delete item._source;Object.assign(item,payload);
          message.textContent="Habilidade atualizada com sucesso no Supabase.";
          await refreshStats();
        }catch(error){console.error(error);message.textContent=error.message||"Não foi possível salvar a habilidade."}
      });
    }));
  }

  document.querySelectorAll("[data-admin-module]").forEach(button=>button.addEventListener("click",()=>openModule(button.dataset.adminModule)));
  logout?.addEventListener("click",async()=>{await account.logout();window.location.assign("conta.html")});
  await refreshStats();
})();
