"use strict";
(function(){
  const items=Array.isArray(window.WONDERLAND_SHOP_ITEMS)?window.WONDERLAND_SHOP_ITEMS:[];
  if(!items.length)return;
  window.WONDERLAND_ADMIN_LOCAL_ITEMS=items.map((item,index)=>({
    id:item.id,
    name:item.name,
    description:item.description||"Equipamento disponível na Loja de Wonderland.",
    item_type:item.slot,
    rarity:item.rarity,
    max_stack:1,
    required_level:1,
    base_value:item.price,
    icon_url:item.icon||"",
    artwork_url:item.image||"",
    is_tradeable:true,
    is_active:item.active!==false,
    sort_order:index,
    slot:item.slot,
    stats:item.stats||{},
    two_handed:Boolean(item.twoHanded),
    occupies_both_hands:Boolean(item.occupiesBoth),
    _source:"local"
  }));
})();
