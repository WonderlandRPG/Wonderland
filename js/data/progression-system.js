"use strict";

(function(){
  const XP_TOTAL_BY_LEVEL={
    1:0,2:100,3:250,4:450,5:700,6:1000,7:1350,8:1750,9:2200,10:2700,
    11:3400,12:4150,13:4950,14:5700,15:6500,16:7600,17:8700,18:9950,19:11200,20:12500,
    21:14200,22:15900,23:17600,24:19300,25:21000,26:23200,27:25400,28:27600,29:29800,30:32000,
    31:34800,32:37600,33:40400,34:43200,35:46000,36:49400,37:52800,38:56200,39:59600,40:63000,
    41:67000,42:71000,43:75000,44:79000,45:83000,46:87600,47:92200,48:96800,49:101400,50:106000,
    51:111200,52:116400,53:121600,54:126800,55:132000,56:137800,57:143600,58:149400,59:155200,60:161000,
    61:167600,62:174200,63:180800,64:187400,65:194000,66:201200,67:208400,68:215600,69:222800,70:230000,
    71:238000,72:246000,73:254000,74:262000,75:270000,76:278800,77:287600,78:296400,79:305200,80:314000,
    81:323600,82:333200,83:342800,84:352400,85:362000,86:372600,87:383200,88:393800,89:404400,90:415000,
    91:426400,92:437800,93:449200,94:460600,95:472000,96:484600,97:497200,98:509800,99:522400,100:535000
  };

  const MISSION_REWARDS={
    E:{xp:500,wg:100},
    D:{xp:1000,wg:250},
    C:{xp:2000,wg:600},
    B:{xp:4000,wg:1500},
    A:{xp:8000,wg:4000},
    S:{xp:15000,wg:10000},
    EX:{xp:30000,wg:25000}
  };

  const CURRENCY={code:"WG",name:"Wonderland Gold"};

  function clampLevel(level){return Math.max(1,Math.min(100,Number(level)||1))}
  function totalForLevel(level){return XP_TOTAL_BY_LEVEL[clampLevel(level)]??0}
  function nextLevelTotal(level){const current=clampLevel(level);return current>=100?XP_TOTAL_BY_LEVEL[100]:XP_TOTAL_BY_LEVEL[current+1]}
  function levelFromTotalXp(totalXp){
    const xp=Math.max(0,Number(totalXp)||0);
    let level=1;
    for(let current=2;current<=100;current+=1){if(xp>=XP_TOTAL_BY_LEVEL[current])level=current;else break}
    return level;
  }
  function progress(totalXp,explicitLevel){
    const xp=Math.max(0,Number(totalXp)||0);
    const level=explicitLevel?clampLevel(explicitLevel):levelFromTotalXp(xp);
    const currentFloor=totalForLevel(level);
    const nextTotal=nextLevelTotal(level);
    const span=Math.max(0,nextTotal-currentFloor);
    const intoLevel=Math.max(0,xp-currentFloor);
    const percent=level>=100?100:Math.max(0,Math.min(100,span?intoLevel/span*100:0));
    return{level,totalXp:xp,currentFloor,nextTotal,span,intoLevel,percent};
  }
  function rewardForRank(rank){return MISSION_REWARDS[String(rank||"E").toUpperCase()]||MISSION_REWARDS.E}
  function formatNumber(value){return new Intl.NumberFormat("pt-BR").format(Number(value)||0)}

  window.WONDERLAND_PROGRESSION={XP_TOTAL_BY_LEVEL,MISSION_REWARDS,CURRENCY,clampLevel,totalForLevel,nextLevelTotal,levelFromTotalXp,progress,rewardForRank,formatNumber};
})();
