"use strict";

(function(){
  const BASE_MANA=100;
  const INT_STEP=5;
  const MANA_PER_STEP=10;

  const toNumber=value=>{
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:0;
  };

  function racialMana(race){
    const value=race?.stats?.mana;
    if(typeof value==="number")return Math.max(0,value);
    const parsed=Number(String(value??"").replace(/[^0-9.-]/g,""));
    return Number.isFinite(parsed)?Math.max(0,parsed):0;
  }

  function manaFromInt(intValue){
    return Math.floor(Math.max(0,toNumber(intValue))/INT_STEP)*MANA_PER_STEP;
  }

  function maxMana({intValue=0,race=null}={}){
    return BASE_MANA+racialMana(race)+manaFromInt(intValue);
  }

  function breakdown({intValue=0,race=null}={}){
    const racial=racialMana(race);
    const intelligence=manaFromInt(intValue);
    return{
      base:BASE_MANA,
      racial,
      intelligence,
      total:BASE_MANA+racial+intelligence,
      rule:`A cada ${INT_STEP} pontos de INT, +${MANA_PER_STEP} de Mana máxima.`
    };
  }

  window.WONDERLAND_MANA_SYSTEM={
    BASE_MANA,
    INT_STEP,
    MANA_PER_STEP,
    racialMana,
    manaFromInt,
    maxMana,
    breakdown
  };
})();
