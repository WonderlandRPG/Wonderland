"use strict";
(function(){
  const account=window.WONDERLAND_ACCOUNT;
  const client=window.WONDERLAND_SUPABASE;
  const characterId=new URLSearchParams(location.search).get("id");
  const slotLabels=window.WONDERLAND_ITEM_SLOTS||{head:"Cabeça",chest:"Peitoral",hands:"Mãos",legs:"Pernas",feet:"Pés",cape:"Capa",necklace:"Colar",ring_1:"Anel I",ring_2:"Anel II",earring_1:"Brinco I",earring_2:"Brinco II",main_hand:"Arma principal",off_hand:"Arma secundária"};
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  if(!account||!client||!characterId)return;

  async function refresh(){
    const data=await account.getCharacterSheet(characterId);
    const inventory=document.getElementById("sheetInventory");
    const equipment=document.getElementById("sheetEquipment");
    if(!inventory||!equipment)return;

    inventory.innerHTML=data.inventory.length?data.inventory.map(item=>{
      const meta=item.metadata||{};
      const stats=Object.entries(meta.stats||{}).map(([key,value])=>`${key} +${value}`).join(" • ");
      return `<article class="character-sheet-item inventory-action-item"><div class="inventory-item-icon">${esc(meta.icon||"◆")}</div><div class="inventory-item-copy"><strong>${esc(meta.name||item.item_key)}</strong><small>${esc(meta.rarity||"Item")} • ${esc(slotLabels[meta.slot]||meta.slot||"Sem slot")}${stats?` • ${esc(stats)}`:""}</small></div><span>x${esc(item.quantity||1)}</span><button type="button" class="wl-button wl-button-gold" data-equip-inventory="${esc(item.id)}">Equipar</button></article>`;
    }).join(""):'<div class="character-sheet-empty">O inventário está vazio. Visite a Loja para comprar equipamentos.</div>';

    const uniqueEquipment=data.equipment.filter((item,index,list)=>!(item.metadata?.linked_two_hand)&&list.findIndex(other=>other.item_key===item.item_key)===index);
    equipment.innerHTML=uniqueEquipment.length?uniqueEquipment.map(item=>{
      const meta=item.metadata||{};
      const stats=Object.entries(meta.stats||{}).map(([key,value])=>`${key} +${value}`).join(" • ");
      const slot=meta.occupies_both_hands||meta.two_handed?"Duas mãos":slotLabels[item.slot]||item.slot;
      return `<article class="character-sheet-item inventory-action-item equipped"><div class="inventory-item-icon">${esc(meta.icon||"◆")}</div><div class="inventory-item-copy"><strong>${esc(meta.name||item.item_key)}</strong><small>${esc(slot)}${stats?` • ${esc(stats)}`:""}</small></div><button type="button" class="wl-button wl-button-ghost" data-unequip-slot="${esc(item.slot)}">Remover</button></article>`;
    }).join(""):'<div class="character-sheet-empty">Nenhum equipamento foi equipado.</div>';

    const equipmentMap=new Map(data.equipment.map(item=>[item.slot,item]));
    document.querySelectorAll("[data-equipment-slot]").forEach(button=>{const item=equipmentMap.get(button.dataset.equipmentSlot);button.textContent=item?(item.metadata?.name||item.item_key):(slotLabels[button.dataset.equipmentSlot]||button.textContent);button.classList.toggle("equipped",Boolean(item));});

    inventory.querySelectorAll("[data-equip-inventory]").forEach(button=>button.addEventListener("click",async()=>{
      button.disabled=true;button.textContent="Equipando...";
      try{const {error}=await client.rpc("equip_inventory_item",{p_character_id:characterId,p_inventory_id:button.dataset.equipInventory});if(error)throw error;await refresh();window.dispatchEvent(new CustomEvent("wonderland:equipment-updated"))}catch(error){alert(error.message||"Não foi possível equipar o item.");button.disabled=false;button.textContent="Equipar"}
    }));
    equipment.querySelectorAll("[data-unequip-slot]").forEach(button=>button.addEventListener("click",async()=>{
      button.disabled=true;button.textContent="Removendo...";
      try{const {error}=await client.rpc("unequip_character_slot",{p_character_id:characterId,p_slot:button.dataset.unequipSlot});if(error)throw error;await refresh();window.dispatchEvent(new CustomEvent("wonderland:equipment-updated"))}catch(error){alert(error.message||"Não foi possível remover o item.");button.disabled=false;button.textContent="Remover"}
    }));
  }

  let attempts=0;
  const timer=setInterval(()=>{attempts++;const content=document.getElementById("sheetContent");if(content&&!content.hidden){clearInterval(timer);refresh().then(()=>window.dispatchEvent(new CustomEvent("wonderland:equipment-updated"))).catch(console.error)}else if(attempts>80)clearInterval(timer)},150);
})();