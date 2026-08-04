"use strict";

(function(){
  const account=window.WONDERLAND_ACCOUNT;
  const user=account?.current();
  if(!user){window.location.replace("conta.html");return}

  const greeting=document.getElementById("charactersGreeting");
  const capacity=document.getElementById("characterCapacity");
  const grid=document.getElementById("charactersGrid");
  const template=document.getElementById("emptyCharacterTemplate");
  const logout=document.getElementById("logoutButton");
  const characters=Array.isArray(user.characters)?user.characters:[];

  greeting.textContent=`Bem-vindo, ${user.name}. Gerencie suas fichas, inventários e progressões.`;
  capacity.textContent=`${characters.length} / 3`;

  function characterCard(character){
    const article=document.createElement("article");
    article.className="character-card wl-card";
    article.innerHTML=`
      <div class="wl-card-frame"></div>
      <span class="wl-card-corner wl-card-corner-top-left"></span>
      <span class="wl-card-corner wl-card-corner-top-right"></span>
      <span class="wl-card-corner wl-card-corner-bottom-left"></span>
      <span class="wl-card-corner wl-card-corner-bottom-right"></span>
      <div class="wl-card-image"><img src="${character.image||"assets/images/logo.png"}" alt="${character.name||"Personagem"}"><span class="wl-card-shine"></span></div>
      <div class="wl-card-body">
        <span class="wl-card-subtitle">Nível ${character.level||1} • ${character.race||"Raça não definida"}</span>
        <h2 class="wl-card-title">${character.name||"Sem nome"}</h2>
        <p class="wl-card-text">${character.className||"Classe não definida"}</p>
        <div class="wl-card-meta"><span class="wl-card-stars">✦</span><a class="wl-button wl-button-gold" href="ficha.html?id=${encodeURIComponent(character.id)}">Abrir ficha</a></div>
      </div>`;
    return article;
  }

  characters.forEach(character=>grid.appendChild(characterCard(character)));
  if(characters.length<3)grid.appendChild(template.content.cloneNode(true));
  while(grid.children.length<3){
    const locked=document.createElement("article");
    locked.className="character-empty-card locked";
    locked.innerHTML="<span class='character-empty-symbol'>◇</span><h2>Vaga disponível</h2><p>Espaço reservado para um futuro personagem.</p>";
    grid.appendChild(locked);
  }

  logout?.addEventListener("click",()=>{account.logout();window.location.assign("conta.html")});
})();
