"use strict";
(function(){
  const clampPercent=value=>Math.max(0,Math.min(75,Number(value)||0));
  const physicalReduction=def=>clampPercent(Math.floor((Number(def)||0)/5));
  const magicalReduction=res=>clampPercent(Math.floor((Number(res)||0)/5));
  const trueReduction=res=>clampPercent(Math.floor((Number(res)||0)/10));
  const hpBonus=res=>Math.floor((Number(res)||0)/5)*10;
  const negativeEffectReduction=res=>clampPercent(Math.floor((Number(res)||0)/5));
  window.WONDERLAND_DEFENSE_SYSTEM={
    rules:{
      DEF:"A cada 5 pontos de DEF, o personagem reduz em 1% o dano físico recebido.",
      RES:"A cada 5 pontos de RES, o personagem recebe +10 de HP máximo, reduz em 1% o dano mágico recebido e em 1% a duração ou intensidade de efeitos negativos. A cada 10 pontos de RES, reduz em 1% o dano verdadeiro recebido. Reduções defensivas têm limite de 75%."
    },
    breakdown({def=0,res=0}={}){
      return{
        physicalReduction:physicalReduction(def),
        magicalReduction:magicalReduction(res),
        trueReduction:trueReduction(res),
        hpBonus:hpBonus(res),
        negativeEffectReduction:negativeEffectReduction(res)
      };
    },
    reduceDamage(amount,type,{def=0,res=0}={}){
      const base=Math.max(0,Number(amount)||0);
      const reductions={physical:physicalReduction(def),magical:magicalReduction(res),true:trueReduction(res)};
      const reduction=reductions[type]||0;
      return Math.max(0,Math.round(base*(1-reduction/100)));
    }
  };
})();