"use strict";

(function(){
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  const parseExplicitMana=(text)=>{
    const source=String(text||"");
    const match=source.match(/(?:custa|consome|gasta)\s+(\d+)\s*mana/i);
    if(!match)return null;
    const value=Number(match[1]);
    return{type:"Mana",value,label:`${value} Mana`};
  };

  const infer=(classe,skill,level=1,{passive=false,ultimate=false,path=false}={})=>{
    if(passive)return{type:"Sem custo",value:0,label:"Sem custo"};

    const explicit=parseExplicitMana(skill?.descricao);
    if(explicit)return explicit;

    const category=String(skill?.categoria||skill?.tipo||"").toLowerCase();
    const desc=String(skill?.descricao||"").toLowerCase();
    let base=12+Math.round(Number(level||1)*0.7);

    if(category.includes("área")||desc.includes("área"))base+=8;
    if(category.includes("cura")||category.includes("suporte")||category.includes("proteção")||desc.includes("escudo"))base+=6;
    if(category.includes("controle")||category.includes("provocação")||desc.includes("atordoa")||desc.includes("lentidão"))base+=5;
    if(category.includes("invocação")||desc.includes("invoca"))base+=10;
    if(path)base+=8;
    if(ultimate)base+=20;

    const max=ultimate?120:95;
    const value=clamp(Math.round(base/5)*5,10,max);
    return{type:"Mana",value,label:`${value} Mana`};
  };

  window.WONDERLAND_SKILL_COSTS={
    infer,
    parseExplicit:parseExplicitMana,
    resourceByClass:{}
  };
})();
