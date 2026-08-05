"use strict";

(function(){
  const client=window.WONDERLAND_SUPABASE;
  if(!client){console.error("Cliente Supabase indisponível.");return}

  const normalizeEmail=value=>String(value||"").trim().toLowerCase();
  const profileFrom=(user,profile)=>({id:user.id,email:user.email,name:profile?.display_name||profile?.username||user.user_metadata?.display_name||user.user_metadata?.username||"Aventureiro",username:profile?.username||user.user_metadata?.username||"Aventureiro",role:profile?.role||"player",avatarUrl:profile?.avatar_url||null,isBanned:Boolean(profile?.is_banned)});
  const withDefaultRank=row=>row?{...row,rank:String(row.rank||"E").toUpperCase()}:row;

  async function getSession(){const {data,error}=await client.auth.getSession();if(error)throw error;return data.session||null}
  async function current(){
    const session=await getSession();if(!session?.user)return null;
    const {data:profile,error}=await client.from("profiles").select("id,username,display_name,role,avatar_url,is_banned").eq("id",session.user.id).maybeSingle();
    if(error)throw error;return profileFrom(session.user,profile)
  }
  async function register({name,email,password}){
    const username=String(name||"").trim();
    const {data,error}=await client.auth.signUp({email:normalizeEmail(email),password:String(password),options:{data:{username,display_name:username},emailRedirectTo:new URL("conta.html",window.location.href).href}});
    if(error)throw error;return{user:data.user,session:data.session,needsEmailConfirmation:Boolean(data.user&&!data.session)}
  }
  async function login({email,password}){const {data,error}=await client.auth.signInWithPassword({email:normalizeEmail(email),password:String(password)});if(error)throw error;return data}
  async function logout(){const {error}=await client.auth.signOut();if(error)throw error}

  async function getCharacters(){
    const user=await current();if(!user)return[];
    const fields="id,name,story,race_id,class_id,path_id,level,experience,hp_current,mana_current,distribution_profile,image_url,created_at";
    const {data,error}=await client.from("characters").select(fields).eq("user_id",user.id).order("created_at",{ascending:true});
    if(error)throw error;return(data||[]).map(withDefaultRank)
  }

  async function getCharacterSheet(characterId){
    const user=await current();if(!user)throw new Error("Sessão expirada. Entre novamente.");
    const fields="id,user_id,name,story,race_id,class_id,path_id,level,experience,hp_current,mana_current,distribution_profile,image_url,created_at";
    const {data:character,error:characterError}=await client.from("characters").select(fields).eq("id",characterId).eq("user_id",user.id).maybeSingle();
    if(characterError)throw characterError;if(!character)throw new Error("Personagem não encontrado.");
    const [attributesResult,inventoryResult,equipmentResult,skillsResult]=await Promise.all([
      client.from("character_attributes").select("*").eq("character_id",characterId).maybeSingle(),
      client.from("character_inventory").select("id,item_key,quantity,slot_position,metadata,acquired_at").eq("character_id",characterId).order("slot_position",{ascending:true}),
      client.from("character_equipment").select("id,slot,item_key,metadata,equipped_at").eq("character_id",characterId).order("slot",{ascending:true}),
      client.from("character_skills").select("id,skill_key,source_type,unlocked_level,is_equipped,slot_position,unlocked_at").eq("character_id",characterId).order("unlocked_level",{ascending:true})
    ]);
    for(const result of [attributesResult,inventoryResult,equipmentResult,skillsResult])if(result.error)throw result.error;
    return{character:withDefaultRank(character),attributes:attributesResult.data||null,inventory:inventoryResult.data||[],equipment:equipmentResult.data||[],skills:skillsResult.data||[]}
  }

  async function updateCharacterImage(characterId,imageUrl){
    const user=await current();if(!user)throw new Error("Sessão expirada. Entre novamente.");
    const normalized=String(imageUrl||"").trim()||null;
    const {data,error}=await client.from("characters").update({image_url:normalized}).eq("id",characterId).eq("user_id",user.id).select("id,image_url").single();
    if(error)throw error;
    return data;
  }

  async function createCharacter(character){
    const user=await current();if(!user)throw new Error("Sessão expirada. Entre novamente.");
    const payload={user_id:user.id,name:character.name,story:character.story||"",race_id:character.raceId,class_id:character.classId,path_id:character.pathId||null,level:1,experience:0,hp_current:Number(character.hpCurrent||0),mana_current:Number(character.manaCurrent||0),distribution_profile:character.attributeProfile==="custom"?"manual":character.attributeProfile||"manual",image_url:character.image||null};
    const {data:created,error:createError}=await client.from("characters").insert(payload).select("id").single();
    if(createError)throw createError;
    const a=character.allocatedAttributes||{},r=character.racialAttributes||{},b=character.baseAttributes||{};
    const {error:attributeError}=await client.from("character_attributes").insert({character_id:created.id,base_for:Number(b.FOR||20),base_def:Number(b.DEF||20),base_res:Number(b.RES||20),base_ini:Number(b.INI||20),base_int:Number(b.INT||20),base_arc:Number(b.ARC||20),allocated_for:Number(a.FOR||0),allocated_def:Number(a.DEF||0),allocated_res:Number(a.RES||0),allocated_ini:Number(a.INI||0),allocated_int:Number(a.INT||0),allocated_arc:Number(a.ARC||0),racial_for:Number(r.FOR||0),racial_def:Number(r.DEF||0),racial_res:Number(r.RES||0),racial_ini:Number(r.INI||0),racial_int:Number(r.INT||0),racial_arc:Number(r.ARC||0)});
    if(attributeError){await client.from("characters").delete().eq("id",created.id);throw attributeError}
    return created
  }

  const isAdmin=user=>user?.role==="admin";
  window.WONDERLAND_ACCOUNT={client,getSession,current,register,login,logout,getCharacters,getCharacterSheet,updateCharacterImage,createCharacter,isAdmin};
})();
