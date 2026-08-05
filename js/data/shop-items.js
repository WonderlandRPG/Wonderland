"use strict";
(function(){
  const COMMON="Comum";
  const items=[];
  const add=(slot,name,stats,price,{twoHanded=false,occupiesBoth=false,icon=null}={})=>items.push({
    id:name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""),
    name,slot,rarity:COMMON,stats,price,twoHanded,occupiesBoth:twoHanded||occupiesBoth,
    icon:icon||({head:"⛑",chest:"🛡",hands:"✦",legs:"◫",feet:"◒",main_hand:"⚔",off_hand:"🛡"}[slot]||"◆"),
    image:null,active:true
  });

  const groups={
    head:[
      ["Elmo",{DEF:15},220],["Elmo Reforçado",{DEF:10,RES:5},240],["Capacete",{RES:15},220],["Capacete de Ferro",{RES:10,DEF:5},240],
      ["Capuz",{INT:15},210],["Capuz de Couro",{INT:10,ARC:5},230],["Tiara",{ARC:15},210],["Tiara de Ferro",{ARC:10,INT:5},230],
      ["Faixa",{INI:15},200],["Faixa de Combate",{INI:10,RES:5},220],["Coroa",{INT:10,DEF:5},250],["Máscara",{ARC:10,RES:5},240],
      ["Chapéu",{INT:5,DEF:5,RES:5},235],["Chapéu de Couro",{ARC:5,DEF:5,RES:5},235]
    ],
    chest:[
      ["Peitoral",{DEF:15},310],["Peitoral de Ferro",{DEF:10,RES:5},330],["Couraça",{RES:15},310],["Couraça Reforçada",{RES:10,DEF:5},330],
      ["Armadura",{FOR:15},320],["Armadura de Ferro",{FOR:10,DEF:5},340],["Colete",{INI:10,DEF:5},300],["Colete de Couro",{FOR:5,DEF:5,RES:5},315],
      ["Gibão",{ARC:10,RES:5},300],["Gibão Reforçado",{ARC:10,DEF:5},320],["Túnica",{INT:10,ARC:5},290],["Túnica Acolchoada",{INT:10,RES:5},305],
      ["Manto",{INT:10,DEF:5},310],["Cota de Malha",{INT:5,DEF:5,RES:5},335]
    ],
    hands:[
      ["Luvas",{FOR:15},210],["Luvas de Couro",{FOR:10,INI:5},225],["Luvas de Ferro",{DEF:10,FOR:5},245],["Manoplas",{DEF:15},240],
      ["Manoplas Pesadas",{DEF:10,RES:5},260],["Braçadeiras",{ARC:15},215],["Braçadeiras de Couro",{ARC:10,INT:5},230],["Braçadeiras de Ferro",{RES:10,DEF:5},250],
      ["Braceletes",{INT:10,ARC:5},230],["Munhequeiras",{INI:15},205],["Munhequeiras de Couro",{INI:10,FOR:5},220],["Protetores de Braço",{INT:10,DEF:5},235],
      ["Mangas Reforçadas",{ARC:10,RES:5},235],["Mangas",{FOR:5,INI:5,DEF:5},225]
    ],
    legs:[
      ["Calças",{RES:15},230],["Calças Reforçadas",{RES:10,INI:5},250],["Grevas",{DEF:15},250],["Grevas de Ferro",{DEF:10,RES:5},270],
      ["Joelheiras",{DEF:5,RES:5,INI:5},235],["Joelheiras de Ferro",{INT:10,DEF:5},255],["Perneiras",{ARC:10,RES:5},245],["Perneiras Reforçadas",{INT:5,DEF:5,RES:5},265]
    ],
    feet:[
      ["Botas",{INI:15},220],["Botas de Couro",{INI:10,FOR:5},235],["Botas de Ferro",{FOR:15},250],["Botinas",{FOR:10,DEF:5},240],
      ["Sandálias",{ARC:10,INI:5},215],["Sapatos",{INT:10,INI:5},220]
    ]
  };
  Object.entries(groups).forEach(([slot,list])=>list.forEach(([name,stats,price])=>add(slot,name,stats,price)));

  add("main_hand","Espada e Escudo",{FOR:10,DEF:5},430,{occupiesBoth:true});
  add("main_hand","Espada Longa",{FOR:15},360);
  add("main_hand","Espadas Duplas",{FOR:10,INI:5},450,{occupiesBoth:true});
  add("main_hand","Espadão",{FOR:10,RES:5},480,{twoHanded:true});
  add("main_hand","Katana",{INI:10,FOR:5},400);
  add("main_hand","Machado",{FOR:15},380);
  add("main_hand","Machado e Escudo",{FOR:5,DEF:5,RES:5},460,{occupiesBoth:true});
  add("main_hand","Martelo de Guerra",{FOR:10,DEF:5},470,{twoHanded:true});
  add("main_hand","Martelo e Escudo",{DEF:10,FOR:5},455,{occupiesBoth:true});
  add("main_hand","Lança",{INI:10,FOR:5},420,{twoHanded:true});
  add("main_hand","Alabarda",{FOR:5,DEF:5,INI:5},490,{twoHanded:true});
  add("main_hand","Adagas Duplas",{INI:15},430,{occupiesBoth:true});
  add("main_hand","Arco Longo",{INI:15},450,{twoHanded:true});
  add("main_hand","Besta",{INI:10,FOR:5},465,{twoHanded:true});
  add("main_hand","Cajado Arcano",{INT:15},440,{twoHanded:true});
  add("main_hand","Cajado de Batalha",{INT:10,DEF:5},460,{twoHanded:true});
  add("main_hand","Cajado Sagrado",{ARC:10,RES:5},470,{twoHanded:true});
  add("main_hand","Orbe Arcano",{ARC:15},390);
  add("main_hand","Grimório",{INT:10,ARC:5},410);
  add("main_hand","Cetro",{ARC:10,INT:5},400);
  add("main_hand","Tomo Místico",{INT:10,RES:5},415);
  add("off_hand","Escudo Gigante",{DEF:15},500,{twoHanded:true,icon:"🛡"});

  items.push({
    id:"anel-dos-administradores",
    name:"Anel dos Administradores",
    slot:"ring_1",
    rarity:"Mítico",
    stats:{FOR:500,DEF:500,RES:500,INI:500,INT:500,ARC:500},
    price:55000000,
    twoHanded:false,
    occupiesBoth:false,
    icon:"💍",
    image:"https://i.pinimg.com/736x/c6/43/53/c643530ae1593718cc69cea79d81fce7.jpg",
    description:"Item administrativo de teste, deliberadamente fora dos padrões normais de balanceamento do RPG.",
    testItem:true,
    active:true
  });

  window.WONDERLAND_SHOP_ITEMS=items;
  window.WONDERLAND_ITEM_SLOTS={head:"Cabeça",chest:"Peitoral",hands:"Mãos",legs:"Pernas",feet:"Pés",cape:"Capa",necklace:"Colar",ring_1:"Anel I",ring_2:"Anel II",earring_1:"Brinco I",earring_2:"Brinco II",main_hand:"Arma principal",off_hand:"Arma secundária"};
})();