"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const classes=window.WONDERLAND_CLASSES||{};
  const characterId=new URLSearchParams(window.location.search).get("id");
  const ATTRS=["FOR","DEF","RES","INI","INT","ARC"];
  const attrNames={FOR:"FOR",DEF:"DEF",RES:"RES",INI:"INI",INT:"INT",ARC:"ARC"};

  function waitForSheet(){
    return new Promise(resolve=>{
      const content=document.getElementById("sheetContent");
      if(content&&!content.hidden)return resolve();
      const observer=new MutationObserver(()=>{if(content&&!content.hidden){observer.disconnect();resolve()}});
      if(content)observer.observe(content,{attributes:true,attributeFilter:["hidden"]});
      setTimeout(()=>{observer.disconnect();resolve()},10000);
    });
  }
  function selectedPathName(cls,pathId){if(!cls||!pathId)return"";const paths=Array.isArray(cls.caminhos)?cls.caminhos:Array.isArray(cls.paths)?cls.paths:[];const target=String(pathId).trim().toLowerCase();const path=paths.find(item=>[item?.id,item?.nome,item?.name].filter(Boolean).some(value=>String(value).trim().toLowerCase()===target));return path?.nome||path?.name||String(pathId)}
  function readAttributes(){const values={};document.querySelectorAll(".character-sheet-attribute").forEach(row=>{const key=String(row.querySelector("span")?.textContent||"").trim().toUpperCase();const value=Number(String(row.querySelector("strong")?.textContent||0).replace(/[^0-9.-]/g,""));if(ATTRS.includes(key))values[key]=Number.isFinite(value)?value:0});return values}
  function cleanText(value){return String(value||"").replace(/\s+/g," ").trim()}
  function percentageNearAttribute(clause,attr){const escaped=attr.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const before=new RegExp("(\\d+(?:[.,]\\d+)?)%\\s*(?:de|do|da|em)?\\s*(?:seu\\s+)?"+escaped,"i").exec(clause);if(before)return Number(before[1].replace(",","."));const after=new RegExp(escaped+"\\s*(?:em|de|do|da)?\\s*(\\d+(?:[.,]\\d+)?)%","i").exec(clause);return after?Number(after[1].replace(",",".")):null}
  function effectDirection(clause){const text=clause.toLowerCase();if(/reduz|reduzir|diminui|diminuir|perde|menos|penalidade|enfraquece/.test(text))return-1;if(/aumenta|aumentar|concede|ganha|recebe|adicional|fortalece|eleva|bônus|bonus/.test(text))return 1;return 0}
  function durationText(clause,fullText){const match=/(?:por|durante|pelos próximos|pelos proximos)\s+(\d+)\s+turnos?/i.exec(clause)||/(?:por|durante|pelos próximos|pelos proximos)\s+(\d+)\s+turnos?/i.exec(fullText);return match?`${match[1]} turno${Number(match[1])===1?"":"s"}`:"Sem duração definida"}
  function calculatedModifiers(description,attributes){const full=cleanText(description);const clauses=full.split(/(?<=[.;:])\s+|\s*[•|]\s*/).map(cleanText).filter(Boolean);const results=[];const seen=new Set();clauses.forEach(clause=>{const lower=clause.toLowerCase();const direction=effectDirection(clause);if(!direction)return;if(/causa\s+\d|dano\s+(?:físico|fisico|mágico|magico|verdadeiro)|cura|escudo/.test(lower))return;ATTRS.forEach(attr=>{if(!new RegExp(`\\b${attr}\\b`,"i").test(clause))return;const percent=percentageNearAttribute(clause,attr);if(percent===null||!Number.isFinite(percent))return;const base=Number(attributes[attr]||0);const delta=Math.round(base*(percent/100));const finalValue=Math.max(0,base+(direction*delta));const key=`${attr}-${percent}-${direction}-${durationText(clause,full)}`;if(seen.has(key))return;seen.add(key);results.push({attr,percent,base,delta,finalValue,direction,duration:durationText(clause,full)})})});return results}
  function renderExtraEffects(){const attributes=readAttributes();document.querySelectorAll(".character-sheet-skill").forEach(card=>{card.querySelector(".character-sheet-skill-calculated-effects")?.remove();const description=card.querySelector("p")?.textContent||"";const effects=calculatedModifiers(description,attributes);if(!effects.length)return;const panel=document.createElement("div");panel.className="character-sheet-skill-calculated-effects";panel.innerHTML=`<div class="calculated-effects-title"><strong>Resultado ao usar</strong><small>Valores calculados com seus atributos atuais</small></div>${effects.map(effect=>{const sign=effect.direction>0?"+":"−";const action=effect.direction>0?"Aumenta":"Reduz";return `<div class="calculated-effect-row"><div><span>${attrNames[effect.attr]}</span><small>${action} ${effect.percent}% por ${effect.duration}</small></div><b>${effect.base} ${sign} ${effect.delta} = ${effect.finalValue}</b></div>`}).join("")}`;card.appendChild(panel)})}

  await waitForSheet();
  if(account&&characterId){try{const data=await account.getCharacterSheet(characterId);const character=data?.character||{};const cls=classes[character.class_id];const pathName=selectedPathName(cls,character.class_path_id);const className=cls?.nome||character.class_id||"Classe não definida";const classTarget=document.getElementById("sheetClass");if(classTarget)classTarget.textContent=pathName?`${className} - ${pathName}`:className}catch(error){console.warn("Não foi possível carregar o caminho da classe.",error)}}
  renderExtraEffects();
  const skillsHost=document.getElementById("sheetSkills");if(skillsHost){const observer=new MutationObserver(()=>renderExtraEffects());observer.observe(skillsHost,{childList:true,subtree:true})}
  window.addEventListener("wonderland:attributes-updated",renderExtraEffects);
})();
