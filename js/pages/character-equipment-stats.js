"use strict";
(function(){
  const account=window.WONDERLAND_ACCOUNT;
  const characterId=new URLSearchParams(location.search).get("id");
  const ATTRS=["FOR","DEF","RES","INI","INT","ARC"];
  if(!account||!characterId)return;

  function waitForSheet(){
    return new Promise(resolve=>{
      const content=document.getElementById("sheetContent");
      if(content&&!content.hidden)return resolve();
      const observer=new MutationObserver(()=>{if(content&&!content.hidden){observer.disconnect();resolve()}});
      if(content)observer.observe(content,{attributes:true,attributeFilter:["hidden"]});
      setTimeout(()=>{observer.disconnect();resolve()},10000);
    });
  }
  function numberFromText(value){const match=String(value||"").match(/-?\d+(?:[.,]\d+)?/);return Number((match?.[0]||0).replace(",","."))||0}
  function readBase(){const values={};document.querySelectorAll(".character-sheet-attribute").forEach(row=>{const key=String(row.querySelector("span")?.textContent||"").trim().toUpperCase();if(ATTRS.includes(key))values[key]=numberFromText(row.querySelector("strong")?.textContent)});return values}
  function equipmentBonus(equipment){const bonus=Object.fromEntries(ATTRS.map(attr=>[attr,0]));const seen=new Set();(equipment||[]).forEach(item=>{if(item.metadata?.linked_two_hand)return;const unique=`${item.item_key}:${item.id||item.slot}`;if(seen.has(unique))return;seen.add(unique);Object.entries(item.metadata?.stats||{}).forEach(([key,value])=>{const attr=String(key).toUpperCase();if(ATTRS.includes(attr))bonus[attr]+=Number(value)||0})});return bonus}
  function applyAttributes(base,bonus){
    document.querySelectorAll(".character-sheet-attribute").forEach(row=>{const attr=String(row.querySelector("span")?.textContent||"").trim().toUpperCase();if(!ATTRS.includes(attr))return;const strong=row.querySelector("strong");const total=(base[attr]||0)+(bonus[attr]||0);strong.textContent=String(total);row.classList.toggle("has-equipment-bonus",Boolean(bonus[attr]));let note=row.querySelector(".equipment-bonus-note");if(bonus[attr]){if(!note){note=document.createElement("em");note.className="equipment-bonus-note";row.appendChild(note)}note.textContent=`Base ${base[attr]||0} + Equipamentos ${bonus[attr]}`;}else note?.remove();});
  }
  function refreshDerived(finalAttrs){
    const map={"Ataque físico":"FOR","Ataque mágico":"INT","Defesa física":"DEF","Resistência":"RES","Iniciativa":"INI","Poder de suporte":"ARC"};
    document.querySelectorAll(".character-sheet-derived-row").forEach(row=>{const label=String(row.querySelector("span")?.textContent||"").trim();const attr=map[label];if(attr)row.querySelector("strong").textContent=String(Math.round(finalAttrs[attr]||0));});
  }
  function refreshSkillCalculations(){window.dispatchEvent(new CustomEvent("wonderland:attributes-updated"));}
  async function apply(){const data=await account.getCharacterSheet(characterId);const base=readBase();const bonus=equipmentBonus(data.equipment);const finalAttrs=Object.fromEntries(ATTRS.map(attr=>[attr,(base[attr]||0)+(bonus[attr]||0)]));applyAttributes(base,bonus);refreshDerived(finalAttrs);refreshSkillCalculations();}

  waitForSheet().then(()=>apply().catch(console.error));
  window.addEventListener("wonderland:equipment-updated",()=>apply().catch(console.error));
})();
