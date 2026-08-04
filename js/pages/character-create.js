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

  const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const selectedRace=()=>races.find(r=>r.id===raceSelect.value)||races[0];
  const selectedClass=()=>classes[classSelect.value]||Object.values(classes)[0];
  const racialBonus=a=>Number(selectedRace()?.stats?.attributes?.[a]||0);
  const usedPoints=()=>attrs.reduce((sum,a)=>sum+allocation[a],0);
  const finalValue=a=>base+allocation[a]+racialBonus(a);

  function populate(){
    raceSelect.innerHTML=races.map(r=>`<option value="${esc(r.id)}">${esc(r.name)}</option>`).join("");
    classSelect.innerHTML=Object.values(classes).map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("");
    renderChoicePreview();renderAllocator();renderReview();
  }

  function renderChoicePreview(){
    const race=selectedRace(),cls=selectedClass();
    racePreview.innerHTML=race?`<h3>${esc(race.name)}</h3><p>${esc(race.tagline||race.archetype||"")}</p><div class="character-choice-stats"><span>HP ${esc(race.stats?.hp||0)}</span><span>Mana ${esc(race.stats?.mana||"Sem bônus")}</span>${attrs.map(a=>`<span>${a} +${racialBonus(a)}</span>`).join("")}</div>`:"";
    classPreview.innerHTML=cls?`<h3>${esc(cls.nome)}</h3><p>${esc(cls.descricao||"")}</p><div class="character-choice-stats"><span>${esc(cls.cargo||"")}</span><span>${esc(cls.estilo?.atributos||"")}</span></div>`:"";
    renderAllocator();renderReview();
  }

  function renderAllocator(){
    remaining.textContent=String(freeTotal-usedPoints());
    allocator.innerHTML=attrs.map(a=>`<article class="attribute-row"><div class="attribute-name"><strong>${a}</strong><small>${attrNames[a]}</small></div><div class="attribute-value"><small>Base</small><strong>${base}</strong></div><div class="attribute-value"><small>Raça</small><strong>+${racialBonus(a)}</strong></div><div class="attribute-value"><small>Distribuído</small><strong>${allocation[a]}</strong></div><button class="attribute-control" type="button" data-attr="${a}" data-delta="-1" ${allocation[a]<=0?"disabled":""}>−</button><button class="attribute-control" type="button" data-attr="${a}" data-delta="1" ${usedPoints()>=freeTotal?"disabled":""}>＋</button><div class="attribute-value"><small>Final</small><strong>${finalValue(a)}</strong></div></article>`).join("");
  }

  function renderReview(){
    const race=selectedRace(),cls=selectedClass();
    review.innerHTML=`<article class="review-card"><h3>Identidade</h3><div class="review-list"><div class="review-row"><span>Nome</span><strong>${esc(nameInput.value||"Não definido")}</strong></div><div class="review-row"><span>Raça</span><strong>${esc(race?.name||"—")}</strong></div><div class="review-row"><span>Classe</span><strong>${esc(cls?.nome||"—")}</strong></div><div class="review-row"><span>Nível inicial</span><strong>1</strong></div><div class="review-row"><span>Pontos distribuídos</span><strong>${usedPoints()} / ${freeTotal}</strong></div></div></article><article class="review-card"><h3>Atributos finais</h3><div class="review-list">${attrs.map(a=>`<div class="review-row"><span>${a} — ${attrNames[a]}</span><strong>${finalValue(a)}</strong></div>`).join("")}</div></article>`;
  }

  function showStep(value){
    step=Math.max(1,Math.min(4,value));
    document.querySelectorAll("[data-step]").forEach(el=>el.classList.toggle("active",Number(el.dataset.step)===step));
    document.querySelectorAll("[data-step-target]").forEach(el=>el.classList.toggle("active",Number(el.dataset.stepTarget)===step));
    prev.hidden=step===1;next.hidden=step===4;finish.hidden=step!==4;
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
    allocation[attr]+=delta;renderAllocator();renderReview();
  });
  raceSelect.addEventListener("change",renderChoicePreview);
  classSelect.addEventListener("change",renderChoicePreview);
  nameInput.addEventListener("input",renderReview);
  next.addEventListener("click",()=>{if(validateStep())showStep(step+1)});
  prev.addEventListener("click",()=>showStep(step-1));
  reset.addEventListener("click",()=>{attrs.forEach(a=>allocation[a]=0);renderAllocator();renderReview()});
  document.querySelectorAll("[data-step-target]").forEach(btn=>btn.addEventListener("click",()=>{const target=Number(btn.dataset.stepTarget);if(target<=step||validateStep())showStep(target)}));

  form.addEventListener("submit",event=>{
    event.preventDefault();
    if(!validateStep())return;
    const latest=account.current();
    const characters=Array.isArray(latest.characters)?latest.characters:[];
    if(characters.length>=3){message.textContent="Esta conta já atingiu o limite de 3 personagens.";return}
    const race=selectedRace(),cls=selectedClass();
    const character={
      id:`char_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      name:nameInput.value.trim(),story:storyInput.value.trim(),raceId:race.id,race:race.name,classId:cls.id,className:cls.nome,
      level:1,experience:0,image:race.artwork||race.image||"assets/images/logo.png",
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
