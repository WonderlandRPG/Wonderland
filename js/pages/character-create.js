"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  if(!account){window.location.replace("conta.html");return}
  const user=await account.current().catch(()=>null);
  if(!user){window.location.replace("conta.html");return}
  const existing=await account.getCharacters().catch(()=>[]);
  if(existing.length>=3){window.location.replace("personagens.html");return}

  const races=Array.isArray(window.WONDERLAND_RACES)?window.WONDERLAND_RACES:[];
  const classes=window.WONDERLAND_CLASSES||{};
  const attrs=["FOR","DEF","RES","INI","INT","ARC"];
  const attrNames={FOR:"Força",DEF:"Defesa",RES:"Resistência",INI:"Iniciativa",INT:"Inteligência",ARC:"Arcano"};
  const base=20,freeTotal=100;
  const allocation=Object.fromEntries(attrs.map(a=>[a,0]));
  let step=1,activeProfile="";

  const $=id=>document.getElementById(id);
  const form=$("characterCreateForm"),nameInput=$("characterName"),storyInput=$("characterStory"),raceSelect=$("characterRace"),classSelect=$("characterClass"),racePreview=$("racePreview"),classPreview=$("classPreview"),allocator=$("attributeAllocator"),remaining=$("remainingPoints"),review=$("characterReview"),message=$("characterCreateMessage"),prev=$("previousStep"),next=$("nextStep"),finish=$("finishCharacter"),reset=$("resetAttributes"),classAttributeGuide=$("classAttributeGuide"),autoDistributionMessage=$("autoDistributionMessage");
  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const selectedRace=()=>races.find(r=>r.id===raceSelect.value)||races[0];
  const selectedClass=()=>classes[classSelect.value]||Object.values(classes)[0];
  const racialBonus=a=>Number(selectedRace()?.stats?.attributes?.[a]||0);
  const usedPoints=()=>attrs.reduce((sum,a)=>sum+allocation[a],0);
  const finalValue=a=>base+allocation[a]+racialBonus(a);

  function parseClassAttributes(cls){
    const source=String(cls?.estilo?.atributos||"").toUpperCase();
    const ordered=attrs.filter(attr=>source.includes(attr));
    const role=String(cls?.cargo||"").toLowerCase();
    let primary=ordered[0];
    if(!primary){
      if(role.includes("suporte")||role.includes("invocador"))primary="ARC";
      else if(role.includes("mágico")||role.includes("magico"))primary="INT";
      else if(role.includes("assassino"))primary="INI";
      else if(role.includes("tanque")&&!role.includes("dps"))primary="DEF";
      else primary="FOR";
    }
    let secondary=ordered.find(attr=>attr!==primary);
    if(!secondary)secondary=primary==="FOR"?"RES":primary==="INT"?"ARC":primary==="ARC"?"INT":primary==="INI"?"FOR":primary==="DEF"?"RES":"DEF";
    return{primary,secondary};
  }

  function distributeByWeights(weights){
    const entries=attrs.map(attr=>({attr,weight:Math.max(.01,Number(weights[attr]||.01))}));
    const total=entries.reduce((sum,item)=>sum+item.weight,0);
    const raw=entries.map(item=>({...item,raw:item.weight/total*freeTotal}));
    const values=Object.fromEntries(raw.map(item=>[item.attr,Math.floor(item.raw)]));
    let left=freeTotal-Object.values(values).reduce((sum,value)=>sum+value,0);
    raw.sort((a,b)=>(b.raw%1)-(a.raw%1));
    for(let i=0;left>0;i=(i+1)%raw.length){values[raw[i].attr]++;left--}
    attrs.forEach(attr=>allocation[attr]=values[attr]);
  }

  function profileWeights(profile){
    const cls=selectedClass(),{primary,secondary}=parseClassAttributes(cls),role=String(cls?.cargo||"").toLowerCase();
    const weights=Object.fromEntries(attrs.map(attr=>[attr,1]));
    if(profile==="aggressive"){
      weights[primary]+=5;weights[secondary]+=2;weights.INI+=2;(primary==="INT"||primary==="ARC"?weights.INT:weights.FOR)+=1.5;weights.DEF=.65;weights.RES=.75;
    }else if(profile==="defensive"){
      weights.DEF+=4;weights.RES+=4;weights[primary]+=2;weights[secondary]+=1.5;if(role.includes("suporte")||role.includes("tanque"))weights.ARC+=1;
    }else{
      weights[primary]+=3.5;weights[secondary]+=2;weights.DEF+=1;weights.RES+=1;weights.INI+=1;if(role.includes("suporte"))weights.ARC+=1.5;
    }
    attrs.forEach(attr=>{if(racialBonus(attr)>0)weights[attr]+=Math.min(1.5,racialBonus(attr)*.22)});
    return weights;
  }

  function applyAutoDistribution(profile){
    distributeByWeights(profileWeights(profile));activeProfile=profile;
    document.querySelectorAll("[data-auto-profile]").forEach(button=>button.classList.toggle("active",button.dataset.autoProfile===profile));
    const labels={aggressive:"Agressivo",balanced:"Equilibrado",defensive:"Defensivo"};
    autoDistributionMessage.textContent=`Perfil ${labels[profile]} aplicado com base em ${selectedClass()?.nome} e ${selectedRace()?.name}.`;
    renderAllocator();renderReview();
  }

  function renderClassAttributeGuide(){
    const cls=selectedClass(),{primary,secondary}=parseClassAttributes(cls);
    classAttributeGuide.innerHTML=`<div class="class-attribute-guide-icon" aria-hidden="true">${esc(cls?.icone||"✦")}</div><div><span>Atributo principal da classe escolhida</span><h3>${primary} — ${attrNames[primary]}</h3><p><strong>${esc(cls?.nome||"Classe")}</strong> utiliza ${primary} como principal e ${secondary} como secundário.</p></div><div class="class-attribute-guide-values"><span>Principal<strong>${primary}</strong></span><span>Secundário<strong>${secondary}</strong></span></div>`;
  }

  function renderChoicePreview(){
    const race=selectedRace(),cls=selectedClass();
    racePreview.innerHTML=race?`<h3>${esc(race.name)}</h3><p>${esc(race.tagline||race.archetype||"")}</p><div class="character-choice-stats"><span>HP ${esc(race.stats?.hp||0)}</span><span>Mana ${esc(race.stats?.mana||"Sem bônus")}</span>${attrs.map(a=>`<span>${a} +${racialBonus(a)}</span>`).join("")}</div>`:"";
    classPreview.innerHTML=cls?`<h3>${esc(cls.nome)}</h3><p>${esc(cls.descricao||"")}</p><div class="character-choice-stats"><span>${esc(cls.cargo||"")}</span><span>${esc(cls.estilo?.atributos||"")}</span></div>`:"";
    renderClassAttributeGuide();if(activeProfile)applyAutoDistribution(activeProfile);else{renderAllocator();renderReview()}
  }

  function renderAllocator(){
    remaining.textContent=String(freeTotal-usedPoints());
    const {primary,secondary}=parseClassAttributes(selectedClass());
    allocator.innerHTML=attrs.map(a=>`<article class="attribute-row ${a===primary?"primary-attribute":a===secondary?"secondary-attribute":""}"><div class="attribute-name"><strong>${a}</strong><small>${attrNames[a]}</small>${a===primary?'<em>Principal</em>':a===secondary?'<em>Secundário</em>':""}</div><div class="attribute-value"><small>Base</small><strong>${base}</strong></div><div class="attribute-value"><small>Raça</small><strong>+${racialBonus(a)}</strong></div><div class="attribute-value"><small>Distribuído</small><strong>${allocation[a]}</strong></div><button class="attribute-control" type="button" data-attr="${a}" data-delta="-1" ${allocation[a]<=0?"disabled":""}>−</button><button class="attribute-control" type="button" data-attr="${a}" data-delta="1" ${usedPoints()>=freeTotal?"disabled":""}>＋</button><div class="attribute-value"><small>Final</small><strong>${finalValue(a)}</strong></div></article>`).join("");
  }

  function renderReview(){
    const race=selectedRace(),cls=selectedClass(),{primary,secondary}=parseClassAttributes(cls);
    review.innerHTML=`<article class="review-card"><h3>Identidade</h3><div class="review-list"><div class="review-row"><span>Nome</span><strong>${esc(nameInput.value||"Não definido")}</strong></div><div class="review-row"><span>Raça</span><strong>${esc(race?.name||"—")}</strong></div><div class="review-row"><span>Classe</span><strong>${esc(cls?.nome||"—")}</strong></div><div class="review-row"><span>Principal</span><strong>${primary}</strong></div><div class="review-row"><span>Secundário</span><strong>${secondary}</strong></div><div class="review-row"><span>Pontos</span><strong>${usedPoints()} / ${freeTotal}</strong></div></div></article><article class="review-card"><h3>Atributos finais</h3><div class="review-list">${attrs.map(a=>`<div class="review-row"><span>${a} — ${attrNames[a]}</span><strong>${finalValue(a)}</strong></div>`).join("")}</div></article>`;
  }

  function showStep(value){
    step=Math.max(1,Math.min(4,value));
    document.querySelectorAll("[data-step]").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===step));
    document.querySelectorAll("[data-step-target]").forEach(el=>el.classList.toggle("active",Number(el.dataset.stepTarget)===step));
    prev.hidden=step===1;next.hidden=step===4;finish.hidden=step!==4;if(step===4)renderReview();
  }

  function validateStep(){
    message.textContent="";
    if(step===1&&nameInput.value.trim().length<3){message.textContent="O nome precisa ter pelo menos 3 caracteres.";nameInput.focus();return false}
    if(step===2&&(!raceSelect.value||!classSelect.value)){message.textContent="Escolha uma raça e uma classe.";return false}
    if(step===3&&usedPoints()!==freeTotal){message.textContent=`Distribua todos os ${freeTotal} pontos antes de continuar.`;return false}
    return true;
  }

  raceSelect.innerHTML=races.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("");
  classSelect.innerHTML=Object.values(classes).map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("");
  renderChoicePreview();showStep(1);

  allocator.addEventListener("click",event=>{const button=event.target.closest("[data-attr]");if(!button)return;const attr=button.dataset.attr,delta=Number(button.dataset.delta);if(delta>0&&usedPoints()>=freeTotal||delta<0&&allocation[attr]<=0)return;allocation[attr]+=delta;activeProfile="";document.querySelectorAll("[data-auto-profile]").forEach(item=>item.classList.remove("active"));autoDistributionMessage.textContent="Distribuição personalizada em andamento.";renderAllocator();renderReview()});
  document.querySelectorAll("[data-auto-profile]").forEach(button=>button.addEventListener("click",()=>applyAutoDistribution(button.dataset.autoProfile)));
  raceSelect.addEventListener("change",renderChoicePreview);classSelect.addEventListener("change",renderChoicePreview);nameInput.addEventListener("input",renderReview);
  next.addEventListener("click",()=>{if(validateStep())showStep(step+1)});prev.addEventListener("click",()=>showStep(step-1));
  reset.addEventListener("click",()=>{attrs.forEach(a=>allocation[a]=0);activeProfile="";document.querySelectorAll("[data-auto-profile]").forEach(item=>item.classList.remove("active"));autoDistributionMessage.textContent="Distribuição redefinida.";renderAllocator();renderReview()});
  document.querySelectorAll("[data-step-target]").forEach(btn=>btn.addEventListener("click",()=>{const target=Number(btn.dataset.stepTarget);if(target<=step||validateStep())showStep(target)}));

  form.addEventListener("submit",async event=>{
    event.preventDefault();if(!validateStep())return;
    finish.disabled=true;message.textContent="Salvando personagem no banco de dados...";
    const race=selectedRace(),cls=selectedClass();
    try{
      await account.createCharacter({
        name:nameInput.value.trim(),story:storyInput.value.trim(),raceId:race.id,classId:cls.id,
        image:race.artwork||race.image||"assets/images/logo.png",attributeProfile:activeProfile||"custom",
        baseAttributes:Object.fromEntries(attrs.map(a=>[a,base])),allocatedAttributes:{...allocation},racialAttributes:Object.fromEntries(attrs.map(a=>[a,racialBonus(a)])),
        hpCurrent:Number(race.stats?.hp||0),manaCurrent:0
      });
      message.textContent="Personagem criado com sucesso.";window.location.assign("personagens.html");
    }catch(error){message.textContent=error.message||"Não foi possível criar o personagem.";finish.disabled=false}
  });
})();
