"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const defense=window.WONDERLAND_DEFENSE_SYSTEM;
  const manaSystem=window.WONDERLAND_MANA_SYSTEM;
  const characterSelect=document.getElementById("arenaCharacter");
  const skillSelect=document.getElementById("arenaSkill");
  const damageType=document.getElementById("arenaDamageType");
  const scaleInput=document.getElementById("arenaScale");
  const enemyDef=document.getElementById("arenaEnemyDef");
  const enemyRes=document.getElementById("arenaEnemyRes");
  const enemyHp=document.getElementById("arenaEnemyHp");
  const turnsInput=document.getElementById("arenaTurns");
  const runButton=document.getElementById("arenaRun");
  const message=document.getElementById("arenaMessage");
  const resultCards=document.getElementById("arenaResultCards");
  const combatLog=document.getElementById("arenaCombatLog");
  const attrs=["FOR","DEF","RES","INI","INT","ARC"];
  const state={characters:[],sheet:null,character:null,finalAttrs:null,skills:[],dummy:null};
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");

  if(!account){message.textContent="Sistema de contas indisponível.";return}

  function baseAttributes(row){return Object.fromEntries(attrs.map(attr=>{const key=attr.toLowerCase();return[attr,Number(row?.[`base_${key}`]||20)+Number(row?.[`allocated_${key}`]||0)+Number(row?.[`racial_${key}`]||0)]}))}
  function equipmentBonus(equipment){const result=Object.fromEntries(attrs.map(attr=>[attr,0]));const seen=new Set();(equipment||[]).forEach(item=>{if(item?.metadata?.linked_two_hand)return;const key=`${item.item_key}:${item.slot}`;if(seen.has(key))return;seen.add(key);Object.entries(item?.metadata?.stats||{}).forEach(([attr,value])=>{const normalized=String(attr).toUpperCase();if(attrs.includes(normalized))result[normalized]+=Number(value)||0})});return result}
  function textValue(value){if(value===null||value===undefined)return"";if(typeof value==="string"||typeof value==="number")return String(value).replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();if(Array.isArray(value))return value.map(textValue).filter(Boolean).join(" • ");if(typeof value==="object")return textValue(value.description||value.descricao||value.text||value.nome||value.name||"");return""}
  function parseLevel(value){const match=String(value||"").match(/(\d+)/);return Number(match?.[1]||1)}
  function parseSkillScale(description){const match=String(description||"").match(/(\d+(?:[.,]\d+)?)%\s+(?:do|de|da)\s+(?:seu\s+)?(FOR|DEF|RES|INI|INT|ARC)/i);return match?{percent:Number(match[1].replace(",",".")),attr:match[2].toUpperCase()}:null}
  function officialSkills(cls,level,pathId){const list=[];(cls?.progressao||[]).forEach(skill=>{const unlock=parseLevel(skill.nivel);if(unlock<=level)list.push({...skill,source:"Classe",unlock})});if(level>=50&&pathId){const selected=(cls?.caminhos||[]).find(path=>String(path.id||path.nome||"").toLowerCase()===String(pathId).toLowerCase());(selected?.habilidades||[]).forEach((skill,index)=>{const unlock=[60,70,80,90,100][index]||100;if(unlock<=level)list.push({...skill,source:selected.nome,unlock})})}return list.filter(skill=>textValue(skill.nome)&&textValue(skill.descricao))}
  function roleWeights(cls){const text=`${cls?.nome||""} ${cls?.especializacao||""} ${cls?.descricao||""}`.toLowerCase();if(/mago|feiticeiro|bruxo|necromante|alquimista/.test(text))return{INT:1.45,ARC:1.25,INI:1.08,RES:.95,DEF:.8,FOR:.65};if(/bardo|druida|suporte|cura|invoca/.test(text))return{ARC:1.45,INT:1.2,RES:1.12,INI:1.05,DEF:.9,FOR:.75};if(/assassino|ninja|arqueiro/.test(text))return{INI:1.45,FOR:1.25,DEF:.95,RES:.9,INT:.8,ARC:.75};if(/guerreiro|bárbaro|barbaro|espadachim|tanque/.test(text))return{FOR:1.35,DEF:1.28,RES:1.18,INI:.95,INT:.7,ARC:.75};return{FOR:1.1,DEF:1.1,RES:1.1,INI:1.1,INT:1.1,ARC:1.1}}
  function buildDummy(playerAttrs,cls,race){const weights=roleWeights(cls);const total=attrs.reduce((sum,key)=>sum+Number(playerAttrs[key]||0),0);const sumWeights=attrs.reduce((sum,key)=>sum+weights[key],0);const distributed={};attrs.forEach(key=>distributed[key]=Math.max(1,Math.round(total*(weights[key]/sumWeights))));const hpBase=Number(race?.stats?.hp||500);const hpBonus=Math.floor(distributed.RES/5)*10;const mana=manaSystem?.breakdown({intValue:distributed.INT,race})?.total||Math.floor(distributed.INT/5)*10;return{name:"Boneco de Teste",race:race?.name||"Raça aleatória",className:cls?.nome||"Classe aleatória",attrs:distributed,hpMax:hpBase+hpBonus,manaMax:mana}}
  function renderDummy(){const dummy=state.dummy;if(!dummy)return;document.getElementById("arenaEnemyName").textContent=dummy.name;document.getElementById("arenaEnemyProfile").textContent=`${dummy.race} • ${dummy.className}`;document.getElementById("arenaEnemyHpView").textContent=String(dummy.hpMax);document.getElementById("arenaEnemyDefView").textContent=String(dummy.attrs.DEF);document.getElementById("arenaEnemyResView").textContent=String(dummy.attrs.RES);document.getElementById("arenaEnemyStats").innerHTML=attrs.map(attr=>`<span>${attr}<strong>${esc(dummy.attrs[attr])}</strong></span>`).join("");enemyHp.value=String(dummy.hpMax);enemyDef.value=String(dummy.attrs.DEF);enemyRes.value=String(dummy.attrs.RES)}

  async function loadCharacters(){
    const current=await account.current().catch(()=>null);
    if(!current){window.location.replace("conta.html");return}
    let characters=[];
    try{characters=await (account.getCharacters?account.getCharacters():account.listCharacters?.())}catch(error){console.error(error);message.textContent=error.message||"Não foi possível carregar os personagens."}
    state.characters=Array.isArray(characters)?characters:[];
    characterSelect.innerHTML=state.characters.length?state.characters.map(char=>`<option value="${esc(char.id)}">${esc(char.name)} • Nível ${esc(char.level||1)}</option>`).join(""):'<option value="">Nenhum personagem disponível</option>';
    characterSelect.disabled=!state.characters.length;
    runButton.disabled=!state.characters.length;
    if(state.characters.length)await loadCharacter(state.characters[0].id);else message.textContent="Nenhum personagem foi encontrado nesta conta."
  }

  async function loadCharacter(id){
    if(!id)return;
    message.textContent="Carregando combatente...";
    try{
      const sheet=await account.getCharacterSheet(id);
      state.sheet=sheet;state.character=sheet.character;
      const base=baseAttributes(sheet.attributes);const bonus=equipmentBonus(sheet.equipment);state.finalAttrs=Object.fromEntries(attrs.map(attr=>[attr,(base[attr]||0)+(bonus[attr]||0)]));
      const race=(window.WONDERLAND_RACES||[]).find(item=>item.id===sheet.character.race_id);
      const cls=(window.WONDERLAND_CLASSES||{})[sheet.character.class_id];
      state.skills=officialSkills(cls,Number(sheet.character.level||1),sheet.character.path_id);
      document.getElementById("arenaPlayerName").textContent=sheet.character.name;
      document.getElementById("arenaPlayerClass").textContent=`${race?.name||sheet.character.race_id} • ${cls?.nome||sheet.character.class_id}`;
      document.getElementById("arenaPlayerImage").src=sheet.character.image_url||race?.artwork||race?.image||"assets/images/logo.png";
      document.getElementById("arenaPlayerStats").innerHTML=attrs.map(attr=>`<span>${attr}<strong>${esc(state.finalAttrs[attr])}</strong></span>`).join("");
      skillSelect.innerHTML='<option value="basic">Ataque básico</option>'+state.skills.map((skill,index)=>`<option value="${index}">${esc(textValue(skill.nome))}</option>`).join("");
      state.dummy=buildDummy(state.finalAttrs,cls,race);renderDummy();
      message.textContent="Combatente e Boneco de Teste prontos.";
    }catch(error){console.error(error);message.textContent=error.message||"Não foi possível carregar o personagem."}
  }

  function syncEnemyView(){document.getElementById("arenaEnemyHpView").textContent=String(Math.max(1,Number(enemyHp.value)||1));document.getElementById("arenaEnemyDefView").textContent=String(Math.max(0,Number(enemyDef.value)||0));document.getElementById("arenaEnemyResView").textContent=String(Math.max(0,Number(enemyRes.value)||0))}
  function runTest(){if(!state.finalAttrs){message.textContent="Selecione um personagem.";return}const selected=skillSelect.value==="basic"?null:state.skills[Number(skillSelect.value)];const parsed=selected?parseSkillScale(textValue(selected.descricao)):null;const type=damageType.value;const defaultAttr=type==="magical"?"INT":"FOR";const scalingAttr=parsed?.attr||defaultAttr;const percent=Math.max(0,Number(scaleInput.value)||100);const attrValue=Number(state.finalAttrs[scalingAttr]||0);const raw=Math.round(attrValue*(percent/100));const targetDef=Math.max(0,Number(enemyDef.value)||0);const targetRes=Math.max(0,Number(enemyRes.value)||0);let reduction=0;if(type==="physical")reduction=defense?.breakdown({def:targetDef,res:targetRes})?.physicalReduction??Math.min(75,Math.floor(targetDef/5));if(type==="magical")reduction=defense?.breakdown({def:targetDef,res:targetRes})?.magicalReduction??Math.min(75,Math.floor(targetRes/5));if(type==="true")reduction=defense?.breakdown({def:targetDef,res:targetRes})?.trueReduction??Math.min(75,Math.floor(targetRes/10));const final=Math.max(0,Math.round(raw*(1-reduction/100)));const turns=Math.max(1,Math.min(20,Number(turnsInput.value)||1));const total=final*turns;const hp=Math.max(1,Number(enemyHp.value)||1);const remaining=Math.max(0,hp-total);resultCards.innerHTML=`<article><span>Dano bruto</span><strong>${raw}</strong></article><article><span>Redução</span><strong>${reduction}%</strong></article><article><span>Dano final</span><strong>${total}</strong></article><article><span>HP restante</span><strong>${remaining}</strong></article>`;combatLog.innerHTML=`<p><strong>${esc(state.character.name)}</strong> usa <strong>${esc(selected?textValue(selected.nome):"Ataque básico")}</strong>.</p><p>Escala utilizada: ${percent}% de ${scalingAttr} (${attrValue}) = ${raw} de dano bruto.</p><p>O Boneco de Teste reduz ${reduction}% por suas defesas. Dano por turno: ${final}.</p><p>${turns} turno(s): ${final} × ${turns} = <strong>${total} de dano final</strong>.</p><p>HP do alvo: ${hp} → ${remaining}.</p>`;message.textContent=remaining<=0?"Teste concluído: Boneco de Teste derrotado.":"Teste concluído."}

  characterSelect.addEventListener("change",()=>loadCharacter(characterSelect.value));
  skillSelect.addEventListener("change",()=>{const skill=skillSelect.value==="basic"?null:state.skills[Number(skillSelect.value)];const parsed=skill?parseSkillScale(textValue(skill.descricao)):null;if(parsed){scaleInput.value=String(parsed.percent);damageType.value=parsed.attr==="INT"?"magical":"physical"}});
  [enemyDef,enemyRes,enemyHp].forEach(input=>input.addEventListener("input",syncEnemyView));runButton.addEventListener("click",runTest);syncEnemyView();await loadCharacters();
})();