"use strict";

(function(){
  const USERS_KEY="wonderlandPrototypeUsers";
  const SESSION_KEY="wonderlandPrototypeSession";
  const normalizeEmail=value=>String(value||"").trim().toLowerCase();
  const readUsers=()=>{try{return JSON.parse(localStorage.getItem(USERS_KEY)||"[]")}catch{return[]}};
  const writeUsers=users=>localStorage.setItem(USERS_KEY,JSON.stringify(users));
  const createId=()=>`usr_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

  const register=({name,email,password})=>{
    const users=readUsers();
    const normalized=normalizeEmail(email);
    if(users.some(user=>user.email===normalized))throw new Error("Este e-mail já está cadastrado.");
    const user={id:createId(),name:String(name||"").trim(),email:normalized,password:String(password),characters:[],createdAt:new Date().toISOString()};
    users.push(user);writeUsers(users);localStorage.setItem(SESSION_KEY,user.id);return user;
  };

  const login=({email,password})=>{
    const user=readUsers().find(item=>item.email===normalizeEmail(email)&&item.password===String(password));
    if(!user)throw new Error("E-mail ou senha incorretos.");
    localStorage.setItem(SESSION_KEY,user.id);return user;
  };

  const current=()=>{const id=localStorage.getItem(SESSION_KEY);return readUsers().find(user=>user.id===id)||null};
  const logout=()=>localStorage.removeItem(SESSION_KEY);

  window.WONDERLAND_ACCOUNT={register,login,current,logout,readUsers,writeUsers};
})();
