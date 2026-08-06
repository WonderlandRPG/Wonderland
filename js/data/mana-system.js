"use strict";

(function(){
  const BASE_MANA=100;
  const INT_STEP=5;
  const MANA_PER_STEP=10;

  const toNumber=(value,fallback=0)=>{
    if(typeof value==="string"){
      const normalized=value.trim().replace(/\s/g,"").replace(",",".").replace(/[^0-9+.-]/g,"");
      value=normalized===""?fallback:normalized;
    }
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };

  const safeMana=value=>Math.max(0,Math.round(toNumber(value,0)));

  function racialMana(race){
    const value=race?.stats?.mana;
    return safeMana(value);
  }

  function manaFromInt(intValue){
    return safeMana(Math.floor(Math.max(0,toNumber(intValue,0))/INT_STEP)*MANA_PER_STEP);
  }

  function maxMana({intValue=0,race=null}={}){
    return safeMana(BASE_MANA+racialMana(race)+manaFromInt(intValue))||BASE_MANA;
  }

  function breakdown({intValue=0,race=null}={}){
    const racial=racialMana(race);
    const intelligence=manaFromInt(intValue);
    const total=safeMana(maxMana({intValue,race}))||BASE_MANA;
    return{
      base:safeMana(BASE_MANA),
      racial:safeMana(racial),
      intelligence:safeMana(intelligence),
      total,
      rule:`A cada ${INT_STEP} pontos de INT, +${MANA_PER_STEP} de Mana máxima.`
    };
  }

  window.WONDERLAND_MANA_SYSTEM={
    BASE_MANA,
    INT_STEP,
    MANA_PER_STEP,
    toNumber,
    safeMana,
    racialMana,
    manaFromInt,
    maxMana,
    breakdown
  };
})();
