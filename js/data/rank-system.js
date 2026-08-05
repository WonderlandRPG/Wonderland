"use strict";

(function(){
  const RANKS={
    E:{id:"E",title:"Iniciante",color:"#9d744f",accent:"#c69a6a",secondary:"#6f4b32"},
    D:{id:"D",title:"Explorador",color:"#5fa56f",accent:"#8ed39a",secondary:"#2f6f46"},
    C:{id:"C",title:"Veterano",color:"#4f8fd8",accent:"#75b8ff",secondary:"#245c9f"},
    B:{id:"B",title:"Elite",color:"#8f62d0",accent:"#bb8cff",secondary:"#5c3297"},
    A:{id:"A",title:"Lenda Viva",color:"#dfb84e",accent:"#ffe07a",secondary:"#9c6f11"},
    S:{id:"S",title:"Herói do Reino",color:"#d84250",accent:"#ff6b7a",secondary:"#7f1621"},
    EX:{id:"EX",title:"Além da Medição",color:"#6FE7FF",accent:"#F8F7FF",secondary:"#B86CFF",prismatic:true}
  };

  function normalize(value){
    const key=String(value||"E").trim().toUpperCase();
    return RANKS[key]?key:"E";
  }

  function fromCharacter(character){
    return RANKS[normalize(character?.rank||character?.rank_id||character?.guild_rank)];
  }

  function emblemHtml(rankValue,{compact=false}={}){
    const rank=RANKS[normalize(rankValue)];
    const style=`--rank-color:${rank.color};--rank-accent:${rank.accent||rank.color};--rank-secondary:${rank.secondary||rank.color}`;
    const classes=["rank-emblem",`rank-emblem-${rank.id.toLowerCase()}`,compact?"rank-emblem-compact":"",rank.prismatic?"rank-emblem-prismatic":""].filter(Boolean).join(" ");
    return `<span class="${classes}" style="${style}" aria-label="Rank ${rank.id}" title="Rank ${rank.id} — ${rank.title}"><span>${rank.id}</span></span>`;
  }

  window.WONDERLAND_RANK_SYSTEM={RANKS,normalize,fromCharacter,emblemHtml};
})();
