"use strict";
(async function(){
  const account=window.WONDERLAND_ACCOUNT;
  const client=window.WONDERLAND_SUPABASE;
  const items=Array.isArray(window.WONDERLAND_SHOP_ITEMS)?window.WONDERLAND_SHOP_ITEMS:[];
  const slots=window.WONDERLAND_ITEM_SLOTS||{};
  const grid=document.getElementById("shopGrid");
  const status=document.getElementById("shopStatus");
  const count=document.getElementById("shopCount");
  const search=document.getElementById("shopSearch");
  const slotFilter=document.getElementById("shopSlot");
  const rarityFilter=document.getElementById("shopRarity");
  const dialog=document.getElementById("shopDialog");
  const form=document.getElementById("shopPurchaseForm");
  const characterSelect=document.getElementById("shopCharacter");
  const balance=document.getElementById("shopCharacterBalance");
  const title=document.getElementById("shopDialogTitle");
  const description=document.getElementById("shopDialogDescription");
  const message=document.getElementById("shopDialogMessage");
  const cancel=document.getElementById("shopCancel");
  const confirm=document.getElementById("shopConfirm");
  let characters=[];
  let selectedItem=null;

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const format=value=>new Intl.NumberFormat("pt-BR").format(Number(value)||0);
  const rarityColors={Comum:"#b9b3a8",Incomum:"#66c783",Raro:"#4ca7ff",Épico:"#a86cff",Lendário:"#f0b84d",Mítico:"#ff596f"};
  const statsText=item=>Object.entries(item.stats||{}).map(([key,value])=>`${key} +${value}`);

  if(!account||!client){window.location.replace("conta.html");return}
  const user=await account.current().catch(()=>null);
  if(!user){window.location.replace("conta.html");return}

  try{characters=await account.getCharacters()}catch(error){console.error(error)}

  [...new Set(items.map(item=>item.slot))].forEach(slot=>slotFilter.insertAdjacentHTML("beforeend",`<option value="${esc(slot)}">${esc(slots[slot]||slot)}</option>`));
  [...new Set(items.map(item=>item.rarity))].forEach(rarity=>rarityFilter.insertAdjacentHTML("beforeend",`<option value="${esc(rarity)}">${esc(rarity)}</option>`));

  function render(){
    const term=search.value.trim().toLowerCase();
    const slot=slotFilter.value;
    const rarity=rarityFilter.value;
    const filtered=items.filter(item=>item.active!==false)
      .filter(item=>slot==="all"||item.slot===slot)
      .filter(item=>rarity==="all"||item.rarity===rarity)
      .filter(item=>!term||`${item.name} ${item.slot} ${item.rarity} ${statsText(item).join(" ")}`.toLowerCase().includes(term));
    count.textContent=String(filtered.length);
    status.textContent=`${filtered.length} item(ns) disponíveis. Todos os valores são cobrados em Wonderland Gold.`;
    grid.innerHTML=filtered.length?filtered.map(item=>{
      const color=rarityColors[item.rarity]||rarityColors.Comum;
      const handText=item.twoHanded?"Arma de duas mãos — ocupa os dois slots":item.occupiesBoth?"Conjunto duplo — ocupa os dois slots de arma":"";
      return `<article class="shop-item-card" style="--rarity:${color}">
        <div class="shop-item-visual">${item.image?`<img src="${esc(item.image)}" alt="${esc(item.name)}">`:`<span class="shop-item-icon" aria-hidden="true">${esc(item.icon||"◆")}</span>`}</div>
        <div class="shop-item-body">
          <div class="shop-item-kicker"><span>${esc(item.rarity)}</span><span>${esc(slots[item.slot]||item.slot)}</span></div>
          <h2>${esc(item.name)}</h2>
          <p class="shop-item-slot">Equipamento comum do mercado de Wonderland.</p>
          <div class="shop-item-stats">${statsText(item).map(stat=>`<span>${esc(stat)}</span>`).join("")}</div>
          <div class="shop-item-warning">${esc(handText)}</div>
          <div class="shop-item-footer"><div class="shop-item-price"><small>Preço</small><strong>${format(item.price)} WG</strong></div><button type="button" class="wl-button wl-button-gold" data-buy-item="${esc(item.id)}">Comprar</button></div>
        </div>
      </article>`;
    }).join(""):'<div class="shop-empty">Nenhum item encontrado com estes filtros.</div>';
    grid.querySelectorAll("[data-buy-item]").forEach(button=>button.addEventListener("click",()=>openPurchase(button.dataset.buyItem)));
  }

  function refreshCharacterOptions(){
    characterSelect.innerHTML=characters.length?characters.map(character=>`<option value="${esc(character.id)}">${esc(character.name)} — ${format(character.wg)} WG</option>`).join(""):'<option value="">Nenhum personagem disponível</option>';
    characterSelect.disabled=!characters.length;
    confirm.disabled=!characters.length;
    updateBalance();
  }
  function updateBalance(){
    const character=characters.find(item=>item.id===characterSelect.value);
    if(!character||!selectedItem){balance.textContent="Selecione um personagem.";return}
    const enough=Number(character.wg)>=Number(selectedItem.price);
    balance.innerHTML=`Saldo de <strong>${esc(character.name)}</strong>: <strong>${format(character.wg)} WG</strong><br>Após a compra: <strong>${enough?format(character.wg-selectedItem.price):"saldo insuficiente"}</strong>${enough?" WG":""}`;
    confirm.disabled=!enough;
  }
  function openPurchase(itemId){
    selectedItem=items.find(item=>item.id===itemId);
    if(!selectedItem)return;
    title.textContent=selectedItem.name;
    description.textContent=`${selectedItem.rarity} • ${slots[selectedItem.slot]||selectedItem.slot} • ${format(selectedItem.price)} WG`;
    message.textContent="";message.classList.remove("error");
    refreshCharacterOptions();
    dialog.showModal();
  }

  characterSelect.addEventListener("change",updateBalance);
  cancel.addEventListener("click",()=>dialog.close());
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!selectedItem)return;
    const character=characters.find(item=>item.id===characterSelect.value);
    if(!character)return;
    confirm.disabled=true;message.textContent="Processando compra...";message.classList.remove("error");
    try{
      const {data,error}=await client.rpc("purchase_shop_item",{
        p_character_id:character.id,p_item_key:selectedItem.id,p_name:selectedItem.name,p_slot:selectedItem.slot,
        p_rarity:selectedItem.rarity,p_price_wg:selectedItem.price,p_stats:selectedItem.stats||{},p_icon:selectedItem.icon||null,
        p_image_url:selectedItem.image||null,p_two_handed:Boolean(selectedItem.twoHanded),p_occupies_both_hands:Boolean(selectedItem.occupiesBoth)
      });
      if(error)throw error;
      character.wg=Number(data?.new_balance??character.wg-selectedItem.price);
      message.textContent=`Compra concluída. ${selectedItem.name} foi enviado ao inventário de ${character.name}.`;
      refreshCharacterOptions();
      setTimeout(()=>dialog.close(),1100);
    }catch(error){console.error(error);message.textContent=error.message||"Não foi possível concluir a compra.";message.classList.add("error");updateBalance()}
  });
  [search,slotFilter,rarityFilter].forEach(control=>control.addEventListener(control===search?"input":"change",render));
  refreshCharacterOptions();render();
})();