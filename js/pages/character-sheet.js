"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const loading=document.getElementById("sheetLoading");
  const content=document.getElementById("sheetContent");
  const logout=document.getElementById("sheetLogout");
  const params=new URLSearchParams(window.location.search);
  const characterId=params.get("id");
  const attrs=["FOR","DEF","RES","INI","INT","ARC"];
  const attrNames={FOR:"Força",DEF:"Defesa",RES:"Resistência",INI:"Iniciativa",INT:"Inteligência",ARC:"Arcano"};
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");

  if(!account||!characterId){window.location.replace("personagens.html");return}
  const user=await account.current().catch(()=>null);
  if(!user){window.location.replace("conta.html");return}

  function parseLevel(value){const match=String(value||"").match(/(\d+)/);return Number(match?.[1]||1)}
  function getFinalAttributes(row){
    return Object.fromEntries(attrs.map(attr=>{
      const key=attr.toLowerCase();
      return[attr,Number(row?.[`base_${key}`]||20)+Number(row?.[`allocated_${key}`]||0)+Number(row?.[`racial_${key}`]||0)]
    }))
  }
  function damageText(description,finalAttrs){
    const source=String(description||"");
    const matches=[...source.matchAll(/(\d+(?:[.,]\d+)?)%\s+de\s+(FOR|DEF|RES|INI|INT|ARC)/gi)];
    if(!matches.length)return"Sem dano numérico direto identificado.";
    return matches.map(match=>{
      const percent=Number(match[1].replace(",","."));
      const attr=match[2].toUpperCase();
      const value=Math.round(finalAttrs[attr]*(percent/100));
      return `${percent}% de ${attr} (${finalAttrs[attr]}) = ${value}`;
    }).join(" • ")
  }
  function officialSkills(cls,race,level){
    const list=[];
    (cls?.passivas||[]).forEach(skill=>list.push({...skill,nivel:1,tipo:"Passiva",passive:true,source:"Classe"}));
    (cls?.progressao||[]).forEach(skill=>{const unlock=parseLevel(skill.nivel);if(unlock<=level)list.push({...skill,nivel:unlock,tipo:skill.categoria||"Habilidade",source:"Classe"})});
    if(level>=50){
      (cls?.caminhos||[]).forEach(path=>{
        if(path.passiva)list.push({...path.passiva,nivel:50,tipo:"Passiva do caminho",passive:true,source:path.nome,path:true});
        (path.habilidades||[]).forEach((skill,index)=>{const unlock=[60,70,80,90,100][index]||100;if(unlock<=level)list.push({...skill,nivel:unlock,tipo:skill.tipo||"Habilidade",ultimate:String(skill.tipo||"").toLowerCase()==="ultimate",source:path.nome,path:true})})
      })
    }
    (race?.traits||race?.passives||[]).forEach(skill=>list.push({nome:skill.name||skill.nome||"Traço racial",descricao:skill.description||skill.descricao||String(skill),nivel:1,tipo:"Racial",passive:true,source:"Raça"}));
    (race?.progression||race?.progressao||[]).forEach(skill=>{const unlock=parseLevel(skill.level||skill.nivel);if(unlock<=level)list.push({nome:skill.name||skill.nome,descricao:skill.description||skill.descricao,nivel:unlock,tipo:skill.category||skill.categoria||"Racial",source:"Raça"})});
    return list
  }
  function renderItems(target,items,emptyText){
    target.innerHTML=items.length?items.map(item=>`<article class="character-sheet-item"><div><strong>${esc(item.metadata?.name||item.item_key)}</strong><small>${esc(item.slot||item.metadata?.rarity||"")}</small></div><span>${item.quantity?`x${esc(item.quantity)}`:"Equipado"}</span></article>`).join(""):`<div class="character-sheet-empty">${esc(emptyText)}</div>`
  }

  try{
    const data=await account.getCharacterSheet(characterId);
    const character=data.character;
    const race=(window.WONDERLAND_RACES||[]).find(item=>item.id===character.race_id);
    const cls=(window.WONDERLAND_CLASSES||{})[character.class_id];
    const finalAttrs=getFinalAttributes(data.attributes);
    const localSkills=officialSkills(cls,race,Number(character.level||1));
    const databaseSkillKeys=new Set(data.skills.map(item=>item.skill_key));
    const skills=localSkills.filter(skill=>!databaseSkillKeys.size||databaseSkillKeys.has(skill.id||skill.nome));

    document.getElementById("sheetImage").src=character.image_url||race?.artwork||race?.image||"assets/images/logo.png";
    document.getElementById("sheetImage").alt=character.name;
    document.getElementById("sheetName").textContent=character.name;
    document.getElementById("sheetSummary").textContent=`${race?.name||character.race_id} • ${cls?.nome||character.class_id}`;
    document.getElementById("sheetLevel").textContent=`Nível ${character.level}`;
    document.getElementById("sheetRace").textContent=race?.name||character.race_id;
    document.getElementById("sheetClass").textContent=cls?.nome||character.class_id;
    document.getElementById("sheetHp").textContent=String(character.hp_current||0);
    document.getElementById("sheetMana").textContent=String(character.mana_current||0);
    document.getElementById("sheetExperience").textContent=String(character.experience||0);
    document.getElementById("sheetStory").textContent=character.story||"Nenhuma história foi registrada.";
    document.getElementById("sheetBuild").textContent=`Perfil ${character.distribution_profile||"manual"}. Atributo principal: ${cls?.estilo?.atributos||cls?.primary_attribute||"não definido"}.`;
    document.getElementById("sheetAttributes").innerHTML=attrs.map(attr=>`<article class="character-sheet-attribute"><span>${attr}</span><strong>${finalAttrs[attr]}</strong><small>${attrNames[attr]}</small></article>`).join("");
    document.getElementById("sheetSkillsSummary").textContent=`${skills.length} habilidade(s) disponíveis no nível ${character.level}. O dano abaixo usa os atributos finais atuais.`;
    document.getElementById("sheetSkills").innerHTML=skills.length?skills.map(skill=>{
      const cost=window.WONDERLAND_SKILL_COSTS?.infer(cls,skill,skill.nivel,{passive:Boolean(skill.passive),ultimate:Boolean(skill.ultimate),path:Boolean(skill.path)})||{label:"—"};
      return `<article class="character-sheet-skill"><header><div><small>${esc(skill.source||"Habilidade")} • Nível ${esc(skill.nivel||1)}</small><h3>${esc(skill.nome)}</h3></div></header><p>${esc(skill.descricao||"")}</p><div class="character-sheet-skill-meta"><span>${esc(skill.tipo||skill.categoria||"Habilidade")}</span><span>${esc(cost.label)}</span></div><div class="character-sheet-skill-damage"><strong>Dano calculado:</strong> ${esc(damageText(skill.descricao,finalAttrs))}</div></article>`
    }).join(""):'<div class="character-sheet-empty">Nenhuma habilidade liberada neste nível.</div>';
    renderItems(document.getElementById("sheetInventory"),data.inventory,"O inventário está vazio.");
    renderItems(document.getElementById("sheetEquipment"),data.equipment,"Nenhum equipamento foi equipado.");

    loading.hidden=true;content.hidden=false;
  }catch(error){
    console.error(error);loading.textContent=error.message||"Não foi possível carregar a ficha.";
  }

  document.querySelectorAll("[data-sheet-tab]").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll("[data-sheet-tab]").forEach(item=>item.classList.toggle("active",item===button));
    document.querySelectorAll("[data-sheet-panel]").forEach(panel=>panel.classList.toggle("active",panel.dataset.sheetPanel===button.dataset.sheetTab));
  }));
  logout?.addEventListener("click",async()=>{await account.logout();window.location.assign("conta.html")});
})();
