"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const client=window.WONDERLAND_SUPABASE;
  const greeting=document.getElementById("adminGreeting");
  const logout=document.getElementById("adminLogout");
  const moduleTitle=document.getElementById("adminModuleTitle");
  const moduleContent=document.getElementById("adminModuleContent");

  if(!account||!client){
    window.location.replace("conta.html");
    return;
  }

  let user;
  try{
    user=await account.current();
  }catch(error){
    console.error(error);
    window.location.replace("conta.html");
    return;
  }

  if(!user){
    window.location.replace("conta.html");
    return;
  }

  if(!account.isAdmin(user)){
    window.location.replace("personagens.html");
    return;
  }

  greeting.textContent=`Bem-vindo, ${user.name}. Gerencie o conteúdo e o balanceamento do Wonderland.`;

  const statMap={
    statUsers:{table:"profiles"},
    statCharacters:{table:"characters"},
    statRaces:{table:"races"},
    statClasses:{table:"classes"},
    statSkills:{table:"skills"},
    statItems:{table:"items"}
  };

  await Promise.all(Object.entries(statMap).map(async([elementId,config])=>{
    const element=document.getElementById(elementId);
    try{
      const {count,error}=await client.from(config.table).select("*",{count:"exact",head:true});
      if(error)throw error;
      element.textContent=String(count??0);
    }catch(error){
      console.error(`Falha ao contar ${config.table}:`,error);
      element.textContent="—";
    }
  }));

  const modules={
    races:{title:"Raças",table:"races",columns:"id,name,difficulty,base_hp,base_mana,is_active,sort_order"},
    classes:{title:"Classes",table:"classes",columns:"id,name,role,primary_attribute,secondary_attribute,is_active,sort_order"},
    skills:{title:"Habilidades",table:"skills",columns:"id,name,source_type,unlock_level,mana_cost,is_passive,is_ultimate,is_active"},
    items:{title:"Itens",table:"items",columns:"id,name,item_type,rarity,required_level,is_active"},
    users:{title:"Usuários",table:"profiles",columns:"id,username,display_name,role,is_banned,created_at"},
    settings:{title:"Balanceamento",table:"game_settings",columns:"key,category,label,value,value_type,is_public,is_editable"}
  };

  const labels={
    id:"ID",name:"Nome",difficulty:"Dificuldade",base_hp:"HP Base",base_mana:"Mana Base",is_active:"Ativo",sort_order:"Ordem",
    role:"Função",primary_attribute:"Principal",secondary_attribute:"Secundário",source_type:"Origem",unlock_level:"Nível",mana_cost:"Mana",
    is_passive:"Passiva",is_ultimate:"Ultimate",item_type:"Tipo",rarity:"Raridade",required_level:"Nível mínimo",username:"Usuário",
    display_name:"Nome exibido",is_banned:"Banido",created_at:"Criado em",key:"Chave",category:"Categoria",label:"Nome",value:"Valor",
    value_type:"Tipo",is_public:"Público",is_editable:"Editável"
  };

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const format=value=>{
    if(typeof value==="boolean")return value?"Sim":"Não";
    if(value===null||value===undefined||value==="")return"—";
    if(typeof value==="object")return esc(JSON.stringify(value));
    return esc(value);
  };

  async function openModule(key){
    const module=modules[key];
    if(!module)return;
    moduleTitle.textContent=module.title;
    moduleContent.innerHTML='<div class="admin-loading">Consultando o Supabase...</div>';
    try{
      const {data,error}=await client.from(module.table).select(module.columns).limit(100);
      if(error)throw error;
      if(!data?.length){
        moduleContent.innerHTML='<div class="admin-empty">Nenhum registro encontrado neste módulo.</div>';
        return;
      }
      const columns=Object.keys(data[0]);
      moduleContent.innerHTML=`<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${columns.map(column=>`<th>${esc(labels[column]||column)}</th>`).join("")}</tr></thead><tbody>${data.map(row=>`<tr>${columns.map(column=>`<td>${format(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }catch(error){
      console.error(error);
      moduleContent.innerHTML=`<div class="admin-error">${esc(error.message||"Não foi possível carregar este módulo.")}</div>`;
    }
  }

  document.querySelectorAll("[data-admin-module]").forEach(button=>button.addEventListener("click",()=>openModule(button.dataset.adminModule)));
  logout?.addEventListener("click",async()=>{await account.logout();window.location.assign("conta.html")});
})();
