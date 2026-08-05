"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const defense=window.WONDERLAND_DEFENSE_SYSTEM;
  const manaSystem=window.WONDERLAND_MANA_SYSTEM;
  const attrs=["FOR","DEF","RES","INI","INT","ARC"];
  const GRID_W=10,GRID_H=7;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const els={setup:$("arenaSetup"),battle:$("arenaBattle"),character:$("arenaCharacter"),monster:$("arenaMonster"),start:$("arenaStart"),message:$("arenaMessage"),grid:$("arenaGrid"),skillCards:$("arenaSkillCards"),log:$("arenaCombatLog"),timer:$("arenaTimer"),turnLabel:$("arenaTurnLabel"),movementInfo:$("arenaMovementInfo"),defend:$("arenaDefend"),endTurn:$("arenaEndTurn"),reset:$("arenaReset")};
  const state={characters:[],sheet:null,character:null,race:null,cls:null,attrs:null,skills:[],dummy:null,started:false,turn:"player",round:1,timer:60,timerId:null,selectedAction:null,player:null,enemy:null,moveLeft:0,actions:{basic:false,race:false,class:false},defendCooldown:0,log:[]};
  if(!account){els.message.textContent="Sistema de contas indisponível.";return}

  function baseAttributes(row){return Object.fromEntries(attrs.map(attr=>{const k=attr.toLowerCase();return[attr,Number(row?.[`base_${k}`]||20)+Number(row?.[`allocated_${k}`]||0)+Number(row?.[`racial_${k}`]||0)]}))}
  function equipmentBonus(equipment){const out=Object.fromEntries(attrs.map(a=>[a,0]));const seen=new Set();(equipment||[]).forEach(item=>{if(item?.metadata?.linked_two_hand)return;const key=`${item.item_key}:${item.slot}`;if(seen.has(key))return;seen.add(key);Object.entries(item?.metadata?.stats||{}).forEach(([a,v])=>{a=String(a).toUpperCase();if(attrs.includes(a))out[a]+=Number(v)||0})});return out}
  function textValue(value){if(value==null)return"";if(typeof value==="string"||typeof value==="number")return String(value).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();if(Array.isArray(value))return value.map(textValue).filter(Boolean).join(" • ");if(typeof value==="object")return textValue(value.description||value.descricao||value.text||value.nome||value.name||"");return""}
  function parseLevel(value){const m=String(value||"").match(/(\d+)/);return Number(m?.[1]||1)}
  function parseScale(text){const m=String(text||"").match(/(\d+(?:[.,]\d+)?)%\s+(?:do|de|da)\s+(?:seu\s+)?(FOR|DEF|RES|INI|INT|ARC)/i);return m?{percent:Number(m[1].replace(",",".")),attr:m[2].toUpperCase()}:null}
  function parseMana(text){const m=String(text||"").match(/(\d+)\s*Mana/i);return Number(m?.[1]||0)}
  function officialSkills(cls,level,pathId){const list=[];(cls?.progressao||[]).forEach(s=>{const unlock=parseLevel(s.nivel);if(unlock<=level)list.push({...s,source:"class",unlock})});if(level>=50&&pathId){const selected=(cls?.caminhos||[]).find(p=>String(p.id||p.nome||"").toLowerCase()===String(pathId).toLowerCase());(selected?.habilidades||[]).forEach((s,i)=>{const unlock=[60,70,80,90,100][i]||100;if(unlock<=level)list.push({...s,source:"class",unlock})})}return list}
  function roleWeights(cls){const t=`${cls?.nome||""} ${cls?.especializacao||""} ${cls?.descricao||""}`.toLowerCase();if(/mago|feiticeiro|bruxo|necromante|alquimista/.test(t))return{INT:1.45,ARC:1.25,INI:1.08,RES:.95,DEF:.8,FOR:.65};if(/bardo|druida|suporte|cura|invoca/.test(t))return{ARC:1.45,INT:1.2,RES:1.12,INI:1.05,DEF:.9,FOR:.75};if(/assassino|ninja|arqueiro/.test(t))return{INI:1.45,FOR:1.25,DEF:.95,RES:.9,INT:.8,ARC:.75};if(/guerreiro|bárbaro|barbaro|espadachim|tanque/.test(t))return{FOR:1.35,DEF:1.28,RES:1.18,INI:.95,INT:.7,ARC:.75};return Object.fromEntries(attrs.map(a=>[a,1]))}
  function buildDummy(playerAttrs,cls,race){const w=roleWeights(cls);const total=attrs.reduce((s,a)=>s+Number(playerAttrs[a]||0),0);const sw=attrs.reduce((s,a)=>s+w[a],0);const distributed={};attrs.forEach(a=>distributed[a]=Math.max(1,Math.round(total*w[a]/sw)));const hpBase=Number(race?.stats?.hp||500);const hpMax=hpBase+Math.floor(distributed.RES/5)*10;const manaMax=manaSystem?.breakdown({intValue:distributed.INT,race})?.total||100+Math.floor(distributed.INT/5)*10;return{name:"Boneco de Teste",attrs:distributed,hpMax,manaMax,race:race?.name||"Raça adaptativa",className:cls?.nome||"Classe adaptativa"}}
  function movementFromIni(ini){return Math.max(1,Math.min(8,Math.floor(Number(ini||0)/25)))}
  function manhattan(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
  function log(text){state.log.unshift(text);state.log=state.log.slice(0,30);els.log.innerHTML=state.log.map(line=>`<p>${line}</p>`).join("")}
  function hpMaxFor(attrsObj,race){return Number(race?.stats?.hp||500)+Math.floor(Number(attrsObj.RES||0)/5)*10}
  function manaMaxFor(attrsObj,race){return manaSystem?.breakdown({intValue:Number(attrsObj.INT||0),race})?.total||100+Math.floor(Number(attrsObj.INT||0)/5)*10}
  function renderSetup(){
    if(!state.sheet)return;
    $("setupPlayerImage").src=state.character.image_url||state.race?.artwork||state.race?.image||"assets/images/logo.png";
    $("setupPlayerName").textContent=state.character.name;
    $("setupPlayerSummary").textContent=`${state.race?.name||state.character.race_id} • ${state.cls?.nome||state.character.class_id}`;
    $("setupPlayerStats").innerHTML=attrs.map(a=>`<span>${a}<strong>${esc(state.attrs[a])}</strong></span>`).join("");
    $("setupEnemySummary").textContent=`${state.dummy.race} • ${state.dummy.className}`;
    $("setupEnemyStats").innerHTML=attrs.map(a=>`<span>${a}<strong>${esc(state.dummy.attrs[a])}</strong></span>`).join("");
  }
  function actionData(){
    const basicType=/cajado|orbe|grimório|tomo|cetro/i.test((state.sheet?.equipment||[]).map(e=>e.metadata?.name||"").join(" "))?"magical":"physical";
    const basicAttr=basicType==="magical"?"INT":"FOR";
    const out=[{id:"basic",name:"Ataque básico",source:"basic",cost:0,range:1,scale:100,attr:basicAttr,type:basicType,description:`100% de ${basicAttr}. Alcance corpo a corpo.`}];
    state.skills.slice(0,8).forEach((s,i)=>{const desc=textValue(s.descricao);const parsed=parseScale(desc);out.push({id:`skill-${i}`,name:textValue(s.nome)||`Habilidade ${i+1}`,source:s.source||"class",cost:parseMana(desc),range:/distância|distancia|alcance|projétil|projetil|área|area/i.test(desc)?3:1,scale:parsed?.percent||100,attr:parsed?.attr||"FOR",type:parsed?.attr==="INT"?"magical":"physical",description:desc})});
    return out;
  }
  function renderBattleHeader(){
    const p=state.player,e=state.enemy;
    $("battlePlayerImage").src=p.image;$("battlePlayerName").textContent=p.name;$("battleEnemyName").textContent=e.name;
    $("battlePlayerHpText").textContent=`${p.hp} / ${p.hpMax}`;$("battleEnemyHpText").textContent=`${e.hp} / ${e.hpMax}`;
    $("battlePlayerManaText").textContent=`${p.mana} / ${p.manaMax}`;$("battleEnemyManaText").textContent=`${e.mana} / ${e.manaMax}`;
    $("battlePlayerHpBar").style.width=`${Math.max(0,p.hp/p.hpMax*100)}%`;$("battleEnemyHpBar").style.width=`${Math.max(0,e.hp/e.hpMax*100)}%`;
    $("battlePlayerManaBar").style.width=`${Math.max(0,p.mana/p.manaMax*100)}%`;$("battleEnemyManaBar").style.width=`${Math.max(0,e.mana/e.manaMax*100)}%`;
    els.turnLabel.textContent=state.turn==="player"?p.name:e.name;els.movementInfo.textContent=`Movimentos: ${state.turn==="player"?state.moveLeft:0}`;
    $("battlePlayerTurn").textContent=state.turn==="player"?"Seu turno":"Aguardando";$("battleEnemyTurn").textContent=state.turn==="enemy"?"IA calculando":"IA instantânea";
    $("actionBasicState").textContent=state.actions.basic?"Usado":"Disponível";$("actionRaceState").textContent=state.actions.race?"Usada":"Disponível";$("actionClassState").textContent=state.actions.class?"Usada":"Disponível";
    els.defend.disabled=state.turn!=="player"||state.defendCooldown>0;els.defend.textContent=state.defendCooldown>0?`Defender — recarga ${state.defendCooldown}`:"Defender próximo dano";
  }
  function renderSkills(){
    els.skillCards.innerHTML=actionData().map(a=>{const used=a.source==="basic"?state.actions.basic:state.actions[a.source]||false;return `<button type="button" class="arena-skill-card ${state.selectedAction?.id===a.id?"selected":""}" data-action-id="${esc(a.id)}" ${used||state.turn!=="player"?"disabled":""}><small>${a.source==="basic"?"Ataque básico":a.source==="race"?"Raça":"Classe"}</small><strong>${esc(a.name)}</strong><span>${a.cost} Mana • ${a.range} casa(s)</span><p>${esc(a.description)}</p><em>${a.scale}% de ${a.attr} • dano ${a.type==="magical"?"mágico":"físico"}</em></button>`}).join("")
  }
  function reachableCells(origin,steps){const cells=[];for(let y=0;y<GRID_H;y++)for(let x=0;x<GRID_W;x++){const d=manhattan(origin,{x,y});if(d>0&&d<=steps&&!(x===state.enemy.x&&y===state.enemy.y))cells.push(`${x},${y}`)}return new Set(cells)}
  function rangeCells(origin,range){const cells=[];for(let y=0;y<GRID_H;y++)for(let x=0;x<GRID_W;x++){const d=manhattan(origin,{x,y});if(d>0&&d<=range)cells.push(`${x},${y}`)}return new Set(cells)}
  function renderGrid(){
    const moveSet=state.turn==="player"&&!state.selectedAction?reachableCells(state.player,state.moveLeft):new Set();
    const rangeSet=state.turn==="player"&&state.selectedAction?rangeCells(state.player,state.selectedAction.range):new Set();
    let html="";
    for(let y=0;y<GRID_H;y++)for(let x=0;x<GRID_W;x++){
      const key=`${x},${y}`;const isP=x===state.player.x&&y===state.player.y;const isE=x===state.enemy.x&&y===state.enemy.y;const cls=["arena-cell"];
      if(moveSet.has(key))cls.push("can-move");if(rangeSet.has(key))cls.push("in-range");if(isE&&rangeSet.has(key))cls.push("targetable");
      html+=`<button type="button" class="${cls.join(" ")}" data-x="${x}" data-y="${y}" role="gridcell">${isP?`<img src="${esc(state.player.image)}" alt="${esc(state.player.name)}"><span class="unit player-unit">${esc(state.player.name)}</span>`:isE?`<span class="dummy-unit">✦</span><span class="unit enemy-unit">${esc(state.enemy.name)}</span>`:""}</button>`;
    }
    els.grid.innerHTML=html;
  }
  function startTimer(){clearInterval(state.timerId);state.timer=60;els.timer.textContent=state.timer;state.timerId=setInterval(()=>{if(!state.started||state.turn!=="player")return;state.timer--;els.timer.textContent=state.timer;if(state.timer<=0){clearInterval(state.timerId);state.player.hp=0;renderAll();finish("O tempo chegou a zero. O jogador perdeu o combate.")}},1000)}
  function calculateDamage(attacker,target,action){const raw=Math.max(0,Math.round(Number(attacker.attrs[action.attr]||0)*(action.scale/100)));const info=defense?.breakdown({def:target.attrs.DEF,res:target.attrs.RES})||{};const reduction=action.type==="magical"?(info.magicalReduction??Math.min(75,Math.floor(target.attrs.RES/5))):(info.physicalReduction??Math.min(75,Math.floor(target.attrs.DEF/5)));return{raw,reduction,final:Math.max(0,Math.round(raw*(1-reduction/100)))}}
  function useAction(action,target){
    if(state.turn!=="player"||target!==state.enemy)return;
    const category=action.source==="basic"?"basic":action.source==="race"?"race":"class";
    if(state.actions[category])return;
    if(manhattan(state.player,state.enemy)>action.range){log(`<strong>${esc(action.name)}</strong> está fora de alcance.`);return}
    if(state.player.mana<action.cost){log(`Mana insuficiente para <strong>${esc(action.name)}</strong>.`);return}
    const dmg=calculateDamage(state.player,state.enemy,action);state.player.mana-=action.cost;
    if(state.enemy.defending){log(`${state.enemy.name} bloqueou 100% do dano.`);state.enemy.defending=false}else state.enemy.hp=Math.max(0,state.enemy.hp-dmg.final);
    state.actions[category]=true;state.selectedAction=null;log(`${state.player.name} usa <strong>${esc(action.name)}</strong>: ${dmg.raw} bruto, ${dmg.reduction}% reduzido, <strong>${dmg.final} de dano</strong>.`);renderAll();if(state.enemy.hp<=0)finish(`${state.enemy.name} foi derrotado.`)
  }
  function moveUnit(unit,x,y){const dist=manhattan(unit,{x,y});if(dist<1||dist>state.moveLeft)return;unit.x=x;unit.y=y;state.moveLeft-=dist;log(`${unit.name} moveu ${dist} casa(s).`);renderAll()}
  function enemyTurn(){
    if(!state.started)return;state.turn="enemy";clearInterval(state.timerId);renderAll();setTimeout(()=>{
      if(!state.started)return;
      const dist=manhattan(state.enemy,state.player);const move=movementFromIni(state.enemy.attrs.INI);
      if(dist>1){let steps=Math.min(move,dist-1);while(steps-->0){if(state.enemy.x<state.player.x)state.enemy.x++;else if(state.enemy.x>state.player.x)state.enemy.x--;else if(state.enemy.y<state.player.y)state.enemy.y++;else if(state.enemy.y>state.player.y)state.enemy.y--;}log(`${state.enemy.name} avança até o alvo.`)}
      if(manhattan(state.enemy,state.player)<=1){const action={name:"Golpe de treinamento",attr:Number(state.enemy.attrs.INT)>Number(state.enemy.attrs.FOR)?"INT":"FOR",scale:100,type:Number(state.enemy.attrs.INT)>Number(state.enemy.attrs.FOR)?"magical":"physical"};const dmg=calculateDamage(state.enemy,state.player,action);if(state.player.defending){log(`${state.player.name} bloqueou 100% do próximo dano.`);state.player.defending=false}else state.player.hp=Math.max(0,state.player.hp-dmg.final);log(`${state.enemy.name} usa <strong>${action.name}</strong> e causa <strong>${dmg.final} de dano</strong>.`)}
      renderAll();if(state.player.hp<=0){finish(`${state.player.name} foi derrotado.`);return}beginPlayerTurn();
    },450)
  }
  function beginPlayerTurn(){state.turn="player";state.round++;state.actions={basic:false,race:false,class:false};state.moveLeft=movementFromIni(state.player.attrs.INI);if(state.defendCooldown>0)state.defendCooldown--;state.selectedAction=null;log(`Turno ${state.round}: ${state.player.name}.`);renderAll();startTimer()}
  function finish(text){state.started=false;clearInterval(state.timerId);log(`<strong>${esc(text)}</strong>`);renderAll()}
  function renderAll(){renderBattleHeader();renderSkills();renderGrid()}

  async function loadCharacters(){
    const current=await account.current().catch(()=>null);if(!current){window.location.replace("conta.html");return}
    try{state.characters=await account.getCharacters()}catch(error){console.error(error);els.message.textContent=error.message||"Não foi possível carregar os personagens.";state.characters=[]}
    els.character.innerHTML=state.characters.length?state.characters.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} • Nível ${esc(c.level||1)}</option>`).join(""):'<option value="">Nenhum personagem disponível</option>';
    els.start.disabled=!state.characters.length;if(state.characters.length)await loadCharacter(state.characters[0].id)
  }
  async function loadCharacter(id){
    if(!id)return;els.message.textContent="Carregando personagem...";
    try{const sheet=await account.getCharacterSheet(id);state.sheet=sheet;state.character=sheet.character;const base=baseAttributes(sheet.attributes),bonus=equipmentBonus(sheet.equipment);state.attrs=Object.fromEntries(attrs.map(a=>[a,(base[a]||0)+(bonus[a]||0)]));state.race=(window.WONDERLAND_RACES||[]).find(r=>r.id===state.character.race_id);state.cls=(window.WONDERLAND_CLASSES||{})[state.character.class_id];state.skills=officialSkills(state.cls,Number(state.character.level||1),state.character.path_id);state.dummy=buildDummy(state.attrs,state.cls,state.race);renderSetup();els.message.textContent="Pronto para iniciar."}catch(error){console.error(error);els.message.textContent=error.message||"Não foi possível carregar o personagem."}
  }
  function startBattle(){
    if(!state.sheet)return;const playerHp=hpMaxFor(state.attrs,state.race),playerMana=manaMaxFor(state.attrs,state.race);
    state.player={name:state.character.name,image:state.character.image_url||state.race?.artwork||state.race?.image||"assets/images/logo.png",attrs:{...state.attrs},hpMax:playerHp,hp:playerHp,manaMax:playerMana,mana:playerMana,x:1,y:Math.floor(GRID_H/2),defending:false};
    state.enemy={name:state.dummy.name,attrs:{...state.dummy.attrs},hpMax:state.dummy.hpMax,hp:state.dummy.hpMax,manaMax:state.dummy.manaMax,mana:state.dummy.manaMax,x:GRID_W-2,y:Math.floor(GRID_H/2),defending:false};
    state.started=true;state.turn="player";state.round=1;state.actions={basic:false,race:false,class:false};state.moveLeft=movementFromIni(state.player.attrs.INI);state.defendCooldown=0;state.selectedAction=null;state.log=[];els.setup.hidden=true;els.battle.hidden=false;log(`O teste começou. ${state.player.name} age primeiro.`);renderAll();startTimer()
  }

  els.character.addEventListener("change",()=>loadCharacter(els.character.value));
  els.start.addEventListener("click",startBattle);
  els.skillCards.addEventListener("click",event=>{const btn=event.target.closest("[data-action-id]");if(!btn||btn.disabled)return;state.selectedAction=actionData().find(a=>a.id===btn.dataset.actionId)||null;renderAll()});
  els.grid.addEventListener("click",event=>{const cell=event.target.closest(".arena-cell");if(!cell||state.turn!=="player"||!state.started)return;const x=Number(cell.dataset.x),y=Number(cell.dataset.y);if(x===state.enemy.x&&y===state.enemy.y&&state.selectedAction){useAction(state.selectedAction,state.enemy);return}if(!state.selectedAction)moveUnit(state.player,x,y)});
  els.endTurn.addEventListener("click",()=>{if(state.turn==="player"&&state.started)enemyTurn()});
  els.defend.addEventListener("click",()=>{if(state.turn!=="player"||state.defendCooldown>0)return;state.player.defending=true;state.defendCooldown=5;state.actions={basic:true,race:true,class:true};state.moveLeft=0;log(`${state.player.name} abriu mão de todas as ações e entrou em defesa.`);renderAll();enemyTurn()});
  els.reset.addEventListener("click",()=>{state.started=false;clearInterval(state.timerId);els.battle.hidden=true;els.setup.hidden=false;els.message.textContent="Teste encerrado sem alterar a ficha real."});

  await loadCharacters();
})();