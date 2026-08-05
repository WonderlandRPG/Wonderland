"use strict";

(function(){
  const RANKS={
    E:{id:"E",title:"Iniciante",color:"#9d744f"},
    D:{id:"D",title:"Explorador",color:"#5fa56f"},
    C:{id:"C",title:"Veterano",color:"#4f8fd8"},
    B:{id:"B",title:"Elite",color:"#8f62d0"},
    A:{id:"A",title:"Lenda Viva",color:"#dfb84e"},
    S:{id:"S",title:"Herói do Reino",color:"#d84250"},
    EX:{id:"EX",title:"Além da Medição",color:"#f5e8bd"}
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
    return `<span class="rank-emblem rank-emblem-${rank.id.toLowerCase()} ${compact?"rank-emblem-compact":""}" style="--rank-color:${rank.color}" aria-label="Rank ${rank.id}" title="Rank ${rank.id} — ${rank.title}"><span>${rank.id}</span></span>`;
  }

  window.WONDERLAND_RANK_SYSTEM={RANKS,normalize,fromCharacter,emblemHtml};
})();
