"use strict";
(function(){
  const client=window.WONDERLAND_SUPABASE;
  const localClasses=window.WONDERLAND_CLASSES||{};
  const localRaces=Array.isArray(window.WONDERLAND_RACES)?window.WONDERLAND_RACES:[];
  const cache={loaded:false,races:[],classes:[],paths:[],skills:[],passives:[],mechanics:[]};
  const slug=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  const text=value=>String(value??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
  const levelOf=value=>Number(String(value||"").match(/(\d+)/)?.[1]||1);
  const parseMana=value=>Number(String(value||"").match(/(?:custa|consome|gasta|custo\s*:?)\s*(\d+)\s*mana/i)?.[1]||0);
  const parseCooldown=value=>Number(String(value||"").match(/(?:recarga|cooldown)\D*(\d+)/i)?.[1]||0);
  const parseScale=value=>{const m=String(value||"").match(/(\d+(?:[.,]\d+)?)%\s+(?:do|de|da)\s+(?:seu\s+)?(FOR|DEF|RES|INI|INT|ARC)/i);return m?{percent:Number(m[1].replace(",",".")),attribute:m[2].toUpperCase()}:null};
  const inferTarget=(description,category)=>/transforma|transformação|postura|forma |assume|fortalecimento|aprimoramento|recupera|regenera|cura a si|escudo para si/i.test(`${description} ${category}`)?"self":"enemy";
  const active=row=>row?.is_active!==false;

  function mergeRows(localRows,dbRows,key){
    const result=new Map();
    localRows.filter(active).forEach(row=>result.set(String(row[key]),row));
    (dbRows||[]).filter(active).forEach(row=>{
      const id=String(row[key]??"");
      if(!id)return;
      const fallback=result.get(id)||{};
      result.set(id,{...fallback,...row,_local:null,_cms:true});
    });
    return [...result.values()].sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0)||String(a.name||"").localeCompare(String(b.name||""),"pt-BR"));
  }

  function fallbackClasses(){return Object.values(localClasses).map((cls,index)=>({id:cls.id,name:cls.nome,description:cls.descricao||"",role:cls.cargo||"",specialization:cls.especializacao?.titulo||cls.cargo||"",difficulty:(String(cls.dificuldade||"").match(/★/g)||[]).length||1,primary_attribute:String(cls.estilo?.atributos||"").match(/FOR|DEF|RES|INI|INT|ARC/i)?.[0]?.toUpperCase()||null,secondary_attribute:String(cls.estilo?.atributos||"").match(/(?:FOR|DEF|RES|INI|INT|ARC).*?(FOR|DEF|RES|INI|INT|ARC)/i)?.[1]?.toUpperCase()||null,strengths:cls.estilo?.fortes||"",weaknesses:cls.estilo?.fracos||"",resource_name:cls.recurso?.nome||null,resource_description:cls.recurso?.descricao||"",icon:cls.icone||"",artwork_url:cls.imagem||"",is_active:true,sort_order:index,_local:cls}))}
  function fallbackRaces(){return localRaces.map((race,index)=>({id:race.id,name:race.name,description:race.description||race.descricao||"",tagline:race.tagline||"",archetype:race.archetype||"",difficulty:(String(race.difficulty||race.dificuldade||"").match(/★/g)||[]).length||1,base_hp:Number(race.stats?.hp||race.hp||500),base_mana:Number(race.stats?.mana||race.mana||0),mechanic_name:race.mechanic?.name||race.mecanica?.nome||null,mechanic_description:race.mechanic?.description||race.mecanica?.descricao||"",icon:race.icon||"",artwork_url:race.artwork||race.image||"",is_active:true,sort_order:index,_local:race}))}
  function fallbackPaths(){return Object.values(localClasses).flatMap(cls=>(cls.caminhos||[]).map((path,index)=>({id:path.id||slug(path.nome),class_id:cls.id,name:path.nome,description:path.descricao||"",specialization:path.especializacao||"",complexity:path.complexidade||"",is_active:true,sort_order:index,_local:path})))}
  function fallbackPassives(){const list=[];Object.values(localClasses).forEach(cls=>{(cls.passivas||[]).forEach((p,index)=>list.push({id:`local-class-${cls.id}-${index}`,passive_key:`${cls.id}-${slug(p.nome)}`,name:p.nome,description:text(p.descricao),source_type:"class",class_id:cls.id,race_id:null,class_path_id:null,effect_schema:[],is_active:true,sort_order:index,_local:p}));(cls.caminhos||[]).forEach((path,index)=>{if(path.passiva)list.push({id:`local-path-${path.id}`,passive_key:`${path.id}-${slug(path.passiva.nome||path.nome)}`,name:path.passiva.nome||path.nome,description:text(path.passiva.descricao),source_type:"path",class_id:cls.id,race_id:null,class_path_id:path.id,effect_schema:[],is_active:true,sort_order:index,_local:path.passiva})})});localRaces.forEach(race=>(race.traits||[]).forEach((p,index)=>list.push({id:`local-race-${race.id}-${index}`,passive_key:`${race.id}-${slug(p.title||p.nome||p.name)}`,name:p.title||p.nome||p.name,description:text(p.content||p.descricao||p.description),source_type:"race",race_id:race.id,class_id:null,class_path_id:null,effect_schema:[],is_active:true,sort_order:index,_local:p})));return list}
  function fallbackSkills(){const list=[];Object.values(localClasses).forEach(cls=>{(cls.progressao||[]).forEach((s,index)=>{const description=text(s.descricao),scale=parseScale(description);list.push({id:`local-class-${cls.id}-${index}`,skill_key:`${cls.id}-${slug(s.nome)}`,name:s.nome,description,category:s.categoria||"",source_type:"class",class_id:cls.id,class_path_id:null,race_id:null,unlock_level:levelOf(s.nivel),mana_cost:parseMana(description),cooldown_turns:parseCooldown(description),range_cells:/distância|distancia|alcance|projétil|projetil|área|area/i.test(description)?3:1,area_cells:/área de (\d+)/i.test(description)?Number(description.match(/área de (\d+)/i)?.[1]||0):0,duration_turns:Number(description.match(/por (\d+) turn/i)?.[1]||0),target_type:inferTarget(description,s.categoria),damage_type:/mágic/i.test(description)?"magical":/dano verdadeiro/i.test(description)?"true":/causa|dano/i.test(description)?"physical":"none",scale_attribute:scale?.attribute||null,scale_percent:scale?.percent||0,effect_schema:[],is_passive:false,is_ultimate:/ultimate|máxima|maxima/i.test(String(s.tipo||s.categoria||"")),is_active:true,sort_order:index,_local:s})});(cls.caminhos||[]).forEach(path=>(path.habilidades||[]).forEach((s,index)=>{const description=text(s.descricao),scale=parseScale(description);list.push({id:`local-path-${path.id}-${index}`,skill_key:`${path.id}-${slug(s.nome)}`,name:s.nome,description,category:s.tipo||"",source_type:"path",class_id:cls.id,class_path_id:path.id,race_id:null,unlock_level:[60,70,80,90,100][index]||100,mana_cost:parseMana(description),cooldown_turns:parseCooldown(description),range_cells:/distância|distancia|alcance|projétil|projetil|área|area/i.test(description)?3:1,area_cells:0,duration_turns:Number(description.match(/por (\d+) turn/i)?.[1]||0),target_type:inferTarget(description,s.tipo),damage_type:/mágic/i.test(description)?"magical":/dano verdadeiro/i.test(description)?"true":/causa|dano/i.test(description)?"physical":"none",scale_attribute:scale?.attribute||null,scale_percent:scale?.percent||0,effect_schema:[],is_passive:false,is_ultimate:/ultimate|máxima|maxima/i.test(String(s.tipo||"")),is_active:true,sort_order:index,_local:s})}))});localRaces.forEach(race=>(race.progression||[]).forEach((s,index)=>{const description=text(s.content||s.descricao),scale=parseScale(description);list.push({id:`local-race-${race.id}-${index}`,skill_key:`${race.id}-${slug(s.name||s.nome)}`,name:s.name||s.nome,description,category:s.type||s.tipo||"",source_type:"race",race_id:race.id,class_id:null,class_path_id:null,unlock_level:Number(s.level||1),mana_cost:parseMana(`${description} ${(s.meta||[]).join(" ")}`),cooldown_turns:parseCooldown(`${description} ${(s.meta||[]).join(" ")}`),range_cells:/distância|distancia|alcance|projétil|projetil|área|area/i.test(description)?3:1,area_cells:0,duration_turns:Number(description.match(/por (\d+) turn/i)?.[1]||0),target_type:inferTarget(description,s.type||s.tipo),damage_type:/mágic/i.test(description)?"magical":/dano verdadeiro/i.test(description)?"true":/causa|dano/i.test(description)?"physical":"none",scale_attribute:scale?.attribute||null,scale_percent:scale?.percent||0,effect_schema:[],is_passive:false,is_ultimate:/ultimate|máxima|maxima/i.test(String(s.type||s.tipo||"")),is_active:true,sort_order:index,_local:s}));return list}

  async function query(table,configure){
    try{
      let request=client.from(table).select("*");
      if(configure)request=configure(request);
      const result=await request;
      if(result.error)throw result.error;
      return result.data||[];
    }catch(error){
      console.warn(`Não foi possível carregar ${table} do CMS.`,error);
      return [];
    }
  }

  async function load(options={}){
    if(cache.loaded&&!options.force)return cache;
    const fallback={races:fallbackRaces(),classes:fallbackClasses(),paths:fallbackPaths(),skills:fallbackSkills(),passives:fallbackPassives(),mechanics:[]};
    if(!client){Object.assign(cache,fallback,{loaded:true});return cache}
    const [races,classes,paths,skills,passives,mechanics]=await Promise.all([
      query("races",q=>q.eq("is_active",true).order("sort_order")),
      query("classes",q=>q.eq("is_active",true).order("sort_order")),
      query("class_paths",q=>q.eq("is_active",true).order("sort_order")),
      query("arena_skill_catalog",q=>q.order("sort_order")),
      query("arena_passive_catalog",q=>q.order("sort_order")),
      query("combat_mechanics",q=>q.eq("is_active",true))
    ]);
    cache.races=mergeRows(fallback.races,races,"id");
    cache.classes=mergeRows(fallback.classes,classes,"id");
    cache.paths=mergeRows(fallback.paths,paths,"id");
    cache.skills=mergeRows(fallback.skills,skills,"skill_key");
    cache.passives=mergeRows(fallback.passives,passives,"passive_key");
    cache.mechanics=mergeRows([],mechanics,"mechanic_key");
    cache.loaded=true;
    return cache;
  }

  function invalidate(){cache.loaded=false}
  async function characterContent(character){const data=await load(),level=Number(character?.level||1),raceId=character?.race_id,classId=character?.class_id,pathId=character?.path_id||character?.class_path_id||null;return{race:data.races.find(r=>r.id===raceId)||null,cls:data.classes.find(c=>c.id===classId)||null,path:data.paths.find(p=>p.id===pathId)||null,skills:data.skills.filter(s=>Number(s.unlock_level||1)<=level&&((s.source_type==="race"&&s.race_id===raceId)||(s.source_type==="class"&&s.class_id===classId)||(s.source_type==="path"&&pathId&&s.class_path_id===pathId))),passives:data.passives.filter(p=>(p.source_type==="race"&&p.race_id===raceId)||(p.source_type==="class"&&p.class_id===classId)||(p.source_type==="path"&&pathId&&p.class_path_id===pathId)),mechanics:data.mechanics.filter(m=>(m.source_type==="race"&&m.race_id===raceId)||(m.source_type==="class"&&m.class_id===classId)||(m.source_type==="path"&&pathId&&m.class_path_id===pathId)||(m.source_type==="global"))}}
  window.WONDERLAND_CONTENT_STORE={load,invalidate,characterContent,cache};
})();
