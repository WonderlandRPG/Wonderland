"use strict";

(function(){
  const account=window.WONDERLAND_ACCOUNT;
  const user=account?.current();
  if(!user){window.location.replace("conta.html");return}
  if((user.characters||[]).length>=3){window.location.replace("personagens.html");return}

  const races=Array.isArray(window.WONDERLAND_RACES)?window.WONDERLAND_RACES:[];
  const classes=window.WONDERLAND_CLASSES||{};
  const attrs=["FOR","DEF","RES","INI","INT","ARC"];
  const attrNames={FOR:"Força",DEF:"Defesa",RES:"Resistência",INI:"Iniciativa",INT:"Inteligência",ARC:"Arcano"};
  const base=20;
  const freeTotal=100;
  const allocation=Object.fromEntries(attrs.map(a=>[a,0]));
  let step=1;
  let activeProfile="";

  const form=document.getElementById("characterCreateForm");
  const nameInput=document.getElementById("characterName");
  const storyInput=document.getElementById("characterStory");
  const raceSelect=document.getElementById("characterRace");
  const classSelect=document.getElementById("characterClass");
  const racePreview=document.getElementById("racePreview");
  const classPreview=document.getElementById("classPreview");
  const allocator=document.getElementById("attributeAllocator");
  const remaining=document.getElementById("remainingPoints");
  const review=document.getElementById("characterReview");
  const message=document.getElementById("characterCreateMessage");
  const prev=document.getElementById("previousStep");
  const next=document.getElementById("nextStep");
  const finish=document.getElementById("finishCharacter");
  const reset=document.getElementById("resetAttributes");
  const classAttributeGuide=document.getElementById("classAttributeGuide");
  const autoDistributionMessage=document.getElementById("autoDistributionMessage");

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
    if(!secondary){
      if(primary==="FOR")secondary="RES";
      else if(primary==="INT")secondary="ARC";
      else if(primary==="ARC")secondary="INT";
      else if(primary==="INI")secondary="FOR";
      else if(primary==="DEF")secondary="RES";
      else secondary="DEF";
    }
    return{primary,secondary};
  }

  function distributeByWeights(weights){
    const entries=attrs.map(attr=>({attr,weight:Math.max(0.01,Number(weights[attr]||0.01))}));
    const totalWeight=entries.reduce((sum,item)=>sum+item.weight,0);
    const raw=entries.map(item=>({...item,raw:(item.weight/totalWeight)*freeTotal}));
    const values=Object.fromEntries(raw.map(item=>[item.attr,Math.floor(item.raw)]));
    let remainingPoints=freeTotal-Object.values(values).reduce((sum,value)=>sum+value,0);
    raw.sort((a,b)=>(b.raw-Math.floor(b.raw))-(a.raw-Math.floor(a.raw)));
    for(let index=0;remainingPoints>0;index=(index+1)%raw.length){values[raw[index].attr]+=1;remainingPoints-=1}
    attrs.forEach(attr=>allocation[attr]=values[attr]);
  }

  function profileWeights(profile){
    const cls=selectedClass();
    const {primary,secondary}=parseClassAttributes(cls);
    const role=String(cls?.cargo||"").toLowerCase();
    const weights=Object.fromEntries(attrs.map(attr=>[attr,1]));

    if(profile==="aggressive"){
      weights[primary]+=5;
      weights[secondary]+=2;
      weights.INI+=2;
      if(primary==="INT"||primary==="ARC")weights.INT+=1.5;
      else weights.FOR+=1.5;
      weights.DEF=Math.max(.55,weights.DEF-.35);
      weights.RES=Math.max(.65,weights.RES-.25);
    }else if(profile==="defensive"){
      weights.DEF+=4;
      weights.RES+=4;
      weights[primary]+=2;
      weights[secondary]+=1.5;
      if(role.includes("suporte")||role.includes("tanque"))weights.ARC+=1;
      weights.INI=Math.max(.7,weights.INI-.2);
    }else{
      weights[primary]+=3.5;
      weights[secondary]+=2;
      weights.DEF+=1;
      weights.RES+=1;
      weights.INI+=1;
      if(role.includes("suporte"))weights.ARC+=1.5;
    }

    attrs.forEach(attr=>{
      const bonus=racialBonus(attr);
      if(bonus>0)weights[attr]+=Math.min(1.5,bonus*.22);
    });
    return weights;
  }

  function applyAutoDistribution(profile){
    distributeByWeights(profileWeights(profile));
    activeProfile=profile;
    document.querySelectorAll("[data-auto-profile]").forEach(button=>button.classList.toggle("active",button.dataset.autoProfile===profile));
    const labels={aggressive:"Agressivo",balanced:"Equilibrado",defensive:"Defensivo"};
    autoDistributionMessage.textContent=`Perfil ${labels[profile]} aplicado. Os 100 pontos foram distribuídos com base em ${selectedClass()?.nome||"sua classe"} e ${selectedRace()?.name||"sua raça"}.`;
    renderAllocator();
    renderReview();
  }

  function renderClassAttributeGuide(){
    const cls=selectedClass();
    const {primary,secondary}=parseClassAttributes(cls);
    classAttributeGuide.innerHTML=`
      <div class="class-attribute-guide-icon" aria-hidden="true">${esc(cls?.icone||"✦")}</div>
      <div>
        <span>Atributo principal da classe escolhida</span>
        <h3>${esc(primary)} — ${esc(attrNames[primary])}</h3>
        <p><strong>${esc(cls?.nome||"Classe")}</strong> utiliza ${esc(primary)} como atributo principal e ${esc(secondary)} como atributo secundário. As distribuições automáticas dão prioridade a esses valores.</p>
      </div>
      <div class="class-attribute-guide-values"><span>Principal<strong>${esc(primary)}</strong></span><span>Secundário<strong>${esc(secondary)}</strong></span></div>`;
  }

  function populate(){
    raceSelect.innerHTML=races.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("");
    classSelect.innerHTML=Object.values(classes).map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("");
    renderChoicePreview();renderAllocator();renderReview();renderClassAttributeGuide();
  }

  function renderChoicePreview(){
    const race=selectedRace(),cls=selectedClass();
    racePreview.innerHTML=race?`<h3>${esc(race.name)}</h3><p>${esc(race.tagline||race.archetype||"")}</p><div class="character-choice-stats"><span>HP ${esc(race.stats?.hp||0)}</span><span>Mana ${esc(race.stats?.mana||"Sem bônus")}</span>${attrs.map(a=>`<span>${a} +${racialBonus(a)}</span>`).join("")}</div>`:"";
    classPreview.innerHTML=cls?`<h3>${esc(cls.nome)}</h3><p>${esc(cls.descricao||"")}</p><div class="character-choice-stats"><span>${esc(cls.cargo||"")}</span><span>${esc(cls.estilo?.atributos||"")}</span></div>`:"";
    renderClassAttributeGuide();
    if(activeProfile)applyAutoDistribution(activeProfile);
    else{renderAllocator();renderReview()}
  }

  function renderAllocator(){
    remaining.textContent=String(freeTotal-usedPoints());
    const {primary,secondary}=parseClassAttributes(selectedClass());
    allocator.innerHTML=attrs.map(a=>`<article class="attribute-row ${a===primary?"primary-attribute":a===secondary?"secondary-attribute":""}"><div class="attribute-name"><strong>${a}</strong><small>${attrNames[a]}</small>${a===primary?'<em>Principal</em>':a===secondary?'<em>Secundário</em>':""}</div><div class="attribute-value"><small>Base</small><strong>${base}</strong></div><div class="attribute-value"><small>Raça</small><strong>+${racialBonus(a)}</strong></div><div class="attribute-value"><small>Distribuído</small><strong>${allocation[a]}</strong></div><button class="attribute-control" type="button" data-attr="${a}" data-delta="-1" ${allocation[a]<=0?"disabled":""}>−</button><button class="attribute-control" type="button" data-attr="${a}" data-delta="1" ${usedPoints()>=freeTotal?"disabled":""}>＋</button><div class="attribute-value"><small>Final</small><strong>${finalValue(a)}</strong></div></article>`).join("");
  }

  function renderReview(){
    const race=selectedRace(),cls=selectedClass();
    const {primary,secondary}=parseClassAttributes(cls);
    review.innerHTML=`<article class="review-card"><h3>Identidade</h3><div class="review-list"><div class="review-row"><span>Nome</span><strong>${esc(nameInput.value||"Não definido")}</strong></div><div class="review-row"><span>Raça</span><strong>${esc(race?.name||"—")}</strong></div><div class="review-row"><span>Classe</span><strong>${esc(cls?.nome||"—")}</strong></div><div class="review-row"><span>Atributo principal</span><strong>${primary} — ${attrNames[primary]}</strong></div><div class="review-row"><span>Atributo secundário</span><strong>${secondary} — ${attrNames[secondary]}</strong></div><div class="review-row"><span>Nível inicial</span><strong>1</strong></div><div class="review-row"><span>Pontos distribuídos</span><strong>${usedPoints()} / ${freeTotal}</strong></div></div></article><article class="review-card"><h3>Atributos finais</h3><div class="review-list">${attrs.map(a=>`<div class="review-row"><span>${a} — ${attrNames[a]}</span><strong>${finalValue(a)}</strong></div>`).join("")}</div></article>`;
  }

  function showStep(value){
    step=Math.max(1,Math.min(4,value));
    document.querySelectorAll("[data-step]").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===step));
    document.querySelectorAll("[data-step-target]").forEach(el=>el.classList.toggle("active",Number(el.dataset.stepTarget)===step));
    prev.hidden=step===1;next.hidden=step===4;finish.hidden=step!==4;
    if(step===3){renderClassAttributeGuide();renderAllocator()}
    if(step===4)renderReview();
  }

  function validateStep(){
    message.textContent="";
    if(step===1&&nameInput.value.trim().length<3){message.textContent="O nome precisa ter pelo menos 3 caracteres.";nameInput.focus();return false}
    if(step===2&&(!raceSelect.value||!classSelect.value)){message.textContent="Escolha uma raça e uma classe.";return false}
    if(step===3&&usedPoints()!==freeTotal){message.textContent=`Distribua todos os ${freeTotal} pontos antes de continuar.`;return false}
    return true;
  }

  allocator.addEventListener("click",event=>{
    const button=event.target.closest("[data-attr]");if(!button)return;
    const attr=button.dataset.attr,delta=Number(button.dataset.delta||0);
    if(!attrs.includes(attr))return;
    if(delta>0&&usedPoints()>=freeTotal)return;
    if(delta<0&&allocation[attr]<=0)return;
    allocation[attr]+=delta;
    activeProfile="";
    document.querySelectorAll("[data-auto-profile]").forEach(item=>item.classList.remove("active"));
    autoDistributionMessage.textContent="Distribuição personalizada em andamento.";
    renderAllocator();renderReview();
  });
  document.querySelectorAll("[data-auto-profile]").forEach(button=>button.addEventListener("click",()=>applyAutoDistribution(button.dataset.autoProfile)));
  raceSelect.addEventListener("change",renderChoicePreview);
  classSelect.addEventListener("change",renderChoicePreview);
  nameInput.addEventListener("input",renderReview);
  next.addEventListener("click",()=>{if(validateStep())showStep(step+1)});
  prev.addEventListener("click",()=>showStep(step-1));
  reset.addEventListener("click",()=>{attrs.forEach(a=>allocation[a]=0);activeProfile="";document.querySelectorAll("[data-auto-profile]").forEach(item=>item.classList.remove("active"));autoDistributionMessage.textContent="Distribuição redefinida. Escolha um perfil ou distribua manualmente.";renderAllocator();renderReview()});
  document.querySelectorAll("[data-step-target]").forEach(btn=>btn.addEventListener("click",()=>{const target=Number(btn.dataset.stepTarget);if(target<=step||validateStep())showStep(target)}));

  form.addEventListener("submit",event=>{
    event.preventDefault();
    if(!validateStep())return;
    const latest=account.current();
    const characters=Array.isArray(latest.characters)?latest.characters:[];
    if(characters.length>=3){message.textContent="Esta conta já atingiu o limite de 3 personagens.";return}
    const race=selectedRace(),cls=selectedClass();
    const {primary,secondary}=parseClassAttributes(cls);
    const character={
      id:`char_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      name:nameInput.value.trim(),story:storyInput.value.trim(),raceId:race.id,race:race.name,classId:cls.id,className:cls.nome,
      level:1,experience:0,image:race.artwork||race.image||"assets/images/logo.png",
      primaryAttribute:primary,secondaryAttribute:secondary,attributeProfile:activeProfile||"custom",
      baseAttributes:Object.fromEntries(attrs.map(a=>[a,base])),allocatedAttributes:{...allocation},racialAttributes:Object.fromEntries(attrs.map(a=>[a,racialBonus(a)])),attributes:Object.fromEntries(attrs.map(a=>[a,finalValue(a)])),
      hp:Number(race.stats?.hp||0),manaBonus:race.stats?.mana||"Sem bônus",inventory:[],equipment:{},createdAt:new Date().toISOString()
    };
    const users=account.readUsers();
    const index=users.findIndex(item=>item.id===latest.id);
    if(index<0){message.textContent="Não foi possível localizar sua conta.";return}
    users[index]={...users[index],characters:[...characters,character]};
    account.writeUsers(users);
    message.textContent="Personagem criado. Abrindo o Salão dos Aventureiros...";
    window.setTimeout(()=>window.location.assign("personagens.html"),350);
  });

  populate();showStep(1);
})();
