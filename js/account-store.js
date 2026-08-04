"use strict";

(function(){
  const USERS_KEY="wonderlandPrototypeUsers";
  const SESSION_KEY="wonderlandPrototypeSession";
  const ADMIN_USER={
    id:"usr_admin_colten",
    name:"Colten",
    username:"Colten",
    email:"colten@wonderland.local",
    password:"78766037",
    role:"admin",
    permissions:["manage_users","manage_characters","manage_races","manage_classes","manage_skills","manage_items","manage_monsters","manage_dungeons","manage_game_balance"],
    characters:[],
    createdAt:"2026-08-04T00:00:00.000Z",
    systemAccount:true
  };

  const normalizeEmail=value=>String(value||"").trim().toLowerCase();
  const normalizeLogin=value=>String(value||"").trim().toLowerCase();
  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||"[]")}catch{return[]}};
  const writeUsers=users=>localStorage.setItem(USERS_KEY,JSON.stringify(users));
  const createId=()=>`usr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  const ensureAdmin=()=>{
    const users=readUsers();
    const existingIndex=users.findIndex(user=>user.id===ADMIN_USER.id||normalizeLogin(user.username||user.name)==="colten");
    if(existingIndex>=0){
      users[existingIndex]={...users[existingIndex],...ADMIN_USER,characters:Array.isArray(users[existingIndex].characters)?users[existingIndex].characters:[]};
    }else{
      users.push({...ADMIN_USER});
    }
    writeUsers(users);
  };

  const register=({name,email,password})=>{
    ensureAdmin();
    const users=readUsers();
    const normalized=normalizeEmail(email);
    const username=String(name||"").trim();
    if(users.some(user=>user.email===normalized))throw new Error("Este e-mail já está cadastrado.");
    if(users.some(user=>normalizeLogin(user.username||user.name)===normalizeLogin(username)))throw new Error("Este nome de usuário já está cadastrado.");
    const user={id:createId(),name:username,username,email:normalized,password:String(password),role:"player",permissions:[],characters:[],createdAt:new Date().toISOString()};
    users.push(user);writeUsers(users);localStorage.setItem(SESSION_KEY,user.id);return user;
  };

  const login=({login,email,password})=>{
    ensureAdmin();
    const identifier=normalizeLogin(login||email);
    const user=readUsers().find(item=>{
      const byEmail=normalizeEmail(item.email)===identifier;
      const byUsername=normalizeLogin(item.username||item.name)===identifier;
      return (byEmail||byUsername)&&item.password===String(password);
    });
    if(!user)throw new Error("Login ou senha incorretos.");
    localStorage.setItem(SESSION_KEY,user.id);return user;
  };

  const current=()=>{ensureAdmin();const id=localStorage.getItem(SESSION_KEY);return readUsers().find(user=>user.id===id)||null};
  const logout=()=>localStorage.removeItem(SESSION_KEY);
  const isAdmin=user=>(user||current())?.role==="admin";

  ensureAdmin();
  window.WONDERLAND_ACCOUNT={register,login,current,logout,isAdmin,readUsers,writeUsers,ensureAdmin};
})();
