"use strict";

(function(){
  const BASE_MANA=100;
  const INT_STEP=5;
  const MANA_PER_STEP=10;

  const toNumber=(value,fallback=0)=>{
    if(typeof value==="string")value=value.replace(",",".").replace(/[^0-9.-]/g,"");
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };

  function racialMana(race){
    const value=race?.stats?.mana;
    return Math.max(0,toNumber(value,0));
  }

  function manaFromInt(intValue){
    return Math.floor(Math.max(0,toNumber(intValue,0))/INT_STEP)*MANA_PER_STEP;
  }

  function maxMana({intValue=0,race=null}={}){
    const total=BASE_MANA+racialMana(race)+manaFromInt(intValue);
    return Number.isFinite(total)?Math.max(0,total):BASE_MANA;
  }

  function breakdown({intValue=0,race=null}={}){
    const racial=racialMana(race);
    const intelligence=manaFromInt(intValue);
    const total=maxMana({intValue,race});
    return{
      base:BASE_MANA,
      racial,
      intelligence,
      total,
      rule:`A cada ${INT_STEP} pontos de INT, +${MANA_PER_STEP} de Mana máxima.`
    };
  }

  window.WONDERLAND_MANA_SYSTEM={
    BASE_MANA,
    INT_STEP,
    MANA_PER_STEP,
    toNumber,
    racialMana,
    manaFromInt,
    maxMana,
    breakdown
  };
})();
