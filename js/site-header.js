"use strict";
(function(){
  if(document.querySelector(".site-header"))return;
  if(!document.querySelector('link[href*="site-header.css"]')){const style=document.createElement("link");style.rel="stylesheet";style.href="css/site-header.css?v=2";document.head.appendChild(style)}
  const current=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const routes=[["Tela inicial","index.html"],["Menu","menu.html"],["Minha conta","conta.html"],["História","historia.html"],["Mundo","mundo.html"],["Raças","racas.html"],["Classes","classes.html"],["Atributos","atributos.html"],["Grimório","grimorio.html"],["Ranks","ranks.html"],["Loja","loja.html"]];
  const previous=document.querySelector("body > header:not(.site-header),header.character-sheet-topbar,header.admin-topbar,header.shop-topbar,header.account-topbar,header.characters-topbar,.character-sheet-topbar,.admin-topbar,.shop-topbar");
  const logoutButton=previous?.querySelector("#sheetLogout,#adminLogout,#shopLogout,#accountLogout,#charactersLogout,button[id*='Logout']");
  const header=document.createElement("header");header.className="site-header";
  header.innerHTML=`<a class="site-header__brand" href="index.html" aria-label="Ir para a tela inicial"><img src="assets/images/logo.png" alt=""><span>Wonderland</span></a><nav class="site-header__nav" aria-label="Navegação principal">${routes.map(([label,href])=>`<a href="${href}" class="${current===href?"active":""}">${label}</a>`).join("")}</nav><div class="site-header__right"><button class="site-header__action site-header__menu-button" type="button" aria-expanded="false" aria-label="Abrir navegação">☰ Navegação</button><a class="site-header__action" href="menu.html">Menu</a>${logoutButton?'<button class="site-header__action site-header__action--danger" id="siteHeaderLogout" type="button">Sair</button>':""}</div>`;
  if(previous)previous.replaceWith(header);else document.body.prepend(header);
  const menuButton=header.querySelector(".site-header__menu-button");
  menuButton?.addEventListener("click",event=>{event.stopPropagation();const open=header.classList.toggle("open");menuButton.setAttribute("aria-expanded",String(open))});
  header.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>header.classList.remove("open")));
  document.addEventListener("click",event=>{if(!header.contains(event.target)){header.classList.remove("open");menuButton?.setAttribute("aria-expanded","false")}});
  if(logoutButton)header.querySelector("#siteHeaderLogout")?.addEventListener("click",()=>logoutButton.click());
})();
