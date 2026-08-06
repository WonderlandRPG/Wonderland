"use strict";

const classesList=document.getElementById("classesList");
const classContent=document.getElementById("classContent");
let classes={};
let currentClass=null;
let activeTab="overview";

const CLASS_ORDER=["barbaro","alquimista","arqueiro","assassino","bardo","bruxo","druida","espadachim","feiticeiro","mago","ninja","necromante","guerreiro"];
const ATTRIBUTES=["FOR","DEF","RES","INI","INT","ARC"];
const PATH_LEVELS=[60,70,80,90,100];
const ATTRIBUTE_THEMES={
 FOR:{accent:"#e56a3d",rgb:"229,106,61",secondary:"#d8a04d",secondaryRgb:"216,160,77"},
 DEF:{accent:"#4f8fd8",rgb:"79,143,216",secondary:"#7bb4e8",secondaryRgb:"123,180,232"},
 RES:{accent:"#43b77a",rgb:"67,183,122",secondary:"#82cf9f",secondaryRgb:"130,207,159"},
 INI:{accent:"#d5aa38",rgb:"213,170,56",secondary:"#f0cf67",secondaryRgb:"240,207,103"},
 INT:{accent:"#865dd4",rgb:"134,93,212",secondary:"#b08bea",secondaryRgb:"176,139,234"},
 ARC:{accent:"#35b7bd",rgb:"53,183,189",secondary:"#70d7d2",secondaryRgb:"112,215,210"}
};
const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
const clone=value=>value?JSON.parse(JSON.stringify(value)):value;
const starsText=value=>"★".repeat(Math.max(1,Math.min(5,Number(value)||1)))+"☆".repeat(5-Math.max(1,Math.min(5,Number(value)||1)));

function getPrimaryAttribute(c){const a=String(c?.estilo?.atributos||"").toUpperCase(),r=String(c?.cargo||"").toLowerCase();if(r.includes("suporte")||r.includes("invocador"))return"ARC";if(r.includes("mágico")||r.includes("magico"))return"INT";if(r.includes("assassino"))return"INI";if(r.includes("tanque")&&!r.includes("dps"))return"DEF";return ATTRIBUTES.find(x=>a.startsWith(x)||a.includes(`${x} PRINCIPAL`))||"FOR"}
function getClassTheme(c){return ATTRIBUTE_THEMES[getPrimaryAttribute(c)]||ATTRIBUTE_THEMES.FOR}
function applyClassTheme(c){const t=getClassTheme(c),s=document.documentElement.style;s.setProperty("--classes-red",t.accent);s.setProperty("--classes-red-rgb",t.rgb);s.setProperty("--classes-gold",t.secondary);s.setProperty("--classes-gold-rgb",t.secondaryRgb);document.body.dataset.classTheme=getPrimaryAttribute(c).toLowerCase()}
function stars(value){const filled=(String(value||"").match(/★/g)||[]).length;return `<span class="rating-stars-inline" aria-label="${filled} de 5 estrelas">${Array.from({length:5},(_,i)=>`<span class="rating-star-inline ${i<filled?"filled":"empty"}">★</span>`).join("")}</span>`}
function getSkillCost(skill,level,options={}){const cmsCost=Number(skill?._cms?.mana_cost);if(Number.isFinite(cmsCost)&&cmsCost>0)return{label:`${cmsCost} Mana`};return window.WONDERLAND_SKILL_COSTS?.infer(currentClass,skill,level,options)||{label:"Sem custo"}}

function applyStructuredScale(description,row){
  let result=String(description||"");
  const percent=Number(row?.scale_percent),attribute=String(row?.scale_attribute||"").toUpperCase();
  if(!row?._cms||!Number.isFinite(percent)||percent<=0||!ATTRIBUTES.includes(attribute))return result;
  const replacement=`${Number.isInteger(percent)?percent:percent.toLocaleString("pt-BR")}% de ${attribute}`;
  const pattern=new RegExp(`\\d+(?:[.,]\\d+)?%\\s+(?:do|de|da)\\s+(?:seu\\s+)?${attribute}`,"i");
  return pattern.test(result)?result.replace(pattern,replacement):result;
}

function skillFromCMS(row){return{nivel:`Nível ${Number(row.unlock_level)||1}`,nome:row.name||"Habilidade",categoria:row.category||"Habilidade",tipo:row.is_ultimate?"Ultimate":row.category||"Ativa",descricao:applyStructuredScale(row.description,row),_cms:row}}
function passiveFromCMS(row){return{nome:row.name||"Passiva",descricao:row.description||"",_cms:row}}

function buildClassesFromCMS(data){
  const local=window.WONDERLAND_CLASSES||{};
  const result={};
  const cmsClasses=Array.isArray(data?.classes)?data.classes:[];
  const ids=new Set([...Object.keys(local),...cmsClasses.map(row=>row.id).filter(Boolean)]);

  ids.forEach(id=>{
    const base=clone(local[id])||{id,nome:id,afinidades:{FOR:"★☆☆☆☆",DEF:"★☆☆☆☆",RES:"★☆☆☆☆",INI:"★☆☆☆☆",INT:"★☆☆☆☆",ARC:"★☆☆☆☆"},estilo:{},especializacao:{},caminhos:[],passivas:[],progressao:[]};
    const row=cmsClasses.find(item=>item.id===id);
    if(row){
      base.id=row.id;
      base.nome=row.name||base.nome;
      base.descricao=row.description||base.descricao||"";
      base.cargo=row.role||base.cargo||"Classe";
      base.imagem=row.artwork_url||base.imagem||"assets/images/logo.png";
      base.icone=row.icon||base.icone||"✦";
      base.dificuldade=starsText(row.difficulty||1);
      base.especializacao={titulo:row.specialization||row.role||base.especializacao?.titulo||base.cargo,descricao:row.description||base.especializacao?.descricao||base.descricao};
      base.estilo={...(base.estilo||{}),principal:row.role||base.estilo?.principal,fortes:row.strengths||base.estilo?.fortes,fracos:row.weaknesses||base.estilo?.fracos,atributos:[row.primary_attribute,row.secondary_attribute].filter(Boolean).join(" principal • ")||base.estilo?.atributos};
      if(row.resource_name||row.resource_description)base.recurso={nome:row.resource_name||base.recurso?.nome||"Mecânica própria",descricao:row.resource_description||base.recurso?.descricao||""};
      base._cms=row;
    }

    const classSkills=(data?.skills||[]).filter(skill=>skill.source_type==="class"&&skill.class_id===id&&skill.is_active!==false).sort((a,b)=>(Number(a.unlock_level)||1)-(Number(b.unlock_level)||1)||(Number(a.sort_order)||0)-(Number(b.sort_order)||0));
    if(classSkills.length)base.progressao=classSkills.map(skillFromCMS);

    const classPassives=(data?.passives||[]).filter(passive=>passive.source_type==="class"&&passive.class_id===id&&passive.is_active!==false).sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0));
    if(classPassives.length)base.passivas=classPassives.map(passiveFromCMS);

    const paths=(data?.paths||[]).filter(path=>path.class_id===id&&path.is_active!==false).sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0));
    if(paths.length){
      base.caminhos=paths.map(path=>{
        const pathSkills=(data?.skills||[]).filter(skill=>skill.source_type==="path"&&skill.class_path_id===path.id&&skill.is_active!==false).sort((a,b)=>(Number(a.unlock_level)||1)-(Number(b.unlock_level)||1)||(Number(a.sort_order)||0)-(Number(b.sort_order)||0));
        const pathPassive=(data?.passives||[]).find(passive=>passive.source_type==="path"&&passive.class_path_id===path.id&&passive.is_active!==false);
        return{id:path.id,nome:path.name||path.id,especializacao:path.specialization||"",complexidade:path.complexity||"",descricao:path.description||"",passiva:pathPassive?passiveFromCMS(pathPassive):null,habilidades:pathSkills.map(skillFromCMS),_cms:path};
      });
    }
    result[id]=base;
  });
  return result;
}

function orderedClasses(){const fixed=CLASS_ORDER.map(id=>classes[id]).filter(Boolean);const used=new Set(fixed.map(item=>item.id));const extras=Object.values(classes).filter(item=>!used.has(item.id)).sort((a,b)=>String(a.nome||"").localeCompare(String(b.nome||""),"pt-BR"));return [...fixed,...extras]}
function createSidebar(){classesList.innerHTML="";const ordered=orderedClasses();ordered.forEach(c=>{const t=getClassTheme(c),b=document.createElement("button");b.type="button";b.className="class-button";b.dataset.id=c.id;b.style.setProperty("--item-accent",t.accent);b.style.setProperty("--item-accent-rgb",t.rgb);b.innerHTML=`<span class="class-icon class-icon-symbol" aria-hidden="true" style="color:${t.accent};border-color:rgba(${t.rgb},.42);background:radial-gradient(circle,rgba(${t.rgb},.20),rgba(5,11,13,.94))">${esc(c.icone||"✦")}</span><div class="class-info"><span class="class-name">${esc(c.nome)}</span><span class="class-role">${esc(c.cargo)}</span></div>`;classesList.appendChild(b)});const p=document.querySelector(".classes-index-heading p");if(p)p.textContent=`${ordered.length} classes oficiais. Escolha uma para consultar seu estilo de combate e progressão.`}

function loadClass(id){const next=classes[id];if(!next)return;currentClass=next;activeTab="overview";applyClassTheme(next);document.querySelectorAll(".class-button").forEach(b=>b.classList.toggle("active",b.dataset.id===id));renderClass()}
function renderClass(){const c=currentClass,p=getPrimaryAttribute(c);classContent.innerHTML=`<div class="class-header"><div class="class-image"><img loading="lazy" decoding="async" src="${esc(c.imagem)}" alt="${esc(c.nome)}"></div><div><span class="class-kicker">${esc(c.cargo)}</span><h1 class="class-title">${esc(c.nome)}</h1><div class="class-stars"><span class="rating-label">Dificuldade</span>${stars(c.dificuldade)}</div><p class="class-description">${esc(c.descricao)}</p><div class="class-path-meta"><strong>${esc(p)} principal</strong><small>${esc(c.recurso?.nome||"Mecânica própria")}</small></div></div></div>${renderAffinityPanel()}<nav class="class-tabs" aria-label="Informações da classe"><button class="class-tab ${activeTab==="overview"?"active":""}" data-tab="overview" type="button">✦ Visão Geral</button><button class="class-tab ${activeTab==="skills"?"active":""}" data-tab="skills" type="button">⚔ Habilidades</button><button class="class-tab ${activeTab==="paths"?"active":""}" data-tab="paths" type="button">▲ Caminhos</button></nav><section class="class-tab-content">${renderActiveTab()}</section>`;const img=classContent.querySelector(".class-image img");if(img)img.addEventListener("error",()=>{img.src="assets/images/logo.png";img.classList.add("fallback")},{once:true})}
function renderAffinityPanel(){const a=currentClass.afinidades||{},p=getPrimaryAttribute(currentClass);return `<section class="class-affinity-panel"><div class="class-affinity-grid">${ATTRIBUTES.map(x=>`<article class="class-affinity-card ${x===p?"primary":""}"><span>${x}</span>${stars(a[x]||"☆☆☆☆☆")}</article>`).join("")}</div></section>`}
function renderActiveTab(){if(activeTab==="skills")return renderProgressao();if(activeTab==="paths")return renderCaminhos();return renderOverviewTab()}
function row(l,v){return `<div class="playstyle-row"><span>${esc(l)}</span><strong>${esc(v||"—")}</strong></div>`}
function renderOverviewTab(){const c=currentClass;return `<div class="overview-grid"><article class="class-highlight-card"><span>Especialização</span><h2>${esc(c.especializacao?.titulo||c.cargo)}</h2><p>${esc(c.especializacao?.descricao||c.descricao)}</p></article><aside class="class-playstyle-card">${row("Função principal",c.estilo?.principal)}${row("Mecânica exclusiva",c.recurso?.nome)}${row("Pontos fortes",c.estilo?.fortes)}${row("Pontos fracos",c.estilo?.fracos)}${row("Atributos centrais",c.estilo?.atributos)}</aside></div>${c.recurso?`<section class="class-resource-card"><span>Mecânica da Classe</span><h2>${esc(c.recurso.nome)}</h2><p>${esc(c.recurso.descricao)}</p></section>`:""}${c.passivas?.length?`<section class="class-section-block"><header class="class-section-heading"><span>Característica permanente</span><h2>Passiva da Classe</h2></header><div class="class-passive-grid">${c.passivas.map(p=>`<article class="passive-card"><h3>${esc(p.nome)}</h3><p>${esc(p.descricao)}</p><span class="class-skill-cost">Custo: Sem custo</span></article>`).join("")}</div></section>`:""}`}
function renderProgressao(){const skills=currentClass.progressao||[];return `<section class="class-progression-section"><header class="class-section-heading"><span>Arsenal da Classe</span><h2>Habilidades — níveis 1 a 50</h2></header><div class="class-skill-list">${skills.map((s,i)=>skillCard(s,String(s.nivel).replace(/\D/g,"")||i+1,i===0)).join("")}</div></section>`}
function skillCard(s,level,open=false,ultimate=false,path=false){const cost=getSkillCost(s,Number(level)||1,{ultimate,path});return `<details class="class-skill-card ${ultimate?"ultimate":""}" ${open?"open":""}><summary class="class-skill-summary"><span class="class-skill-level">Nível<br><strong>${esc(level)}</strong></span><span class="class-skill-title-wrap"><small>${esc(ultimate?"Poder Supremo":s.categoria||"Habilidade")}</small><strong>${esc(s.nome)}</strong><em class="class-skill-cost">Custo: ${esc(cost.label)}</em></span><span class="class-skill-toggle" aria-hidden="true">＋</span></summary><div class="class-skill-body"><p>${esc(s.descricao)}</p><div class="class-skill-cost-detail"><strong>Custo</strong><span>${esc(cost.label)}</span></div></div></details>`}
function renderCaminhos(){const paths=currentClass.caminhos||[];if(!paths.length)return `<div class="class-empty-state"><strong>Nenhum Caminho registrado.</strong></div>`;return `<section class="class-paths-section"><header class="class-section-heading"><span>Especializações de nível 50</span><h2>Caminhos de ${esc(currentClass.nome)}</h2></header><div class="class-path-selector">${paths.map((p,i)=>`<button class="class-path-selector-button ${i===0?"active":""}" type="button" data-path-index="${i}"><span>Caminho ${i+1}</span><strong>${esc(p.nome)}</strong></button>`).join("")}</div><div id="classPathView">${renderSinglePath(paths[0],0)}</div></section>`}
function renderSinglePath(path,index){return `<article class="class-path-card"><header class="class-path-header"><span>Caminho ${index+1}</span><h3>${esc(path.nome)}</h3><div class="class-path-meta"><strong>${esc(path.especializacao)}</strong><small>Complexidade: ${esc(path.complexidade)}</small></div><p>${esc(path.descricao)}</p></header>${path.passiva?`<section class="class-path-passive"><span>Nível 50 • Nova Passiva</span><h4>${esc(path.passiva.nome)}</h4><div>${esc(path.passiva.descricao)}</div><small class="class-skill-cost">Custo: Sem custo</small></section>`:""}<div class="class-skill-list class-path-progression">${(path.habilidades||[]).map((h,i)=>skillCard(h,String(h.nivel||PATH_LEVELS[i]||100).replace(/\D/g,""),i===0,String(h.tipo).toLowerCase()==="ultimate",true)).join("")}</div></article>`}

classContent.addEventListener("click",event=>{const tab=event.target.closest(".class-tab");if(tab){activeTab=tab.dataset.tab||"overview";renderClass();return}const pathButton=event.target.closest(".class-path-selector-button");if(pathButton){const i=Number(pathButton.dataset.pathIndex),view=document.getElementById("classPathView");if(!Number.isNaN(i)&&view&&currentClass.caminhos?.[i]){classContent.querySelectorAll(".class-path-selector-button").forEach(b=>b.classList.toggle("active",b===pathButton));view.innerHTML=renderSinglePath(currentClass.caminhos[i],i)}}});
classesList.addEventListener("click",event=>{const button=event.target.closest(".class-button");if(button)loadClass(button.dataset.id)});

async function initializeClasses(){
  classContent.innerHTML='<div class="class-empty-state"><strong>Sincronizando classes com o painel administrativo...</strong></div>';
  try{
    const store=window.WONDERLAND_CONTENT_STORE;
    const data=store?await store.load({force:true}):null;
    classes=data?buildClassesFromCMS(data):(window.WONDERLAND_CLASSES||{});
  }catch(error){
    console.warn("Falha ao carregar o CMS; usando catálogo local.",error);
    classes=window.WONDERLAND_CLASSES||{};
  }
  const first=CLASS_ORDER.find(id=>classes[id])||Object.keys(classes)[0];
  if(!first){classContent.innerHTML='<div class="class-empty-state"><strong>Não foi possível carregar as classes.</strong></div>';return}
  createSidebar();loadClass(first);
}
initializeClasses();
