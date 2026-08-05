"use strict";
(function(){
  const current=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const routes=[
    ["Tela inicial","index.html"],["Menu","menu.html"],["Minha conta","conta.html"],["História","historia.html"],["Mundo","mundo.html"],["Raças","racas.html"],["Classes","classes.html"],["Atributos","atributos.html"],["Grimório","grimorio.html"],["Ranks","ranks.html"],["Loja","loja.html"]
  ];
  const header=document.createElement("header");
  header.className="site-header";
  const previous=document.querySelector("header.character-sheet-topbar,header.admin-topbar,header.shop-topbar,.character-sheet-topbar,.admin-topbar,.shop-topbar");
  const logoutButton=previous?.querySelector("#sheetLogout,#adminLogout,#shopLogout,button[id*='Logout']");
  header.innerHTML=`<div class="site-header__left"><button class="site-header__action site-header__menu-button" type="button" aria-expanded="false">☰ Navegação</button><a class="site-header__action" href="menu.html">Menu</a></div><a class="site-header__brand" href="index.html"><img src="assets/images/logo.png" alt=""><span>Wonderland</span></a><nav class="site-header__nav" aria-label="Navegação principal">${routes.map(([label,href])=>`<a href="${href}" class="${current===href?'active':''}">${label}</a>`).join("")}</nav><div class="site-header__right">${logoutButton?'<button class="site-header__action site-header__action--danger" id="siteHeaderLogout" type="button">Sair</button>':''}</div>`;
  if(previous)previous.replaceWith(header);else document.body.prepend(header);
  const menuButton=header.querySelector(".site-header__menu-button");
  menuButton?.addEventListener("click",()=>{const open=header.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open))});
  document.addEventListener("click",event=>{if(!header.contains(event.target)){header.classList.remove("open");menuButton?.setAttribute("aria-expanded","false")}});
  if(logoutButton){
    header.querySelector("#siteHeaderLogout")?.addEventListener("click",()=>logoutButton.click());
  }
})();
