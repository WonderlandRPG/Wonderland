"use strict";

(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const rankSystem=window.WONDERLAND_RANK_SYSTEM;
  const greeting=document.getElementById("charactersGreeting");
  const capacity=document.getElementById("characterCapacity");
  const grid=document.getElementById("charactersGrid");
  const template=document.getElementById("emptyCharacterTemplate");
  const logout=document.getElementById("logoutButton");
  const adminPanelButton=document.getElementById("adminPanelButton");

  if(!account){window.location.replace("conta.html");return}

  let user;
  try{user=await account.current()}catch(error){console.error(error)}
  if(!user){window.location.replace("conta.html");return}

  if(adminPanelButton&&account.isAdmin(user))adminPanelButton.hidden=false;

  greeting.textContent=`Bem-vindo, ${user.name}. Gerencie suas fichas, inventários e progressões.`;
  grid.innerHTML='<article class="character-empty-card locked"><span class="character-empty-symbol">✦</span><h2>Carregando personagens</h2><p>Consultando o Salão dos Aventureiros...</p></article>';

  const raceMap=Object.fromEntries((window.WONDERLAND_RACES||[]).map(race=>[race.id,race]));
  const classMap=window.WONDERLAND_CLASSES||{};

  function esc(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}

  function characterCard(character){
    const race=raceMap[character.race_id];
    const cls=classMap[character.class_id];
    const rank=rankSystem?.fromCharacter(character)||{id:"E",title:"Iniciante",color:"#9d744f"};
    const portrait=character.image_url||race?.artwork||race?.image||"assets/images/logo.png";
    const article=document.createElement("article");
    article.className=`character-card wl-card character-card-rank-${String(rank.id).toLowerCase()}`;
    article.style.setProperty("--rank-color",rank.color||"#d6b56b");
    article.innerHTML=`
      <div class="wl-card-frame"></div>
      <span class="wl-card-corner wl-card-corner-top-left"></span>
      <span class="wl-card-corner wl-card-corner-top-right"></span>
      <span class="wl-card-corner wl-card-corner-bottom-left"></span>
      <span class="wl-card-corner wl-card-corner-bottom-right"></span>
      <div class="wl-card-image character-photo-cover">
        <img src="${esc(portrait)}" alt="${esc(character.name||"Personagem")}">
        <span class="wl-card-shine"></span>
        <div class="character-rank-overlay" title="Rank ${esc(rank.id)} — ${esc(rank.title)}">${rankSystem?.emblemHtml(rank.id)||`<span class="rank-emblem"><span>${esc(rank.id)}</span></span>`}</div>
      </div>
      <div class="wl-card-body">
        <span class="wl-card-subtitle">Nível ${esc(character.level||1)} • ${esc(race?.name||character.race_id||"Raça não definida")}</span>
        <h2 class="wl-card-title">${esc(character.name||"Sem nome")}</h2>
        <p class="wl-card-text">${esc(cls?.nome||character.class_id||"Classe não definida")}</p>
        <div class="wl-card-meta"><span class="wl-card-stars">Rank ${esc(rank.id)}</span><a class="wl-button wl-button-gold" href="ficha.html?id=${encodeURIComponent(character.id)}">Abrir ficha</a></div>
      </div>`;
    return article;
  }

  try{
    const characters=await account.getCharacters();
    capacity.textContent=`${characters.length} / 3`;
    grid.innerHTML="";
    characters.forEach(character=>grid.appendChild(characterCard(character)));
    if(characters.length<3)grid.appendChild(template.content.cloneNode(true));
    while(grid.children.length<3){
      const locked=document.createElement("article");
      locked.className="character-empty-card locked";
      locked.innerHTML="<span class='character-empty-symbol'>◇</span><h2>Vaga disponível</h2><p>Espaço reservado para um futuro personagem.</p>";
      grid.appendChild(locked);
    }
  }catch(error){
    console.error(error);
    capacity.textContent="— / 3";
    grid.innerHTML=`<article class="character-empty-card locked"><span class="character-empty-symbol">!</span><h2>Não foi possível carregar</h2><p>${esc(error.message||"Tente novamente em instantes.")}</p></article>`;
  }

  logout?.addEventListener("click",async()=>{logout.disabled=true;try{await account.logout()}finally{window.location.assign("conta.html")}});
})();
