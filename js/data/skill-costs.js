"use strict";

(function(){
  const RESOURCE_BY_CLASS={
    barbaro:"Fúria",alquimista:"Reagente",arqueiro:"Energia",assassino:"Energia",bardo:"Mana",bruxo:"Mana",druida:"Mana",espadachim:"Energia",feiticeiro:"Mana",mago:"Mana",ninja:"Energia",necromante:"Mana",guerreiro:"Energia"
  };
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const parseExplicit=(text)=>{
    const source=String(text||"");
    const patterns=[
      [/custa\s+(\d+)\s*mana/i,"Mana"],[/consome\s+(\d+)\s*mana/i,"Mana"],[/gasta\s+(\d+)\s*mana/i,"Mana"],
      [/custa\s+(\d+)\s*energia/i,"Energia"],[/consome\s+(\d+)\s*energia/i,"Energia"],[/gasta\s+(\d+)\s*energia/i,"Energia"],
      [/custa\s+(\d+)%\s*do\s*hp/i,"HP"],[/consome\s+(\d+)%\s*do\s*hp/i,"HP"],[/gasta\s+(\d+)%\s*do\s*hp/i,"HP"],
      [/custa\s+(\d+)\s*f[úu]ria/i,"Fúria"],[/consome\s+(\d+)\s*f[úu]ria/i,"Fúria"],[/gasta\s+(\d+)\s*f[úu]ria/i,"Fúria"],
      [/custa\s+(\d+)\s*reagentes?/i,"Reagente"],[/consome\s+(\d+)\s*reagentes?/i,"Reagente"],[/gasta\s+(\d+)\s*reagentes?/i,"Reagente"]
    ];
    for(const [regex,type] of patterns){const match=source.match(regex);if(match)return{type,value:Number(match[1]),label:type==="HP"?`${match[1]}% do HP`:`${match[1]} ${type}${type==="Reagente"&&Number(match[1])>1?"s":""}`};}
    return null;
  };
  const infer=(classe,skill,level=1,{passive=false,ultimate=false,path=false}={})=>{
    if(passive)return{type:"Sem custo",value:0,label:"Sem custo"};
    const explicit=parseExplicit(skill?.descricao);if(explicit)return explicit;
    const resource=RESOURCE_BY_CLASS[classe?.id]||"Mana";
    const category=String(skill?.categoria||skill?.tipo||"").toLowerCase();
    const desc=String(skill?.descricao||"").toLowerCase();
    let base=12+Math.round(Number(level||1)*0.7);
    if(category.includes("área")||desc.includes("área"))base+=8;
    if(category.includes("cura")||category.includes("suporte")||category.includes("proteção")||desc.includes("escudo"))base+=6;
    if(category.includes("controle")||category.includes("provocação")||desc.includes("atordoa")||desc.includes("lentidão"))base+=5;
    if(category.includes("invocação")||desc.includes("invoca"))base+=10;
    if(path)base+=8;
    if(ultimate)base+=20;
    if(resource==="Fúria"){
      const value=ultimate?10:clamp(Math.round(base/12),1,8);
      return{type:resource,value,label:`${value} ${resource}`};
    }
    if(resource==="Reagente"){
      const value=ultimate?5:clamp(Math.round(base/22),1,3);
      return{type:resource,value,label:`${value} Reagente${value>1?"s":""}`};
    }
    if(resource==="HP"){
      const value=ultimate?15:clamp(Math.round(base/4),4,12);
      return{type:resource,value,label:`${value}% do HP`};
    }
    const max=ultimate?120:95;
    const value=clamp(Math.round(base/5)*5,10,max);
    return{type:resource,value,label:`${value} ${resource}`};
  };
  window.WONDERLAND_SKILL_COSTS={infer,parseExplicit,resourceByClass:RESOURCE_BY_CLASS};
})();
