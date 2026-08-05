"use strict";
(function(){
  const defense=window.WONDERLAND_DEFENSE_SYSTEM;
  const ATTRS=["FOR","DEF","RES","INI","INT","ARC"];
  function readAttrs(){const result={};document.querySelectorAll(".character-sheet-attribute").forEach(row=>{const key=String(row.querySelector("span")?.textContent||"").trim().toUpperCase();const value=Number(String(row.querySelector("strong")?.textContent||0).replace(/[^0-9.-]/g,""));if(ATTRS.includes(key))result[key]=Number.isFinite(value)?value:0});return result}
  function enhanceDerived(){if(!defense)return;const attrs=readAttrs();const info=defense.breakdown({def:attrs.DEF,res:attrs.RES});const host=document.getElementById("sheetDerived");if(!host)return;host.querySelectorAll("[data-defense-derived]").forEach(node=>node.remove());const rows=[
    ["Redução física",`${info.physicalReduction}%`,"1% a cada 5 DEF"],
    ["Redução mágica",`${info.magicalReduction}%`,"1% a cada 5 RES"],
    ["Redução verdadeira",`${info.trueReduction}%`,"1% a cada 10 RES"],
    ["Resistência a efeitos",`${info.negativeEffectReduction}%`,"Duração ou intensidade"],
    ["HP concedido por RES",`+${info.hpBonus}`,"+10 HP a cada 5 RES"]
  ];
  host.insertAdjacentHTML("beforeend",rows.map(([label,value,note])=>`<article class="character-sheet-derived-row" data-defense-derived><span>${label}</span><small>${note}</small><strong>${value}</strong></article>`).join(""))}
  function bindTabs(){document.querySelectorAll("[data-sheet-tab]").forEach(button=>{if(button.dataset.stabilityBound)return;button.dataset.stabilityBound="1";button.addEventListener("click",()=>{const target=button.dataset.sheetTab;document.querySelectorAll("[data-sheet-tab]").forEach(item=>item.classList.toggle("active",item===button));document.querySelectorAll("[data-sheet-panel]").forEach(panel=>panel.classList.toggle("active",panel.dataset.sheetPanel===target))})})}
  function init(){bindTabs();enhanceDerived();const content=document.getElementById("sheetContent");if(content){const observer=new MutationObserver(()=>{bindTabs();enhanceDerived()});observer.observe(content,{childList:true,subtree:true})}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();